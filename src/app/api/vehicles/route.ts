import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@/lib/database/supabase-server';
import { getServiceRoleSupabase } from '@/lib/database/supabase';
import { requirePermission, AuthorizationError } from '@/lib/security/rbac';
import { prepareVehicleRecord, VehicleDomainError } from '@/lib/domain/vehicles/service';
import { Profile } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerComponentClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: '401 Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    if (!profile || !profile.is_active) return NextResponse.json({ error: '403 Forbidden' }, { status: 403 });

    requirePermission(profile as Profile, 'LOGISTICS_VIEW');

    const serviceClient = getServiceRoleSupabase();
    const { data: vehicles, error } = await serviceClient
      .from('vehicles')
      .select('*, vehicle_owners(name)')
      .order('vehicle_number', { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ vehicles });
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
    const vehicleData = prepareVehicleRecord(body);

    const serviceClient = getServiceRoleSupabase();

    // Check duplicate normalized vehicle number
    const { data: existing } = await serviceClient
      .from('vehicles')
      .select('id')
      .eq('vehicle_number', vehicleData.vehicle_number)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: `Vehicle with number '${vehicleData.vehicle_number}' already exists.` }, { status: 400 });
    }

    const { data: vehicle, error } = await serviceClient
      .from('vehicles')
      .insert(vehicleData)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await serviceClient.from('audit_logs').insert({
      entity_type: 'vehicle',
      entity_id: vehicle.id,
      action: 'VEHICLE_CREATE',
      new_values: vehicle,
      performed_by: user.id,
    });

    return NextResponse.json({ vehicle }, { status: 201 });
  } catch (err: unknown) {
    if (err instanceof VehicleDomainError) return NextResponse.json({ error: err.message }, { status: 400 });
    if (err instanceof AuthorizationError) return NextResponse.json({ error: err.message }, { status: 403 });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
