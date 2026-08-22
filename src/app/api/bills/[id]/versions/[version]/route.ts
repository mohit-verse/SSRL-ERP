import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@/lib/database/supabase-server';
import { getServiceRoleSupabase } from '@/lib/database/supabase';
import { requirePermission, AuthorizationError } from '@/lib/security/rbac';
import { Profile } from '@/lib/types';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; version: string } }
) {
  try {
    const supabase = await createServerComponentClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: '401 Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    if (!profile || !profile.is_active) return NextResponse.json({ error: '403 Forbidden' }, { status: 403 });

    requirePermission(profile as Profile, 'BILL_GENERATE');

    const verNum = parseInt(params.version, 10);
    if (isNaN(verNum)) return NextResponse.json({ error: 'Invalid version number.', code: 'BILL_VERSION_NOT_FOUND' }, { status: 400 });

    const serviceClient = getServiceRoleSupabase();

    const { data: billVer, error } = await serviceClient
      .from('bill_versions')
      .select('*')
      .eq('bill_id', params.id)
      .eq('version_number', verNum)
      .single();

    if (error || !billVer) {
      return NextResponse.json({ error: `Bill version v${verNum} not found.`, code: 'BILL_VERSION_NOT_FOUND' }, { status: 404 });
    }

    return NextResponse.json({ version: billVer });
  } catch (err: unknown) {
    if (err instanceof AuthorizationError) return NextResponse.json({ error: err.message }, { status: 403 });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
