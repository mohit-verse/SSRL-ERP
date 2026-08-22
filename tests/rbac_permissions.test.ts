import { describe, it, expect } from 'vitest';
import { 
  requireActiveUser, 
  requireRole, 
  requirePermission, 
  preventSelfRoleEscalation, 
  AuthorizationError 
} from '@/lib/security/rbac';
import { PERMISSION_MATRIX, isPermissionGranted, Permission } from '@/lib/security/permissions';
import { validatePaymentDate } from '@/lib/domain/payments/service';
import { Profile } from '@/lib/types';

describe('Phase 2 RBAC & Permission Matrix Security Suite', () => {

  const superAdminProfile: Profile = {
    id: 'usr-admin-1',
    email: 'admin@ssrl.com',
    full_name: 'Super Admin',
    role: 'SUPER_ADMIN',
    is_active: true,
    created_at: new Date().toISOString(),
  };

  const operatorProfile: Profile = {
    id: 'usr-op-1',
    email: 'operator@ssrl.com',
    full_name: 'Operator User',
    role: 'OPERATOR',
    is_active: true,
    created_at: new Date().toISOString(),
  };

  const caAuditorProfile: Profile = {
    id: 'usr-ca-1',
    email: 'ca@ssrl.com',
    full_name: 'CA Auditor',
    role: 'CA_AUDITOR',
    is_active: true,
    created_at: new Date().toISOString(),
  };

  const deactivatedProfile: Profile = {
    id: 'usr-disabled-1',
    email: 'disabled@ssrl.com',
    full_name: 'Deactivated User',
    role: 'OPERATOR',
    is_active: false,
    created_at: new Date().toISOString(),
  };

  describe('1. SUPER_ADMIN Permission Matrix', () => {
    it('grants SUPER_ADMIN access to ALL permissions', () => {
      const allPermissions: Permission[] = Object.keys(PERMISSION_MATRIX) as Permission[];
      allPermissions.forEach((permission) => {
        expect(isPermissionGranted('SUPER_ADMIN', permission)).toBe(true);
        expect(() => requirePermission(superAdminProfile, permission)).not.toThrow();
      });
    });
  });

  describe('2. OPERATOR Permission Matrix', () => {
    it('allows OPERATOR operational permissions', () => {
      const allowed: Permission[] = [
        'REPORTS_VIEW',
        'LOGISTICS_VIEW',
        'TRIP_CREATE',
        'TRIP_EDIT_ACTIVE_FY',
        'PAYMENT_RECORD',
        'PAYMENT_BACKDATE_30D',
        'EXPENSE_RECORD',
        'BILL_GENERATE',
        'AUDIT_VIEW',
      ];

      allowed.forEach((perm) => {
        expect(isPermissionGranted('OPERATOR', perm)).toBe(true);
        expect(() => requirePermission(operatorProfile, perm)).not.toThrow();
      });
    });

    it('rejects OPERATOR from SUPER_ADMIN sensitive mutations', () => {
      const forbidden: Permission[] = [
        'TRIP_RESTORE_DELETED',
        'TRIP_SETTLED_EDIT',
        'PAYMENT_BACKDATE_UNLIMITED',
        'PAYMENT_REVERSE',
        'BILL_CANCEL_RESTORE',
        'USER_MANAGEMENT',
      ];

      forbidden.forEach((perm) => {
        expect(isPermissionGranted('OPERATOR', perm)).toBe(false);
        expect(() => requirePermission(operatorProfile, perm)).toThrow(AuthorizationError);
      });
    });
  });

  describe('3. CA_AUDITOR Permission Matrix (Strict Read-Only)', () => {
    it('allows CA_AUDITOR read permissions', () => {
      const readPerms: Permission[] = ['REPORTS_VIEW', 'LOGISTICS_VIEW', 'AUDIT_VIEW'];
      readPerms.forEach((perm) => {
        expect(isPermissionGranted('CA_AUDITOR', perm)).toBe(true);
        expect(() => requirePermission(caAuditorProfile, perm)).not.toThrow();
      });
    });

    it('rejects CA_AUDITOR from ALL mutation permissions', () => {
      const mutationPerms: Permission[] = [
        'TRIP_CREATE',
        'TRIP_EDIT_ACTIVE_FY',
        'TRIP_RESTORE_DELETED',
        'TRIP_SETTLED_EDIT',
        'PAYMENT_RECORD',
        'PAYMENT_BACKDATE_30D',
        'PAYMENT_BACKDATE_UNLIMITED',
        'PAYMENT_REVERSE',
        'EXPENSE_RECORD',
        'BILL_GENERATE',
        'BILL_CANCEL_RESTORE',
        'USER_MANAGEMENT',
      ];

      mutationPerms.forEach((perm) => {
        expect(isPermissionGranted('CA_AUDITOR', perm)).toBe(false);
        expect(() => requirePermission(caAuditorProfile, perm)).toThrow(AuthorizationError);
      });
    });
  });

  describe('4. Account Deactivation Invariant', () => {
    it('denies deactivated accounts from any operation regardless of role', () => {
      expect(() => requireActiveUser(deactivatedProfile)).toThrow(AuthorizationError);
      expect(() => requireRole(deactivatedProfile, ['OPERATOR', 'SUPER_ADMIN'])).toThrow(AuthorizationError);
      expect(() => requirePermission(deactivatedProfile, 'LOGISTICS_VIEW')).toThrow(AuthorizationError);
    });
  });

  describe('5. Role Escalation Protection Invariant', () => {
    it('prevents users from modifying their own role or activation state', () => {
      expect(() => preventSelfRoleEscalation('usr-admin-1', 'usr-admin-1')).toThrow(
        '403 Forbidden: Users cannot modify their own role or activation state'
      );
    });

    it('allows SUPER_ADMIN to modify other user accounts', () => {
      expect(() => preventSelfRoleEscalation('usr-admin-1', 'usr-op-1')).not.toThrow();
    });
  });

  describe('6. Historical Payment Backdating Guards (BR-005)', () => {
    it('rejects OPERATOR payment backdating > 30 calendar days', () => {
      const fortyDaysAgo = new Date();
      fortyDaysAgo.setDate(fortyDaysAgo.getDate() - 40);
      const dateStr = fortyDaysAgo.toISOString().split('T')[0];

      expect(() => validatePaymentDate(dateStr, false)).toThrow(
        'Operators cannot enter payments backdated more than 30 calendar days.'
      );
    });

    it('allows SUPER_ADMIN unrestricted historical payment backdating', () => {
      const oneYearAgo = new Date();
      oneYearAgo.setDate(oneYearAgo.getDate() - 365);
      const dateStr = oneYearAgo.toISOString().split('T')[0];

      expect(() => validatePaymentDate(dateStr, true)).not.toThrow();
    });
  });
});
