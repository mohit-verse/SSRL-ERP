import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@/lib/database/supabase-server';
import { getServiceRoleSupabase } from '@/lib/database/supabase';
import { requirePermission, AuthorizationError } from '@/lib/security/rbac';
import { validateTripStatusTransition, validateTripSoftDelete, TripDomainError } from '@/lib/domain/trips/service';
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

    requirePermission(profile as Profile, 'LOGISTICS_VIEW');

    const serviceClient = getServiceRoleSupabase();

    const { data: trip, error } = await serviceClient
      .from('trips')
      .select('*, parties(*), vehicles(*), vehicle_owners(*), drivers(*), trip_destinations(*), trip_party_financials(*), trip_owner_financials(*)')
      .eq('id', params.id)
      .single();

    if (error || !trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    return NextResponse.json({ trip });
  } catch (err: unknown) {
    if (err instanceof AuthorizationError) return NextResponse.json({ error: err.message }, { status: 403 });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerComponentClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: '401 Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    if (!profile || !profile.is_active) return NextResponse.json({ error: '403 Forbidden' }, { status: 403 });

    const body = await request.json();
    const serviceClient = getServiceRoleSupabase();

    const { data: existingTrip } = await serviceClient.from('trips').select('*').eq('id', params.id).single();
    if (!existingTrip) return NextResponse.json({ error: 'Trip not found' }, { status: 404 });

    // Handle Status State Machine Transition
    if (body.target_status) {
      validateTripStatusTransition(existingTrip.trip_status, body.target_status, profile.role);

      const { data: updatedTrip, error: updateError } = await serviceClient
        .from('trips')
        .update({ trip_status: body.target_status })
        .eq('id', params.id)
        .select()
        .single();

      if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

      // Audit Integration Point
      await serviceClient.from('audit_logs').insert({
        entity_type: 'trip',
        entity_id: params.id,
        action: 'TRIP_STATUS_CHANGE',
        old_values: { trip_status: existingTrip.trip_status },
        new_values: { trip_status: body.target_status },
        change_reason: body.change_reason || 'Trip lifecycle transition',
        performed_by: user.id,
      });

      return NextResponse.json({ success: true, trip: updatedTrip });
    }

    return NextResponse.json({ error: 'No valid update parameters provided' }, { status: 400 });
  } catch (err: unknown) {
    if (err instanceof TripDomainError) return NextResponse.json({ error: err.message }, { status: 400 });
    if (err instanceof AuthorizationError) return NextResponse.json({ error: err.message }, { status: 403 });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerComponentClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: '401 Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    if (!profile || !profile.is_active) return NextResponse.json({ error: '403 Forbidden' }, { status: 403 });

    const serviceClient = getServiceRoleSupabase();

    const { data: existingTrip } = await serviceClient.from('trips').select('*').eq('id', params.id).single();
    if (!existingTrip) return NextResponse.json({ error: 'Trip not found' }, { status: 404 });

    // Check for active payments/allocations
    const { data: activeAllocations } = await serviceClient
      .from('payment_allocations')
      .select('id')
      .eq('trip_id', params.id)
      .eq('allocation_status', 'ACTIVE');

    const hasActivePayments = (activeAllocations || []).length > 0;

    // Validate soft delete permissions and constraints
    validateTripSoftDelete(existingTrip, hasActivePayments, profile as Profile);

    // Soft delete (is_deleted = true)
    const { error: deleteError } = await serviceClient
      .from('trips')
      .update({ is_deleted: true })
      .eq('id', params.id);

    if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 });

    // Audit integration
    await serviceClient.from('audit_logs').insert({
      entity_type: 'trip',
      entity_id: params.id,
      action: 'TRIP_SOFT_DELETE',
      old_values: { is_deleted: false },
      new_values: { is_deleted: true },
      performed_by: user.id,
    });

    return NextResponse.json({ success: true, message: 'Trip soft-deleted successfully' });
  } catch (err: unknown) {
    if (err instanceof TripDomainError) return NextResponse.json({ error: err.message }, { status: 400 });
    if (err instanceof AuthorizationError) return NextResponse.json({ error: err.message }, { status: 403 });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
