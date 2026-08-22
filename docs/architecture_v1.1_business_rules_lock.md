# Shri Sanwariya Road Lines (SSRL) ERP  
## Master Architecture & Business Rules Lock Specification v1.1

**Document Version:** 1.1.0 (Business Rules Lock Stage)  
**Status:** BLOCKED — PENDING OWNER DECISIONS ON BR-001 THROUGH BR-007  
**Author:** Principal Software Architect & Senior Full-Stack Engineering Agent  

---

## 1. CONFIRMED TECHNICAL CORRECTIONS

The following technical corrections identified during the Pre-Implementation Audit are formally incorporated into the SSRL ERP System Architecture:

### 1.1 Party Unloading Charges Aggregation
* Added column `trip_party_financials.unloading_charges NUMERIC(12,2) NOT NULL DEFAULT 0.00`.
* Party Net Receivable formula updated:
  $$\text{Net Receivable} = \text{Freight} + \text{Unloading Charges} + \text{Detention} + \text{Additional Charges} - \text{Deductions} - \text{TDS}$$
* **Aggregation Rule**: Destination unloading charges (`trip_destinations.unloading_charge`) are summed and written to `trip_party_financials.unloading_charges` inside the database transaction whenever destination drops are created, updated, or deleted.

### 1.2 Itemized Payment Allocation Table (`payment_allocations`)
* Introduced `payment_allocations` table to track itemized debt reduction per trip for single and Bulk Payments.
* Structure: `id`, `payment_id` (FK), `trip_id` (FK), `amount_allocated` (NUMERIC), `allocated_at` (TIMESTAMP), `status` (ENUM: `ACTIVE`, `REVERSED`).
* Allocations are immutable audit records. Reversals mark `status = 'REVERSED'` and log compensating entries.

### 1.3 Audit & Profile Foreign Key Integrity
* All profile foreign key relationships (`created_by`, `performed_by`, `cancelled_by`, `deleted_by`, `generated_by`, `uploaded_by`) across financial tables MUST enforce `ON DELETE RESTRICT`.
* Account deletion in Supabase Auth is prohibited; user access is revoked by setting `profiles.is_active = FALSE`.

### 1.4 Duplicate Billing Prevention (`bill_trips`)
* Prevent active double-billing via partial unique index:
  ```sql
  CREATE UNIQUE INDEX idx_unique_active_trip_billing 
  ON bill_trips (trip_id) 
  WHERE bill_id IN (SELECT id FROM bills WHERE status = 'CURRENT');
  ```

---

## 2. UPDATED FINANCIAL INVARIANTS

1. **Party Net Receivable**:
   $$\text{Net Receivable} = \text{Freight} + \text{Unloading Charges} + \text{Detention} + \text{Additional Charges} - \text{Deductions} - \text{TDS}$$
2. **Vehicle Owner Net Payable**:
   $$\text{Net Payable} = (\text{Freight} - \text{Owner Deductions}) + \text{Detention} + \text{Additional Charges} + \text{Unloading Charges}$$
3. **Vehicle Owner Deduction Cap**:
   $$\sum \text{Owner Deductions} \le \text{Gross Freight}$$
4. **Vehicle Owner Overpayment Prevention**:
   $$\sum \text{Active Owner Payments} \le \text{Net Payable}$$
5. **Party Bulk Payment Balance**:
   $$\text{Payment Amount} = \sum \text{Allocations} + \text{Generated Party Credit}$$

---

## 3. UPDATED DATABASE MODEL (DDL EXTRACT)

```sql
-- Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Payment Allocation Status
CREATE TYPE allocation_status_enum AS ENUM ('ACTIVE', 'REVERSED');

-- Payment Allocations Table
CREATE TABLE payment_allocations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE RESTRICT,
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE RESTRICT,
  amount_allocated NUMERIC(12,2) NOT NULL CHECK (amount_allocated > 0),
  status allocation_status_enum NOT NULL DEFAULT 'ACTIVE',
  allocated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Idempotency Keys Table
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

-- Index for Idempotency
CREATE INDEX idx_idempotency_lookup ON idempotency_keys(idempotency_key, user_id);
```

