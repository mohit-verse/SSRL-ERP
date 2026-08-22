import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@/lib/database/supabase-server';
import { getServiceRoleSupabase } from '@/lib/database/supabase';
import { requirePermission, AuthorizationError } from '@/lib/security/rbac';
import { buildBillSnapshot, BillDomainError } from '@/lib/domain/bills/service';
import { Profile } from '@/lib/types';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerComponentClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: '401 Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    if (!profile || !profile.is_active) return NextResponse.json({ error: '403 Forbidden' }, { status: 403 });

    requirePermission(profile as Profile, 'BILL_GENERATE');

    const serviceClient = getServiceRoleSupabase();

    // 1. Lock & Fetch Bill
    const { data: bill } = await serviceClient
      .from('bills')
      .select('*, parties(*), bill_trips(*)')
      .eq('id', params.id)
      .single();

    if (!bill) return NextResponse.json({ error: 'Bill not found.', code: 'BILL_NOT_FOUND' }, { status: 404 });
    if (bill.status === 'CANCELLED') return NextResponse.json({ error: 'Cannot generate version for a CANCELLED bill.', code: 'BILL_CANCELLED' }, { status: 400 });

    const tripIds = (bill.bill_trips || []).map((bt: any) => bt.trip_id);

    // 2. Fetch Latest Trip Financials
    const { data: trips } = await serviceClient
      .from('trips')
      .select('*, vehicles(vehicle_number), drivers(name), trip_destinations(*), trip_party_financials(*)')
      .in('id', tripIds);

    if (!trips || trips.length === 0) {
      return NextResponse.json({ error: 'Mapped trips not found.', code: 'BILL_TRIP_NOT_FOUND' }, { status: 404 });
    }

    // Check if any mapped trip is soft-deleted
    const deletedTrip = trips.find((t) => t.is_deleted);
    if (deletedTrip) {
      return NextResponse.json({
        error: `Cannot generate version while trip ${deletedTrip.trip_number} is soft-deleted.`,
        code: 'BILL_TRIP_DELETED',
      }, { status: 400 });
    }

    const nextVersion = (bill.current_version || 1) + 1;

    // 3. Build New Immutable Snapshot
    const snapshotInput = {
      bill_number: bill.bill_number,
      version_number: nextVersion,
      generated_at: new Date().toISOString(),
      party: {
        id: bill.parties.id,
        name: bill.parties.name,
        gstin: bill.parties.gstin,
        phone: bill.parties.phone,
        address: bill.parties.address,
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

    // 4. Persist New Version
    const { data: billVer, error: verErr } = await serviceClient
      .from('bill_versions')
      .insert({
        bill_id: bill.id,
        version_number: nextVersion,
        snapshot_data: snapshotData,
        generated_by: user.id,
      })
      .select()
      .single();

    if (verErr || !billVer) return NextResponse.json({ error: verErr?.message || 'Version generation failed' }, { status: 500 });

    // 5. Update Bill Record to CURRENT with new version_number
    await serviceClient
      .from('bills')
      .update({
        current_version: nextVersion,
        status: 'CURRENT',
      })
      .eq('id', bill.id);

    // 6. Audit Event
    await serviceClient.from('audit_logs').insert({
      entity_type: 'bill',
      entity_id: bill.id,
      action: 'BILL_VERSION_CREATE',
      old_values: { current_version: bill.current_version, status: bill.status },
      new_values: { current_version: nextVersion, status: 'CURRENT' },
      performed_by: user.id,
    });

    return NextResponse.json({ success: true, version: billVer });
  } catch (err: unknown) {
    if (err instanceof BillDomainError) return NextResponse.json({ error: err.message, code: err.code }, { status: 400 });
    if (err instanceof AuthorizationError) return NextResponse.json({ error: err.message }, { status: 403 });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
