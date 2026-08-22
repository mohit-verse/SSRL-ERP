import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@/lib/database/supabase-server';
import { getServiceRoleSupabase } from '@/lib/database/supabase';
import { requirePermission, AuthorizationError } from '@/lib/security/rbac';
import { prepareDriverRecord, DriverDomainError } from '@/lib/domain/drivers/service';
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
    const { data: drivers, error } = await serviceClient.from('drivers').select('*').order('name', { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ drivers });
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
    const driverData = prepareDriverRecord(body);

    const serviceClient = getServiceRoleSupabase();
    const { data: driver, error } = await serviceClient
      .from('drivers')
      .insert(driverData)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await serviceClient.from('audit_logs').insert({
      entity_type: 'driver',
      entity_id: driver.id,
      action: 'DRIVER_CREATE',
      new_values: driver,
      performed_by: user.id,
    });

    return NextResponse.json({ driver }, { status: 201 });
  } catch (err: unknown) {
    if (err instanceof DriverDomainError) return NextResponse.json({ error: err.message }, { status: 400 });
    if (err instanceof AuthorizationError) return NextResponse.json({ error: err.message }, { status: 403 });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