---

## 4. PAYMENT ALLOCATION MODEL

A Payment relates to Trips through `payment_allocations`:

```
Payment (₹100,000)
 ├── payment_allocations → Trip A (₹40,000) [ACTIVE]
 ├── payment_allocations → Trip B (₹35,000) [ACTIVE]
 └── party_credits → Unallocated Credit (₹25,000) [ACTIVE]
```

Allocations are created inside atomic database transactions. They are never physically deleted.

---

## 5. PAYMENT REVERSAL MODEL

When a Payment is cancelled:
1. `payments.status` is set to `'CANCELLED'`.
2. All linked `payment_allocations.status` are set to `'REVERSED'`.
3. Linked `party_credits.status` are set to `'REVERSED'`.
4. Any `party_credit_usages` stemming from the credit are marked `reversed = TRUE`, restoring outstanding balances on downstream trips.
5. Entry inserted into `payment_reversals` and `audit_logs`.

---

## 6. FIFO CONCURRENCY MODEL

To prevent race conditions during Bulk Payments and Owner Payments:

```sql
-- Step 1: Lock Party Row Exclusively
SELECT id FROM parties WHERE id = $1 FOR UPDATE;

-- Step 2: Lock Unsettled Trips Exclusively
SELECT id FROM trips 
WHERE party_id = $1 AND is_deleted = FALSE AND trip_status != 'CANCELLED' 
ORDER BY loading_date ASC, created_at ASC, trip_number ASC, id ASC
FOR UPDATE;
```

### Deterministic Sort Order Layers:
1. `loading_date ASC`: Business priority (Oldest load date first).
2. `created_at ASC`: System entry priority (First created trip first).
3. `trip_number ASC`: Human-readable identifier tie-breaker.
4. `id ASC`: Absolute UUID tie-breaker guaranteeing deterministic SQL execution.

---

## 7. BILLING INTEGRITY MODEL

* **Snapshot Immutability**: `bill_versions.snapshot_data` (JSONB) is frozen at generation time.
* **Outdated Trigger**: Updating a Trip triggers an automatic update setting `bills.status = 'OUTDATED'` for all active bills containing that trip.
* **Version Bumping**: Generating a new snapshot increments `bills.current_version` and sets `status = 'CURRENT'`.

---

## 8. TRIP STATE MODEL

The system cleanly separates **Operational Business Status** from **Database Deletion Lifecycle**:

* **`trip_status` (ENUM)**: `PLANNED`, `IN_TRANSIT`, `DELIVERED`, `SETTLED`, `CANCELLED`.
* **`is_deleted` (BOOLEAN)**: `TRUE` / `FALSE` (Soft-deletion flag).

### Deletion Guard:
A Trip can have `is_deleted = TRUE` **only** if it has 0 active payments and 0 active bills, OR via explicit Super-Admin soft-deletion which temporarily sets linked bills to `TRIP_DELETED` status while preserving internal `trip_status`.

---

## 9. AUDIT MODEL

Every financial edit logs an immutable row in `audit_logs`:
* `entity_type`, `entity_id`, `action`, `old_values` (JSONB), `new_values` (JSONB), `change_reason` (Mandatory for reversals/cancellations), `performed_by`, `performed_at`.

---

## 10. SECURITY MODEL

* **Authentication**: Supabase Auth (Email + Password). Session verified via JWT middleware against `profiles.is_active = TRUE`.
* **Authorization (RBAC)**:
  * `SUPER_ADMIN`: Full permissions (Reversals, Bill Cancellation/Restoration, Role management).
  * `OPERATOR`: Operational entry (Trips, Payments, Expenses, Bills).
  * `CA_AUDITOR`: Read-Only access to financial ledgers and audit logs. Rejects all `POST`/`PUT`/`DELETE` calls with `403 Forbidden`.

