import { PaymentType, PaymentMode } from '@/lib/types';

export interface CreatePaymentInput {
  payment_number: string;
  payment_type: PaymentType;
  party_id?: string;
  vehicle_owner_id?: string;
  trip_id?: string;
  amount: number;
  payment_mode: PaymentMode;
  reference_number?: string;
  payment_date: string;
  idempotency_key?: string;
}

export interface ReversalPaymentInput {
  payment_id: string;
  reason: string;
}
