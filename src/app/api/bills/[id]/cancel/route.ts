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

    const body = await request.json();
    const { reason } = body;

    if (!reason || reason.trim() === '') {
      return NextResponse.json({ error: 'Cancellation reason is mandatory.', code: 'BILL_STATUS_INVALID' }, { status: 400 });
    }

    const serviceClient = getServiceRoleSupabase();

    const { data: bill } = await serviceClient.from('bills').select('*').eq('id', params.id).single();
    if (!bill) return NextResponse.json({ error: 'Bill not found.', code: 'BILL_NOT_FOUND' }, { status: 404 });

    validateBillStatusTransition(bill.status, 'CANCELLED', profile.role);

    const now = new Date().toISOString();
    await serviceClient
      .from('bills')
      .update({
        status: 'CANCELLED',
        cancelled_at: now,
        cancelled_by: user.id,
        cancellation_reason: reason.trim(),
      })
      .eq('id', params.id);

    // Unmark bill_trips is_current so trips can be re-billed if needed
    await serviceClient
      .from('bill_trips')
      .update({ is_current: false })
      .eq('bill_id', params.id);

    await serviceClient.from('audit_logs').insert({
      entity_type: 'bill',
      entity_id: params.id,
      action: 'BILL_CANCEL',
      old_values: { status: bill.status },
      new_values: { status: 'CANCELLED', cancellation_reason: reason.trim() },
      change_reason: reason.trim(),
      performed_by: user.id,
    });

    return NextResponse.json({ success: true, message: 'Bill cancelled successfully.' });
  } catch (err: unknown) {
    if (err instanceof BillDomainError) return NextResponse.json({ error: err.message, code: err.code }, { status: 400 });
    if (err instanceof AuthorizationError) return NextResponse.json({ error: err.message }, { status: 403 });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
