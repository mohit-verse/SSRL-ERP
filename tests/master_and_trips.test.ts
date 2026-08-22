import { describe, it, expect } from 'vitest';
import { validatePartyInput, preparePartyRecord, PartyDomainError } from '@/lib/domain/parties/service';
import { validateOwnerInput, OwnerDomainError } from '@/lib/domain/owners/service';
import { validateVehicleInput, prepareVehicleRecord, VehicleDomainError } from '@/lib/domain/vehicles/service';
import { 
  validateTripStatusTransition, 
  validateVehicleOwnershipConsistency, 
  processTripDestinations, 
  validateTripSoftDelete, 
  TripDomainError 
} from '@/lib/domain/trips/service';
import { getIndianFinancialYear, isDateInActiveFY } from '@/lib/utils/financialYear';
import { normalizeVehicleNumber, isValidGSTIN, isValidPAN } from '@/lib/utils/validation';
import { Vehicle, Trip, Profile } from '@/lib/types';

describe('Phase 3 Master Data & Logistics Operational Suite', () => {

  describe('1. Master Data Normalization & Invariants', () => {
    it('rejects empty party name and invalid GSTIN format', () => {
      expect(() => validatePartyInput({ name: '   ' })).toThrow(PartyDomainError);
      expect(() => validatePartyInput({ name: 'Valid Party', gstin: 'INVALID_GSTIN' })).toThrow(PartyDomainError);
      expect(isValidGSTIN('22AAAAA0000A1Z5')).toBe(true);
    });

    it('trims whitespace and uppercase converts GSTIN', () => {
      const prepared = preparePartyRecord({ name: '  Test Logistics  ', gstin: '22aaaaa0000a1z5' });
      expect(prepared.name).toBe('Test Logistics');
      expect(prepared.gstin).toBe('22AAAAA0000A1Z5');
    });

    it('rejects invalid PAN for vehicle owners', () => {
      expect(() => validateOwnerInput({ name: 'Owner 1', pan_number: '12345' })).toThrow(OwnerDomainError);
      expect(isValidPAN('ABCDE1234F')).toBe(true);
    });

    it('normalizes vehicle numbers deterministically', () => {
      expect(normalizeVehicleNumber('mp 09-ab 1234')).toBe('MP09AB1234');
      expect(normalizeVehicleNumber('MP09AB1234')).toBe('MP09AB1234');
    });

    it('rejects MARKET vehicle without owner_id', () => {
      expect(() => validateVehicleInput({ vehicle_number: 'MP09AB1234', ownership_type: 'MARKET' })).toThrow(VehicleDomainError);
    });

    it('enforces vehicle ownership consistency', () => {
      const marketVehicle: Vehicle = {
        id: 'v-1',
        vehicle_number: 'MP09AB1234',
        ownership_type: 'MARKET',
        owner_id: 'own-1',
        created_at: new Date().toISOString(),
      };

      const ownVehicle: Vehicle = {
        id: 'v-2',
        vehicle_number: 'MP09CD5678',
        ownership_type: 'OWN',
        created_at: new Date().toISOString(),
      };

      expect(validateVehicleOwnershipConsistency(marketVehicle)).toBe('own-1');
      expect(() => validateVehicleOwnershipConsistency(ownVehicle, 'unrelated-owner')).toThrow(TripDomainError);
    });
  });

  describe('2. Multi-Destination Processing & Unloading Aggregation', () => {
    it('requires at least one destination', () => {
      expect(() => processTripDestinations([])).toThrow('At least one destination is required');
    });

    it('rejects negative unloading charges and duplicate sequences', () => {
      expect(() => processTripDestinations([{ sequence_order: 1, destination_name: 'Stop 1', unloading_charge: -100 }])).toThrow('cannot be negative');
      expect(() => processTripDestinations([
        { sequence_order: 1, destination_name: 'Stop 1', unloading_charge: 500 },
        { sequence_order: 1, destination_name: 'Stop 2', unloading_charge: 300 },
      ])).toThrow('Duplicate sequence order');
    });

    it('correctly aggregates total unloading charges across stops', () => {
      const { totalUnloadingCharges } = processTripDestinations([
        { sequence_order: 1, destination_name: 'Indore Hub', unloading_charge: 1200 },
        { sequence_order: 2, destination_name: 'Bhopal Hub', unloading_charge: 800 },
      ]);
      expect(totalUnloadingCharges).toBe(2000);
    });
  });

  describe('3. Trip Lifecycle State Machine & RBAC Guards', () => {
    it('allows valid state transitions', () => {
      expect(() => validateTripStatusTransition('PLANNED', 'IN_TRANSIT', 'OPERATOR')).not.toThrow();
      expect(() => validateTripStatusTransition('IN_TRANSIT', 'DELIVERED', 'OPERATOR')).not.toThrow();
      expect(() => validateTripStatusTransition('DELIVERED', 'SETTLED', 'SUPER_ADMIN')).not.toThrow();
    });

    it('rejects invalid state jumps', () => {
      expect(() => validateTripStatusTransition('PLANNED', 'DELIVERED', 'SUPER_ADMIN')).toThrow(TripDomainError);
    });

    it('rejects OPERATOR from executing Trip Settlement', () => {
      expect(() => validateTripStatusTransition('DELIVERED', 'SETTLED', 'OPERATOR')).toThrow('Only SUPER_ADMIN can execute Trip Settlement');
    });

    it('rejects CA_AUDITOR from any status mutation', () => {
      expect(() => validateTripStatusTransition('PLANNED', 'IN_TRANSIT', 'CA_AUDITOR')).toThrow('strictly read-only');
    });
  });

  describe('4. Trip Soft-Delete Guards', () => {
    const dummyTrip: Trip = {
      id: 'trip-1',
      trip_number: 'TRP-001',
      party_id: 'p-1',
      vehicle_id: 'v-1',
      loading_date: new Date().toISOString().split('T')[0],
      loading_location: 'Indore',
      trip_status: 'IN_TRANSIT',
      is_deleted: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const adminProfile: Profile = { id: 'a-1', email: 'a@a.com', full_name: 'Admin', role: 'SUPER_ADMIN', is_active: true, created_at: '' };
    const operatorProfile: Profile = { id: 'o-1', email: 'o@o.com', full_name: 'Operator', role: 'OPERATOR', is_active: true, created_at: '' };

    it('rejects non-SUPER_ADMIN soft-delete', () => {
      expect(() => validateTripSoftDelete(dummyTrip, false, operatorProfile)).toThrow('Only SUPER_ADMIN can soft-delete trips');
    });

    it('blocks soft-delete if active payments exist', () => {
      expect(() => validateTripSoftDelete(dummyTrip, true, adminProfile)).toThrow('Active payments or allocations exist');
    });

    it('allows soft-delete for clean trips in active FY by SUPER_ADMIN', () => {
      expect(() => validateTripSoftDelete(dummyTrip, false, adminProfile)).not.toThrow();
    });
  });

  describe('5. Indian Financial Year Boundary Rules', () => {
    it('calculates Indian FY correctly (April 1 to March 31)', () => {
      const novDate = new Date(2025, 10, 15); // Nov 15, 2025
      const fyNov = getIndianFinancialYear(novDate);
      expect(fyNov.label).toBe('FY 2025-26');

      const janDate = new Date(2026, 0, 15); // Jan 15, 2026
      const fyJan = getIndianFinancialYear(janDate);
      expect(fyJan.label).toBe('FY 2025-26');
    });

    it('validates active FY boundaries', () => {
      const today = new Date();
      expect(isDateInActiveFY(today, today)).toBe(true);

      const oldDate = new Date(2020, 4, 1); // May 2020
      expect(isDateInActiveFY(oldDate, today)).toBe(false);
    });
  });
});
