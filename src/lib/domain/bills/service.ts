import { BillStatus, UserRole } from '@/lib/types';

export class BillDomainError extends Error {
  public code: string;
  constructor(message: string, code: string = 'BILL_ERROR') {
    super(message);
    this.name = 'BillDomainError';
    this.code = code;
  }
}

/**
 * Valid Bill Status Machine Transitions Guard
 */
export function validateBillStatusTransition(
  fromStatus: BillStatus,
  toStatus: BillStatus,
  userRole: UserRole
): void {
  if (userRole === 'CA_AUDITOR') {
    throw new BillDomainError('403 Forbidden: CA_AUDITOR is strictly read-only for bill status transitions.', 'BILL_STATUS_INVALID');
  }

  // Cancel & Restore require SUPER_ADMIN
  if ((toStatus === 'CANCELLED' || toStatus === 'RESTORED') && userRole !== 'SUPER_ADMIN') {
    throw new BillDomainError('403 Forbidden: Only SUPER_ADMIN can execute bill cancellation or restoration.', 'BILL_STATUS_INVALID');
  }

  const allowedTransitions: Record<BillStatus, BillStatus[]> = {
    CURRENT: ['OUTDATED', 'CANCELLED', 'TRIP_DELETED'],
    OUTDATED: ['CURRENT', 'CANCELLED', 'TRIP_DELETED'],
    CANCELLED: ['RESTORED'],
    RESTORED: ['CURRENT', 'OUTDATED', 'CANCELLED', 'TRIP_DELETED'],
    TRIP_DELETED: ['CURRENT', 'OUTDATED'],
  };

  if (!allowedTransitions[fromStatus]?.includes(toStatus)) {
    throw new BillDomainError(
      `Invalid bill status transition from '${fromStatus}' to '${toStatus}'.`,
      'BILL_STATUS_INVALID'
    );
  }
}

/**
 * Validates Trip Eligibility for Bill Generation
 */
export interface TripForBillingValidation {
  id: string;
  party_id: string;
  is_deleted: boolean;
  trip_status: string;
  is_already_current_billed?: boolean;
}

export function validateTripsForBilling(
  partyId: string,
  trips: TripForBillingValidation[]
): void {
  if (!trips || trips.length === 0) {
    throw new BillDomainError('At least one trip must be selected for bill generation.', 'BILL_TRIP_NOT_FOUND');
  }

  for (const t of trips) {
    if (t.party_id !== partyId) {
      throw new BillDomainError(`Trip ${t.id} belongs to a different Party. Mixed-party billing is prohibited.`, 'BILL_TRIP_INVALID');
    }
    if (t.is_deleted) {
      throw new BillDomainError(`Trip ${t.id} is soft-deleted and cannot be billed.`, 'BILL_TRIP_DELETED');
    }
    if (t.trip_status === 'CANCELLED') {
      throw new BillDomainError(`Trip ${t.id} is CANCELLED and cannot be billed.`, 'BILL_TRIP_INVALID');
    }
    if (t.is_already_current_billed) {
      throw new BillDomainError(`Trip ${t.id} is already attached to an active CURRENT bill.`, 'BILL_TRIP_ALREADY_BILLED');
    }
  }
}

/**
 * Builds an Immutable Self-Contained Financial Snapshot
 */
export interface SnapshotInputData {
  bill_number: string;
  version_number: number;
  generated_at: string;
  party: {
    id: string;
    name: string;
    gstin?: string;
    phone?: string;
    address?: string;
  };
  trips: Array<{
    id: string;
    trip_number: string;
    loading_date: string;
    loading_location: string;
    lr_number?: string;
    invoice_number?: string;
    vehicle_number?: string;
    driver_name?: string;
    destinations: Array<{
      sequence_order: number;
      destination_name: string;
      unloading_charge: number;
    }>;
    financials: {
      freight: number;
      unloading_charges: number;
      detention: number;
      additional_charges: number;
      deductions: number;
      tds_amount: number;
      gross_receivable: number;
      net_receivable: number;
    };
  }>;
}

export function buildBillSnapshot(input: SnapshotInputData): Record<string, unknown> {
  const total_gross_receivable = input.trips.reduce((sum, t) => sum + t.financials.gross_receivable, 0);
  const total_net_receivable = input.trips.reduce((sum, t) => sum + t.financials.net_receivable, 0);
  const total_freight = input.trips.reduce((sum, t) => sum + t.financials.freight, 0);
  const total_unloading = input.trips.reduce((sum, t) => sum + t.financials.unloading_charges, 0);
  const total_detention = input.trips.reduce((sum, t) => sum + t.financials.detention, 0);
  const total_deductions = input.trips.reduce((sum, t) => sum + t.financials.deductions + t.financials.tds_amount, 0);

  const clonedTrips = JSON.parse(JSON.stringify(input.trips));
  const clonedParty = JSON.parse(JSON.stringify(input.party));

  return {
    bill_number: input.bill_number,
    version_number: input.version_number,
    generated_at: input.generated_at,
    party: clonedParty,
    trips: clonedTrips,
    totals: {
      total_gross_receivable,
      total_net_receivable,
      total_freight,
      total_unloading,
      total_detention,
      total_deductions,
    },
  };
}
