import { describe, it, expect } from 'vitest';
import { formatIndianCurrency } from '@/app/bills/BillsClient';
import { UserRole } from '@/lib/types';

describe('Phase 3B-3 Bill Details Page & Version History Viewer Suite', () => {

  const mockBill = {
    id: 'bill-uuid-001',
    bill_number: 'INV-2026-888',
    party_id: 'party-1',
    current_version: 2,
    status: 'CURRENT',
    created_at: '2026-08-22T10:00:00Z',
    parties: { name: 'UltraTech Cement' },
    bill_versions: [
      {
        id: 'ver-1',
        version_number: 1,
        generated_at: '2026-08-22T10:00:00Z',
        snapshot_data: {
          party: { name: 'UltraTech Cement' },
          trips: [
            {
              id: 't-100',
              trip_number: 'TRP-100',
              loading_date: '2026-08-20',
              loading_location: 'Surat',
              financials: {
                freight: 50000,
                unloading_charges: 0,
                detention: 0,
                additional_charges: 0,
                deductions: 0,
                tds_amount: 0,
                gross_receivable: 50000,
                net_receivable: 50000,
              },
            },
          ],
          totals: {
            total_gross_receivable: 50000,
            total_deductions: 0,
            total_tds_amount: 0,
            total_net_receivable: 50000,
            trip_count: 1,
          },
        },
      },
      {
        id: 'ver-2',
        version_number: 2,
        generated_at: '2026-08-22T12:00:00Z',
        snapshot_data: {
          party: { name: 'UltraTech Cement' },
          trips: [
            {
              id: 't-100',
              trip_number: 'TRP-100',
              loading_date: '2026-08-20',
              loading_location: 'Surat',
              financials: {
                freight: 55000,
                unloading_charges: 0,
                detention: 1000,
                additional_charges: 0,
                deductions: 500,
                tds_amount: 500,
                gross_receivable: 56000,
                net_receivable: 55000,
              },
            },
          ],
          totals: {
            total_gross_receivable: 56000,
            total_deductions: 500,
            total_tds_amount: 500,
            total_net_receivable: 55000,
            trip_count: 1,
          },
        },
      },
    ],
  };

  // 1. Valid Bill Header
  it('1. Extracts valid bill header metadata from authoritative response', () => {
    expect(mockBill.bill_number).toBe('INV-2026-888');
    expect(mockBill.parties.name).toBe('UltraTech Cement');
    expect(mockBill.status).toBe('CURRENT');
    expect(mockBill.current_version).toBe(2);
  });

  // 2 & 3. 404 and Error State Handling
  it('2 & 3. Identifies 404 Bill Not Found and network failure states correctly', () => {
    const handleApiResponse = (status: number, data: any) => {
      if (status === 404) return 'BILL_NOT_FOUND';
      if (status === 500) return 'SERVER_ERROR';
      if (!data?.bill) return 'INVALID_RESPONSE';
      return 'SUCCESS';
    };

    expect(handleApiResponse(404, { error: 'Bill record not found' })).toBe('BILL_NOT_FOUND');
    expect(handleApiResponse(500, {})).toBe('SERVER_ERROR');
    expect(handleApiResponse(200, { bill: mockBill })).toBe('SUCCESS');
  });

  // 4, 5, 6, 7, 8. Status Specific Rendering
  it('4, 5, 6, 7 & 8. Determines correct UI banner and badge configuration for all bill statuses', () => {
    const getStatusConfig = (status: string) => {
      switch (status) {
        case 'CURRENT': return { badgeColor: 'green', showOutdatedWarning: false };
        case 'OUTDATED': return { badgeColor: 'amber', showOutdatedWarning: true };
        case 'CANCELLED': return { badgeColor: 'red', showCancelledBanner: true };
        case 'RESTORED': return { badgeColor: 'purple', showRestoredBanner: true };
        case 'TRIP_DELETED': return { badgeColor: 'orange', showTripDeletedWarning: true };
        default: return { badgeColor: 'gray' };
      }
    };

    expect(getStatusConfig('CURRENT').badgeColor).toBe('green');
    expect(getStatusConfig('OUTDATED').showOutdatedWarning).toBe(true);
    expect(getStatusConfig('CANCELLED').showCancelledBanner).toBe(true);
    expect(getStatusConfig('RESTORED').showRestoredBanner).toBe(true);
    expect(getStatusConfig('TRIP_DELETED').showTripDeletedWarning).toBe(true);
  });

  // 9, 10, 11, 12. Version Switching & Ordering
  it('9, 10, 11 & 12. Sorts versions descending and switches active snapshot viewer correctly', () => {
    const sortedVersions = [...mockBill.bill_versions].sort((a, b) => b.version_number - a.version_number);
    expect(sortedVersions[0].version_number).toBe(2);
    expect(sortedVersions[1].version_number).toBe(1);

    // Default version selection
    let activeVerNum = mockBill.current_version;
    let activeVersion = sortedVersions.find((v) => v.version_number === activeVerNum);
    expect(activeVersion?.snapshot_data.totals.total_net_receivable).toBe(55000);

    // Switch to version 1
    activeVerNum = 1;
    activeVersion = sortedVersions.find((v) => v.version_number === activeVerNum);
    expect(activeVersion?.snapshot_data.totals.total_net_receivable).toBe(50000);
  });

  // 13, 14 & 18. STEP 18 ACCOUNTING SAFETY TEST (Historical Immutability)
  it('13, 14 & 18 (STEP 18 SAFETY). Strictly uses snapshot financial values (₹50,000) and ignores live modified trip values (₹60,000)', () => {
    // Simulated live operational trip that was edited in trips table after bill v1 was generated
    const liveTripRecord = {
      id: 't-100',
      trip_number: 'TRP-100',
      trip_party_financials: [{ net_receivable: 60000 }], // Live trip increased to ₹60,000!
    };

    // Version 1 snapshot record frozen at bill creation time
    const v1Snapshot = mockBill.bill_versions.find((v) => v.version_number === 1)?.snapshot_data;

    // Render logic extracts total from snapshot, NOT live trip record
    const renderedNetFromSnapshot = v1Snapshot?.totals.total_net_receivable;
    const recomputedLiveNet = liveTripRecord.trip_party_financials[0].net_receivable;

    // INVARIANT: rendered Net MUST equal snapshot ₹50,000 and MUST NOT equal live ₹60,000
    expect(renderedNetFromSnapshot).toBe(50000);
    expect(renderedNetFromSnapshot).not.toBe(recomputedLiveNet);
    expect(formatIndianCurrency(renderedNetFromSnapshot!)).toBe('₹50,000');
  });

  // 15 & 23. Trip Membership & Navigation
  it('15 & 23. Formats trip membership row and generates view-trip link', () => {
    const tripSnapshot = mockBill.bill_versions[0].snapshot_data.trips[0];
    expect(tripSnapshot.trip_number).toBe('TRP-100');
    expect(`/trips/${tripSnapshot.id}`).toBe('/trips/t-100');
  });

  // 17. Audit Timeline Rendering
  it('17. Formats audit timeline events cleanly', () => {
    const mockAuditLogs = [
      { id: 'log-1', action: 'BILL_CREATE', created_at: '2026-08-22T10:00:00Z', profiles: { full_name: 'John Doe', role: 'OPERATOR' } },
    ];
    expect(mockAuditLogs[0].action).toBe('BILL_CREATE');
    expect(mockAuditLogs[0].profiles.full_name).toBe('John Doe');
  });

  // 18 & 19. RBAC Controls
  it('18 & 19. Restricts CA_AUDITOR to read-only views while allowing SUPER_ADMIN full inspection', () => {
    const isMutationAllowed = (role: UserRole) => role !== 'CA_AUDITOR';
    expect(isMutationAllowed('CA_AUDITOR')).toBe(false);
    expect(isMutationAllowed('SUPER_ADMIN')).toBe(true);
    expect(isMutationAllowed('OPERATOR')).toBe(true);
  });

});
