# BUSINESS_WORKFLOWS.md

```yaml
document:
  id: DOC-006
  title: BUSINESS_WORKFLOWS
  version: 1.0
  status: Frozen

purpose: Define the complete operational workflows followed by Shri Sanwariya Road Lines.

depends_on:
  - 00_READ_FIRST.md
  - AI_RULES.md
  - GLOSSARY.md
  - PROJECT.md
  - BUSINESS_MODEL.md

used_by:
  - BUSINESS_RULES.md
  - DATABASE.md
  - API.md
  - MODULES.md

last_updated: 2026-08-05
```

---

# 1. Introduction

This document defines the operational workflows performed by Shri Sanwariya Road Lines.

The workflows documented here represent the approved business processes that Version 1 of SSRL ERP shall implement.

No workflow may be modified without explicit approval.

---

# 2. Workflow Classification

Transportation work is classified using two independent dimensions.

## Customer Type

- Market
- Company

## Vehicle Type

- Own Fleet
- External Vehicle

Valid combinations are:

| Customer | Vehicle          |
| -------- | ---------------- |
| Market   | External Vehicle |
| Market   | Own Fleet        |
| Company  | External Vehicle |
| Company  | Own Fleet        |

This classification shall be followed throughout the ERP.

---

# WF-001 — Market Trip Workflow

## Purpose

Manage transportation work received from market customers.

---

## Trigger

A market customer requests transportation.

---

## Preconditions

- Customer information is available.
- Loading and destination cities are known.
- Vehicle has been arranged.

---

## Workflow

### Step 1

Create a new trip.

Enter:

- Loading Date
- Party Name
- From City
- To City
- Vehicle Number
- Driver Mobile Number

---

### Step 2

Determine vehicle ownership.

If the vehicle belongs to the Own Fleet:

- Enable Own Fleet workflow.

Otherwise:

- Enable External Vehicle workflow.

The ERP performs this detection automatically.

---

### Step 3

Complete trip information.

If External Vehicle:

Collect:

- Vehicle Owner
- Owner Mobile Number
- Weight
- Freight Rate
- Advance
- Balance
- Vehicle Rate
- Vehicle Advance
- Vehicle Balance
- Detention
- Deduction
- LR Number
- Remarks

If Own Fleet:

Collect:

- Freight Rate
- LR Number
- Remarks

Operational expenses are recorded separately.

---

### Step 4

Save the trip.

If the vehicle number does not exist in the Vehicle Directory:

Automatically create a new Vehicle Directory record using:

- Vehicle Number
- Owner Name
- Owner Mobile Number

No confirmation dialog shall be displayed.

---

### Step 5

Execute transportation.

Trip status progresses through the approved lifecycle.

---

### Step 6

Receive POD.

Upload the POD using ImageKit.

Trip status changes to:

POD Received

---

### Step 7

Market trip is completed.

No monthly submission process is involved.

---

## Outputs

- Trip created.
- Vehicle directory updated if required.
- POD attached.
- Trip available for reporting.

---

## Related Business Rules

- Vehicle Directory Auto Save
- Historical Snapshots
- POD Management

---

# WF-002 — Company Trip Workflow

## Purpose

Manage transportation work performed for registered companies.

---

## Trigger

A registered company assigns transportation work.

---

## Preconditions

- Company exists in Party Directory.
- Company billing configuration exists.

---

## Workflow

### Step 1

Create trip.

Required fields:

- Loading Date
- Party
- From City
- To City
- Vehicle Number
- Driver Mobile Number

---

### Step 2

ERP determines whether the vehicle belongs to:

- Own Fleet
- External Vehicle

Workflow changes automatically.

---

### Step 3

Enter trip information.

External Vehicle:

- Owner Name
- Owner Mobile
- Weight
- Freight
- Advance
- Balance
- Vehicle Rate
- Vehicle Advance
- Vehicle Balance
- Detention
- Deduction
- LR Number
- Remarks

Own Fleet:

- Freight
- LR Number
- Remarks

