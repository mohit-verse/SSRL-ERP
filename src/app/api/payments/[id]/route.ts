import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@/lib/database/supabase-server';
import { getServiceRoleSupabase } from '@/lib/database/supabase';
import { requirePermission, AuthorizationError } from '@/lib/security/rbac';
import { Profile } from '@/lib/types';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerComponentClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: '401 Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    if (!profile || !profile.is_active) return NextResponse.json({ error: '403 Forbidden' }, { status: 403 });

    requirePermission(profile as Profile, 'PAYMENT_RECORD');

    const serviceClient = getServiceRoleSupabase();

    const { data: payment, error } = await serviceClient
      .from('payments')
      .select('*, parties(*), vehicle_owners(*), trips(*), payment_allocations(*, trips(trip_number, loading_date)), party_credits(*, party_credit_usages(*)), payment_reversals(*)')
      .eq('id', params.id)
      .single();

    if (error || !payment) {
      return NextResponse.json({ error: 'Payment record not found', code: 'PAYMENT_NOT_FOUND' }, { status: 404 });
    }

    return NextResponse.json({ payment });
  } catch (err: unknown) {
    if (err instanceof AuthorizationError) return NextResponse.json({ error: err.message }, { status: 403 });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
