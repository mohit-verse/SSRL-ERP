import { describe, it, expect } from 'vitest';
import { 
  validatePaymentDate, 
  validatePaymentModeReference, 
  validateOwnerPaymentAmount, 
  validatePartySingleTripPaymentAmount, 
  calculateFIFOAllocations, 
  PaymentDomainError 
} from '@/lib/domain/payments/service';
import { performLedgerReconciliation } from '@/lib/domain/payments/reconciliation';
import { calculateOwnerFinancials } from '@/lib/domain/financials/service';

describe('Phase 4 Payment & Treasury Engine Suite', () => {

  describe('1. Payment Backdating & Mode Reference Controls', () => {
    const today = new Date();

    it('rejects future payment dates', () => {
      const futureDate = new Date(today.getTime() + 86400000 * 5).toISOString().split('T')[0];
      expect(() => validatePaymentDate(futureDate, 'SUPER_ADMIN', today)).toThrow('cannot be in the future');
    });

    it('rejects OPERATOR backdate > 30 calendar days', () => {
      const oldDate = new Date(today.getTime() - 86400000 * 45).toISOString().split('T')[0];
      expect(() => validatePaymentDate(oldDate, 'OPERATOR', today)).toThrow('Operators cannot enter payments backdated more than 30');
    });

    it('allows OPERATOR backdate <= 30 calendar days', () => {
      const validOldDate = new Date(today.getTime() - 86400000 * 20).toISOString().split('T')[0];
      expect(() => validatePaymentDate(validOldDate, 'OPERATOR', today)).not.toThrow();
    });

    it('allows SUPER_ADMIN historical backdate beyond 30 days', () => {
      const historicalDate = '2025-01-01';
      expect(() => validatePaymentDate(historicalDate, 'SUPER_ADMIN', today)).not.toThrow();
    });

    it('rejects CA_AUDITOR from recording payments', () => {
      expect(() => validatePaymentDate('2026-08-01', 'CA_AUDITOR', today)).toThrow('CA_AUDITOR cannot record payments');
    });

    it('requires reference number for UPI, BANK_TRANSFER, CHEQUE', () => {
      expect(() => validatePaymentModeReference('UPI', '')).toThrow('Reference number');
      expect(() => validatePaymentModeReference('BANK_TRANSFER', '   ')).toThrow('Reference number');
      expect(() => validatePaymentModeReference('CHEQUE', undefined)).toThrow('Reference number');
      expect(() => validatePaymentModeReference('CASH', '')).not.toThrow();
    });
  });

  describe('2. Vehicle Owner Overpayment Invariants', () => {
    it('calculates Net Payable correctly: (Freight - Deductions) + Detention + Additional + Unloading', () => {
      const result = calculateOwnerFinancials({
        freight: 50000,
        total_deductions: 5000,
        detention: 2000,
        additional_charges: 1000,
        unloading_charges: 1500,
      });
      // (50000 - 5000) + 2000 + 1000 + 1500 = 49500
      expect(result.net_payable).toBe(49500);
    });

    it('rejects owner deductions exceeding freight', () => {
      expect(() => calculateOwnerFinancials({
        freight: 10000,
        total_deductions: 12000,
        detention: 0,
        additional_charges: 0,
        unloading_charges: 0,
      })).toThrow('Owner deductions');
    });

    it('rejects vehicle owner overpayment with VEHICLE_OWNER_OVERPAYMENT error code', () => {
      const netPayable = 40000;
      const alreadyPaid = 25000;
      const remainingPayable = 15000;

      // Attempting 15001 > 15000
      try {
        validateOwnerPaymentAmount(15001, netPayable, alreadyPaid);
        expect.fail('Should have thrown overpayment error');
      } catch (err: any) {
        expect(err).toBeInstanceOf(PaymentDomainError);
        expect(err.code).toBe('VEHICLE_OWNER_OVERPAYMENT');
        expect(err.message).toContain('VEHICLE_OWNER_OVERPAYMENT');
      }
    });

    it('accepts owner payment within remaining payable limit', () => {
      expect(() => validateOwnerPaymentAmount(15000, 40000, 25000)).not.toThrow();
    });
  });

  describe('3. Party Single-Trip Overpayment Invariants', () => {
    it('rejects single-trip payment exceeding outstanding receivable', () => {
      try {
        validatePartySingleTripPaymentAmount(50001, 50000);
        expect.fail('Should have thrown single trip overpayment error');
      } catch (err: any) {
        expect(err.code).toBe('PARTY_TRIP_OVERPAYMENT');
      }
    });

    it('accepts single-trip payment equal to or below outstanding', () => {
      expect(() => validatePartySingleTripPaymentAmount(50000, 50000)).not.toThrow();
      expect(() => validatePartySingleTripPaymentAmount(20000, 50000)).not.toThrow();
    });
  });

  describe('4. FIFO Bulk Allocation & Party Credit Engine', () => {
    const eligibleTrips = [
      { id: 'trip-1', trip_number: 'TRP-101', loading_date: '2026-08-01', created_at: '2026-08-01T10:00:00Z', net_receivable: 20000, already_allocated: 0 },
      { id: 'trip-2', trip_number: 'TRP-102', loading_date: '2026-08-05', created_at: '2026-08-05T10:00:00Z', net_receivable: 30000, already_allocated: 0 },
      { id: 'trip-3', trip_number: 'TRP-103', loading_date: '2026-08-10', created_at: '2026-08-10T10:00:00Z', net_receivable: 25000, already_allocated: 0 },
    ];

    it('allocates bulk payment strictly in FIFO order (loading_date ASC)', () => {
      const result = calculateFIFOAllocations(60000, eligibleTrips);
      expect(result.allocations).toEqual([
        { trip_id: 'trip-1', amount_allocated: 20000 },
        { trip_id: 'trip-2', amount_allocated: 30000 },
        { trip_id: 'trip-3', amount_allocated: 10000 },
      ]);
      expect(result.remainingUnallocated).toBe(0);
    });

    it('creates Party Credit when bulk payment exceeds total outstanding debts', () => {
      const result = calculateFIFOAllocations(100000, eligibleTrips);
      // Total debts: 20000 + 30000 + 25000 = 75000
      expect(result.allocations.length).toBe(3);
      expect(result.remainingUnallocated).toBe(25000); // Party Credit = 25000
    });

    it('handles tie-breaking deterministically (created_at, trip_number, id)', () => {
      const tieTrips = [
        { id: 'trip-b', trip_number: 'TRP-B', loading_date: '2026-08-01', created_at: '2026-08-01T10:00:00Z', net_receivable: 10000, already_allocated: 0 },
        { id: 'trip-a', trip_number: 'TRP-A', loading_date: '2026-08-01', created_at: '2026-08-01T10:00:00Z', net_receivable: 10000, already_allocated: 0 },
      ];
      const result = calculateFIFOAllocations(10000, tieTrips);
      expect(result.allocations[0].trip_id).toBe('trip-a'); // TRP-A comes before TRP-B
    });
  });

  describe('5. Financial Reconciliation Service', () => {
    it('detects clean ledger without discrepancies', () => {
      const report = performLedgerReconciliation([
        { id: 'trip-1', net_receivable: 50000, active_allocations: [20000, 30000], active_credit_usages: [] },
      ]);
      expect(report.isClean).toBe(true);
      expect(report.discrepanciesCount).toBe(0);
    });

    it('detects over-allocated ledger discrepancies', () => {
      const report = performLedgerReconciliation([
        { id: 'trip-1', net_receivable: 50000, active_allocations: [30000, 30000], active_credit_usages: [] },
      ]);
      expect(report.isClean).toBe(false);
      expect(report.discrepanciesCount).toBe(1);
      expect(report.partyReports[0].isOverAllocated).toBe(true);
    });
  });
});