---

## 11. RECONCILIATION MODEL

### Party X Reconciliation Formula:
$$\text{Total Active Receivables}(P) = \sum_{t \in \text{ActiveTrips}(P)} \text{Net Receivable}(t)$$
$$\text{Total Direct Allocations}(P) = \sum_{a \in \text{ActiveAllocations}(P)} \text{amount\_allocated}(a)$$
$$\text{Total Credit Applied}(P) = \sum_{u \in \text{ActiveCreditUsages}(P)} \text{amount\_applied}(u)$$
$$\text{Total Outstanding}(P) = \text{Total Active Receivables}(P) - \text{Total Direct Allocations}(P) - \text{Total Credit Applied}(P)$$

### Party Payment Ledger Integrity Invariant:
$$\text{Total Active Payments}(P) = \text{Total Direct Allocations}(P) + \sum_{c \in \text{Credits}(P)} \text{original\_credit}(c)$$

### Vehicle Owner Y Reconciliation Formula:
$$\text{Total Owner Outstanding}(O) = \sum_{t \in \text{ActiveTrips}(O)} \text{Net Payable}(t) - \sum_{p \in \text{ActiveOwnerPayments}(O)} \text{amount}(p)$$

---

## 12. OPEN BUSINESS DECISIONS (BR-001 THROUGH BR-007)

---

### DECISION BR-001
* **BUSINESS QUESTION**: How should the system handle a reduction in Party Trip Freight after payments have already been received?  
  *Example*: Trip Receivable was ₹50,000 and paid ₹50,000. Freight is edited and Receivable becomes ₹40,000.
* **WHY IT MATTERS**: Paid amount (₹50,000) now exceeds new Receivable (₹40,000), creating an unallocated overpayment of ₹10,000.
* **AFFECTED MODULES**: Trip Service, Party Financials, Treasury Engine.
* **AFFECTED TABLES**: `trips`, `trip_party_financials`, `payments`, `party_credits`.
* **AFFECTED FINANCIAL LOGIC**: Party Outstanding calculation and Party Credit ledger.
* **POSSIBLE OPTIONS**:
  * **Option A**: Block the Freight edit until existing payments are reversed or reallocated.
  * **Option B**: Automatically convert the excess ₹10,000 into Party Credit.
  * **Option C**: Create a controlled Credit Adjustment Note.
* **CONSEQUENCE OF EACH OPTION**:
  * *Option A*: Maximize financial safety; prevents accidental freight changes on settled trips.
  * *Option B*: Convenient for operators, but generates auto-credits without an explicit payment transaction.
  * *Option C*: Audit-compliant, but requires building an adjustment note module.
* **RECOMMENDED OPTION**: **Option A** (Block edit if `New Receivable < Paid Amount`).
* **FINAL STATUS**: `PENDING USER DECISION`

---

### DECISION BR-002
* **BUSINESS QUESTION**: How should the system handle a reduction in Vehicle Owner Payable after owner payments have been disbursed?  
  *Example*: Owner Payable was ₹40,000 and paid ₹40,000. Freight is edited and Owner Payable becomes ₹35,000.
* **WHY IT MATTERS**: Owner has been overpaid by ₹5,000. SSRL is owed money by the truck owner, but there is NO Vehicle Owner Credit system.
* **AFFECTED MODULES**: Trip Service, Vehicle Owner Financials, Treasury Engine.
* **AFFECTED TABLES**: `trips`, `trip_owner_financials`, `payments`.
* **AFFECTED FINANCIAL LOGIC**: Vehicle Owner Payable balance & ledger.
* **POSSIBLE OPTIONS**:
  * **Option A**: Block the edit if `New Payable < Disbursed Owner Payments`.
  * **Option B**: Create a Vehicle Owner Recovery/Receivable Balance (owner owes SSRL).
  * **Option C**: Require Super-Admin override with deduction adjustment.
