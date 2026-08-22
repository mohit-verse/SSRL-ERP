import { Trip, TripDestination, TripPartyFinancials, TripOwnerFinancials } from '@/lib/types';

export interface CreateTripInput {
  trip_number: string;
  party_id: string;
  vehicle_id: string;
  vehicle_owner_id?: string;
  driver_id?: string;
  loading_date: string;
  loading_location: string;
  lr_number?: string;
  invoice_number?: string;
  remarks?: string;
  destinations: Array<{
    destination_name: string;
    unloading_charge: number;
    remarks?: string;
  }>;
  party_financials: {
    freight: number;
    detention: number;
    additional_charges: number;
    deductions: number;
    tds_applicable: boolean;
    tds_amount: number;
    remarks?: string;
  };
  owner_financials?: {
    freight: number;
    detention: number;
    additional_charges: number;
    unloading_charges: number;
    total_deductions: number;
    remarks?: string;
  };
}

export interface FullTripRecord {
  trip: Trip;
  destinations: TripDestination[];
  party_financials: TripPartyFinancials;
  owner_financials?: TripOwnerFinancials;
}
