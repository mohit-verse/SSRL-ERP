import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@/lib/database/supabase-server';
import { getServiceRoleSupabase } from '@/lib/database/supabase';
import { requirePermission, AuthorizationError } from '@/lib/security/rbac';
import { 
  validateTripsForBilling, 
  buildBillSnapshot, 
  BillDomainError 
} from '@/lib/domain/bills/service';
import { Profile } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerComponentClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: '401 Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    if (!profile || !profile.is_active) return NextResponse.json({ error: '403 Forbidden' }, { status: 403 });

    requirePermission(profile as Profile, 'BILL_GENERATE');

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '15', 10);
    const partyId = searchParams.get('party_id');
    const status = searchParams.get('status');
    const query = searchParams.get('q') || '';

    const offset = (page - 1) * limit;

    const serviceClient = getServiceRoleSupabase();
    let dbQuery = serviceClient
      .from('bills')
      .select('*, parties(name), bill_trips(trip_id, is_current, trips(trip_number, loading_date, trip_party_financials(net_receivable)))', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (partyId) dbQuery = dbQuery.eq('party_id', partyId);
    if (status) dbQuery = dbQuery.eq('status', status);
    if (query) {
      dbQuery = dbQuery.ilike('bill_number', `%${query}%`);
    }

    const { data: bills, count, error } = await dbQuery;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({
      bills,
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

    requirePermission(profile as Profile, 'BILL_GENERATE');

    const body = await request.json();
    const { party_id, trip_ids, bill_number: customBillNum } = body;

    if (!party_id || !trip_ids || !Array.isArray(trip_ids) || trip_ids.length === 0) {
      return NextResponse.json({ error: 'Party ID and selected trip IDs are required.', code: 'BILL_TRIP_NOT_FOUND' }, { status: 400 });
    }

    const serviceClient = getServiceRoleSupabase();

    // 1. Fetch Party Details
    const { data: party } = await serviceClient.from('parties').select('*').eq('id', party_id).single();
    if (!party) return NextResponse.json({ error: 'Party not found.', code: 'BILL_TRIP_INVALID' }, { status: 404 });

    // 2. Fetch Trips & Check Current Bill Mappings
    const { data: trips } = await serviceClient
      .from('trips')
      .select('*, vehicles(vehicle_number), drivers(name), trip_destinations(*), trip_party_financials(*)')
      .in('id', trip_ids);

    if (!trips || trips.length !== trip_ids.length) {
      return NextResponse.json({ error: 'One or more selected trips were not found.', code: 'BILL_TRIP_NOT_FOUND' }, { status: 404 });
    }

    // Check if any trip is already CURRENT-billed
    for (const t of trips) {
      const { data: existingMap } = await serviceClient
        .from('bill_trips')
        .select('id')
        .eq('trip_id', t.id)
        .eq('is_current', true)
        .maybeSingle();

      if (existingMap) {
        return NextResponse.json({
          error: `Trip ${t.trip_number} is already attached to an active CURRENT bill. Duplicate billing is prohibited.`,
          code: 'BILL_TRIP_ALREADY_BILLED',
        }, { status: 400 });
      }
    }

    // 3. Validate Eligibility
    validateTripsForBilling(
      party_id,
      trips.map((t) => ({
        id: t.id,
        party_id: t.party_id,
        is_deleted: t.is_deleted,
        trip_status: t.trip_status,
      }))
    );

    const billNumber = customBillNum?.trim() || `BILL-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    // 4. Create Bill Record
    const { data: bill, error: billErr } = await serviceClient
      .from('bills')
      .insert({
        bill_number: billNumber,
        party_id,
        current_version: 1,
        status: 'CURRENT',
      })
      .select()
      .single();

    if (billErr || !bill) return NextResponse.json({ error: billErr?.message || 'Bill creation failed' }, { status: 500 });

    // 5. Create bill_trips mappings
    const billTripInserts = trips.map((t) => ({
      bill_id: bill.id,
      trip_id: t.id,
      is_current: true,
    }));
    await serviceClient.from('bill_trips').insert(billTripInserts);

    // 6. Build Immutable Snapshot v1
    const snapshotInput = {
      bill_number: billNumber,
      version_number: 1,
      generated_at: new Date().toISOString(),
      party: {
        id: party.id,
        name: party.name,
        gstin: party.gstin,
        phone: party.phone,
        address: party.address,
      },
      trips: trips.map((t: any) => ({
        id: t.id,
        trip_number: t.trip_number,
        loading_date: t.loading_date,
        loading_location: t.loading_location,
        lr_number: t.lr_number,
        invoice_number: t.invoice_number,
        vehicle_number: t.vehicles?.vehicle_number,
        driver_name: t.drivers?.name,
        destinations: (t.trip_destinations || []).map((d: any) => ({
          sequence_order: d.sequence_order,
          destination_name: d.destination_name,
          unloading_charge: Number(d.unloading_charge),
        })),
        financials: {
          freight: Number(t.trip_party_financials?.[0]?.freight || 0),
          unloading_charges: Number(t.trip_party_financials?.[0]?.unloading_charges || 0),
          detention: Number(t.trip_party_financials?.[0]?.detention || 0),
          additional_charges: Number(t.trip_party_financials?.[0]?.additional_charges || 0),
          deductions: Number(t.trip_party_financials?.[0]?.deductions || 0),
          tds_amount: Number(t.trip_party_financials?.[0]?.tds_amount || 0),
          gross_receivable: Number(t.trip_party_financials?.[0]?.gross_receivable || 0),
          net_receivable: Number(t.trip_party_financials?.[0]?.net_receivable || 0),
        },
      })),
    };

    const snapshotData = buildBillSnapshot(snapshotInput);

    // 7. Persist Bill Version v1
    const { data: billVer } = await serviceClient
      .from('bill_versions')
      .insert({
        bill_id: bill.id,
        version_number: 1,
        snapshot_data: snapshotData,
        generated_by: user.id,
      })
      .select()
      .single();

    // 8. Audit Log
    await serviceClient.from('audit_logs').insert({
      entity_type: 'bill',
      entity_id: bill.id,
      action: 'BILL_CREATE',
      new_values: { bill, version: billVer },
      performed_by: user.id,
    });

    return NextResponse.json({ success: true, bill, version: billVer }, { status: 201 });
  } catch (err: unknown) {
    if (err instanceof BillDomainError) return NextResponse.json({ error: err.message, code: err.code }, { status: 400 });
    if (err instanceof AuthorizationError) return NextResponse.json({ error: err.message }, { status: 403 });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
