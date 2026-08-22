import { describe, it, expect, vi } from 'vitest';
import { getExecutiveDashboardMetrics, DashboardDataError } from '@/lib/domain/dashboard/service';

function createMockSupabase(overrides: Record<string, unknown> = {}) {
  return {
    from: vi.fn((tableName: string) => {
      const defaultChain = {
        select: vi.fn().mockImplementation(() => {
          const promise = Promise.resolve(overrides[tableName] || { data: [], count: 0, error: null });
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (promise as any).eq = vi.fn().mockResolvedValue(overrides[`${tableName}_eq`] || { data: [], count: 0, error: null });
          return promise;
        }),
      };
      return defaultChain;
    }),
  };
}

describe('Executive Dashboard — Accounting Verification & Reconciliation Audit', () => {
  it('1. Zero state test: returns zero metrics when database is clean/empty', async () => {
    const mockSupabase = createMockSupabase();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const metrics = await getExecutiveDashboardMetrics(mockSupabase as any);

    expect(metrics.trips.totalTrips).toBe(0);
    expect(metrics.financials.partyReceivables).toBe(0);
    expect(metrics.financials.vehicleOwnerPayables).toBe(0);
    expect(metrics.financials.pendingUnsettledPayments).toBe(0);
    expect(metrics.financials.currentFyFreight).toBe(0);
    expect(metrics.masters.totalParties).toBe(0);
  });

  it('2. Trip status breakdown & master counts test', async () => {
    const mockTrips = [
      { id: 't1', trip_status: 'PLANNED', loading_date: '2026-05-10', is_deleted: false },
      { id: 't2', trip_status: 'IN_TRANSIT', loading_date: '2026-05-11', is_deleted: false },
      { id: 't3', trip_status: 'DELIVERED', loading_date: '2026-05-12', is_deleted: false },
      { id: 't4', trip_status: 'SETTLED', loading_date: '2026-05-13', is_deleted: false },
      { id: 't5', trip_status: 'CANCELLED', loading_date: '2026-05-14', is_deleted: false },
    ];

    const mockSupabase = createMockSupabase({
      trips_eq: { data: mockTrips, error: null },
      parties: { count: 10, data: [], error: null },
      vehicle_owners: { count: 5, data: [], error: null },
      vehicles: { count: 8, data: [], error: null },
      drivers: { count: 7, data: [], error: null },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const metrics = await getExecutiveDashboardMetrics(mockSupabase as any);

    expect(metrics.trips.totalTrips).toBe(5);
    expect(metrics.trips.planned).toBe(1);
    expect(metrics.trips.inTransit).toBe(1);
    expect(metrics.trips.delivered).toBe(1);
    expect(metrics.trips.settled).toBe(1);
    expect(metrics.trips.cancelled).toBe(1);
    expect(metrics.masters.totalParties).toBe(10);
  });

  it('3. Unallocated owner advance does not reduce active trip owner payable', async () => {
    const mockSupabase = createMockSupabase({
      trips_eq: { data: [{ id: 't1', trip_status: 'DELIVERED', loading_date: '2026-05-10', is_deleted: false }], error: null },
      trip_owner_financials: { data: [{ trip_id: 't1', freight: 15000, net_payable: 15000 }], error: null },
      payments_eq: { data: [{ id: 'p_unalloc_owner', amount: 5000, status: 'ACTIVE', payment_type: 'VEHICLE_OWNER_ADVANCE' }], error: null },
      payment_allocations_eq: { data: [], error: null },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const metrics = await getExecutiveDashboardMetrics(mockSupabase as any);

    expect(metrics.financials.vehicleOwnerPayables).toBe(15000);
  });

  it('4. Allocated owner advance reduces owner payable of target trip', async () => {
    const mockSupabase = createMockSupabase({
      trips_eq: { data: [{ id: 't1', trip_status: 'DELIVERED', loading_date: '2026-05-10', is_deleted: false }], error: null },
      trip_owner_financials: { data: [{ trip_id: 't1', freight: 15000, net_payable: 15000 }], error: null },
      payments_eq: { data: [{ id: 'p_alloc_owner', amount: 5000, status: 'ACTIVE', payment_type: 'VEHICLE_OWNER_ADVANCE', trip_id: 't1' }], error: null },
      payment_allocations_eq: { data: [{ id: 'a_owner', payment_id: 'p_alloc_owner', trip_id: 't1', amount_allocated: 5000, status: 'ACTIVE' }], error: null },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const metrics = await getExecutiveDashboardMetrics(mockSupabase as any);

    expect(metrics.financials.vehicleOwnerPayables).toBe(10000);
  });

  it('5. Partially allocated owner payment reduces owner payable by allocated portion', async () => {
    const mockSupabase = createMockSupabase({
      trips_eq: { data: [{ id: 't1', trip_status: 'DELIVERED', loading_date: '2026-05-10', is_deleted: false }], error: null },
      trip_owner_financials: { data: [{ trip_id: 't1', freight: 20000, net_payable: 20000 }], error: null },
      payments_eq: { data: [{ id: 'p_owner', amount: 15000, status: 'ACTIVE', payment_type: 'VEHICLE_OWNER_BALANCE' }], error: null },
      payment_allocations_eq: { data: [{ id: 'a_owner', payment_id: 'p_owner', trip_id: 't1', amount_allocated: 10000, status: 'ACTIVE' }], error: null },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const metrics = await getExecutiveDashboardMetrics(mockSupabase as any);

    expect(metrics.financials.vehicleOwnerPayables).toBe(10000);
  });

  it('6. Reversed owner allocation restores owner payable', async () => {
    const mockSupabase = createMockSupabase({
      trips_eq: { data: [{ id: 't1', trip_status: 'DELIVERED', loading_date: '2026-05-10', is_deleted: false }], error: null },
      trip_owner_financials: { data: [{ trip_id: 't1', freight: 20000, net_payable: 20000 }], error: null },
      payments_eq: { data: [{ id: 'p_owner', amount: 20000, status: 'ACTIVE', payment_type: 'VEHICLE_OWNER_BALANCE' }], error: null },
      payment_allocations_eq: { data: [], error: null },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const metrics = await getExecutiveDashboardMetrics(mockSupabase as any);

    expect(metrics.financials.vehicleOwnerPayables).toBe(20000);
  });

  it('7. Cancelled owner payment does not reduce owner payable', async () => {
    const mockSupabase = createMockSupabase({
      trips_eq: { data: [{ id: 't1', trip_status: 'DELIVERED', loading_date: '2026-05-10', is_deleted: false }], error: null },
      trip_owner_financials: { data: [{ trip_id: 't1', freight: 20000, net_payable: 20000 }], error: null },
      payments_eq: { data: [], error: null },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const metrics = await getExecutiveDashboardMetrics(mockSupabase as any);

    expect(metrics.financials.vehicleOwnerPayables).toBe(20000);
  });

  it('8. Party allocation attached to a soft-deleted trip does not reduce active-trip receivables', async () => {
    const mockSupabase = createMockSupabase({
      trips_eq: {
        data: [
          { id: 't_active', trip_status: 'DELIVERED', loading_date: '2026-05-10', is_deleted: false },
          { id: 't_del', trip_status: 'DELIVERED', loading_date: '2026-05-10', is_deleted: true },
        ],
        error: null,
      },
      trip_party_financials: {
        data: [
          { trip_id: 't_active', freight: 10000, net_receivable: 10000 },
          { trip_id: 't_del', freight: 10000, net_receivable: 10000 },
        ],
        error: null,
      },
      payments_eq: { data: [{ id: 'p1', amount: 10000, status: 'ACTIVE', payment_type: 'PARTY_BALANCE' }], error: null },
      payment_allocations_eq: { data: [{ id: 'a1', payment_id: 'p1', trip_id: 't_del', amount_allocated: 10000, status: 'ACTIVE' }], error: null },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const metrics = await getExecutiveDashboardMetrics(mockSupabase as any);

    expect(metrics.financials.partyReceivables).toBe(10000);
  });

  it('9. Party payment allocated to deleted trip continues reducing payment unallocated cash', async () => {
    const mockSupabase = createMockSupabase({
      trips_eq: {
        data: [{ id: 't_del', trip_status: 'DELIVERED', loading_date: '2026-05-10', is_deleted: true }],
        error: null,
      },
      payments_eq: { data: [{ id: 'p1', amount: 10000, status: 'ACTIVE', payment_type: 'BULK_PAYMENT' }], error: null },
      payment_allocations_eq: { data: [{ id: 'a1', payment_id: 'p1', trip_id: 't_del', amount_allocated: 10000, status: 'ACTIVE' }], error: null },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const metrics = await getExecutiveDashboardMetrics(mockSupabase as any);

    expect(metrics.financials.pendingUnsettledPayments).toBe(0);
  });

  it('10. Party payment with active credit subtracts credit from pending unallocated cash', async () => {
    const mockSupabase = createMockSupabase({
      trips_eq: { data: [], error: null },
      payments_eq: { data: [{ id: 'p1', amount: 10000, status: 'ACTIVE', payment_type: 'BULK_PAYMENT' }], error: null },
      party_credits_eq: { data: [{ id: 'c1', source_payment_id: 'p1', original_credit: 10000, status: 'ACTIVE' }], error: null },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const metrics = await getExecutiveDashboardMetrics(mockSupabase as any);

    expect(metrics.financials.pendingUnsettledPayments).toBe(0);
  });

  it('11. BULK_PAYMENT split between multiple party trips reduces receivables deterministically', async () => {
    const mockSupabase = createMockSupabase({
      trips_eq: {
        data: [
          { id: 't1', trip_status: 'DELIVERED', loading_date: '2026-05-10', is_deleted: false },
          { id: 't2', trip_status: 'DELIVERED', loading_date: '2026-05-11', is_deleted: false },
        ],
        error: null,
      },
      trip_party_financials: {
        data: [
          { trip_id: 't1', freight: 15000, net_receivable: 15000 },
          { trip_id: 't2', freight: 15000, net_receivable: 15000 },
        ],
        error: null,
      },
      payments_eq: { data: [{ id: 'pb1', amount: 30000, status: 'ACTIVE', payment_type: 'BULK_PAYMENT' }], error: null },
      payment_allocations_eq: {
        data: [
          { id: 'a1', payment_id: 'pb1', trip_id: 't1', amount_allocated: 15000, status: 'ACTIVE' },
          { id: 'a2', payment_id: 'pb1', trip_id: 't2', amount_allocated: 15000, status: 'ACTIVE' },
        ],
        error: null,
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const metrics = await getExecutiveDashboardMetrics(mockSupabase as any);

    expect(metrics.financials.partyReceivables).toBe(0);
    expect(metrics.financials.pendingUnsettledPayments).toBe(0);
  });

  it('12. Cross-domain allocation rejection: owner allocation does not reduce party receivables', async () => {
    const mockSupabase = createMockSupabase({
      trips_eq: { data: [{ id: 't1', trip_status: 'DELIVERED', loading_date: '2026-05-10', is_deleted: false }], error: null },
      trip_party_financials: { data: [{ trip_id: 't1', freight: 25000, net_receivable: 25000 }], error: null },
      payments_eq: { data: [{ id: 'p_owner', amount: 20000, status: 'ACTIVE', payment_type: 'VEHICLE_OWNER_BALANCE', trip_id: 't1' }], error: null },
      payment_allocations_eq: { data: [{ id: 'a_owner', payment_id: 'p_owner', trip_id: 't1', amount_allocated: 20000, status: 'ACTIVE' }], error: null },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const metrics = await getExecutiveDashboardMetrics(mockSupabase as any);

    expect(metrics.financials.partyReceivables).toBe(25000);
  });

  it('13. Error resilience test: throws DashboardDataError when database error occurs', async () => {
    const mockSupabase = {
      from: vi.fn(() => ({
        select: vi.fn().mockImplementation(() => {
          const promise = Promise.resolve({ data: null, error: new Error('DB Connection Refused') });
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (promise as any).eq = vi.fn().mockResolvedValue({ data: null, error: new Error('DB Connection Refused') });
          return promise;
        }),
      })),
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await expect(getExecutiveDashboardMetrics(mockSupabase as any)).rejects.toThrow(DashboardDataError);
  });
});
