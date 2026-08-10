# BUSINESS_RULES.md

```yaml
document:
  id: DOC-007
  title: BUSINESS_RULES
  version: 1.0
  status: Frozen

purpose: Define the mandatory business rules that govern SSRL ERP.

depends_on:
  - 00_READ_FIRST.md
  - AI_RULES.md
  - GLOSSARY.md
  - PROJECT.md
  - BUSINESS_MODEL.md
  - BUSINESS_WORKFLOWS.md

used_by:
  - DATABASE.md
  - API.md
  - MODULES.md
  - UI_UX.md
  - DO_NOT_BREAK.md

last_updated: 2026-08-05
```

---

# 1. Introduction

This document defines the mandatory business rules of Shri Sanwariya Road Lines.

Unlike workflows, which explain **how work is performed**, business rules define **what must always remain true**.

Business rules are implementation-independent.

They apply regardless of:

- Database design
- API implementation
- Frontend design
- Technology stack

Every implementation of SSRL ERP shall comply with these rules.

---

# 2. Trip Rules

## BR-001 — Customer Type

Every trip shall belong to exactly one customer type.

Allowed values:

- Market
- Company

A trip shall never belong to both.

---

## BR-002 — Vehicle Type

Every trip shall use exactly one vehicle.

Vehicle classification shall be determined automatically by the ERP.

Allowed values:

- Own Fleet
- External Vehicle

The user shall not manually choose the vehicle type.

---

## BR-003 — Vehicle Ownership Detection

Whenever a vehicle number is entered,

the ERP shall automatically determine whether the vehicle belongs to Shri Sanwariya Road Lines' own fleet.

If the vehicle exists in the Own Fleet directory:

- Own Fleet workflow shall be applied.

Otherwise:

- External Vehicle workflow shall be applied.

---

## BR-004 — Historical Snapshots

Every trip shall permanently preserve all operational information captured at the time of trip creation.

Historical trips shall never change due to future modifications in master data.

The snapshot shall include, but is not limited to:

- Party Name
- Vehicle Number
- Vehicle Owner Name
- Vehicle Owner Mobile Number
- Driver Mobile Number
- Freight Rate
- Vehicle Rate
- Weight
- LR Number
- Financial Values
- Remarks

---

## BR-005 — Vehicle Directory Auto Save

If a vehicle number does not exist in the Vehicle Directory,

the ERP shall automatically create a new Vehicle Directory record using:

- Vehicle Number
- Owner Name
- Owner Mobile Number

The ERP shall not display any confirmation dialog.

---

## BR-006 — Driver Information

Version 1 shall store only:

- Driver Mobile Number

Driver names shall not be maintained.

Driver information belongs to the trip only.

It shall not be stored in any master directory.

---

## BR-007 — Trip Deletion

Trips shall never be permanently deleted immediately.

Deleted trips shall be moved to Trash.

Trips shall remain in Trash for 30 days.

After 30 days,

the ERP shall permanently remove them.

---

## BR-008 — Trip Number

Every trip shall receive an automatically generated Trip Number.

Trip Numbers shall reset at the beginning of every Financial Year.

Trip Numbers shall remain unique within a Financial Year.

---

# 3. POD Rules

## BR-009 — POD Requirement

A trip shall become eligible for billing only after the required POD has been received according to the approved business workflow.

---

## BR-010 — POD Upload

POD documents shall be uploaded using ImageKit.

The ERP shall store only metadata and file references.

---

## BR-011 — POD Status

Uploading a valid POD shall automatically update the Trip Status to:

POD Received

---

# 4. Billing Rules

## BR-012 — Billing Configuration

Every Company Party shall have exactly one billing configuration.

Allowed values:

- Individual Billing
- Consolidated Billing

---

## BR-013 — Freight Suggestion

The ERP may suggest freight rates configured for a company.

Users shall be permitted to override the suggested freight rate for individual trips.

---

## BR-014 — Individual Billing

One Individual Bill shall contain exactly one trip.

No Individual Bill shall contain multiple trips.

---

## BR-015 — Consolidated Billing

One Consolidated Bill may contain multiple trips.

All trips shall belong to the same company.

Trips from different companies shall never appear in the same bill.

---

## BR-016 — Bill Eligibility

A trip shall be eligible for billing only when all of the following conditions are satisfied:

- Company Trip
- POD Received
- Not Already Billed
- Not Cancelled

---

## BR-017 — Bill Locking

Once generated,

a bill shall become locked.

Editing shall not be permitted.

Corrections shall require:

- Bill Cancellation
- Bill Regeneration

according to the approved workflow.

---

## BR-018 — Bill Number

Every bill shall receive an automatically generated Bill Number.

The Bill Number shall:

- Begin with the configured two-letter prefix.
- Contain a maximum of six characters including the prefix.
- Contain no hyphens.
- Reset every Financial Year.

Example:

SB0001
SB0245
SB9999

---

# End of Part 1

This section defines:

- Trip Rules
- POD Rules
- Initial Billing Rules

The remaining business rules continue in Part 2.

---

