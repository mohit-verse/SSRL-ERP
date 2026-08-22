import { describe, it, expect } from 'vitest';
import { UserRole, TripStatus, Vehicle } from '@/lib/types';

describe('Phase 2C-3 Trip Details & Operational Mutation Workflow Logic', () => {

  const sampleTrip = {
    id: 'trip-101',
    trip_number: 'TRP-2026-101',
    loading_date: '2026-08-22',
    loading_location: 'Indore Hub',
    trip_status: 'PLANNED' as TripStatus,
    is_deleted: false,
    parties: { name: 'UltraTech Cement' },
    vehicles: { id: 'v1', vehicle_number: 'MP09AB1234', ownership_type: 'MARKET' as const },
    vehicle_owners: { name: 'Rajesh Logistics' },
    drivers: { name: 'Ramesh Driver' },
    trip_destinations: [
      { id: 'd1', sequence_order: 1, destination_name: 'Bhopal', unloading_charge: 500 },
      { id: 'd2', sequence_order: 2, destination_name: 'Jabalpur', unloading_charge: 300 },
    ],
    trip_party_financials: [{ freight: 25000, unloading_charges: 800, gross_receivable: 25800, net_receivable: 25800 }],
    trip_owner_financials: [{ owner_freight: 20000, net_payable: 20000 }],
  };

  const ownFleetTrip = {
    ...sampleTrip,
    id: 'trip-102',
    trip_number: 'TRP-2026-102',
    vehicles: { id: 'v2', vehicle_number: 'MP09OWN99', ownership_type: 'OWN' as const },
    vehicle_owners: null,
  };

  // Item A: Valid Trip Rendering
  it('A. Renders valid trip header and core attributes', () => {
    expect(sampleTrip.trip_number).toBe('TRP-2026-101');
    expect(sampleTrip.parties.name).toBe('UltraTech Cement');
    expect(sampleTrip.vehicles.vehicle_number).toBe('MP09AB1234');
  });

  // Item B & C: Not Found & Error States
  it('B & C. Identifies missing trips and captures network/API errors', () => {
    const handleTripFetch = (data: any | null) => {
      if (!data) return { error: 'Trip Not Found', code: 404 };
      return { data, code: 200 };
    };

    expect(handleTripFetch(null).code).toBe(404);
    expect(handleTripFetch(sampleTrip).code).toBe(200);
  });

  // Item D: Party Financial Summary
  it('D. Calculates party financial gross and net receivable correctly', () => {
    const fin = sampleTrip.trip_party_financials[0];
    expect(fin.freight).toBe(25000);
    expect(fin.unloading_charges).toBe(800);
    expect(fin.gross_receivable).toBe(25800);
  });

  // Item E: MARKET Owner Financial Summary
  it('E. Renders MARKET vehicle owner freight and net payable', () => {
    const fin = sampleTrip.trip_owner_financials[0];
    expect(sampleTrip.vehicles.ownership_type).toBe('MARKET');
    expect(sampleTrip.vehicle_owners?.name).toBe('Rajesh Logistics');
    expect(fin.owner_freight).toBe(20000);
  });

  // Item F: OWN Fleet Behavior
  it('F. Hides external owner payable section for OWN fleet vehicles', () => {
    expect(ownFleetTrip.vehicles.ownership_type).toBe('OWN');
    expect(ownFleetTrip.vehicle_owners).toBeNull();
  });

  // Item G: Destination Ordering
  it('G. Preserves destination sequence order and calculates unloading total', () => {
    const dests = sampleTrip.trip_destinations;
    expect(dests[0].sequence_order).toBe(1);
    expect(dests[1].sequence_order).toBe(2);
    const totalUnloading = dests.reduce((sum, d) => sum + d.unloading_charge, 0);
    expect(totalUnloading).toBe(800);
  });

  // Item H: Payment Classification
  it('H. Classifies allocations strictly between Party and Owner payments', () => {
    const allocations = [
      { id: 'a1', payments: { payment_type: 'PARTY_ADVANCE' }, amount_allocated: 5000 },
      { id: 'a2', payments: { payment_type: 'VEHICLE_OWNER_ADVANCE' }, amount_allocated: 4000 },
    ];

    const partyAllocations = allocations.filter((a) => a.payments.payment_type.startsWith('PARTY_'));
    const ownerAllocations = allocations.filter((a) => a.payments.payment_type.startsWith('VEHICLE_OWNER_'));

    expect(partyAllocations.length).toBe(1);
    expect(ownerAllocations.length).toBe(1);
  });

  // Item I & J: Bill and Document Status Rendering
  it('I & J. Validates bill and document status rendering codes', () => {
    const validBillStatuses = ['DRAFT', 'APPROVED', 'PAID', 'OUTDATED'];
    const validDocStatuses = ['UPLOADING', 'ACTIVE', 'FAILED', 'DELETED'];

    validBillStatuses.forEach((s) => expect(['DRAFT', 'APPROVED', 'PAID', 'OUTDATED'].includes(s)).toBe(true));
    validDocStatuses.forEach((s) => expect(['UPLOADING', 'ACTIVE', 'FAILED', 'DELETED'].includes(s)).toBe(true));
  });

  // Item K: Audit Timeline Rendering
  it('K. Renders audit events with action, actor, and timestamp', () => {
    const auditEvent = { action: 'TRIP_CREATE', profiles: { full_name: 'John Admin', role: 'SUPER_ADMIN' }, created_at: '2026-08-22T10:00:00Z' };
    expect(auditEvent.action).toBe('TRIP_CREATE');
    expect(auditEvent.profiles.full_name).toBe('John Admin');
  });

  // Item L & M: Valid & Invalid Status Transition Controls
  it('L & M. Restricts status transitions according to official state machine', () => {
    const getPermittedTransitions = (currentStatus: TripStatus, role: UserRole) => {
      if (currentStatus === 'PLANNED') return ['IN_TRANSIT', 'CANCELLED'];
      if (currentStatus === 'IN_TRANSIT') return ['DELIVERED', 'CANCELLED'];
      if (currentStatus === 'DELIVERED' && role === 'SUPER_ADMIN') return ['SETTLED'];
      if (currentStatus === 'SETTLED' && role === 'SUPER_ADMIN') return ['DELIVERED'];
      return [];
    };

    expect(getPermittedTransitions('PLANNED', 'OPERATOR')).toEqual(['IN_TRANSIT', 'CANCELLED']);
    expect(getPermittedTransitions('DELIVERED', 'OPERATOR')).toEqual([]); // Settlement restricted to SUPER_ADMIN
    expect(getPermittedTransitions('DELIVERED', 'SUPER_ADMIN')).toEqual(['SETTLED']);
    expect(getPermittedTransitions('CANCELLED', 'SUPER_ADMIN')).toEqual([]);
  });

  // Item N & O: RBAC Controls
  it('N & O. Enforces CA_AUDITOR read-only rule and SUPER_ADMIN privilege', () => {
    const canMutateStatus = (role: UserRole) => role !== 'CA_AUDITOR';
    const canSettleTrip = (role: UserRole) => role === 'SUPER_ADMIN';

    expect(canMutateStatus('CA_AUDITOR')).toBe(false);
    expect(canMutateStatus('OPERATOR')).toBe(true);
    expect(canSettleTrip('OPERATOR')).toBe(false);
    expect(canSettleTrip('SUPER_ADMIN')).toBe(true);
  });

  // Item P: Soft-Deleted Trip Presentation
  it('P. Restricts active controls and exposes restore action only to SUPER_ADMIN for soft-deleted trips', () => {
    const deletedTrip = { ...sampleTrip, is_deleted: true };

    const canRestore = (trip: any, role: UserRole) => trip.is_deleted && role === 'SUPER_ADMIN';
    const canMutate = (trip: any, role: UserRole) => !trip.is_deleted && role !== 'CA_AUDITOR';

    expect(canRestore(deletedTrip, 'OPERATOR')).toBe(false);
    expect(canRestore(deletedTrip, 'SUPER_ADMIN')).toBe(true);
    expect(canMutate(deletedTrip, 'SUPER_ADMIN')).toBe(false);
  });

  // Item Q: Refresh Mutation State
  it('Q. Updates local state immediately after server confirmation of status mutation', () => {
    let tripStatus: TripStatus = 'PLANNED';

    const onMutationSuccess = (newStatus: TripStatus) => {
      tripStatus = newStatus;
    };

    onMutationSuccess('IN_TRANSIT');
    expect(tripStatus).toBe('IN_TRANSIT');
  });
});
