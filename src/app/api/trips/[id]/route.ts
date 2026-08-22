import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@/lib/database/supabase-server';
import { getServiceRoleSupabase } from '@/lib/database/supabase';
import { requirePermission, AuthorizationError } from '@/lib/security/rbac';
import { 
  validateTripStatusTransition, 
  validateTripSoftDelete, 
  validateTripRestore,
  validateFinancialEditGuards,
  validateSettlementEligibility,
  TripDomainError 
} from '@/lib/domain/trips/service';
import { calculatePartyFinancials, calculateOwnerFinancials, FinancialValidationError } from '@/lib/domain/financials/service';
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

    const { data: existingTrip } = await serviceClient.from('trips').select('*, vehicles(ownership_type)').eq('id', params.id).single();
    if (!existingTrip) return NextResponse.json({ error: 'Trip not found' }, { status: 404 });

    // 1. Handle Trip Restore Action
    if (body.action === 'RESTORE' || body.restore === true) {
      validateTripRestore(existingTrip, profile as Profile);

      const { data: restoredTrip, error: restoreErr } = await serviceClient
        .from('trips')
        .update({ is_deleted: false })
        .eq('id', params.id)
        .select()
        .single();

      if (restoreErr) return NextResponse.json({ error: restoreErr.message }, { status: 500 });

      await serviceClient.from('audit_logs').insert({
        entity_type: 'trip',
        entity_id: params.id,
        action: 'TRIP_RESTORE',
        old_values: { is_deleted: true },
        new_values: { is_deleted: false },
        performed_by: user.id,
      });

      return NextResponse.json({ success: true, trip: restoredTrip, message: 'Trip restored successfully' });
    }

    // 2. Handle Status State Machine Transition
    if (body.target_status) {
      validateTripStatusTransition(existingTrip.trip_status, body.target_status, profile.role);

      // If transitioning to SETTLED, verify full financial settlement
      if (body.target_status === 'SETTLED') {
        const { data: partyFin } = await serviceClient.from('trip_party_financials').select('net_receivable').eq('trip_id', params.id).single();
        const { data: ownerFin } = await serviceClient.from('trip_owner_financials').select('net_payable').eq('trip_id', params.id).maybeSingle();

        // Calculate Party Allocations + Credit Usages on Trip
        const { data: partyAllocations } = await serviceClient
          .from('payment_allocations')
          .select('amount_allocated, payments!inner(payment_type, status)')
          .eq('trip_id', params.id)
          .eq('status', 'ACTIVE')
          .eq('payments.status', 'ACTIVE');

        const partyAllocated = (partyAllocations || [])
          .filter((a: any) => !a.payments.payment_type.startsWith('VEHICLE_OWNER_'))
          .reduce((sum: number, a: any) => sum + Number(a.amount_allocated), 0);

        const { data: partyCreditUsages } = await serviceClient
          .from('party_credit_usages')
          .select('amount_applied')
          .eq('target_trip_id', params.id)
          .eq('reversed', false);

        const partyCreditsApplied = (partyCreditUsages || []).reduce((sum: number, c: any) => sum + Number(c.amount_applied), 0);
        const totalPartyAllocated = partyAllocated + partyCreditsApplied;

        // Calculate Owner Allocations on Trip
        const ownerAllocated = (partyAllocations || [])
          .filter((a: any) => a.payments.payment_type.startsWith('VEHICLE_OWNER_'))
          .reduce((sum: number, a: any) => sum + Number(a.amount_allocated), 0);

        validateSettlementEligibility(
          Number(partyFin?.net_receivable || 0),
          totalPartyAllocated,
          ownerFin ? Number(ownerFin.net_payable) : undefined,
          ownerFin ? ownerAllocated : undefined
        );
      }

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

    // 3. Handle Financial and Header Updates
    requirePermission(profile as Profile, 'TRIP_EDIT_ACTIVE_FY');

    // Fetch existing allocations for financial edit guards
    const { data: partyAllocations } = await serviceClient
      .from('payment_allocations')
      .select('amount_allocated, payments!inner(payment_type, status)')
      .eq('trip_id', params.id)
      .eq('status', 'ACTIVE')
      .eq('payments.status', 'ACTIVE');

    const allocatedPartyAmount = (partyAllocations || [])
      .filter((a: any) => !a.payments.payment_type.startsWith('VEHICLE_OWNER_'))
      .reduce((sum: number, a: any) => sum + Number(a.amount_allocated), 0);

    const { data: partyCreditUsages } = await serviceClient
      .from('party_credit_usages')
      .select('amount_applied')
      .eq('target_trip_id', params.id)
      .eq('reversed', false);

    const totalPartyAllocated = allocatedPartyAmount + (partyCreditUsages || []).reduce((sum: number, c: any) => sum + Number(c.amount_applied), 0);

    const allocatedOwnerAmount = (partyAllocations || [])
      .filter((a: any) => a.payments.payment_type.startsWith('VEHICLE_OWNER_'))
      .reduce((sum: number, a: any) => sum + Number(a.amount_allocated), 0);

    let updatedPartyFin = null;
    let updatedOwnerFin = null;
    let financialChanged = false;

    // Update Party Financials if fields provided
    if (body.party_freight !== undefined || body.unloading_charges !== undefined || body.detention !== undefined || body.additional_charges !== undefined || body.deductions !== undefined || body.tds_amount !== undefined) {
      const { data: existingPartyFin } = await serviceClient.from('trip_party_financials').select('*').eq('trip_id', params.id).single();
      
      const partyInput = {
        freight: body.party_freight !== undefined ? Number(body.party_freight) : Number(existingPartyFin?.freight || 0),
        unloading_charges: body.unloading_charges !== undefined ? Number(body.unloading_charges) : Number(existingPartyFin?.unloading_charges || 0),
        detention: body.detention !== undefined ? Number(body.detention) : Number(existingPartyFin?.detention || 0),
        additional_charges: body.additional_charges !== undefined ? Number(body.additional_charges) : Number(existingPartyFin?.additional_charges || 0),
        deductions: body.deductions !== undefined ? Number(body.deductions) : Number(existingPartyFin?.deductions || 0),
        tds_amount: body.tds_amount !== undefined ? Number(body.tds_amount) : Number(existingPartyFin?.tds_amount || 0),
      };

      const partyRes = calculatePartyFinancials(partyInput);
      validateFinancialEditGuards(partyRes.net_receivable, totalPartyAllocated);

      const { data: pFin, error: pErr } = await serviceClient
        .from('trip_party_financials')
        .update({
          freight: partyInput.freight,
          unloading_charges: partyInput.unloading_charges,
          detention: partyInput.detention,
          additional_charges: partyInput.additional_charges,
          deductions: partyInput.deductions,
          tds_amount: partyInput.tds_amount,
        })
        .eq('trip_id', params.id)
        .select()
        .single();

      if (pErr) return NextResponse.json({ error: pErr.message }, { status: 500 });
      updatedPartyFin = pFin;
      financialChanged = true;
    }

    // Update Owner Financials if fields provided
    if (body.owner_freight !== undefined || body.owner_detention !== undefined || body.owner_additional_charges !== undefined || body.owner_unloading_charges !== undefined || body.owner_total_deductions !== undefined) {
      const { data: existingOwnerFin } = await serviceClient.from('trip_owner_financials').select('*').eq('trip_id', params.id).maybeSingle();
      
      if (existingOwnerFin) {
        const ownerInput = {
          freight: body.owner_freight !== undefined ? Number(body.owner_freight) : Number(existingOwnerFin.freight),
          detention: body.owner_detention !== undefined ? Number(body.owner_detention) : Number(existingOwnerFin.detention),
          additional_charges: body.owner_additional_charges !== undefined ? Number(body.owner_additional_charges) : Number(existingOwnerFin.additional_charges),
          unloading_charges: body.owner_unloading_charges !== undefined ? Number(body.owner_unloading_charges) : Number(existingOwnerFin.unloading_charges),
          total_deductions: body.owner_total_deductions !== undefined ? Number(body.owner_total_deductions) : Number(existingOwnerFin.total_deductions),
        };

        const ownerRes = calculateOwnerFinancials(ownerInput);
        validateFinancialEditGuards(0, 0, ownerRes.net_payable, allocatedOwnerAmount);

        const { data: oFin, error: oErr } = await serviceClient
          .from('trip_owner_financials')
          .update({
            freight: ownerInput.freight,
            detention: ownerInput.detention,
            additional_charges: ownerInput.additional_charges,
            unloading_charges: ownerInput.unloading_charges,
            total_deductions: ownerInput.total_deductions,
          })
          .eq('trip_id', params.id)
          .select()
          .single();

        if (oErr) return NextResponse.json({ error: oErr.message }, { status: 500 });
        updatedOwnerFin = oFin;
        financialChanged = true;
      }
    }

    // Outdated Bill Behavior: If financial fields changed, mark current attached bill OUTDATED
    if (financialChanged) {
      const { data: activeBillLink } = await serviceClient
        .from('bill_trips')
        .select('bill_id, bills(id, status)')
        .eq('trip_id', params.id)
        .eq('is_current', true)
        .maybeSingle();

      if (activeBillLink && activeBillLink.bill_id) {
        await serviceClient
          .from('bills')
          .update({ status: 'OUTDATED' })
          .eq('id', activeBillLink.bill_id);
      }
    }

    // Update Header metadata fields
    const headerUpdates: Record<string, any> = {};
    if (body.loading_date) headerUpdates.loading_date = body.loading_date;
    if (body.loading_location) headerUpdates.loading_location = body.loading_location.trim();
    if (body.lr_number !== undefined) headerUpdates.lr_number = body.lr_number ? body.lr_number.trim() : null;
    if (body.invoice_number !== undefined) headerUpdates.invoice_number = body.invoice_number ? body.invoice_number.trim() : null;
    if (body.remarks !== undefined) headerUpdates.remarks = body.remarks ? body.remarks.trim() : null;
    if (body.driver_id !== undefined) headerUpdates.driver_id = body.driver_id || null;

    let updatedTrip = existingTrip;
    if (Object.keys(headerUpdates).length > 0) {
      const { data: tData, error: tErr } = await serviceClient
        .from('trips')
        .update(headerUpdates)
        .eq('id', params.id)
        .select()
        .single();
      if (tErr) return NextResponse.json({ error: tErr.message }, { status: 500 });
      updatedTrip = tData;
    }

    // Audit integration
    await serviceClient.from('audit_logs').insert({
      entity_type: 'trip',
      entity_id: params.id,
      action: 'TRIP_UPDATE',
      old_values: { existingTrip },
      new_values: { updatedTrip, updatedPartyFin, updatedOwnerFin },
      performed_by: user.id,
    });

    return NextResponse.json({ success: true, trip: updatedTrip, party_financials: updatedPartyFin, owner_financials: updatedOwnerFin });
  } catch (err: unknown) {
    if (err instanceof TripDomainError) return NextResponse.json({ error: err.message, code: err.code }, { status: 400 });
    if (err instanceof FinancialValidationError) return NextResponse.json({ error: err.message }, { status: 400 });
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

    // Check for active payment allocations
    const { data: activeAllocations } = await serviceClient
      .from('payment_allocations')
      .select('id')
      .eq('trip_id', params.id)
      .eq('status', 'ACTIVE');

    const hasActivePayments = (activeAllocations || []).length > 0;

    // Validate soft delete permissions and constraints
    validateTripSoftDelete(existingTrip, hasActivePayments, profile as Profile);

    // Soft delete (is_deleted = true)
    const { error: deleteError } = await serviceClient
      .from('trips')
      .update({ is_deleted: true })
      .eq('id', params.id);

    if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 });

    // Handle Billing Relationship Revocation if trip was billed
    const { data: activeBillLink } = await serviceClient
      .from('bill_trips')
      .select('id, bill_id, bills(id, status)')
      .eq('trip_id', params.id)
      .eq('is_current', true)
      .maybeSingle();

    if (activeBillLink) {
      await serviceClient
        .from('bill_trips')
        .update({ is_current: false })
        .eq('id', activeBillLink.id);

      const billData = activeBillLink.bills as any;
      if (billData && billData.status !== 'TRIP_DELETED') {
        await serviceClient
          .from('bills')
          .update({
            status: 'TRIP_DELETED',
            previous_status_before_trip_deleted: billData.status,
          })
          .eq('id', billData.id);
      }
    }

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
    if (err instanceof TripDomainError) return NextResponse.json({ error: err.message, code: err.code }, { status: 400 });
    if (err instanceof AuthorizationError) return NextResponse.json({ error: err.message }, { status: 403 });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