Expenses are recorded separately.

---

### Step 4

If company has predefined freight rates:

ERP suggests the configured freight rate.

User may override the suggested value.

---

### Step 5

Save trip.

Unknown vehicle numbers are automatically stored in Vehicle Directory.

---

### Step 6

Transportation completed.

---

### Step 7

Receive POD.

Upload POD.

Trip becomes eligible for billing.

---

### Step 8

Billing is performed according to the company's configured billing type.

Either:

- Individual Bill

or

- Consolidated Bill

---

## Outputs

- Company trip completed.
- POD stored.
- Trip ready for billing.

---

## Related Business Rules

- Company Billing Configuration
- Freight Override
- Vehicle Directory Auto Save
- POD Required Before Billing

---

# WF-003 — POD Management Workflow

## Purpose

Manage Proof of Delivery documents.

---

## Trigger

POD is received from transporter or customer.

---

## Preconditions

Trip exists.

---

## Workflow

### Step 1

Open trip.

---

### Step 2

Upload POD document.

Storage:

ImageKit

---

### Step 3

ERP validates upload.

---

### Step 4

Trip status changes to:

POD Received

---

### Step 5

Trip becomes eligible for billing.

---

## Outputs

- POD stored.
- Trip updated.
- Billing enabled.

---

## Business Rules

Billing shall not proceed until the required POD has been received according to the approved workflow.

---

# End of Part 1

This section covers:

- WF-001 — Market Trip Workflow
- WF-002 — Company Trip Workflow
- WF-003 — POD Management Workflow

The remaining workflows continue in Part 2.

---

# WF-004 — Individual Billing Workflow

## Purpose

Generate an individual bill for a single company trip.

This workflow is used for companies that require one bill per trip.

---

## Trigger

A company trip becomes eligible for billing.

---

## Preconditions

- Trip exists.
- Trip belongs to a Company Party.
- Required POD has been received.
- Company billing type is configured as **Individual Billing**.
- Trip has not already been billed.

---

## Workflow

### Step 1

Open the Billing module.

---

### Step 2

Select the company.

The ERP displays only eligible trips.

Eligible trips must satisfy all of the following conditions:

- Company Trip
- POD Received
- Not Already Billed
- Not Cancelled

---

### Step 3

Select a single trip.

---

### Step 4

Generate Bill.

The ERP automatically:

- Generates the next Bill Number.
- Creates the Bill record.
- Links the selected trip to the bill.
- Marks the trip as **Billed**.

---

### Step 5

Preview Bill.

The preview must exactly match the approved company bill format.

No redesign or layout modification is permitted.

---

### Step 6

Digital Signature

If the **Digital Signature** checkbox is enabled:

- Apply digital signature.
- Apply digital seal.

Otherwise:

- Leave signature area blank.

---

### Step 7

Print or Export.

Supported outputs:

- Print
- PDF

---

### Step 8

Send Bill

The generated bill may be:

- Printed
- Shared digitally
- Sent through Email

The ERP records the bill generation but does not track email delivery in Version 1.

---

## Outputs

- Bill created.
- Bill Number generated.
- Trip linked to Bill.
- Trip status updated.
- Printable document generated.

---

## Business Rules

- One Individual Bill contains exactly one trip.
- A billed trip cannot be billed again.
- Billing is allowed only after POD.
- Bill layout must remain identical to the approved format.

---

# WF-005 — Consolidated Billing Workflow

## Purpose

Generate a single bill containing multiple trips.

Used for companies accepting monthly consolidated invoices.

---

## Trigger

Company billing cycle is ready.

---

## Preconditions

- Company billing type is **Consolidated Billing**.
- Trips belong to the same company.
- Trips are eligible for billing.
- Required PODs have been received.

---

## Workflow

### Step 1

Open Billing Module.

---

### Step 2

Select Company.

---

### Step 3

Select Billing Period.

Normally:

- Month
- Financial Year

---

### Step 4

ERP displays eligible trips.

Only trips satisfying:

