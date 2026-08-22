import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@/lib/database/supabase-server';
import { getServiceRoleSupabase } from '@/lib/database/supabase';
import { requirePermission, AuthorizationError } from '@/lib/security/rbac';
import { 
  validateVehicleOwnershipConsistency, 
  processTripDestinations, 
  TripDomainError 
} from '@/lib/domain/trips/service';
import { calculatePartyFinancials, calculateOwnerFinancials } from '@/lib/domain/financials/service';
import { Profile } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerComponentClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: '401 Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    if (!profile || !profile.is_active) return NextResponse.json({ error: '403 Forbidden' }, { status: 403 });

    requirePermission(profile as Profile, 'LOGISTICS_VIEW');

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '15', 10);
    const status = searchParams.get('status');
    const partyId = searchParams.get('party_id');
    const vehicleId = searchParams.get('vehicle_id');
    const query = searchParams.get('q') || '';

    const offset = (page - 1) * limit;

    const serviceClient = getServiceRoleSupabase();
    let dbQuery = serviceClient
      .from('trips')
      .select('*, parties(name), vehicles(vehicle_number, ownership_type), vehicle_owners(name), drivers(name)', { count: 'exact' })
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) dbQuery = dbQuery.eq('trip_status', status);
    if (partyId) dbQuery = dbQuery.eq('party_id', partyId);
    if (vehicleId) dbQuery = dbQuery.eq('vehicle_id', vehicleId);
    if (query) {
      dbQuery = dbQuery.or(`trip_number.ilike.%${query}%,lr_number.ilike.%${query}%,invoice_number.ilike.%${query}%`);
    }

    const { data: trips, count, error } = await dbQuery;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({
      trips,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (err: unknown) {
    if (err instanceof AuthorizationError) return NextResponse.json({ error: err.message }, { status: 403 });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerComponentClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: '401 Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    if (!profile || !profile.is_active) return NextResponse.json({ error: '403 Forbidden' }, { status: 403 });

    requirePermission(profile as Profile, 'TRIP_CREATE');

    const body = await request.json();
    const {
      trip_number,
      party_id,
      vehicle_id,
      driver_id,
      loading_date,
      loading_location,
      lr_number,
      invoice_number,
      remarks,
      destinations,
      party_freight,
      owner_freight,
    } = body;

    if (!trip_number || !party_id || !vehicle_id || !loading_date || !loading_location) {
      return NextResponse.json({ error: 'Missing required trip fields.' }, { status: 400 });
    }

    const serviceClient = getServiceRoleSupabase();

    // 1. Verify Party exists
    const { data: party } = await serviceClient.from('parties').select('id').eq('id', party_id).single();
    if (!party) return NextResponse.json({ error: 'Referenced Party does not exist.' }, { status: 400 });

    // 2. Verify Vehicle and Ownership Consistency
    const { data: vehicle } = await serviceClient.from('vehicles').select('*').eq('id', vehicle_id).single();
    if (!vehicle) return NextResponse.json({ error: 'Referenced Vehicle does not exist.' }, { status: 400 });

    const validatedOwnerId = validateVehicleOwnershipConsistency(vehicle, body.vehicle_owner_id);

    // 3. Verify Trip Number Uniqueness
    const { data: existingTrip } = await serviceClient
      .from('trips')
      .select('id')
      .eq('trip_number', trip_number.trim())
      .maybeSingle();

    if (existingTrip) {
      return NextResponse.json({ error: `Trip number '${trip_number}' already exists.` }, { status: 400 });
    }

    // 4. Process Multi-destinations & calculate total unloading charge
    const { processedDestinations, totalUnloadingCharges } = processTripDestinations(destinations || [
      { sequence_order: 1, destination_name: 'Primary Destination', unloading_charge: 0 },
    ]);

    // 5. Initialize Party & Owner Financials with Invariants
    const partyFinancialInput = {
      freight: party_freight || 0,
      unloading_charges: totalUnloadingCharges,
      detention: 0,
      additional_charges: 0,
      deductions: 0,
      tds_amount: 0,
    };
    calculatePartyFinancials(partyFinancialInput); // Throws if invalid

    const ownerFinancialInput = {
      freight: owner_freight || 0,
      detention: 0,
      additional_charges: 0,
      unloading_charges: 0,
      total_deductions: 0,
    };
    if (vehicle.ownership_type === 'MARKET') {
      calculateOwnerFinancials(ownerFinancialInput); // Throws if invalid
    }

    // 6. Execute Atomic Database Insert Transaction
    const { data: trip, error: tripError } = await serviceClient
      .from('trips')
      .insert({
        trip_number: trip_number.trim(),
        party_id,
        vehicle_id,
        vehicle_owner_id: validatedOwnerId,
        driver_id: driver_id || null,
        loading_date,
        loading_location: loading_location.trim(),
        lr_number: lr_number ? lr_number.trim() : null,
        invoice_number: invoice_number ? invoice_number.trim() : null,
        remarks: remarks ? remarks.trim() : null,
        trip_status: 'IN_TRANSIT',
        created_by: user.id,
      })
      .select()
      .single();

    if (tripError || !trip) {
      return NextResponse.json({ error: tripError?.message || 'Failed to create trip record' }, { status: 500 });
    }

    // Insert Destinations
    const destInserts = processedDestinations.map((d) => ({
      trip_id: trip.id,
      sequence_order: d.sequence_order,
      destination_name: d.destination_name,
      unloading_charge: d.unloading_charge,
      remarks: d.remarks || null,
    }));
    await serviceClient.from('trip_destinations').insert(destInserts);

    // Insert Party Financials
    await serviceClient.from('trip_party_financials').insert({
      trip_id: trip.id,
      freight: partyFinancialInput.freight,
      unloading_charges: partyFinancialInput.unloading_charges,
      detention: 0,
      additional_charges: 0,
      deductions: 0,
      tds_amount: 0,
      tds_applicable: false,
    });

    // Insert Owner Financials if MARKET
    if (vehicle.ownership_type === 'MARKET') {
      await serviceClient.from('trip_owner_financials').insert({
        trip_id: trip.id,
        freight: ownerFinancialInput.freight,
        detention: 0,
        additional_charges: 0,
        unloading_charges: 0,
        total_deductions: 0,
      });
    }

    // Audit integration
    await serviceClient.from('audit_logs').insert({
      entity_type: 'trip',
      entity_id: trip.id,
      action: 'TRIP_CREATE',
      new_values: { trip, destinations: processedDestinations },
      performed_by: user.id,
    });

    return NextResponse.json({ success: true, trip }, { status: 201 });
  } catch (err: unknown) {
    if (err instanceof TripDomainError) return NextResponse.json({ error: err.message }, { status: 400 });
    if (err instanceof AuthorizationError) return NextResponse.json({ error: err.message }, { status: 403 });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
