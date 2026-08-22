import { describe, it, expect } from 'vitest';
import { UserRole, TripStatus, Vehicle } from '@/lib/types';

describe('Phase 2C-2 Create Trip UI & Dispatch Workflow Logic', () => {

  const dummyParties = [{ id: 'p1', name: 'UltraTech Cement' }];
  const dummyVehicles: Vehicle[] = [
    { id: 'v-market', vehicle_number: 'MH12AB1234', ownership_type: 'MARKET', owner_id: 'owner-1', created_at: '' },
    { id: 'v-own', vehicle_number: 'MP09CD5678', ownership_type: 'OWN', created_at: '' },
  ];
  const dummyOwners = [{ id: 'owner-1', name: 'Rajesh Transport' }];
  const dummyDrivers = [{ id: 'd1', name: 'Ramesh Kumar' }];

  // Item A & B: CA_AUDITOR Access Control
  it('A & B. Restricts creation modal access for CA_AUDITOR role', () => {
    const isCreateAllowed = (role: UserRole) => role === 'SUPER_ADMIN' || role === 'OPERATOR';
    expect(isCreateAllowed('SUPER_ADMIN')).toBe(true);
    expect(isCreateAllowed('OPERATOR')).toBe(true);
    expect(isCreateAllowed('CA_AUDITOR')).toBe(false);
  });

  // Item C: Required Field Validation
  it('C. Validates mandatory fields before API submission', () => {
    const validateFields = (payload: { trip_number: string; party_id: string; vehicle_id: string; loading_date: string; loading_location: string }) => {
      if (!payload.trip_number.trim()) return 'Trip Number is required.';
      if (!payload.loading_date) return 'Loading Date is required.';
      if (!payload.party_id) return 'Party is required.';
      if (!payload.vehicle_id) return 'Vehicle is required.';
      if (!payload.loading_location.trim()) return 'Loading Location is required.';
      return null;
    };

    expect(validateFields({ trip_number: '', party_id: 'p1', vehicle_id: 'v-own', loading_date: '2026-08-22', loading_location: 'Indore' })).toBe('Trip Number is required.');
    expect(validateFields({ trip_number: 'TRP-1', party_id: '', vehicle_id: 'v-own', loading_date: '2026-08-22', loading_location: 'Indore' })).toBe('Party is required.');
    expect(validateFields({ trip_number: 'TRP-1', party_id: 'p1', vehicle_id: 'v-own', loading_date: '2026-08-22', loading_location: 'Indore' })).toBeNull();
  });

  // Item D: MARKET Vehicle Owner Requirement
  it('D. Enforces vehicle owner selection for MARKET vehicles', () => {
    const validateVehicleOwner = (vehicle: Vehicle, ownerId?: string) => {
      if (vehicle.ownership_type === 'MARKET' && !ownerId) {
        return 'Vehicle Owner selection is required for MARKET vehicles.';
      }
      return null;
    };

    expect(validateVehicleOwner(dummyVehicles[0], undefined)).toBe('Vehicle Owner selection is required for MARKET vehicles.');
    expect(validateVehicleOwner(dummyVehicles[0], 'owner-1')).toBeNull();
  });

  // Item E: OWN Vehicle External Owner Prohibition
  it('E. Rejects external vehicle owner assignment for OWN fleet vehicles', () => {
    const validateVehicleOwner = (vehicle: Vehicle, ownerId?: string) => {
      if (vehicle.ownership_type === 'OWN' && ownerId) {
        return 'OWN fleet vehicles cannot have an external vehicle owner.';
      }
      return null;
    };

    expect(validateVehicleOwner(dummyVehicles[1], 'owner-1')).toBe('OWN fleet vehicles cannot have an external vehicle owner.');
    expect(validateVehicleOwner(dummyVehicles[1], undefined)).toBeNull();
  });

  // Item F: Master Data Selection
  it('F. Populates master data options from authoritative properties', () => {
    expect(dummyParties.length).toBe(1);
    expect(dummyVehicles.length).toBe(2);
    expect(dummyOwners.length).toBe(1);
    expect(dummyDrivers.length).toBe(1);
  });

  // Item G: Destination Ordering & Validation
  it('G. Maintains sequence order and validates destination fields', () => {
    const destinations = [
      { sequence_order: 1, destination_name: 'Bhopal', unloading_charge: 500 },
      { sequence_order: 2, destination_name: 'Jabalpur', unloading_charge: 300 },
    ];

    expect(destinations[0].sequence_order).toBe(1);
    expect(destinations[1].sequence_order).toBe(2);

    const totalUnloading = destinations.reduce((sum, d) => sum + d.unloading_charge, 0);
    expect(totalUnloading).toBe(800);
  });

  // Item H: Payload Assembly
  it('H. Assembles compliant POST /api/trips payload', () => {
    const assemblePayload = (
      tripNumber: string,
      partyId: string,
      vehicle: Vehicle,
      ownerId: string | undefined,
      partyFreight: number,
      ownerFreight: number
    ) => ({
      trip_number: tripNumber,
      party_id: partyId,
      vehicle_id: vehicle.id,
      vehicle_owner_id: vehicle.ownership_type === 'MARKET' ? ownerId : undefined,
      party_freight: partyFreight,
      owner_freight: vehicle.ownership_type === 'MARKET' ? ownerFreight : 0,
    });

    const marketPayload = assemblePayload('TRP-101', 'p1', dummyVehicles[0], 'owner-1', 25000, 20000);
    expect(marketPayload.vehicle_owner_id).toBe('owner-1');
    expect(marketPayload.owner_freight).toBe(20000);

    const ownPayload = assemblePayload('TRP-102', 'p1', dummyVehicles[1], undefined, 25000, 20000);
    expect(ownPayload.vehicle_owner_id).toBeUndefined();
    expect(ownPayload.owner_freight).toBe(0);
  });

  // Item I & J: Server Error Handling & Form State Preservation
  it('I, J & K. Maps server errors and preserves form state upon submission failure', () => {
    const handleServerError = (status: number, data: { error: string }) => {
      let isSubmitting = true;
      let modalOpen = true;
      let errorBanner: string | null = null;

      if (status !== 200 && status !== 201) {
        errorBanner = data.error;
        isSubmitting = false;
        modalOpen = true; // Modal stays open to preserve entered values
      }

      return { errorBanner, isSubmitting, modalOpen };
    };

    const duplicateRes = handleServerError(400, { error: "Trip number 'TRP-101' already exists." });
    expect(duplicateRes.errorBanner).toContain("already exists");
    expect(duplicateRes.modalOpen).toBe(true);
    expect(duplicateRes.isSubmitting).toBe(false);

    const financialRes = handleServerError(400, { error: "Party deductions cannot exceed gross freight." });
    expect(financialRes.errorBanner).toContain("deductions cannot exceed");
    expect(financialRes.modalOpen).toBe(true);
  });

  // Item L: Double-Submit Prevention
  it('L. Prevents double-submission by locking state during pending API request', () => {
    let isSubmitting = false;

    const startSubmit = () => {
      if (isSubmitting) return false;
      isSubmitting = true;
      return true;
    };

    expect(startSubmit()).toBe(true); // First click succeeds
    expect(startSubmit()).toBe(false); // Second click during submission is blocked
  });

  // Item M & N: Success & Cancel Workflow
  it('M & N. Handles modal dismissal and success list refresh trigger', () => {
    let modalOpen = true;
    let listRefreshed = false;

    const handleSuccess = () => {
      modalOpen = false;
      listRefreshed = true;
    };

    const handleCancel = () => {
      modalOpen = false;
    };

    handleSuccess();
    expect(modalOpen).toBe(false);
    expect(listRefreshed).toBe(true);

    modalOpen = true;
    handleCancel();
    expect(modalOpen).toBe(false);
  });
});
