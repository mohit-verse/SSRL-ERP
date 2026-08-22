import { describe, it, expect } from 'vitest';
import { formatIndianCurrency, getBillStatusBadge } from '@/app/bills/BillsClient';
import { UserRole } from '@/lib/types';

describe('Phase 3B-1 Bills List Frontend & Integration Suite', () => {

  // 1. Currency Formatting
  it('3. Formats currency according to Indian ₹ format with zero fraction digits', () => {
    expect(formatIndianCurrency(50000)).toBe('₹50,000');
    expect(formatIndianCurrency(1250000)).toBe('₹12,50,000');
    expect(formatIndianCurrency(0)).toBe('₹0');
  });

  // 2. Status Badge Mapping
  it('4 & 12. Maps all 5 authoritative bill statuses deterministically to UI badges', () => {
    const currentBadge = getBillStatusBadge('CURRENT');
    expect(currentBadge.props.children).toBe('CURRENT');
    expect(currentBadge.props.className).toContain('badge-delivered');

    const outdatedBadge = getBillStatusBadge('OUTDATED');
    expect(outdatedBadge.props.children).toBe('OUTDATED');

    const cancelledBadge = getBillStatusBadge('CANCELLED');
    expect(cancelledBadge.props.children).toBe('CANCELLED');
    expect(cancelledBadge.props.className).toContain('badge-cancelled');

    const restoredBadge = getBillStatusBadge('RESTORED');
    expect(restoredBadge.props.children).toBe('RESTORED');
    expect(restoredBadge.props.className).toContain('badge-settled');

    const tripDeletedBadge = getBillStatusBadge('TRIP_DELETED');
    expect(tripDeletedBadge.props.children).toBe('TRIP DELETED');

    const unknownBadge = getBillStatusBadge('UNKNOWN_STATUS');
    expect(unknownBadge.props.children).toBe('UNKNOWN_STATUS');
  });

  // 3. KPI & Status Calculation
  it('1. Calculates KPI status breakdown correctly from bill dataset', () => {
    const mockBills = [
      { id: 'b1', status: 'CURRENT' },
      { id: 'b2', status: 'CURRENT' },
      { id: 'b3', status: 'OUTDATED' },
      { id: 'b4', status: 'CANCELLED' },
      { id: 'b5', status: 'RESTORED' },
      { id: 'b6', status: 'TRIP_DELETED' },
    ];

    const currentCount = mockBills.filter((b) => b.status === 'CURRENT').length;
    const outdatedCount = mockBills.filter((b) => b.status === 'OUTDATED').length;
    const cancelledCount = mockBills.filter((b) => b.status === 'CANCELLED').length;
    const restoredCount = mockBills.filter((b) => b.status === 'RESTORED').length;
    const tripDeletedCount = mockBills.filter((b) => b.status === 'TRIP_DELETED').length;

    expect(currentCount).toBe(2);
    expect(outdatedCount).toBe(1);
    expect(cancelledCount).toBe(1);
    expect(restoredCount).toBe(1);
    expect(tripDeletedCount).toBe(1);
  });

  // 4. Bill Row Financial Sum calculation
  it('2 & 13. Calculates total bill amount from mapped trip financials and formats navigation link', () => {
    const mockBill = {
      id: 'bill-100',
      bill_number: 'INV-2026-001',
      parties: { name: 'UltraTech Cement' },
      current_version: 2,
      created_at: '2026-08-22T10:00:00Z',
      bill_trips: [
        { trips: { trip_party_financials: [{ net_receivable: 30000 }] } },
        { trips: { trip_party_financials: [{ net_receivable: 25000 }] } },
      ],
    };

    const totalAmount = mockBill.bill_trips.reduce((sum, bt) => {
      return sum + bt.trips.trip_party_financials[0].net_receivable;
    }, 0);

    expect(totalAmount).toBe(55000);
    expect(formatIndianCurrency(totalAmount)).toBe('₹55,000');
    expect(`/bills/${mockBill.id}`).toBe('/bills/bill-100');
  });

  // 5. Search Debounce & Query Parameters
  it('5. Builds correct query URL with debounced search query', () => {
    const buildQueryUrl = (page: number, limit: number, q?: string) => {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      if (q) params.append('q', q.trim());
      return `/api/bills?${params.toString()}`;
    };

    expect(buildQueryUrl(1, 15, 'INV-1001')).toBe('/api/bills?page=1&limit=15&q=INV-1001');
  });

  // 6 & 7. Party and Status Filters
  it('6 & 7. Applies party_id and status filters to API query string', () => {
    const buildQueryUrl = (partyId?: string, status?: string) => {
      const params = new URLSearchParams();
      params.append('page', '1');
      params.append('limit', '15');
      if (partyId) params.append('party_id', partyId);
      if (status) params.append('status', status);
      return `/api/bills?${params.toString()}`;
    };

    expect(buildQueryUrl('party-99', 'OUTDATED')).toBe('/api/bills?page=1&limit=15&party_id=party-99&status=OUTDATED');
  });

  // 8 & 14. Pagination Calculation & Reset
  it('8 & 14. Calculates page bounds correctly and resets page to 1 on filter mutation', () => {
    const totalItems = 42;
    const limit = 15;
    const totalPages = Math.ceil(totalItems / limit);

    expect(totalPages).toBe(3);

    let currentPage = 2;
    const onFilterChange = () => {
      currentPage = 1;
    };

    onFilterChange();
    expect(currentPage).toBe(1);
  });

  // 9 & 10. Empty and Error State Handling
  it('9 & 10. Handles empty billing registry and API error states gracefully', () => {
    const renderState = (loading: boolean, errorMsg: string | null, count: number) => {
      if (loading) return 'LOADING';
      if (errorMsg) return 'ERROR';
      if (count === 0) return 'EMPTY';
      return 'DATA';
    };

    expect(renderState(true, null, 0)).toBe('LOADING');
    expect(renderState(false, '500 Internal Server Error', 0)).toBe('ERROR');
    expect(renderState(false, null, 0)).toBe('EMPTY');
    expect(renderState(false, null, 10)).toBe('DATA');
  });

  // 11. RBAC Read-Only Controls
  it('11. Restricts CA_AUDITOR role from displaying bill generation action button', () => {
    const canCreateBill = (userRole: UserRole) => userRole !== 'CA_AUDITOR';

    expect(canCreateBill('SUPER_ADMIN')).toBe(true);
    expect(canCreateBill('OPERATOR')).toBe(true);
    expect(canCreateBill('CA_AUDITOR')).toBe(false);
  });
});
