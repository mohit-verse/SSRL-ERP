export interface Trip {
  id: string;
  trip_number: string;
  loading_date: string;
  unloading_date?: string | null;
  status: 'CREATED' | 'IN_PROGRESS' | 'DELIVERED' | 'POD_RECEIVED' | 'BILLED' | 'SUBMITTED' | 'PAYMENT_PENDING' | 'PAID' | 'CLOSED';
  
  party_id: string;
  party: {
    id: string;
    party_name: string;
    party_type: string;
  };
  
  from_city: string;
  to_city: string;
  
  vehicle_number: string;
  vehicle_type: 'OWN_FLEET' | 'EXTERNAL';
  driver_mobile: string;
  vehicle_owner_name?: string | null;
  vehicle_owner_mobile?: string | null;
  
  weight?: number | null;
  freight_rate: number;
  vehicle_rate?: number | null;
  lr_number?: string | null;
  
  customer_advance: number;
  owner_advance?: number | null;
  detention?: number | null;
  deduction?: number | null;
  
  revenue?: number | null;
  expense?: number | null;
  profit?: number | null;
  customer_balance?: number | null;
  owner_balance?: number | null;
  
  remarks?: string | null;
  
  expenses?: TripExpense[];
  documents?: TripDocument[];
  
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export interface TripExpense {
  id: string;
  trip_id: string;
  expense_type: 'FUEL' | 'DRIVER_BATTA' | 'FASTAG' | 'MAINTENANCE' | 'OTHER';
  amount: number;
  expense_date: string;
  remarks?: string | null;
  created_at: string;
}

export interface TripDocument {
  id: string;
  trip_id: string;
  document_type: string;
  status: string;
  files: TripDocumentFile[];
}

export interface TripDocumentFile {
  id: string;
  trip_document_id: string;
  imagekit_file_id: string;
  imagekit_url: string;
  original_file_name: string;
  display_order: number;
}
