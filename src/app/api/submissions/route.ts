import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@/lib/database/supabase-server';
import { getServiceRoleSupabase } from '@/lib/database/supabase';
import { requirePermission, AuthorizationError } from '@/lib/security/rbac';
import { Profile } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerComponentClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: '401 Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    if (!profile || !profile.is_active) return NextResponse.json({ error: '403 Forbidden' }, { status: 403 });

    requirePermission(profile as Profile, 'BILL_GENERATE');

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '15', 10);
    const partyId = searchParams.get('party_id');
    const offset = (page - 1) * limit;

    const serviceClient = getServiceRoleSupabase();
    let dbQuery = serviceClient
      .from('submissions')
      .select('*, parties(name), submission_bills(*, bills(bill_number, current_version, status))', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (partyId) dbQuery = dbQuery.eq('party_id', partyId);

    const { data: submissions, count, error } = await dbQuery;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({
      submissions,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
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

    requirePermission(profile as Profile, 'BILL_GENERATE');

    const body = await request.json();
    const { party_id, submission_date, remarks, bill_ids } = body;

    if (!party_id || !submission_date) {
      return NextResponse.json({ error: 'Party ID and submission_date are required.', code: 'SUBMISSION_NOT_FOUND' }, { status: 400 });
    }

    const serviceClient = getServiceRoleSupabase();

    const subNumber = `SUB-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const { data: submission, error: subErr } = await serviceClient
      .from('submissions')
      .insert({
        submission_number: subNumber,
        party_id,
        submission_date,
        remarks: remarks?.trim() || null,
        created_by: user.id,
      })
      .select()
      .single();

    if (subErr || !submission) return NextResponse.json({ error: subErr?.message || 'Submission creation failed' }, { status: 500 });

    if (bill_ids && Array.isArray(bill_ids) && bill_ids.length > 0) {
      const subBillInserts = bill_ids.map((bId: string) => ({
        submission_id: submission.id,
        bill_id: bId,
      }));
      await serviceClient.from('submission_bills').insert(subBillInserts);
    }

    await serviceClient.from('audit_logs').insert({
      entity_type: 'submission',
      entity_id: submission.id,
      action: 'SUBMISSION_CREATE',
      new_values: { submission, bill_ids },
      performed_by: user.id,
    });

    return NextResponse.json({ success: true, submission }, { status: 201 });
  } catch (err: unknown) {
    if (err instanceof AuthorizationError) return NextResponse.json({ error: err.message }, { status: 403 });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
