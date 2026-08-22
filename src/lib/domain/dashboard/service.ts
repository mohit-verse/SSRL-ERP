import { SupabaseClient } from '@supabase/supabase-js';
import { ExecutiveDashboardMetrics } from './types';
import { getIndianFinancialYear } from '@/lib/utils/financialYear';

export class DashboardDataError extends Error {
  public code: string;
  constructor(message: string, code: string = 'DASHBOARD_DATA_ERROR') {
    super(message);
    this.name = 'DashboardDataError';
    this.code = code;
  }
}

const PARTY_PAYMENT_TYPES = new Set([
  'PARTY_ADVANCE',
  'PARTY_BALANCE',
  'PARTY_DETENTION',
  'BULK_PAYMENT',
]);

const OWNER_PAYMENT_TYPES = new Set([
  'VEHICLE_OWNER_ADVANCE',
  'VEHICLE_OWNER_BALANCE',
  'VEHICLE_OWNER_DETENTION',
]);

/**
 * Server-side Aggregation Service for SSRL Executive Dashboard.
 * Performs strict, accounting-reconciled, domain-compliant parallel queries.
 */
export async function getExecutiveDashboardMetrics(
  supabase: SupabaseClient
): Promise<ExecutiveDashboardMetrics> {
  try {
    const activeFy = getIndianFinancialYear();
    const startDateStr = activeFy.startDate.toISOString().split('T')[0];
    const endDateStr = activeFy.endDate.toISOString().split('T')[0];

    const [
      tripsResult,
      partiesCountResult,
      ownersCountResult,
      vehiclesCountResult,
      driversCountResult,
      partyFinancialsResult,
      ownerFinancialsResult,
      paymentsResult,
      allocationsResult,
      creditsResult,
      creditUsagesResult,
      outdatedBillsResult,
      failedDocsResult,
      activeDocsResult,
    ] = await Promise.all([
      // 1. Non-deleted trips
      supabase
        .from('trips')
        .select('id, trip_status, loading_date, is_deleted')
        .eq('is_deleted', false),

      // 2. Master Data Counts (Total row counts)
      supabase.from('parties').select('id', { count: 'exact', head: true }),
      supabase.from('vehicle_owners').select('id', { count: 'exact', head: true }),
      supabase.from('vehicles').select('id', { count: 'exact', head: true }),
      supabase.from('drivers').select('id', { count: 'exact', head: true }),

      // 3. Trip Party Financials
      supabase.from('trip_party_financials').select('freight, net_receivable, trip_id'),

      // 4. Trip Owner Financials
      supabase.from('trip_owner_financials').select('net_payable, trip_id'),

      // 5. Active Payments (status = 'ACTIVE')
      supabase
        .from('payments')
        .select('id, amount, status, payment_type, trip_id')
        .eq('status', 'ACTIVE'),

      // 6. Active Payment Allocations (status = 'ACTIVE')
      supabase
        .from('payment_allocations')
        .select('id, payment_id, trip_id, amount_allocated, status')
        .eq('status', 'ACTIVE'),

      // 7. Active Party Credits (status = 'ACTIVE')
      supabase
        .from('party_credits')
        .select('id, source_payment_id, original_credit, status')
        .eq('status', 'ACTIVE'),

      // 8. Active Credit Usages (reversed = false)
      supabase
        .from('party_credit_usages')
        .select('id, party_credit_id, target_trip_id, amount_applied, reversed')
        .eq('reversed', false),

      // 9. Outdated Bills (status = 'OUTDATED')
      supabase
        .from('bills')
        .select('id, status', { count: 'exact', head: true })
        .eq('status', 'OUTDATED'),

      // 10. Document Metadata Status (FAILED / ACTIVE)
      supabase
        .from('document_metadata')
        .select('id, status', { count: 'exact', head: true })
        .eq('status', 'FAILED'),
      supabase
        .from('document_metadata')
        .select('id, status', { count: 'exact', head: true })
        .eq('status', 'ACTIVE'),
    ]);

    // Throw explicit error on any query failure
    if (tripsResult.error) throw tripsResult.error;
    if (partiesCountResult.error) throw partiesCountResult.error;
    if (ownersCountResult.error) throw ownersCountResult.error;
    if (vehiclesCountResult.error) throw vehiclesCountResult.error;
    if (driversCountResult.error) throw driversCountResult.error;
    if (partyFinancialsResult.error) throw partyFinancialsResult.error;
    if (ownerFinancialsResult.error) throw ownerFinancialsResult.error;
    if (paymentsResult.error) throw paymentsResult.error;
    if (allocationsResult.error) throw allocationsResult.error;
    if (creditsResult.error) throw creditsResult.error;
    if (creditUsagesResult.error) throw creditUsagesResult.error;

    const tripsData = tripsResult.data || [];
    const activeTripIds = new Set<string>();
    const activeTripIdsInFy = new Set<string>();

    let planned = 0;
    let inTransit = 0;
    let delivered = 0;
    let settled = 0;
    let cancelled = 0;

    for (const trip of tripsData) {
      if (trip.is_deleted) continue;
      activeTripIds.add(trip.id);

      if (trip.trip_status === 'PLANNED') planned++;
      else if (trip.trip_status === 'IN_TRANSIT') inTransit++;
      else if (trip.trip_status === 'DELIVERED') delivered++;
      else if (trip.trip_status === 'SETTLED') settled++;
      else if (trip.trip_status === 'CANCELLED') cancelled++;

      if (trip.loading_date >= startDateStr && trip.loading_date <= endDateStr) {
        activeTripIdsInFy.add(trip.id);
      }
    }

    // Classify Active Payments
    const paymentsData = paymentsResult.data || [];
    const activePartyPaymentIds = new Set<string>();
    const activeOwnerPaymentIds = new Set<string>();
    let totalActivePartyPaymentAmount = 0;
    let totalActiveOwnerPaymentAmountOnActiveTrips = 0;

    for (const payment of paymentsData) {
      if (payment.status !== 'ACTIVE') continue;

      if (PARTY_PAYMENT_TYPES.has(payment.payment_type)) {
        activePartyPaymentIds.add(payment.id);
        totalActivePartyPaymentAmount += Number(payment.amount) || 0;
      } else if (OWNER_PAYMENT_TYPES.has(payment.payment_type)) {
        activeOwnerPaymentIds.add(payment.id);
        if (payment.trip_id && activeTripIds.has(payment.trip_id)) {
          totalActiveOwnerPaymentAmountOnActiveTrips += Number(payment.amount) || 0;
        }
      }
    }

    // Classify Active Payment Allocations by Parent Payment Type
    const rawAllocations = allocationsResult.data || [];
    let totalPartyAllocationsOnActiveTrips = 0;
    let totalPartyAllocationsOverall = 0;
    let totalOwnerAllocationsOnActiveTrips = 0;

    for (const alloc of rawAllocations) {
      if (alloc.status !== 'ACTIVE') continue;

      if (activePartyPaymentIds.has(alloc.payment_id)) {
        const amt = Number(alloc.amount_allocated) || 0;
        totalPartyAllocationsOverall += amt;
        if (activeTripIds.has(alloc.trip_id)) {
          totalPartyAllocationsOnActiveTrips += amt;
        }
      } else if (activeOwnerPaymentIds.has(alloc.payment_id)) {
        const amt = Number(alloc.amount_allocated) || 0;
        if (activeTripIds.has(alloc.trip_id)) {
          totalOwnerAllocationsOnActiveTrips += amt;
        }
      }
    }

    // Party Credit Usages against Active Trips
    const rawCreditUsages = creditUsagesResult.data || [];
    let totalCreditUsagesOnActiveTrips = 0;

    for (const usage of rawCreditUsages) {
      if (usage.reversed) continue;
      if (activeTripIds.has(usage.target_trip_id)) {
        totalCreditUsagesOnActiveTrips += Number(usage.amount_applied) || 0;
      }
    }

    // Party Credits Created from Active Party Payments
    const rawCredits = creditsResult.data || [];
    let totalPartyCreditsCreated = 0;

    for (const credit of rawCredits) {
      if (credit.status !== 'ACTIVE') continue;
      if (activePartyPaymentIds.has(credit.source_payment_id)) {
        totalPartyCreditsCreated += Number(credit.original_credit) || 0;
      }
    }

    // 1. Party Receivables Calculation
    const partyFinancialsData = (partyFinancialsResult.data || []).filter((pf) => activeTripIds.has(pf.trip_id));
    const totalNetReceivable = partyFinancialsData.reduce((sum, item) => sum + (Number(item.net_receivable) || 0), 0);
    const partyReceivables = Math.max(0, totalNetReceivable - (totalPartyAllocationsOnActiveTrips + totalCreditUsagesOnActiveTrips));

    // 2. Vehicle Owner Payables Calculation (Allocation-Level Accounting)
    const ownerFinancialsData = (ownerFinancialsResult.data || []).filter((of) => activeTripIds.has(of.trip_id));
    const totalNetPayable = ownerFinancialsData.reduce((sum, item) => sum + (Number(item.net_payable) || 0), 0);
    // Combine explicit owner allocations and direct trip-linked active owner payments
    const totalOwnerSettledOnActiveTrips = Math.max(totalOwnerAllocationsOnActiveTrips, totalActiveOwnerPaymentAmountOnActiveTrips);
    const vehicleOwnerPayables = Math.max(0, totalNetPayable - totalOwnerSettledOnActiveTrips);

    // 3. Pending / Unallocated Party Payments Calculation
    // Invariant: Party Payment Amount = Allocated Amount + Party Credits Created + Unallocated Pending Amount
    const pendingUnsettledPayments = Math.max(0, totalActivePartyPaymentAmount - (totalPartyAllocationsOverall + totalPartyCreditsCreated));

    // 4. Current FY Freight Revenue (April 1 - March 31 Indian FY)
    const currentFyFreight = partyFinancialsData
      .filter((pf) => activeTripIdsInFy.has(pf.trip_id))
      .reduce((sum, item) => sum + (Number(item.freight) || 0), 0);

    // Document & Control Metrics
    const outdatedBillsCount = outdatedBillsResult.count || 0;
    const failedDocsCount = failedDocsResult.count || 0;
    const activeDocsCount = activeDocsResult.count || 0;

    const alerts: string[] = [];
    if (outdatedBillsCount > 0) {
      alerts.push(`${outdatedBillsCount} bill(s) are outdated due to trip amendments and require versioning update.`);
    }
    if (failedDocsCount > 0) {
      alerts.push(`${failedDocsCount} document(s) failed storage upload and require re-upload.`);
    }

    return {
      trips: {
        totalTrips: activeTripIds.size,
        planned,
        inTransit,
        delivered,
        settled,
        cancelled,
      },
      financials: {
        partyReceivables,
        vehicleOwnerPayables,
        pendingUnsettledPayments,
        currentFyFreight,
      },
      masters: {
        totalParties: partiesCountResult.count || 0,
        totalVehicleOwners: ownersCountResult.count || 0,
        totalVehicles: vehiclesCountResult.count || 0,
        totalDrivers: driversCountResult.count || 0,
      },
      controls: {
        failedDocuments: failedDocsCount,
        activeDocuments: activeDocsCount,
        outdatedBills: outdatedBillsCount,
        attentionItemsCount: alerts.length,
        alerts,
      },
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Failed to aggregate executive dashboard metrics:', error);
    throw new DashboardDataError('Unable to load executive dashboard metrics. Please try again later.');
  }
}
