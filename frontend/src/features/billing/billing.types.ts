import { Trip } from '../trips/trips.types';

export interface Bill {
  id: string;
  bill_number: string;
  financial_year_id: string;
  party_id: string;
  bill_type: 'INDIVIDUAL' | 'CONSOLIDATED';
  bill_date: string;
  digital_signature: boolean;
  total_amount: number;
  status: 'GENERATED' | 'SUBMITTED' | 'CANCELLED';

  party_name_snapshot: string;
  gst_number_snapshot?: string | null;
  billing_address_snapshot?: string | null;

  created_by: string;
  created_at: string;

  trips?: Trip[];
}

export interface GenerateBillPayload {
  tripIds: string[];
  partyId: string;
  billingType: 'INDIVIDUAL' | 'CONSOLIDATED';
  billDate: string;
  digitalSignature: boolean;
}

export interface CancelBillPayload {
  reason: string;
}

export interface EligibleTripsParams {
  party_id: string;
  billing_type: 'INDIVIDUAL' | 'CONSOLIDATED';
}

export interface BillsQueryParams {
  page?: number;
  limit?: number;
  q?: string;
}
