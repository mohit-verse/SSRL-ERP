import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@/lib/database/supabase-server';
import { getServiceRoleSupabase } from '@/lib/database/supabase';
import { requirePermission, AuthorizationError } from '@/lib/security/rbac';
import { preparePartyRecord, PartyDomainError } from '@/lib/domain/parties/service';
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
    const query = searchParams.get('q') || '';

    const serviceClient = getServiceRoleSupabase();
    let dbQuery = serviceClient.from('parties').select('*').order('name', { ascending: true });

    if (query) {
      dbQuery = dbQuery.or(`name.ilike.%${query}%,phone.ilike.%${query}%,gstin.ilike.%${query}%`);
    }

    const { data: parties, error } = await dbQuery;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ parties });
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
    const partyData = preparePartyRecord(body);

    const serviceClient = getServiceRoleSupabase();

    // Check duplicate party name
    const { data: existing } = await serviceClient
      .from('parties')
      .select('id')
      .ilike('name', partyData.name)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: `Party with name '${partyData.name}' already exists.` }, { status: 400 });
    }

    const { data: party, error } = await serviceClient
      .from('parties')
      .insert(partyData)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Audit integration
    await serviceClient.from('audit_logs').insert({
      entity_type: 'party',
      entity_id: party.id,
      action: 'PARTY_CREATE',
      new_values: party,
      performed_by: user.id,
    });

    return NextResponse.json({ party }, { status: 201 });
  } catch (err: unknown) {
    if (err instanceof PartyDomainError) return NextResponse.json({ error: err.message }, { status: 400 });
    if (err instanceof AuthorizationError) return NextResponse.json({ error: err.message }, { status: 403 });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
