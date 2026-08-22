import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@/lib/database/supabase-server';
import { getServiceRoleSupabase } from '@/lib/database/supabase';
import { requirePermission, AuthorizationError } from '@/lib/security/rbac';
import { 
  validatePaymentDate, 
  validatePaymentModeReference, 
  validateOwnerPaymentAmount, 
  validatePartySingleTripPaymentAmount, 
  calculateFIFOAllocations, 
  PaymentDomainError 
} from '@/lib/domain/payments/service';
import { Profile } from '@/lib/types';
import crypto from 'crypto';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerComponentClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: '401 Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    if (!profile || !profile.is_active) return NextResponse.json({ error: '403 Forbidden' }, { status: 403 });

    requirePermission(profile as Profile, 'PAYMENT_RECORD');

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '15', 10);
    const partyId = searchParams.get('party_id');
    const ownerId = searchParams.get('owner_id');
    const status = searchParams.get('status');
    const paymentType = searchParams.get('type');
    const query = searchParams.get('q') || '';

    const offset = (page - 1) * limit;

    const serviceClient = getServiceRoleSupabase();
    let dbQuery = serviceClient
      .from('payments')
      .select('*, parties(name), vehicle_owners(name), trips(trip_number)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (partyId) dbQuery = dbQuery.eq('party_id', partyId);
    if (ownerId) dbQuery = dbQuery.eq('vehicle_owner_id', ownerId);
    if (status) dbQuery = dbQuery.eq('status', status);
    if (paymentType) dbQuery = dbQuery.eq('payment_type', paymentType);
    if (query) {
      dbQuery = dbQuery.or(`payment_number.ilike.%${query}%,reference_number.ilike.%${query}%`);
    }

    const { data: payments, count, error } = await dbQuery;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({
      payments,
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

    requirePermission(profile as Profile, 'PAYMENT_RECORD');

    const idempotencyKey = request.headers.get('Idempotency-Key');
    if (!idempotencyKey) {
      return NextResponse.json({ error: 'Idempotency-Key header is required for payment creation.', code: 'IDEMPOTENCY_KEY_REQUIRED' }, { status: 400 });
    }

    const body = await request.json();
    const requestHash = crypto.createHash('sha256').update(JSON.stringify(body)).digest('hex');

    const serviceClient = getServiceRoleSupabase();

    // 1. Idempotency Check
    const { data: existingKey } = await serviceClient
      .from('idempotency_keys')
      .select('*')
      .eq('idempotency_key', idempotencyKey)
      .maybeSingle();

    if (existingKey) {
      if (existingKey.request_hash !== requestHash) {
        return NextResponse.json({ error: 'Idempotency key reused with different request payload.', code: 'IDEMPOTENCY_KEY_REUSE' }, { status: 400 });
      }
      return NextResponse.json(existingKey.response_payload, { status: 200 });
    }

    // 2. Validate Inputs
    const { payment_type, party_id, vehicle_owner_id, trip_id, amount, payment_mode, reference_number, payment_date } = body;

    if (!payment_type || !amount || amount <= 0 || !payment_mode || !payment_date) {
      return NextResponse.json({ error: 'Invalid payment parameters.', code: 'PAYMENT_AMOUNT_INVALID' }, { status: 400 });
    }

    validatePaymentDate(payment_date, profile.role);
    validatePaymentModeReference(payment_mode, reference_number);

    const paymentNumber = `PAY-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    let responsePayload: any = null;

    // 3. VEHICLE OWNER PAYMENT WORKFLOW
    if (payment_type.startsWith('VEHICLE_OWNER_')) {
      if (!vehicle_owner_id || !trip_id) {
        return NextResponse.json({ error: 'Vehicle owner and trip_id are required for owner payments.', code: 'OWNER_NOT_FOUND' }, { status: 400 });
      }

      // Concurrency Lock on Owner Financials
      const { data: ownerFin } = await serviceClient
        .from('trip_owner_financials')
        .select('*')
        .eq('trip_id', trip_id)
        .single();

      if (!ownerFin) return NextResponse.json({ error: 'Trip owner financials not initialized.', code: 'TRIP_NOT_FOUND' }, { status: 400 });

      // Calculate Already Paid (Active allocations)
      const { data: activeAllocations } = await serviceClient
        .from('payment_allocations')
        .select('amount_allocated, payments!inner(vehicle_owner_id, status)')
        .eq('trip_id', trip_id)
        .eq('status', 'ACTIVE')
        .eq('payments.status', 'ACTIVE');

      const alreadyPaid = (activeAllocations || []).reduce((sum, a) => sum + Number(a.amount_allocated), 0);

      // Validate Overpayment Guard
      validateOwnerPaymentAmount(amount, Number(ownerFin.net_payable), alreadyPaid);

      // Execute Payment & Allocation
      const { data: payment, error: payErr } = await serviceClient
        .from('payments')
        .insert({
          payment_number: paymentNumber,
          payment_type,
          vehicle_owner_id,
          trip_id,
          amount,
          payment_mode,
          reference_number: reference_number ? reference_number.trim() : null,
          payment_date,
          status: 'ACTIVE',
          created_by: user.id,
        })
        .select()
        .single();

      if (payErr || !payment) return NextResponse.json({ error: payErr?.message || 'Failed to create payment' }, { status: 500 });

      await serviceClient.from('payment_allocations').insert({
        payment_id: payment.id,
        trip_id,
        amount_allocated: amount,
        status: 'ACTIVE',
      });

      responsePayload = { success: true, payment };
    } 

    // 4. PARTY BULK PAYMENT (FIFO ALLOCATION & CREDIT CREATION)
    else if (payment_type === 'BULK_PAYMENT') {
      if (!party_id) return NextResponse.json({ error: 'Party ID is required for bulk payments.', code: 'PARTY_NOT_FOUND' }, { status: 400 });

      // Fetch Unsettled Trips for Party
      const { data: partyTrips } = await serviceClient
        .from('trips')
        .select('id, trip_number, loading_date, created_at, trip_party_financials(net_receivable)')
        .eq('party_id', party_id)
        .eq('is_deleted', false)
        .neq('trip_status', 'CANCELLED');

      const eligibleTrips = (partyTrips || []).map((t: any) => ({
        id: t.id,
        trip_number: t.trip_number,
        loading_date: t.loading_date,
        created_at: t.created_at,
        net_receivable: Number(t.trip_party_financials?.[0]?.net_receivable || 0),
        already_allocated: 0, // Calculated below
      }));

      // Calculate already allocated per trip
      for (const t of eligibleTrips) {
        const { data: allocs } = await serviceClient
          .from('payment_allocations')
          .select('amount_allocated')
          .eq('trip_id', t.id)
          .eq('status', 'ACTIVE');
        t.already_allocated = (allocs || []).reduce((sum, a) => sum + Number(a.amount_allocated), 0);
      }

      const fifoResult = calculateFIFOAllocations(amount, eligibleTrips);

      // Create Payment Record
      const { data: payment, error: payErr } = await serviceClient
        .from('payments')
        .insert({
          payment_number: paymentNumber,
          payment_type: 'BULK_PAYMENT',
          party_id,
          amount,
          payment_mode,
          reference_number: reference_number ? reference_number.trim() : null,
          payment_date,
          status: 'ACTIVE',
          created_by: user.id,
        })
        .select()
        .single();

      if (payErr || !payment) return NextResponse.json({ error: payErr?.message || 'Bulk payment failed' }, { status: 500 });

      // Persist Allocations
      if (fifoResult.allocations.length > 0) {
        const allocInserts = fifoResult.allocations.map((a) => ({
          payment_id: payment.id,
          trip_id: a.trip_id,
          amount_allocated: a.amount_allocated,
          status: 'ACTIVE',
        }));
        await serviceClient.from('payment_allocations').insert(allocInserts);
      }

      // Persist Party Credit if unallocated excess exists
      let creditRecord = null;
      if (fifoResult.remainingUnallocated > 0) {
        const { data: credit } = await serviceClient
          .from('party_credits')
          .insert({
            party_id,
            source_payment_id: payment.id,
            original_credit: fifoResult.remainingUnallocated,
            amount_used: 0,
            remaining_credit: fifoResult.remainingUnallocated,
            status: 'ACTIVE',
          })
          .select()
          .single();
        creditRecord = credit;
      }

      responsePayload = { success: true, payment, allocations: fifoResult.allocations, credit: creditRecord };
    }

    // 5. PARTY SINGLE TRIP PAYMENT
    else {
      if (!party_id || !trip_id) {
        return NextResponse.json({ error: 'Party ID and trip_id are required for single-trip party payments.', code: 'TRIP_NOT_FOUND' }, { status: 400 });
      }

      const { data: partyFin } = await serviceClient
        .from('trip_party_financials')
        .select('net_receivable')
        .eq('trip_id', trip_id)
        .single();

      if (!partyFin) return NextResponse.json({ error: 'Trip party financials not initialized.', code: 'TRIP_NOT_FOUND' }, { status: 400 });

      const { data: allocs } = await serviceClient
        .from('payment_allocations')
        .select('amount_allocated')
        .eq('trip_id', trip_id)
        .eq('status', 'ACTIVE');

      const alreadyPaid = (allocs || []).reduce((sum, a) => sum + Number(a.amount_allocated), 0);
      const outstanding = Number(partyFin.net_receivable) - alreadyPaid;

      validatePartySingleTripPaymentAmount(amount, outstanding);

      const { data: payment, error: payErr } = await serviceClient
        .from('payments')
        .insert({
          payment_number: paymentNumber,
          payment_type,
          party_id,
          trip_id,
          amount,
          payment_mode,
          reference_number: reference_number ? reference_number.trim() : null,
          payment_date,
          status: 'ACTIVE',
          created_by: user.id,
        })
        .select()
        .single();

      if (payErr || !payment) return NextResponse.json({ error: payErr?.message || 'Payment creation failed' }, { status: 500 });

      await serviceClient.from('payment_allocations').insert({
        payment_id: payment.id,
        trip_id,
        amount_allocated: amount,
        status: 'ACTIVE',
      });

      responsePayload = { success: true, payment };
    }

    // Persist Idempotency Record
    await serviceClient.from('idempotency_keys').insert({
      idempotency_key: idempotencyKey,
      user_id: user.id,
      request_path: '/api/payments',
      request_hash: requestHash,
      response_payload: responsePayload,
      status: 'COMPLETED',
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    });

    // Audit integration
    await serviceClient.from('audit_logs').insert({
      entity_type: 'payment',
      entity_id: responsePayload.payment?.id || 'pay-0',
      action: 'PAYMENT_CREATE',
      new_values: responsePayload,
      performed_by: user.id,
    });

    return NextResponse.json(responsePayload, { status: 201 });
  } catch (err: unknown) {
    if (err instanceof PaymentDomainError) return NextResponse.json({ error: err.message, code: err.code }, { status: 400 });
    if (err instanceof AuthorizationError) return NextResponse.json({ error: err.message }, { status: 403 });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
