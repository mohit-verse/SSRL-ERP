import { 
  Payment, 
  PaymentType, 
  PaymentMode, 
  PaymentStatus, 
  AllocationStatus, 
  CreditStatus, 
  UserRole, 
  Profile 
} from '@/lib/types';
import { isDateInActiveFY } from '@/lib/utils/financialYear';

export class PaymentDomainError extends Error {
  public code: string;
  constructor(message: string, code: string = 'PAYMENT_ERROR') {
    super(message);
    this.name = 'PaymentDomainError';
    this.code = code;
  }
}

/**
 * Validates Payment Date / Backdating Rules based on User Role
 */
export function validatePaymentDate(paymentDateStr: string, userRole: UserRole | boolean, referenceDate: Date = new Date()): void {
  const paymentDate = new Date(paymentDateStr);
  if (isNaN(paymentDate.getTime())) {
    throw new PaymentDomainError('Invalid payment date format.', 'PAYMENT_DATE_INVALID');
  }

  // Prevent Future Payment Dates
  if (paymentDate > referenceDate) {
    throw new PaymentDomainError('Payment date cannot be in the future.', 'PAYMENT_FUTURE_DATE');
  }

  if (userRole === 'CA_AUDITOR') {
    throw new PaymentDomainError('403 Forbidden: CA_AUDITOR cannot record payments.', 'PAYMENT_BACKDATE_FORBIDDEN');
  }

  const isSuperAdmin = typeof userRole === 'boolean' ? userRole : userRole === 'SUPER_ADMIN';

  if (!isSuperAdmin) {
    const diffMs = referenceDate.getTime() - paymentDate.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    if (diffDays > 30) {
      throw new PaymentDomainError('Operators cannot enter payments backdated more than 30 calendar days.', 'PAYMENT_BACKDATE_FORBIDDEN');
    }
  }
  // SUPER_ADMIN has unlimited backdating permission
}

/**
 * Validates Payment Mode Reference Number Requirements
 */
export function validatePaymentModeReference(mode: PaymentMode, referenceNumber?: string): void {
  if (mode === 'UPI' || mode === 'BANK_TRANSFER' || mode === 'CHEQUE') {
    if (!referenceNumber || referenceNumber.trim() === '') {
      throw new PaymentDomainError(`Reference number (UTR/Cheque No.) is required for ${mode} payments.`, 'PAYMENT_AMOUNT_INVALID');
    }
  }
}

/**
 * Vehicle Owner Overpayment Invariant Guard
 * Net Payable = (Freight - Deductions) + Detention + Additional Charges + Unloading Charges
 * Overpayment > Remaining Payable MUST BE REJECTED!
 */
export function validateOwnerPaymentAmount(
  attemptedAmount: number,
  netPayable: number,
  alreadyPaid: number
): void {
  if (attemptedAmount <= 0) {
    throw new PaymentDomainError('Payment amount must be greater than zero.', 'PAYMENT_AMOUNT_INVALID');
  }

  const remainingPayable = netPayable - alreadyPaid;

  if (attemptedAmount > remainingPayable) {
    throw new PaymentDomainError(
      `VEHICLE_OWNER_OVERPAYMENT: Attempted payment (₹${attemptedAmount.toLocaleString()}) exceeds remaining payable balance (₹${remainingPayable.toLocaleString()}). Net Payable: ₹${netPayable.toLocaleString()}, Already Paid: ₹${alreadyPaid.toLocaleString()}.`,
      'VEHICLE_OWNER_OVERPAYMENT'
    );
  }
}

/**
 * Single Trip Party Payment Invariant Guard
 */
export function validatePartySingleTripPaymentAmount(
  attemptedAmount: number,
  outstandingReceivable: number
): void {
  if (attemptedAmount <= 0) {
    throw new PaymentDomainError('Payment amount must be greater than zero.', 'PAYMENT_AMOUNT_INVALID');
  }

  if (attemptedAmount > outstandingReceivable) {
    throw new PaymentDomainError(
      `PARTY_TRIP_OVERPAYMENT: Single trip payment (₹${attemptedAmount.toLocaleString()}) exceeds outstanding trip receivable (₹${outstandingReceivable.toLocaleString()}). Use Bulk Payment for excess allocations or Party Credit creation.`,
      'PARTY_TRIP_OVERPAYMENT'
    );
  }
}

/**
 * FIFO Allocation Calculator for Bulk Payments
 * FIFO Order: loading_date ASC, created_at ASC, trip_number ASC, id ASC
 */
export interface EligibleTripForFIFO {
  id: string;
  trip_number: string;
  loading_date: string;
  created_at: string;
  net_receivable: number;
  already_allocated: number;
}

export interface FIFOAllocationResult {
  allocations: Array<{ trip_id: string; amount_allocated: number }>;
  remainingUnallocated: number;
}

export function calculateFIFOAllocations(
  bulkAmount: number,
  eligibleTrips: EligibleTripForFIFO[]
): FIFOAllocationResult {
  if (bulkAmount <= 0) {
    throw new PaymentDomainError('Bulk payment amount must be positive.', 'PAYMENT_AMOUNT_INVALID');
  }

  // Sort deterministically
  const sortedTrips = [...eligibleTrips].sort((a, b) => {
    if (a.loading_date !== b.loading_date) return a.loading_date.localeCompare(b.loading_date);
    if (a.created_at !== b.created_at) return a.created_at.localeCompare(b.created_at);
    if (a.trip_number !== b.trip_number) return a.trip_number.localeCompare(b.trip_number);
    return a.id.localeCompare(b.id);
  });

  let remaining = bulkAmount;
  const allocations: Array<{ trip_id: string; amount_allocated: number }> = [];

  for (const trip of sortedTrips) {
    if (remaining <= 0) break;
    const outstanding = Math.max(0, trip.net_receivable - trip.already_allocated);
    if (outstanding > 0) {
      const allocateAmount = Math.min(remaining, outstanding);
      allocations.push({ trip_id: trip.id, amount_allocated: allocateAmount });
      remaining -= allocateAmount;
    }
  }

  return {
    allocations,
    remainingUnallocated: remaining,
  };
}

/**
 * Reconciliation Helper: Reconstructs Outstanding Balances from Ledger
 */
export interface ReconciliationPartyReport {
  tripId: string;
  netReceivable: number;
  totalAllocations: number;
  totalCreditUsages: number;
  expectedOutstanding: number;
  isOverAllocated: boolean;
}

export function reconcilePartyTrip(
  netReceivable: number,
  activeAllocations: number[],
  activeCreditUsages: number[]
): ReconciliationPartyReport {
  const totalAllocations = activeAllocations.reduce((sum, a) => sum + a, 0);
  const totalCreditUsages = activeCreditUsages.reduce((sum, c) => sum + c, 0);
  const expectedOutstanding = netReceivable - totalAllocations - totalCreditUsages;

  return {
    tripId: '',
    netReceivable,
    totalAllocations,
    totalCreditUsages,
    expectedOutstanding,
    isOverAllocated: expectedOutstanding < 0,
  };
}
