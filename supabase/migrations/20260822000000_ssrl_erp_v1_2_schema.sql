-- SSRL ERP Master Schema Migration v1.2
-- Authoritative Specification Version: 1.2.0

-- Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;
SET search_path TO public, extensions;

-- 1. ENUM DEFINITIONS
CREATE TYPE user_role AS ENUM ('SUPER_ADMIN', 'OPERATOR', 'CA_AUDITOR');
CREATE TYPE vehicle_ownership AS ENUM ('MARKET', 'OWN');
CREATE TYPE trip_status_type AS ENUM ('PLANNED', 'IN_TRANSIT', 'DELIVERED', 'SETTLED', 'CANCELLED');
CREATE TYPE own_expense_category AS ENUM ('BHATTA', 'DIESEL', 'FASTAG', 'DRIVER_SALARY', 'MAINTENANCE', 'REPAIR', 'OTHER');
CREATE TYPE payment_type_enum AS ENUM (
  'PARTY_ADVANCE', 'PARTY_BALANCE', 'PARTY_DETENTION',
  'VEHICLE_OWNER_ADVANCE', 'VEHICLE_OWNER_BALANCE', 'VEHICLE_OWNER_DETENTION',
  'BULK_PAYMENT'
);
CREATE TYPE payment_mode_enum AS ENUM ('UPI', 'CASH', 'BANK_TRANSFER', 'CHEQUE');
CREATE TYPE payment_status_enum AS ENUM ('ACTIVE', 'CANCELLED');
CREATE TYPE allocation_status_enum AS ENUM ('ACTIVE', 'REVERSED');
CREATE TYPE credit_status_enum AS ENUM ('ACTIVE', 'EXHAUSTED', 'REVERSED');
CREATE TYPE bill_status_enum AS ENUM ('CURRENT', 'OUTDATED', 'CANCELLED', 'RESTORED', 'TRIP_DELETED');

-- 2. USER PROFILES
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE RESTRICT,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'OPERATOR',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. LOGISTICS MASTERS
CREATE TABLE parties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  gstin TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE vehicle_owners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  phone TEXT,
  pan_number TEXT,
  bank_details JSONB DEFAULT '{}'::jsonb,
  address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_number TEXT NOT NULL UNIQUE,
  ownership_type vehicle_ownership NOT NULL,
  owner_id UUID REFERENCES vehicle_owners(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE drivers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  phone TEXT,
  license_number TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. TRIPS & LOGISTICS
CREATE TABLE trips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_number TEXT NOT NULL UNIQUE,
  party_id UUID NOT NULL REFERENCES parties(id) ON DELETE RESTRICT,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE RESTRICT,
  vehicle_owner_id UUID REFERENCES vehicle_owners(id) ON DELETE RESTRICT,
  driver_id UUID REFERENCES drivers(id) ON DELETE RESTRICT,
  loading_date DATE NOT NULL,
  loading_location TEXT NOT NULL,
  lr_number TEXT,
  invoice_number TEXT,
  trip_status trip_status_type NOT NULL DEFAULT 'IN_TRANSIT',
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  remarks TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE trip_destinations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  sequence_order INT NOT NULL DEFAULT 1,
  destination_name TEXT NOT NULL,
  unloading_charge NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (unloading_charge >= 0),
  remarks TEXT
);

-- 5. TRIP FINANCIALS
CREATE TABLE trip_party_financials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL UNIQUE REFERENCES trips(id) ON DELETE CASCADE,
  freight NUMERIC(12,2) NOT NULL CHECK (freight >= 0),
  unloading_charges NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (unloading_charges >= 0),
  detention NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (detention >= 0),
  additional_charges NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (additional_charges >= 0),
  deductions NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (deductions >= 0),
  tds_applicable BOOLEAN NOT NULL DEFAULT FALSE,
  tds_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (tds_amount >= 0),
  gross_receivable NUMERIC(12,2) NOT NULL GENERATED ALWAYS AS (
    freight + unloading_charges + detention + additional_charges
  ) STORED,
  net_receivable NUMERIC(12,2) NOT NULL GENERATED ALWAYS AS (
    freight + unloading_charges + detention + additional_charges - deductions - tds_amount
  ) STORED,
  remarks TEXT,
  CONSTRAINT chk_party_deductions_tds CHECK ((deductions + tds_amount) <= (freight + unloading_charges + detention + additional_charges))
);

