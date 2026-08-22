import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@/lib/database/supabase-server';
import { getServiceRoleSupabase } from '@/lib/database/supabase';
import { requirePermission, AuthorizationError } from '@/lib/security/rbac';
import { PaymentDomainError } from '@/lib/domain/payments/service';
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

    // SUPER_ADMIN Permission Guard
    requirePermission(profile as Profile, 'PAYMENT_REVERSE');

    const body = await request.json();
    const { reason } = body;

    if (!reason || reason.trim() === '') {
      return NextResponse.json({ error: 'Cancellation reason is mandatory.', code: 'PAYMENT_AMOUNT_INVALID' }, { status: 400 });
    }

    const serviceClient = getServiceRoleSupabase();

    // 1. Lock & Verify Payment
    const { data: payment } = await serviceClient
      .from('payments')
      .select('*')
      .eq('id', params.id)
      .single();

    if (!payment) return NextResponse.json({ error: 'Payment not found', code: 'PAYMENT_NOT_FOUND' }, { status: 404 });

    if (payment.status === 'CANCELLED') {
      return NextResponse.json({ error: 'Payment is already cancelled.', code: 'PAYMENT_ALREADY_CANCELLED' }, { status: 400 });
    }

    // 2. Mark Payment CANCELLED
    const now = new Date().toISOString();
    const { error: cancelErr } = await serviceClient
      .from('payments')
      .update({
        status: 'CANCELLED',
        cancelled_at: now,
        cancelled_by: user.id,
        cancellation_reason: reason.trim(),
      })
      .eq('id', params.id);

    if (cancelErr) return NextResponse.json({ error: cancelErr.message }, { status: 500 });

    // 3. Reverse Payment Allocations
    await serviceClient
      .from('payment_allocations')
      .update({ status: 'REVERSED' })
      .eq('payment_id', params.id);

    // 4. Reverse Generated Party Credits & Usages
    const { data: credits } = await serviceClient
      .from('party_credits')
      .select('id')
      .eq('source_payment_id', params.id);

    if (credits && credits.length > 0) {
      const creditIds = credits.map((c) => c.id);

      // Reverse Credits
      await serviceClient
        .from('party_credits')
        .update({ status: 'REVERSED', remaining_credit: 0 })
        .in('id', creditIds);

      // Reverse Credit Usages
      await serviceClient
        .from('party_credit_usages')
        .update({ is_reversed: true })
        .in('credit_id', creditIds);
    }

    // 5. Insert Payment Reversal Record
    await serviceClient.from('payment_reversals').insert({
      payment_id: params.id,
      reversal_amount: payment.amount,
      reason: reason.trim(),
      reversed_by: user.id,
      reversed_at: now,
    });

    // 6. Audit Integration
    await serviceClient.from('audit_logs').insert({
      entity_type: 'payment',
      entity_id: params.id,
      action: 'PAYMENT_CANCEL',
      old_values: { status: 'ACTIVE', amount: payment.amount },
      new_values: { status: 'CANCELLED', cancellation_reason: reason.trim() },
      change_reason: reason.trim(),
      performed_by: user.id,
    });

    return NextResponse.json({ success: true, message: 'Payment cancelled and allocations reversed successfully.' });
  } catch (err: unknown) {
    if (err instanceof PaymentDomainError) return NextResponse.json({ error: err.message, code: err.code }, { status: 400 });
    if (err instanceof AuthorizationError) return NextResponse.json({ error: err.message }, { status: 403 });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
