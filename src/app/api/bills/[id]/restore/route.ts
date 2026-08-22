import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@/lib/database/supabase-server';
import { getServiceRoleSupabase } from '@/lib/database/supabase';
import { requirePermission, AuthorizationError } from '@/lib/security/rbac';
import { validateBillStatusTransition, BillDomainError } from '@/lib/domain/bills/service';
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

    requirePermission(profile as Profile, 'BILL_CANCEL_RESTORE');

    const serviceClient = getServiceRoleSupabase();

    const { data: bill } = await serviceClient
      .from('bills')
      .select('*, bill_trips(*)')
      .eq('id', params.id)
      .single();

    if (!bill) return NextResponse.json({ error: 'Bill not found.', code: 'BILL_NOT_FOUND' }, { status: 404 });

    validateBillStatusTransition(bill.status, 'RESTORED', profile.role);

    // Verify mapped trips are not currently attached to another CURRENT bill
    const tripIds = (bill.bill_trips || []).map((bt: any) => bt.trip_id);
    for (const tid of tripIds) {
      const { data: conflict } = await serviceClient
        .from('bill_trips')
        .select('id')
        .eq('trip_id', tid)
        .eq('is_current', true)
        .maybeSingle();

      if (conflict) {
        return NextResponse.json({
          error: `Cannot restore bill. Trip ${tid} is already attached to another CURRENT bill.`,
          code: 'BILL_RESTORE_CONFLICT',
        }, { status: 400 });
      }
    }

    await serviceClient
      .from('bills')
      .update({ status: 'RESTORED' })
      .eq('id', params.id);

    // Re-mark bill_trips as current
    await serviceClient
      .from('bill_trips')
      .update({ is_current: true })
      .eq('bill_id', params.id);

    await serviceClient.from('audit_logs').insert({
      entity_type: 'bill',
      entity_id: params.id,
      action: 'BILL_RESTORE',
      old_values: { status: bill.status },
      new_values: { status: 'RESTORED' },
      performed_by: user.id,
    });

    return NextResponse.json({ success: true, message: 'Bill restored successfully.' });
  } catch (err: unknown) {
    if (err instanceof BillDomainError) return NextResponse.json({ error: err.message, code: err.code }, { status: 400 });
    if (err instanceof AuthorizationError) return NextResponse.json({ error: err.message }, { status: 403 });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
