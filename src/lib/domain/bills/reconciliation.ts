export interface BillReconciliationIssue {
  code: string;
  message: string;
  billId?: string;
  tripId?: string;
}

export interface BillReconciliationResult {
  isClean: boolean;
  issues: BillReconciliationIssue[];
}

export function performBillingReconciliation(
  bills: Array<{
    id: string;
    bill_number: string;
    current_version: number;
    status: string;
    versions: Array<{ version_number: number; snapshot_data: any }>;
    mapped_trips: Array<{ trip_id: string; is_current: boolean; is_deleted: boolean }>;
  }>
): BillReconciliationResult {
  const issues: BillReconciliationIssue[] = [];

  for (const b of bills) {
    // 1. Current bill with missing bill_trips mapping
    if (b.status === 'CURRENT' && (!b.mapped_trips || b.mapped_trips.length === 0)) {
      issues.push({
        code: 'MISSING_TRIP_MAPPING',
        message: `Bill ${b.bill_number} (id: ${b.id}) is CURRENT but has no mapped trips.`,
        billId: b.id,
      });
    }

    // 2. CURRENT bill referencing deleted Trip
    if (b.status === 'CURRENT') {
      const deletedTrip = b.mapped_trips.find((t) => t.is_deleted);
      if (deletedTrip) {
        issues.push({
          code: 'CURRENT_BILL_DELETED_TRIP',
          message: `Bill ${b.bill_number} is CURRENT but references soft-deleted trip ${deletedTrip.trip_id}.`,
          billId: b.id,
          tripId: deletedTrip.trip_id,
        });
      }
    }

    // 3. Duplicate version numbers or Version gap
    const versionNums = b.versions.map((v) => v.version_number).sort((x, y) => x - y);
    const uniqueVersions = new Set(versionNums);
    if (uniqueVersions.size !== versionNums.length) {
      issues.push({
        code: 'DUPLICATE_VERSION_NUMBER',
        message: `Bill ${b.bill_number} has duplicate version numbers.`,
        billId: b.id,
      });
    }

    for (let i = 0; i < versionNums.length; i++) {
      if (versionNums[i] !== i + 1) {
        issues.push({
          code: 'VERSION_GAP',
          message: `Bill ${b.bill_number} has a version gap (expected v${i + 1}, found v${versionNums[i]}).`,
          billId: b.id,
        });
        break;
      }
    }

    // 4. current_version without corresponding version record
    const hasCurrentVer = b.versions.some((v) => v.version_number === b.current_version);
    if (!hasCurrentVer) {
      issues.push({
        code: 'MISSING_CURRENT_VERSION_RECORD',
        message: `Bill ${b.bill_number} specifies current_version = ${b.current_version} but version record is missing.`,
        billId: b.id,
      });
    }

    // 5. Snapshot total mismatch against its own snapshot data
    for (const v of b.versions) {
      if (v.snapshot_data && v.snapshot_data.totals && v.snapshot_data.trips) {
        const calculatedNet = (v.snapshot_data.trips as any[]).reduce((sum, t) => sum + (t.financials?.net_receivable || 0), 0);
        if (calculatedNet !== v.snapshot_data.totals.total_net_receivable) {
          issues.push({
            code: 'SNAPSHOT_TOTAL_MISMATCH',
            message: `Bill ${b.bill_number} version v${v.version_number} snapshot totals mismatch inner trip sum.`,
            billId: b.id,
          });
        }
      }
    }
  }

  return {
    isClean: issues.length === 0,
    issues,
  };
}
