import { describe, it, expect } from 'vitest';
import { 
  validateBillStatusTransition, 
  validateTripsForBilling, 
  buildBillSnapshot, 
  BillDomainError 
} from '@/lib/domain/bills/service';
import { performBillingReconciliation } from '@/lib/domain/bills/reconciliation';

describe('Phase 5 Immutable Billing & Snapshot Engine Suite', () => {

  describe('1. Bill Validation & Eligibility Controls', () => {
    it('validates single trip billing for matching party', () => {
      expect(() => validateTripsForBilling('p-1', [
        { id: 't-1', party_id: 'p-1', is_deleted: false, trip_status: 'DELIVERED' }
      ])).not.toThrow();
    });

    it('validates multi-trip billing for matching party', () => {
      expect(() => validateTripsForBilling('p-1', [
        { id: 't-1', party_id: 'p-1', is_deleted: false, trip_status: 'DELIVERED' },
        { id: 't-2', party_id: 'p-1', is_deleted: false, trip_status: 'IN_TRANSIT' },
      ])).not.toThrow();
    });

    it('rejects mixed-party trips with BILL_TRIP_INVALID error code', () => {
      try {
        validateTripsForBilling('p-1', [
          { id: 't-1', party_id: 'p-1', is_deleted: false, trip_status: 'DELIVERED' },
          { id: 't-2', party_id: 'p-2', is_deleted: false, trip_status: 'DELIVERED' },
        ]);
        expect.fail('Should have thrown mixed party error');
      } catch (err: any) {
        expect(err.code).toBe('BILL_TRIP_INVALID');
      }
    });

    it('rejects already-current-billed trip with BILL_TRIP_ALREADY_BILLED', () => {
      try {
        validateTripsForBilling('p-1', [
          { id: 't-1', party_id: 'p-1', is_deleted: false, trip_status: 'DELIVERED', is_already_current_billed: true },
        ]);
        expect.fail('Should have thrown already billed error');
      } catch (err: any) {
        expect(err.code).toBe('BILL_TRIP_ALREADY_BILLED');
      }
    });

    it('rejects soft-deleted trips with BILL_TRIP_DELETED', () => {
      try {
        validateTripsForBilling('p-1', [
          { id: 't-1', party_id: 'p-1', is_deleted: true, trip_status: 'DELIVERED' },
        ]);
        expect.fail('Should have thrown deleted trip error');
      } catch (err: any) {
        expect(err.code).toBe('BILL_TRIP_DELETED');
      }
    });

    it('rejects CANCELLED trips with BILL_TRIP_INVALID', () => {
      try {
        validateTripsForBilling('p-1', [
          { id: 't-1', party_id: 'p-1', is_deleted: false, trip_status: 'CANCELLED' },
        ]);
        expect.fail('Should have thrown cancelled trip error');
      } catch (err: any) {
        expect(err.code).toBe('BILL_TRIP_INVALID');
      }
    });
  });

  describe('2. Immutable Snapshot Generator & Frozen Data Integrity', () => {
    const mockInput = {
      bill_number: 'INV-1001',
      version_number: 1,
      generated_at: '2026-08-22T10:00:00Z',
      party: {
        id: 'p-1',
        name: 'UltraTech Cement',
        gstin: '08AAAAA0000A1Z5',
        phone: '9829000000',
        address: 'Jaipur, Rajasthan',
      },
      trips: [
        {
          id: 't-1',
          trip_number: 'TRP-101',
          loading_date: '2026-08-01',
          loading_location: 'Kotputli',
          lr_number: 'LR-5001',
          vehicle_number: 'RJ-14-GA-1234',
          destinations: [
            { sequence_order: 1, destination_name: 'Jaipur Depot', unloading_charge: 500 },
          ],
          financials: {
            freight: 50000,
            unloading_charges: 500,
            detention: 1000,
            additional_charges: 500,
            deductions: 1000,
            tds_amount: 1000,
            gross_receivable: 52000,
            net_receivable: 50000,
          },
        },
      ],
    };

    it('generates self-contained snapshot with complete financial and destination details', () => {
      const snapshot = buildBillSnapshot(mockInput);
      expect(snapshot.bill_number).toBe('INV-1001');
      expect(snapshot.party).toEqual(mockInput.party);
      expect((snapshot.trips as any[])[0].destinations.length).toBe(1);
      expect((snapshot.totals as any).total_net_receivable).toBe(50000);
    });

    it('snapshot remains immutable when source object changes', () => {
      const snapshot = buildBillSnapshot(mockInput);
      // Mutate original source object
      mockInput.trips[0].financials.freight = 999999;
      // Frozen snapshot retains original value
      expect(((snapshot.trips as any[])[0].financials.freight)).toBe(50000);
    });
  });

  describe('3. Bill Status Machine & Transition Matrix Rules', () => {
    it('allows CURRENT -> OUTDATED, CANCELLED, TRIP_DELETED', () => {
      expect(() => validateBillStatusTransition('CURRENT', 'OUTDATED', 'OPERATOR')).not.toThrow();
      expect(() => validateBillStatusTransition('CURRENT', 'CANCELLED', 'SUPER_ADMIN')).not.toThrow();
      expect(() => validateBillStatusTransition('CURRENT', 'TRIP_DELETED', 'OPERATOR')).not.toThrow();
    });

    it('allows OUTDATED -> CURRENT, CANCELLED, TRIP_DELETED', () => {
      expect(() => validateBillStatusTransition('OUTDATED', 'CURRENT', 'OPERATOR')).not.toThrow();
      expect(() => validateBillStatusTransition('OUTDATED', 'CANCELLED', 'SUPER_ADMIN')).not.toThrow();
    });

    it('allows CANCELLED -> RESTORED (SUPER_ADMIN only)', () => {
      expect(() => validateBillStatusTransition('CANCELLED', 'RESTORED', 'SUPER_ADMIN')).not.toThrow();
      expect(() => validateBillStatusTransition('CANCELLED', 'RESTORED', 'OPERATOR')).toThrow('403 Forbidden');
    });

    it('allows TRIP_DELETED -> CURRENT, OUTDATED', () => {
      expect(() => validateBillStatusTransition('TRIP_DELETED', 'CURRENT', 'OPERATOR')).not.toThrow();
      expect(() => validateBillStatusTransition('TRIP_DELETED', 'OUTDATED', 'OPERATOR')).not.toThrow();
    });

    it('rejects CA_AUDITOR from any bill status mutation', () => {
      expect(() => validateBillStatusTransition('CURRENT', 'OUTDATED', 'CA_AUDITOR')).toThrow('403 Forbidden');
    });
  });

  describe('4. Billing Ledger Reconciliation Engine', () => {
    it('detects clean billing ledger without discrepancies', () => {
      const res = performBillingReconciliation([
        {
          id: 'b-1',
          bill_number: 'INV-101',
          current_version: 1,
          status: 'CURRENT',
          versions: [
            {
              version_number: 1,
              snapshot_data: {
                totals: { total_net_receivable: 50000 },
                trips: [{ financials: { net_receivable: 50000 } }],
              },
            },
          ],
          mapped_trips: [{ trip_id: 't-1', is_current: true, is_deleted: false }],
        },
      ]);
      expect(res.isClean).toBe(true);
      expect(res.issues.length).toBe(0);
    });

    it('detects CURRENT bill referencing soft-deleted trip', () => {
      const res = performBillingReconciliation([
        {
          id: 'b-1',
          bill_number: 'INV-101',
          current_version: 1,
          status: 'CURRENT',
          versions: [{ version_number: 1, snapshot_data: {} }],
          mapped_trips: [{ trip_id: 't-1', is_current: true, is_deleted: true }],
        },
      ]);
      expect(res.isClean).toBe(false);
      expect(res.issues.some((i) => i.code === 'CURRENT_BILL_DELETED_TRIP')).toBe(true);
    });

    it('detects bill version gap (e.g. v1 then v3)', () => {
      const res = performBillingReconciliation([
        {
          id: 'b-1',
          bill_number: 'INV-101',
          current_version: 3,
          status: 'CURRENT',
          versions: [
            { version_number: 1, snapshot_data: {} },
            { version_number: 3, snapshot_data: {} },
          ],
          mapped_trips: [{ trip_id: 't-1', is_current: true, is_deleted: false }],
        },
      ]);
      expect(res.isClean).toBe(false);
      expect(res.issues.some((i) => i.code === 'VERSION_GAP')).toBe(true);
    });

    it('detects snapshot net receivable mismatch', () => {
      const res = performBillingReconciliation([
        {
          id: 'b-1',
          bill_number: 'INV-101',
          current_version: 1,
          status: 'CURRENT',
          versions: [
            {
              version_number: 1,
              snapshot_data: {
                totals: { total_net_receivable: 60000 }, // mismatch vs 50000
                trips: [{ financials: { net_receivable: 50000 } }],
              },
            },
          ],
          mapped_trips: [{ trip_id: 't-1', is_current: true, is_deleted: false }],
        },
      ]);
      expect(res.isClean).toBe(false);
      expect(res.issues.some((i) => i.code === 'SNAPSHOT_TOTAL_MISMATCH')).toBe(true);
    });
  });
});
