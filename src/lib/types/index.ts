export type UserRole = 'SUPER_ADMIN' | 'OPERATOR' | 'CA_AUDITOR';
export type VehicleOwnership = 'MARKET' | 'OWN';
export type TripStatus = 'PLANNED' | 'IN_TRANSIT' | 'DELIVERED' | 'SETTLED' | 'CANCELLED';
export type OwnExpenseCategory = 'BHATTA' | 'DIESEL' | 'FASTAG' | 'DRIVER_SALARY' | 'MAINTENANCE' | 'REPAIR' | 'OTHER';
export type PaymentType = 
  | 'PARTY_ADVANCE' | 'PARTY_BALANCE' | 'PARTY_DETENTION'
  | 'VEHICLE_OWNER_ADVANCE' | 'VEHICLE_OWNER_BALANCE' | 'VEHICLE_OWNER_DETENTION'
  | 'BULK_PAYMENT';
export type PaymentMode = 'UPI' | 'CASH' | 'BANK_TRANSFER' | 'CHEQUE';
export type PaymentStatus = 'ACTIVE' | 'CANCELLED';
export type AllocationStatus = 'ACTIVE' | 'REVERSED';
export type CreditStatus = 'ACTIVE' | 'EXHAUSTED' | 'REVERSED';
export type BillStatus = 'CURRENT' | 'OUTDATED' | 'CANCELLED' | 'RESTORED' | 'TRIP_DELETED';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export interface Party {
  id: string;
  name: string;
  gstin?: string;
  phone?: string;
  email?: string;
  address?: string;
  created_at: string;
  updated_at: string;
}

export interface VehicleOwner {
  id: string;
  name: string;
  phone?: string;
  pan_number?: string;
  bank_details?: Record<string, unknown>;
  address?: string;
  created_at: string;
}

export interface Vehicle {
  id: string;
  vehicle_number: string;
  ownership_type: VehicleOwnership;
  owner_id?: string;
  created_at: string;
}

export interface Driver {
  id: string;
  name: string;
  phone?: string;
  license_number?: string;
  created_at: string;
}

export interface TripDestination {
  id: string;
  trip_id: string;
  sequence_order: number;
  destination_name: string;
  unloading_charge: number;
  remarks?: string;
}

export interface TripPartyFinancials {
  id: string;
  trip_id: string;
  freight: number;
  unloading_charges: number;
  detention: number;
  additional_charges: number;
  deductions: number;
  tds_applicable: boolean;
  tds_amount: number;
  gross_receivable: number;
  net_receivable: number;
  remarks?: string;
}

export interface TripOwnerFinancials {
  id: string;
  trip_id: string;
  freight: number;
  detention: number;
  additional_charges: number;
  unloading_charges: number;
  total_deductions: number;
  net_payable: number;
  remarks?: string;
}

export interface Trip {
  id: string;
  trip_number: string;
  party_id: string;
  vehicle_id: string;
  vehicle_owner_id?: string;
  driver_id?: string;
  loading_date: string;
  loading_location: string;
  lr_number?: string;
  invoice_number?: string;
  trip_status: TripStatus;
  is_deleted: boolean;
  remarks?: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentAllocation {
  id: string;
  payment_id: string;
  trip_id: string;
  amount_allocated: number;
  status: AllocationStatus;
  allocated_at: string;
}

export interface Payment {
  id: string;
  payment_number: string;
  payment_type: PaymentType;
  party_id?: string;
  vehicle_owner_id?: string;
  trip_id?: string;
  amount: number;
  payment_mode: PaymentMode;
  reference_number?: string;
  payment_date: string;
  status: PaymentStatus;
  cancelled_at?: string;
  cancelled_by?: string;
  cancellation_reason?: string;
  created_by: string;
  created_at: string;
}

export interface PartyCredit {
  id: string;
  party_id: string;
  source_payment_id: string;
  original_credit: number;
  amount_used: number;
  remaining_credit: number;
  status: CreditStatus;
  created_at: string;
}

export interface Bill {
  id: string;
  bill_number: string;
  party_id: string;
  current_version: number;
  status: BillStatus;
  previous_status_before_trip_deleted?: string;
  cancelled_at?: string;
  cancelled_by?: string;
  cancellation_reason?: string;
  created_at: string;
}

export interface BillTrip {
  id: string;
  bill_id: string;
  trip_id: string;
  is_current: boolean;
  created_at: string;
}

export interface AuditLog {
  id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  old_values?: Record<string, unknown>;
  new_values?: Record<string, unknown>;
  change_reason?: string;
  performed_by: string;
  performed_at: string;
}

export interface PartyCreditUsage {
  id: string;
  credit_id: string;
  trip_id: string;
  amount_used: number;
  is_reversed: boolean;
  used_at: string;
}

export interface PaymentReversal {
  id: string;
  payment_id: string;
  reversal_amount: number;
  reason: string;
  reversed_by: string;
  reversed_at: string;
}

export interface BillVersion {
  id: string;
  bill_id: string;
  version_number: number;
  snapshot_data: Record<string, unknown>;
  generated_by: string;
  generated_at: string;
}

export interface Submission {
  id: string;
  submission_number: string;
  party_id: string;
  submission_date: string;
  remarks?: string;
  created_by: string;
  created_at: string;
}

export interface SubmissionBill {
  id: string;
  submission_id: string;
  bill_id: string;
  created_at: string;
}

export type DocumentCategory = 'BILL' | 'PAYMENT' | 'TRIP' | 'EXPENSE' | 'SUBMISSION' | 'OTHER';
export type DocumentStatus = 'UPLOADING' | 'ACTIVE' | 'FAILED' | 'DELETED';

export interface DocumentMetadata {
  id: string;
  entity_type: string;
  entity_id: string;
  document_type: DocumentCategory | string;
  drive_file_id: string;
  file_name: string;
  mime_type: string;
  file_size: number;
  status: DocumentStatus;
  uploaded_by: string;
  created_at: string;
}

export interface IdempotencyKey {
  id: string;
  idempotency_key: string;
  user_id: string;
  request_path: string;
  request_hash: string;
  response_payload?: Record<string, unknown>;
  status: 'PROCESSING' | 'COMPLETED' | 'FAILED';
  created_at: string;
  expires_at: string;
}



