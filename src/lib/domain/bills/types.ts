import { Bill } from '@/lib/types';

export interface GenerateBillInput {
  party_id: string;
  trip_ids: string[];
}

export interface BillSnapshotData {
  bill_number: string;
  party_name: string;
  party_gstin?: string;
  generated_at: string;
  trips: Array<{
    trip_number: string;
    lr_number?: string;
    loading_date: string;
    vehicle_number: string;
    freight: number;
    unloading_charges: number;
    detention: number;
    additional_charges: number;
    deductions: number;
    tds_amount: number;
    net_receivable: number;
  }>;
  total_net_receivable: number;
}