CREATE TABLE trip_owner_financials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL UNIQUE REFERENCES trips(id) ON DELETE CASCADE,
  freight NUMERIC(12,2) NOT NULL CHECK (freight >= 0),
  detention NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (detention >= 0),
  additional_charges NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (additional_charges >= 0),
  unloading_charges NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (unloading_charges >= 0),
  total_deductions NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (total_deductions >= 0),
  net_payable NUMERIC(12,2) NOT NULL GENERATED ALWAYS AS (
    (freight - total_deductions) + detention + additional_charges + unloading_charges
  ) STORED,
  remarks TEXT,
  CONSTRAINT chk_deductions_lte_freight CHECK (total_deductions <= freight)
);

CREATE TABLE vehicle_owner_deductions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_owner_financial_id UUID NOT NULL REFERENCES trip_owner_financials(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  reason TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. EXPENSES
CREATE TABLE own_vehicle_expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID REFERENCES trips(id) ON DELETE SET NULL,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE RESTRICT,
  driver_id UUID REFERENCES drivers(id) ON DELETE RESTRICT,
  expense_type own_expense_category NOT NULL,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  reason_or_remark TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE general_expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  reason_or_remark TEXT,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES profiles(id) ON DELETE RESTRICT,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. TREASURY & PAYMENTS
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payment_number TEXT NOT NULL UNIQUE,
  payment_type payment_type_enum NOT NULL,
  party_id UUID REFERENCES parties(id) ON DELETE RESTRICT,
  vehicle_owner_id UUID REFERENCES vehicle_owners(id) ON DELETE RESTRICT,
  trip_id UUID REFERENCES trips(id) ON DELETE RESTRICT,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  payment_mode payment_mode_enum NOT NULL DEFAULT 'UPI',
  reference_number TEXT,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE CHECK (payment_date <= CURRENT_DATE),
  status payment_status_enum NOT NULL DEFAULT 'ACTIVE',
  cancelled_at TIMESTAMPTZ,
  cancelled_by UUID REFERENCES profiles(id) ON DELETE RESTRICT,
  cancellation_reason TEXT,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE payment_allocations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE RESTRICT,
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE RESTRICT,
  amount_allocated NUMERIC(12,2) NOT NULL CHECK (amount_allocated > 0),
  status allocation_status_enum NOT NULL DEFAULT 'ACTIVE',
  allocated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE payment_reversals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  original_payment_id UUID NOT NULL UNIQUE REFERENCES payments(id) ON DELETE RESTRICT,
  reversal_amount NUMERIC(12,2) NOT NULL,
  reversal_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  performed_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  reason TEXT NOT NULL
);

CREATE TABLE party_credits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  party_id UUID NOT NULL REFERENCES parties(id) ON DELETE RESTRICT,
  source_payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE RESTRICT,
  original_credit NUMERIC(12,2) NOT NULL CHECK (original_credit > 0),
  amount_used NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (amount_used >= 0),
  remaining_credit NUMERIC(12,2) NOT NULL GENERATED ALWAYS AS (original_credit - amount_used) STORED,
  status credit_status_enum NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE party_credit_usages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  party_credit_id UUID NOT NULL REFERENCES party_credits(id) ON DELETE RESTRICT,
  target_trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE RESTRICT,
  amount_applied NUMERIC(12,2) NOT NULL CHECK (amount_applied > 0),
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reversed BOOLEAN NOT NULL DEFAULT FALSE
);