- Same Company
- POD Received
- Not Billed
- Not Cancelled

appear in the list.

---

### Step 5

Select trips.

User may:

- Select all
- Select manually

---

### Step 6

Generate Bill.

ERP automatically:

- Generates Bill Number.
- Creates Consolidated Bill.
- Links all selected trips.
- Marks all selected trips as **Billed**.

---

### Step 7

Preview.

The generated bill must exactly match the approved consolidated bill layout.

---

### Step 8

Digital Signature.

If enabled:

- Insert signature.
- Insert seal.

Otherwise:

Leave signature section blank.

---

### Step 9

Print or Export.

Supported outputs:

- Print
- PDF

---

## Outputs

- Consolidated Bill created.
- Multiple trips linked.
- Trips marked as billed.
- Printable document generated.

---

## Business Rules

- One Consolidated Bill may contain multiple trips.
- Trips from different companies shall never appear in one bill.
- Only eligible trips shall be selectable.
- Bill format must match the approved company format exactly.

---

# WF-006 — Submission Workflow

## Purpose

Manage submission of bills to companies.

Some companies require submitted bill records for payment processing.

---

## Trigger

Bills are ready for submission.

---

## Preconditions

- Bills exist.
- Bills belong to the same company.
- Bills have not already been submitted.

---

## Workflow

### Step 1

Open Submission Module.

---

### Step 2

Select Company.

---

### Step 3

ERP displays bills available for submission.

---

### Step 4

Select bills.

---

### Step 5

Create Submission.

ERP automatically:

- Generates Submission Number.
- Creates Submission record.
- Links selected bills.
- Marks bills as Submitted.

---

### Step 6

Print Submission List (Optional)

If required, print the submission summary for office records.

---

### Step 7

Deliver Bills.

Bills are submitted to the company.

Submission Date is recorded.

---

## Outputs

- Submission created.
- Bills linked.
- Submission Number generated.
- Bills marked as Submitted.

---

## Business Rules

- One submission belongs to one company only.
- One submission may contain multiple bills.
- Bills already submitted cannot be selected again.
- Submission Number resets every financial year.

---

# End of Part 2

This section covers:

- WF-004 — Individual Billing Workflow
- WF-005 — Consolidated Billing Workflow
- WF-006 — Submission Workflow

The remaining workflows continue in Part 3.

---

# WF-007 — Standard Payment Workflow

## Purpose

Record payments received from companies following the standard payment process.

This workflow applies to companies that settle payments through normal billing practices.

---

## Trigger

A payment is received from the company.

---

## Preconditions

- Company exists.
- Outstanding bills exist.
- Company is not configured for Bulk Payment.

---

## Workflow

### Step 1

Open the Payments Module.

---

### Step 2

Select the Company.

The ERP displays:

- Outstanding Bills
- Bill Numbers
- Bill Dates
- Bill Amounts
- Outstanding Amount

---

### Step 3

Select the bill(s) against which payment has been received.

---

### Step 4

Enter payment information.

Required fields:

- Payment Amount
- Payment Date
- Reference Number

---

### Step 5

Save Payment.

The ERP automatically:

- Creates a Payment record.
- Associates the payment with the selected bill(s).
- Updates the outstanding amount.
- Marks fully paid bills as **Paid**.
- Marks partially paid bills as **Partially Paid**.

---

### Step 6

Update Dashboard and Reports.

Outstanding reports are refreshed automatically.

---

## Outputs

- Payment recorded.
- Outstanding amount updated.
- Financial reports updated.

---

## Business Rules

- Payments cannot exceed the outstanding amount.
- Bills with zero outstanding amount are marked as Paid.
- Payment history must remain immutable.
- Payment records cannot be edited after creation. Corrections shall be made using reversal or adjustment entries in future versions if required.

---

# WF-008 — Bulk Payment Workflow (FIFO)

## Purpose

Manage payments received from companies that do not pay against individual bills.

---

## Trigger

A bulk payment is received.

---

## Preconditions