# 5. Submission Rules

## BR-019 — Submission Eligibility

Only generated bills shall be eligible for submission.

Draft or cancelled bills shall never be submitted.

---

## BR-020 — Company Consistency

A submission shall contain bills belonging to exactly one company.

Bills from multiple companies shall never be included in the same submission.

---

## BR-021 — Submission Number

Every submission shall receive an automatically generated Submission Number.

Submission Numbers shall:

- Be unique.
- Reset every Financial Year.
- Never be reused.

---

## BR-022 — Submission History

Submission history shall be permanently preserved.

Submission records shall never be edited or deleted.

---

## BR-023 — Submission Reissue

If a company requests the bills again due to:

- Lost documents
- Damaged documents
- Missing delivery
- Any operational reason

The ERP shall:

- Create a new Submission.
- Generate a new Submission Number.
- Preserve all previous submissions.

Previous submissions shall never be modified.

---

## BR-024 — Submission-Bill Relationship

A bill may belong to multiple submissions over time.

Each submission represents a historical event.

Submission history shall remain permanently available.

---

# 6. Payment Rules

## BR-025 — Payment Types

The ERP shall support two payment models:

- Standard Payment
- Bulk Payment

The payment model shall be determined from the Company configuration.

Users shall not manually change the payment model during payment entry.

---

## BR-026 — Standard Payment

Standard Payment companies record payments against outstanding bills.

Outstanding amounts shall be updated automatically.

---

## BR-027 — Bulk Payment

Bulk Payment companies shall maintain outstanding balances month-wise.

Payments shall not be allocated directly against individual bills.

---

## BR-028 — FIFO Allocation

Bulk Payments shall always follow FIFO allocation.

Allocation order:

Oldest Outstanding Month

↓

Next Oldest Month

↓

Continue until payment amount is exhausted.

Manual allocation shall never be permitted.

---

## BR-029 — Automatic Allocation

The ERP shall automatically create payment allocation records.

Users shall never manually edit allocation records.

---

## BR-030 — Outstanding Amount

Outstanding amounts shall always be calculated from recorded payments.

Outstanding values shall never be entered manually.

---

## BR-031 — Payment History

Every payment shall become a permanent financial record.

Payment records shall never be deleted.

Future corrections shall be performed using accounting adjustments rather than modifying historical payments.

---

## BR-032 — Payment Reference

Every payment shall contain:

- Payment Date
- Amount
- Reference Number

Reference Number is mandatory.

---

# 7. Own Fleet Rules

## BR-033 — Own Fleet Detection

Own Fleet shall always be determined automatically from the vehicle number.

Manual selection is prohibited.

---

## BR-034 — Expense Categories

Version 1 supports the following expense types:

- Fuel
- Driver Batta
- FASTag
- Maintenance
- Other

No additional categories shall be introduced without approval.

---

## BR-035 — Multiple Expense Entries

Every expense category shall support unlimited entries.

Example:

Fuel

- ₹3,000
- ₹5,000
- ₹2,500

---

## BR-036 — Dynamic Totals

Expense totals shall always be calculated dynamically.

The ERP shall never store:

- Total Fuel
- Total Driver Batta
- Total Maintenance
- Total FASTag
- Total Other Expense

These values shall always be derived.

---

## BR-037 — Profit Calculation

Own Fleet operating profit shall be calculated as:

Customer Freight

− Operational Expenses

=

Operating Profit

The ERP shall always calculate profit automatically.

---

# 8. Vehicle Directory Rules

## BR-038 — Directory Purpose

Vehicle Directory stores the latest known information for external vehicles.

It is not intended to preserve historical ownership.

Historical ownership belongs to Trip Snapshots.

---

## BR-039 — Stored Information

Version 1 stores only:

- Vehicle Number
- Owner Name
- Owner Mobile Number

No additional owner information shall be maintained.

---

## BR-040 — Automatic Updates

When an existing vehicle is used in a trip,

its latest Owner Name and Owner Mobile Number may be updated in the Vehicle Directory.

Historical trips shall remain unchanged.

---

## BR-041 — Driver Information

Driver Mobile Number belongs to individual trips only.

Driver information shall never be stored in Vehicle Directory.

---

# 9. Document Rules

## BR-042 — Supported Documents

Version 1 supports:

- POD
- RC
- Insurance
- Fitness
- Permit
- PUC

No additional document categories shall be implemented in Version 1.

---

## BR-043 — Document Storage

All supported documents shall be stored using ImageKit.

Only document metadata shall be stored inside the ERP database.

---

## BR-044 — Vehicle Document Expiry

Vehicle documents containing expiry dates shall support reminder notifications before expiry.

The ERP shall not automatically renew documents.

---

# End of Part 2

This section defines:

- Submission Rules
- Payment Rules
- Own Fleet Rules
- Vehicle Directory Rules
- Document Rules

The remaining business rules continue in Part 3.

---

# 10. User Rules

## BR-045 — User Roles

Version 1 shall support the following user roles:

- Super Admin
- Admin
- User

No additional roles shall be introduced in Version 1.

