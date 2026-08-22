import { 
  Trip, 
  TripDestination, 
  TripPartyFinancials, 
  TripOwnerFinancials, 
  TripStatus, 
  UserRole, 
  Vehicle, 
  Profile 
} from '@/lib/types';
import { CreateTripInput, FullTripRecord } from './types';
import { calculatePartyFinancials, calculateOwnerFinancials, FinancialValidationError } from '@/lib/domain/financials/service';
import { isDateInActiveFY } from '@/lib/utils/financialYear';

export class TripDomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TripDomainError';
  }
}

/**
 * Validates State Machine Transitions adhering strictly to Architecture v1.2
 */
export function validateTripStatusTransition(
  currentStatus: TripStatus,
  targetStatus: TripStatus,
  userRole: UserRole
): void {
  if (currentStatus === targetStatus) return;

  if (userRole === 'CA_AUDITOR') {
    throw new TripDomainError('403 Forbidden: CA_AUDITOR is strictly read-only.');
  }

  // Allowed Transitions Definition
  const allowedMap: Record<TripStatus, TripStatus[]> = {
    PLANNED: ['IN_TRANSIT', 'CANCELLED'],
    IN_TRANSIT: ['DELIVERED', 'CANCELLED'],
    DELIVERED: ['SETTLED'],
    SETTLED: ['DELIVERED'],
    CANCELLED: [],
  };

  const validNextStates = allowedMap[currentStatus] || [];
  if (!validNextStates.includes(targetStatus)) {
    throw new TripDomainError(`Invalid trip lifecycle transition from ${currentStatus} to ${targetStatus}.`);
  }

  // OPERATOR Restriction Guard
  if (userRole === 'OPERATOR') {
    if (currentStatus === 'DELIVERED' && targetStatus === 'SETTLED') {
      throw new TripDomainError('403 Forbidden: Only SUPER_ADMIN can execute Trip Settlement.');
    }
    if (currentStatus === 'SETTLED') {
      throw new TripDomainError('403 Forbidden: Operators cannot edit or revert SETTLED trips.');
    }
  }
}

/**
 * Enforces Vehicle Ownership Consistency for MARKET vs OWN vehicles
 */
export function validateVehicleOwnershipConsistency(
  vehicle: Vehicle,
  requestedOwnerId?: string
): string | undefined {
  if (vehicle.ownership_type === 'MARKET') {
    if (!vehicle.owner_id && !requestedOwnerId) {
      throw new TripDomainError('MARKET vehicles must have an associated Vehicle Owner.');
    }
    return vehicle.owner_id || requestedOwnerId;
  }

  if (vehicle.ownership_type === 'OWN') {
    if (requestedOwnerId && requestedOwnerId !== vehicle.owner_id) {
      throw new TripDomainError('OWN fleet vehicles cannot be assigned to an external vehicle owner.');
    }
    return undefined;
  }

  return undefined;
}

/**
 * Validates Multi-Destination Input & Calculates Aggregated Unloading Charge Total
 */
export function processTripDestinations(
  destinations: Array<{ sequence_order?: number; destination_name: string; unloading_charge: number; remarks?: string }>
): { processedDestinations: Array<{ sequence_order: number; destination_name: string; unloading_charge: number; remarks?: string }>; totalUnloadingCharges: number } {
  if (!destinations || destinations.length === 0) {
    throw new TripDomainError('At least one destination is required for an operational trip.');
  }

  let totalUnloadingCharges = 0;
  const seenSequences = new Set<number>();

  const processedDestinations = destinations.map((d, index) => {
    const sequence_order = d.sequence_order !== undefined ? d.sequence_order : index + 1;

    if (!d.destination_name || d.destination_name.trim() === '') {
      throw new TripDomainError(`Destination name at sequence ${sequence_order} cannot be empty.`);
    }

    if (d.unloading_charge < 0) {
      throw new TripDomainError(`Unloading charge at destination '${d.destination_name}' cannot be negative.`);
    }

    if (seenSequences.has(sequence_order)) {
      throw new TripDomainError(`Duplicate sequence order ${sequence_order} found in destinations.`);
    }
    seenSequences.add(sequence_order);

    totalUnloadingCharges += d.unloading_charge;

    return {
      sequence_order,
      destination_name: d.destination_name.trim(),
      unloading_charge: d.unloading_charge,
      remarks: d.remarks ? d.remarks.trim() : undefined,
    };
  });

  return { processedDestinations, totalUnloadingCharges };
}

/**
 * Validates Soft-Deletion Eligibility for a Trip
 */
export function validateTripSoftDelete(
  trip: Trip,
  hasActivePayments: boolean,
  userProfile: Profile
): void {
  if (userProfile.role !== 'SUPER_ADMIN') {
    throw new TripDomainError('403 Forbidden: Only SUPER_ADMIN can soft-delete trips.');
  }

  if (hasActivePayments) {
    throw new TripDomainError('Cannot soft-delete trip: Active payments or allocations exist for this trip.');
  }

  const loadingDate = new Date(trip.loading_date);
  if (!isDateInActiveFY(loadingDate)) {
    throw new TripDomainError('Cannot soft-delete trip: Trip belongs to a closed Financial Year.');
  }
}
