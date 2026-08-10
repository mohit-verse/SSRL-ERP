import { Party } from '../parties/parties.api';
import { Trip } from '../trips/trips.types';

export interface Payment {
  id: string;
  payment_number: string;
  party_id: string;
  payment_type: 'STANDARD' | 'BULK';
  amount: number | string;
  payment_date: string;
  reference_number: string;
  remarks?: string | null;
  status: 'COMPLETED' | 'CANCELLED';
  created_by: string;
  created_at: string;
  
  party?: Party;
  payment_allocations?: PaymentAllocation[];
}

export interface PaymentAllocation {
  id: string;
  payment_id: string;
  bill_id?: string | null;
  financial_year_id: string;
  allocation_month?: string | null;
  allocated_amount: number | string;
  allocation_order: number;
  created_at: string;
}

export interface OutstandingResponse {
  totalOutstanding: number;
  monthWiseOutstanding: Record<string, number>;
  outstandingTrips: Trip[];
}

export interface RecordPaymentPayload {
  partyId: string;
  amount: number;
  paymentDate: string;
  referenceNumber: string;
  remarks?: string | null;
}

export interface CancelPaymentPayload {
  remarks: string;
}