- Company exists.
- Company is configured for **Bulk Payment**.
- Outstanding monthly balances exist.

---

## Workflow

### Step 1

Open the Payments Module.

---

### Step 2

Select the Company.

The ERP displays:

- Month-wise outstanding balances.
- Total outstanding amount.
- Previous payment history.

---

### Step 3

Click **Add Payment**.

---

### Step 4

Enter:

- Payment Amount
- Payment Date
- Reference Number

---

### Step 5

Save Payment.

The ERP automatically:

- Creates the payment record.
- Starts FIFO allocation.

Allocation order:

Oldest Outstanding Month

↓

Next Oldest Month

↓

Next Month

Until the payment amount is exhausted.

---

### Step 6

Update Outstanding Balances.

Each month's outstanding amount is recalculated automatically.

---

### Step 7

Refresh Reports.

Dashboard, reports, and payment summaries are updated.

---

## Outputs

- Payment recorded.
- FIFO allocation completed.
- Month-wise outstanding updated.
- Payment history updated.

---

## Business Rules

- Manual allocation is strictly prohibited.
- FIFO allocation is mandatory.
- Allocation always starts from the oldest unpaid month.
- Previous payment history must never be modified.
- Allocation records are created automatically.

---

# WF-009 — Own Fleet Expense Workflow

## Purpose

Record operational expenses incurred by Shri Sanwariya Road Lines' own vehicles during trip execution.

---

## Trigger

An operational expense occurs during an Own Fleet trip.

---

## Preconditions

- Trip belongs to Own Fleet.
- Trip exists.

---

## Workflow

### Step 1

Open the Trip.

---

### Step 2

Navigate to the Expenses section.

---

### Step 3

Click **Add Expense**.

---

### Step 4

Select Expense Type.

Supported values:

- Fuel
- Driver Batta
- FASTag
- Maintenance
- Other

---

### Step 5

Enter:

- Amount
- Expense Date
- Remark (Optional)

---

### Step 6

Save Expense.

The ERP creates a new expense record.

Multiple entries of the same expense type are allowed.

Example:

Fuel

- ₹4,000
- ₹3,500
- ₹5,000

Driver Batta

- ₹500
- ₹500

FASTag

- ₹1,250

---

### Step 7

Automatic Calculation.

The ERP calculates:

- Total Fuel
- Total Driver Batta
- Total FASTag
- Total Maintenance
- Total Other Expenses
- Total Operational Expense

Totals are calculated dynamically and are not stored manually.

---

### Step 8

Profit Calculation.

The ERP calculates:

Customer Freight

− Total Operational Expenses

=

Operating Profit

---

## Outputs

- Expense recorded.
- Trip expense summary updated.
- Own Fleet profitability updated.
- Reports refreshed.

---

## Business Rules

- Multiple entries are allowed for every expense type.
- Totals are always calculated dynamically.
- Expense history is immutable.
- Only Own Fleet trips may contain operational expenses.

---

# 3. Workflow Dependencies

The operational workflow of SSRL ERP follows the sequence below.

Market Workflow

Customer Request

↓

Trip Creation

↓

Trip Completion

↓

POD Upload

↓

Trip Completed

---

Company Workflow

Company Request

↓

Trip Creation

↓

Trip Completion

↓

POD Upload

↓

Billing

↓

Submission

↓

Payment

↓

Completed

---

Own Fleet Workflow

Trip Creation

↓

Expense Recording

↓

Trip Completion

↓

POD Upload

↓

Billing (if Company Trip)

↓

Payment

↓

Profit Calculation

---

# Related Documents

- PROJECT.md
- BUSINESS_MODEL.md
- BUSINESS_RULES.md
- DO_NOT_BREAK.md
- DATABASE.md
- API.md
- MODULES.md

---

# Document Status

**Status:** Frozen

This document defines the approved operational workflows of Shri Sanwariya Road Lines.

All future database design, API design, UI implementation, module development, and testing shall follow these workflows.

Any modification to these workflows requires explicit approval before implementation.