-- 8. BILLING & SUBMISSIONS
CREATE TABLE bills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bill_number TEXT NOT NULL UNIQUE,
  party_id UUID NOT NULL REFERENCES parties(id) ON DELETE RESTRICT,
  current_version INT NOT NULL DEFAULT 1,
  status bill_status_enum NOT NULL DEFAULT 'CURRENT',
  previous_status_before_trip_deleted TEXT,
  cancelled_at TIMESTAMPTZ,
  cancelled_by UUID REFERENCES profiles(id) ON DELETE RESTRICT,
  cancellation_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE bill_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bill_id UUID NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
  version_number INT NOT NULL,
  snapshot_data JSONB NOT NULL,
  generated_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(bill_id, version_number)
);

CREATE TABLE bill_trips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bill_id UUID NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE RESTRICT,
  is_current BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Partial Unique Index: Ensures a Trip can belong to at most ONE active CURRENT bill
CREATE UNIQUE INDEX idx_unique_active_trip_billing ON bill_trips (trip_id) WHERE (is_current = TRUE);

CREATE TABLE submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  submission_number TEXT NOT NULL UNIQUE,
  submission_date DATE NOT NULL DEFAULT CURRENT_DATE,
  remarks TEXT,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE submission_bills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  bill_id UUID NOT NULL REFERENCES bills(id) ON DELETE RESTRICT
);

-- 9. AUDIT & SYSTEM INTEGRITY
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  action TEXT NOT NULL,
  old_values JSONB,
  new_values JSONB,
  change_reason TEXT,
  performed_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  performed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE document_metadata (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  document_type TEXT NOT NULL,
  drive_file_id TEXT NOT NULL,
  file_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  uploaded_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE idempotency_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  idempotency_key TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  request_path TEXT NOT NULL,
  request_hash TEXT NOT NULL,
  response_payload JSONB,
  status TEXT NOT NULL CHECK (status IN ('PROCESSING', 'COMPLETED', 'FAILED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours')
);

-- 10. INDEXES
CREATE INDEX idx_trips_party ON trips(party_id);
CREATE INDEX idx_trips_vehicle ON trips(vehicle_id);
CREATE INDEX idx_trips_owner ON trips(vehicle_owner_id);
CREATE INDEX idx_payments_party ON payments(party_id);
CREATE INDEX idx_payments_owner ON payments(vehicle_owner_id);
CREATE INDEX idx_payments_trip ON payments(trip_id);
CREATE INDEX idx_allocations_payment ON payment_allocations(payment_id);
CREATE INDEX idx_allocations_trip ON payment_allocations(trip_id);
CREATE INDEX idx_audit_lookup ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_idempotency_lookup ON idempotency_keys(idempotency_key, user_id);

-- 11. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_destinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_party_financials ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_owner_financials ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_owner_deductions ENABLE ROW LEVEL SECURITY;
ALTER TABLE own_vehicle_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE general_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_reversals ENABLE ROW LEVEL SECURITY;
ALTER TABLE party_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE party_credit_usages ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE bill_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bill_trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE submission_bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE idempotency_keys ENABLE ROW LEVEL SECURITY;

-- Base Authenticated Read Policy (Active profiles only)
CREATE POLICY "Active profiles can view data" ON profiles
  FOR SELECT USING (auth.uid() = id AND is_active = true);

-- Helper Function: Check if user is active & non-CA for mutations
CREATE OR REPLACE FUNCTION is_active_mutator()
RETURNS BOOLEAN AS $$
DECLARE
  u_role user_role;
  u_active BOOLEAN;
BEGIN
  SELECT role, is_active INTO u_role, u_active FROM profiles WHERE id = auth.uid();
  IF u_active = TRUE AND u_role IN ('SUPER_ADMIN', 'OPERATOR') THEN
    RETURN TRUE;
  END IF;
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