* **CONSEQUENCE OF EACH OPTION**:
  * *Option A*: Strict safety; prevents negative owner balances.
  * *Option B*: Requires building a Vehicle Owner Receivable ledger.
  * *Option C*: Operational flexibility with manual administrative risk.
* **RECOMMENDED OPTION**: **Option A** (Block edit if `New Payable < Disbursed Payments`).
* **FINAL STATUS**: `PENDING USER DECISION`

---

### DECISION BR-003
* **BUSINESS QUESTION**: What is the exact scope and treatment of Destination Unloading Charges in Party Financials?
* **WHY IT MATTERS**: Determines whether unloading charges are billed to the Party or handled purely as operational reimbursements.
* **AFFECTED MODULES**: Trip Destinations, Party Financials, Billing Engine.
* **AFFECTED TABLES**: `trip_destinations`, `trip_party_financials`, `bills`.
* **AFFECTED FINANCIAL LOGIC**: Net Party Receivable calculation.
* **POSSIBLE OPTIONS**:
  * **Option A**: Included in Party Receivable (Party pays unloading charges to SSRL).
  * **Option B**: Reimbursed separately outside the main trip invoice.
  * **Option C**: Operational record only (excluded from Party Receivable).
* **CONSEQUENCE OF EACH OPTION**:
  * *Option A*: Increases invoice total; consistent with prompt Section 4.
  * *Option B*: Requires separate reimbursement tracking.
  * *Option C*: Excludes unloading charges from party revenue/receivables.
* **RECOMMENDED OPTION**: **Option A** (Included in Party Net Receivable).
* **FINAL STATUS**: `PENDING USER DECISION`

---

### DECISION BR-004
* **BUSINESS QUESTION**: What is the precise calculation base for Tax Deducted at Source (TDS)?
* **WHY IT MATTERS**: Determines how `tds_amount` is validated and subtracted from Party Receivable.
* **AFFECTED MODULES**: Party Financials, Billing Engine, CA Reports.
* **AFFECTED TABLES**: `trip_party_financials`.
* **AFFECTED FINANCIAL LOGIC**: Net Party Receivable & Tax compliance reports.
* **POSSIBLE OPTIONS**:
  * **Option A**: Freight only.
  * **Option B**: Freight + Unloading Charges.
  * **Option C**: Gross Party Receivable before deductions (`Freight + Unloading + Detention + Additional Charges`).
  * **Option D**: Manual lump-sum entry with no base validation.
* **CONSEQUENCE OF EACH OPTION**:
  * *Option A/B/C*: Enforces formula validation.
  * *Option D*: Maximize user flexibility; user enters exact TDS figure from TDS certificate.
* **RECOMMENDED OPTION**: **Option D** (User manually marks TDS applicable and enters required TDS amount, validated to not exceed Gross Receivable).
* **FINAL STATUS**: `PENDING USER DECISION`

---

### DECISION BR-005
* **BUSINESS QUESTION**: Are operators allowed to enter payments with backdated payment dates?
* **WHY IT MATTERS**: Affects financial reporting period closure and historical ledger accuracy.
* **AFFECTED MODULES**: Payment Engine, Financial Reporting, CA Portal.
* **AFFECTED TABLES**: `payments`.
* **AFFECTED FINANCIAL LOGIC**: Monthly & Financial Year Outstanding reports.
* **POSSIBLE OPTIONS**:
  * **Option A**: Prohibited (`payment_date` is strictly `CURRENT_DATE`).
  * **Option B**: Allowed freely for all users.
  * **Option C**: Allowed for Operators up to 30 days backdated; Super-Admin uncapped; mandatory audit reason.
* **CONSEQUENCE OF EACH OPTION**:
  * *Option A*: High audit integrity, but inconvenient for bank sync delays.
  * *Option B*: Risk of altering closed monthly statements without approval.
  * *Option C*: Real-world operational balance with audit accountability.
* **RECOMMENDED OPTION**: **Option C** (Controlled backdating with mandatory reason).
* **FINAL STATUS**: `PENDING USER DECISION`

