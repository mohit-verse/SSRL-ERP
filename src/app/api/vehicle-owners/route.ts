import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@/lib/database/supabase-server';
import { getServiceRoleSupabase } from '@/lib/database/supabase';
import { requirePermission, AuthorizationError } from '@/lib/security/rbac';
import { prepareOwnerRecord, sanitizeOwnerForList, OwnerDomainError } from '@/lib/domain/owners/service';
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
    const { data: owners, error } = await serviceClient.from('vehicle_owners').select('*').order('name', { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const sanitizedOwners = (owners || []).map(sanitizeOwnerForList);
    return NextResponse.json({ owners: sanitizedOwners });
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
    const ownerData = prepareOwnerRecord(body);

    const serviceClient = getServiceRoleSupabase();
    const { data: owner, error } = await serviceClient
      .from('vehicle_owners')
      .insert(ownerData)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await serviceClient.from('audit_logs').insert({
      entity_type: 'vehicle_owner',
      entity_id: owner.id,
      action: 'OWNER_CREATE',
      new_values: owner,
      performed_by: user.id,
    });

    return NextResponse.json({ owner: sanitizeOwnerForList(owner) }, { status: 201 });
  } catch (err: unknown) {
    if (err instanceof OwnerDomainError) return NextResponse.json({ error: err.message }, { status: 400 });
    if (err instanceof AuthorizationError) return NextResponse.json({ error: err.message }, { status: 403 });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
