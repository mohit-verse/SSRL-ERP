import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@/lib/database/supabase-server';
import { getServiceRoleSupabase } from '@/lib/database/supabase';
import { requirePermission, AuthorizationError } from '@/lib/security/rbac';
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

    const body = await request.json();
    const { bill_id } = body;

    if (!bill_id) return NextResponse.json({ error: 'bill_id is required.', code: 'SUBMISSION_BILL_INVALID' }, { status: 400 });

    const serviceClient = getServiceRoleSupabase();

    // Check Duplicate Mapping
    const { data: existingMap } = await serviceClient
      .from('submission_bills')
      .select('id')
      .eq('submission_id', params.id)
      .eq('bill_id', bill_id)
      .maybeSingle();

    if (existingMap) {
      return NextResponse.json({ error: 'Bill is already attached to this submission.', code: 'SUBMISSION_BILL_DUPLICATE' }, { status: 400 });
    }

    const { data: subBill, error } = await serviceClient
      .from('submission_bills')
      .insert({
        submission_id: params.id,
        bill_id,
      })
      .select()
      .single();

    if (error || !subBill) return NextResponse.json({ error: error?.message || 'Failed to attach bill' }, { status: 500 });

    await serviceClient.from('audit_logs').insert({
      entity_type: 'submission',
      entity_id: params.id,
      action: 'SUBMISSION_BILL_ATTACH',
      new_values: { submission_id: params.id, bill_id },
      performed_by: user.id,
    });

    return NextResponse.json({ success: true, submission_bill: subBill }, { status: 201 });
  } catch (err: unknown) {
    if (err instanceof AuthorizationError) return NextResponse.json({ error: err.message }, { status: 403 });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
