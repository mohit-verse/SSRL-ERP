import { describe, it, expect } from 'vitest';
import { calculatePartyFinancials, calculateOwnerFinancials, FinancialValidationError } from '@/lib/domain/financials/service';
import { validatePaymentDate } from '@/lib/domain/payments/service';
import { authorizeUser, AuthorizationError } from '@/lib/security/rbac';
import { Profile } from '@/lib/types';

describe('Phase 1 Database & Domain Invariant Verification Suite', () => {

  describe('1. Party Financial Calculation Invariants', () => {
    it('calculates Party Gross & Net Receivable correctly', () => {
      const result = calculatePartyFinancials({
        freight: 50000,
        unloading_charges: 2000,
        detention: 1000,
        additional_charges: 500,
        deductions: 1500,
        tds_amount: 1000,
      });

      expect(result.gross_receivable).toBe(53500); // 50000 + 2000 + 1000 + 500
      expect(result.net_receivable).toBe(51000);   // 53500 - 1500 - 1000
    });

    it('rejects negative freight', () => {
      expect(() => calculatePartyFinancials({
        freight: -500,
        unloading_charges: 0,
        detention: 0,
        additional_charges: 0,
        deductions: 0,
        tds_amount: 0,
      })).toThrow(FinancialValidationError);
    });

    it('rejects negative deductions', () => {
      expect(() => calculatePartyFinancials({
        freight: 10000,
        unloading_charges: 0,
        detention: 0,
        additional_charges: 0,
        deductions: -200,
        tds_amount: 0,
      })).toThrow(FinancialValidationError);
    });

    it('rejects Party deductions + TDS > Gross Receivable (chk_party_deductions_tds)', () => {
      expect(() => calculatePartyFinancials({
        freight: 10000,
        unloading_charges: 500,
        detention: 0,
        additional_charges: 0,
        deductions: 8000,
        tds_amount: 3000, // Total reduction = 11000 > Gross 10500
      })).toThrow(FinancialValidationError);
    });
  });

  describe('2. Vehicle Owner Financial Calculation Invariants', () => {
    it('calculates Vehicle Owner Net Payable correctly', () => {
      const result = calculateOwnerFinancials({
        freight: 40000,
        detention: 2000,
        additional_charges: 500,
        unloading_charges: 1000,
        total_deductions: 3000,
      });

      // (40000 - 3000) + 2000 + 500 + 1000 = 40500
      expect(result.net_payable).toBe(40500);
    });

    it('rejects Vehicle Owner total_deductions > gross freight (chk_deductions_lte_freight)', () => {
      expect(() => calculateOwnerFinancials({
        freight: 30000,
        detention: 0,
        additional_charges: 0,
        unloading_charges: 0,
        total_deductions: 35000, // Exceeds freight 30000
      })).toThrow(FinancialValidationError);
    });
  });

  describe('3. Backdated Payment Date Invariants (BR-005)', () => {
    it('rejects future payment dates for all users', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 5);
      const futureStr = futureDate.toISOString().split('T')[0];

      expect(() => validatePaymentDate(futureStr, true)).toThrow('Payment date cannot be in the future.');
      expect(() => validatePaymentDate(futureStr, false)).toThrow('Payment date cannot be in the future.');
    });

    it('allows Operators to backdate up to 30 calendar days', () => {
      const twentyDaysAgo = new Date();
      twentyDaysAgo.setDate(twentyDaysAgo.getDate() - 20);
      const str = twentyDaysAgo.toISOString().split('T')[0];

      expect(() => validatePaymentDate(str, false)).not.toThrow();
    });

    it('rejects Operators backdating > 30 calendar days', () => {
      const fortyDaysAgo = new Date();
      fortyDaysAgo.setDate(fortyDaysAgo.getDate() - 40);
      const str = fortyDaysAgo.toISOString().split('T')[0];

      expect(() => validatePaymentDate(str, false)).toThrow('Operators cannot enter payments backdated more than 30 calendar days.');
    });

    it('allows Super Admin unrestricted backdating', () => {
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      const str = ninetyDaysAgo.toISOString().split('T')[0];

      expect(() => validatePaymentDate(str, true)).not.toThrow();
    });
  });

  describe('4. Profile & RBAC Security Invariants', () => {
    it('rejects deactivated user profiles', () => {
      const deactivatedUser: Profile = {
        id: 'u-1',
        email: 'disabled@ssrl.com',
        full_name: 'Disabled User',
        role: 'OPERATOR',
        is_active: false,
        created_at: new Date().toISOString(),
      };

      expect(() => authorizeUser(deactivatedUser, ['OPERATOR', 'SUPER_ADMIN'])).toThrow(AuthorizationError);
    });

    it('rejects CA_AUDITOR from mutating operations', () => {
      const auditor: Profile = {
        id: 'u-ca',
        email: 'ca@ssrl.com',
        full_name: 'CA Auditor',
        role: 'CA_AUDITOR',
        is_active: true,
        created_at: new Date().toISOString(),
      };

      expect(() => authorizeUser(auditor, ['OPERATOR', 'SUPER_ADMIN'])).toThrow(AuthorizationError);
    });
  });
});
