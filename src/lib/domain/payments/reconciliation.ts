import { reconcilePartyTrip, ReconciliationPartyReport } from './service';

export interface LedgerReconciliationResult {
  isClean: boolean;
  partyReports: ReconciliationPartyReport[];
  discrepanciesCount: number;
}

export function performLedgerReconciliation(
  partyTrips: Array<{
    id: string;
    net_receivable: number;
    active_allocations: number[];
    active_credit_usages: number[];
  }>
): LedgerReconciliationResult {
  const partyReports: ReconciliationPartyReport[] = partyTrips.map((t) => {
    const report = reconcilePartyTrip(t.net_receivable, t.active_allocations, t.active_credit_usages);
    return {
      ...report,
      tripId: t.id,
    };
  });

  const discrepanciesCount = partyReports.filter((r) => r.isOverAllocated).length;

  return {
    isClean: discrepanciesCount === 0,
    partyReports,
    discrepanciesCount,
  };
}