---

### DECISION BR-006
* **BUSINESS QUESTION**: What is the policy and restriction window for restoring soft-deleted trips?
* **WHY IT MATTERS**: Restoring a trip re-opens financial receivables/payables and alters historical statements.
* **AFFECTED MODULES**: Trip Service, Audit Engine, Billing Engine.
* **AFFECTED TABLES**: `trips`, `bills`.
* **AFFECTED FINANCIAL LOGIC**: Historical profit & outstanding reports.
* **POSSIBLE OPTIONS**:
  * **Option A**: Indefinite restoration by Super-Admin.
  * **Option B**: Restricted to current Financial Year only.
  * **Option C**: Prohibited once financial year is closed.
* **CONSEQUENCE OF EACH OPTION**:
  * *Option A*: Maximum flexibility.
  * *Option B/C*: Protects closed accounting periods from retrospective alterations.
* **RECOMMENDED OPTION**: **Option B** (Restoration permitted within active Financial Year by Super-Admin).
* **FINAL STATUS**: `PENDING USER DECISION`

---

### DECISION BR-007
* **BUSINESS QUESTION**: What is the lifespan and rollover policy for Party Credit?
* **WHY IT MATTERS**: Determines whether unapplied party credit balances expire or carry forward across financial years.
* **AFFECTED MODULES**: Treasury Engine, Financial Reports, FIFO Engine.
* **AFFECTED TABLES**: `party_credits`.
* **AFFECTED FINANCIAL LOGIC**: Year-end financial balance sheet closing.
* **POSSIBLE OPTIONS**:
  * **Option A**: Carries forward indefinitely across financial years.
  * **Option B**: Expires at Financial Year closure (March 31st).
  * **Option C**: Requires manual reconciliation rollover at FY closure.
* **CONSEQUENCE OF EACH OPTION**:
  * *Option A*: Standard double-entry customer credit ledger behavior.
  * *Option B*: Reverts unapplied credit to revenue (non-standard).
  * *Option C*: Involves manual year-end accounting workflow.
* **RECOMMENDED OPTION**: **Option A** (Carries forward indefinitely until fully consumed or refunded).
* **FINAL STATUS**: `PENDING USER DECISION`

---

## 13. ADDITIONAL BUSINESS DECISIONS DISCOVERED

* **BR-008**: **Billing Prior to Delivery**: Can a Trip with status `PLANNED` or `IN_TRANSIT` be billed, or must it be `DELIVERED` first? (*Recommended: Must be `DELIVERED` or `IN_TRANSIT` with POD*).
* **BR-009**: **Owner Payment Prior to Delivery**: Can SSRL disburse advances/balances to Vehicle Owners before trip delivery? (*Recommended: Advances allowed anytime; Balances require `DELIVERED` status*).
* **BR-010**: **Automated Settlement Trigger**: Does a Trip status automatically change to `SETTLED` when outstanding balances reach 0, or requires manual click? (*Recommended: Automated state transition to `SETTLED` upon zero outstanding balance*).
* **BR-011**: **Financial Editing After Settlement**: Can trip financial fields be edited after status becomes `SETTLED`? (*Recommended: Super-Admin only, requiring state revert to `DELIVERED`*).
* **BR-012**: **Partial Payment Reversal**: Are partial payment reversals permitted, or must payment cancellations be 100% full reversals? (*Recommended: 100% Full reversals only for strict audit clarity*).

---

## 14. IMPLEMENTATION BLOCKERS

1. **Owner Confirmation required for Open Business Decisions BR-001 through BR-007**.
2. **Confirmation of Additional Business Decisions BR-008 through BR-012**.

---

## 15. IMPLEMENTATION READINESS STATUS

### ARCHITECTURE STATUS:
`A. BLOCKED — BUSINESS DECISIONS REQUIRED`

---
*No application code, database migrations, or UI files have been created. Engineering remains strictly paused pending business decision confirmation.*