---

## BR-046 — Authentication

Every user shall authenticate using their assigned credentials.

Anonymous access is prohibited.

---

## BR-047 — Authorization

Users shall only access modules and actions permitted by their assigned role.

Unauthorized operations shall be rejected.

---

## BR-048 — Password Storage

User passwords shall never be stored in plain text.

Passwords shall always be securely hashed before storage.

---

## BR-049 — Settings Access

Only Super Admin shall be permitted to modify system settings.

Other users shall have read-only or no access according to their permissions.

---

# 11. Reporting Rules

## BR-050 — Reports

Version 1 shall support at minimum:

- Monthly Trip Report
- Party Ledger
- Vehicle Owner Ledger
- Company Outstanding Report
- Own Fleet Profit Report
- Pending POD Report
- Payment Summary
- Financial Summary

---

## BR-051 — Report Accuracy

Reports shall always be generated from live database records.

Report values shall never be manually editable.

---

## BR-052 — Excel Export

Supported reports shall be exportable to Microsoft Excel.

The exported data shall accurately represent the data displayed within the ERP.

---

## BR-053 — PDF Export

Supported reports shall be exportable to PDF without altering the underlying data.

---

# 12. Number Generation Rules

## BR-054 — Trip Number

Trip Numbers shall:

- Be generated automatically.
- Remain unique within a Financial Year.
- Reset every Financial Year.

---

## BR-055 — Bill Number

Bill Numbers shall:

- Begin with the configured two-letter prefix.
- Contain a maximum of six characters including the prefix.
- Contain no separators or hyphens.
- Reset every Financial Year.

---

## BR-056 — Submission Number

Submission Numbers shall:

- Be generated automatically.
- Remain unique.
- Reset every Financial Year.

---

## BR-057 — Payment Number

Payment Numbers shall be generated automatically.

Payment Numbers shall remain unique throughout the system.

---

# 13. Data Integrity Rules

## BR-058 — Master Data Independence

Changes made to master records shall never modify historical transactional records.

This includes:

- Parties
- Vehicle Directory
- Own Fleet
- Company Configuration

Historical trips and bills shall always preserve their original snapshot values.

---

## BR-059 — Immutable Financial Records

Financial records shall never be overwritten.

Historical financial data must remain available for auditing purposes.

---

## BR-060 — Audit Trail

Every important business action shall create an Activity Log.

Examples include:

- Trip Creation
- Trip Update
- Trip Deletion
- Bill Generation
- Bill Cancellation
- Submission Creation
- Payment Recording
- User Login
- Settings Modification

---

## BR-061 — Soft Delete

Where supported, records shall be soft deleted rather than permanently removed.

Trips shall remain in Trash for 30 days before permanent deletion.

---

## BR-062 — Database Integrity

The ERP shall maintain referential integrity between all related records.

No orphan records shall exist.

---

# 14. Performance Rules

## BR-063 — Search Performance

Frequently searched fields shall be indexed.

Typical searchable fields include:

- Trip Number
- Bill Number
- LR Number
- Vehicle Number
- Party Name
- Owner Mobile Number

---

## BR-064 — Large Dataset Handling

The ERP shall support efficient operation with datasets containing at least:

- 100,000 Trips
- 10,000 Bills
- 10,000 Payments

Performance optimizations such as pagination and indexed queries shall be used where appropriate.

---

## BR-065 — Keyboard Efficiency

The ERP shall prioritize keyboard-based workflows for frequent operations.

Approved keyboard shortcuts shall be implemented where applicable.

---

## BR-066 — Native Experience

The application shall provide a desktop experience comparable to native Windows software.

Performance shall take precedence over unnecessary animations.

---

# 15. General System Rules

## BR-067 — Version 1 Scope

Only approved Version 1 functionality shall be implemented.

Features outside the approved scope require explicit approval before development.

---

## BR-068 — Business Adaptation

The software shall adapt to Shri Sanwariya Road Lines' business processes.

Business processes shall never be changed solely to accommodate software limitations.

---

## BR-069 — Documentation Authority

When implementation differs from approved documentation:

The implementation shall be corrected.

Documentation shall not be modified to justify incorrect implementation.

---

## BR-070 — AI Assumptions

AI development tools shall not invent:

- Business Rules
- Workflows
- Database Structures
- APIs
- User Interfaces

When documentation is incomplete, implementation shall stop until clarification is obtained.

---

# 16. Related Documents

- 00_READ_FIRST.md
- AI_RULES.md
- GLOSSARY.md
- PROJECT.md
- BUSINESS_MODEL.md
- BUSINESS_WORKFLOWS.md
- DO_NOT_BREAK.md
- DATABASE.md
- API.md
- MODULES.md
- UI_UX.md
- DEVELOPMENT_GUIDE.md

---

# Document Status

**Status:** Frozen

This document defines the mandatory business rules governing Version 1 of SSRL ERP.

All future database design, API design, module implementation, UI behaviour, testing, and AI-generated code shall comply with these rules.

Any modification to these rules requires explicit approval from the project owner before implementation.
