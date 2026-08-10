# DO_NOT_BREAK.md

```yaml
document:
  id: DOC-008
  title: DO_NOT_BREAK
  version: 1.0
  status: Frozen

purpose: Define the non-negotiable principles of SSRL ERP.

depends_on:
  - AI_RULES.md
  - PROJECT.md
  - BUSINESS_MODEL.md
  - BUSINESS_WORKFLOWS.md
  - BUSINESS_RULES.md

used_by:
  - All Development
  - Database
  - API
  - UI
  - AI Development
  - Testing

last_updated: 2026-08-05
```

---

# Introduction

This document contains the highest-priority rules of SSRL ERP.

These rules shall never be violated.

If any implementation conflicts with this document, the implementation is incorrect.

No optimization, refactoring, new feature, or AI-generated code may violate these rules.

---

# DNB-001 — Business First

The software shall always adapt to the business.

The business shall never adapt to the software.

---

# DNB-002 — Documentation Authority

Approved documentation is the single source of truth.

If implementation differs from documentation, implementation shall be corrected.

Documentation shall never be modified to justify incorrect implementation.

---

# DNB-003 — Historical Integrity

Historical business records shall never change.

Historical trips, bills, submissions and payments must always preserve the information that existed when they were created.

---

# DNB-004 — Snapshot Preservation

Trips shall permanently preserve snapshots of:

- Party Information
- Vehicle Information
- Freight
- Vehicle Rate
- Driver Mobile Number
- Financial Values

Changes to master data shall never modify historical trips.

---

# DNB-005 — Automatic Vehicle Detection

Vehicle ownership shall always be determined automatically from the Own Fleet directory.

Users shall never manually choose:

- Own Fleet
- External Vehicle

---

# DNB-006 — Vehicle Directory Auto Save

Unknown vehicle numbers shall automatically create Vehicle Directory records.

The ERP shall not display confirmation dialogs.

---

# DNB-007 — POD Before Billing

Billing shall never be allowed before the required POD has been received according to the approved workflow.

---

# DNB-008 — Bill Layout Integrity

Individual Bills and Consolidated Bills shall remain visually identical to the company's approved formats.

The ERP shall populate data only.

It shall never redesign the layouts.

---

# DNB-009 — Bill Locking

Generated bills shall become locked.

Corrections require:

- Bill Cancellation
- Bill Regeneration

Direct editing is prohibited.

---

# DNB-010 — Billing Configuration

Every Company Party shall have exactly one billing configuration:

- Individual Billing
- Consolidated Billing

The ERP shall always respect this configuration.

---

# DNB-011 — FIFO Payment Allocation

Bulk Payment companies shall always use FIFO allocation.

Allocation shall:

- Start from the oldest outstanding month.
- Continue month by month.
- Never allow manual allocation.

---

# DNB-012 — Submission History

Submission history shall never be overwritten.

Every re-submission shall generate:

- New Submission
- New Submission Number
- New Submission Date

Historical submissions remain permanently available.

---

# DNB-013 — Own Fleet Expenses

Only Own Fleet trips may contain:

- Fuel
- Driver Batta
- FASTag
- Maintenance
- Other Expenses

---

# DNB-014 — Dynamic Calculations

Derived values shall never be stored manually.

Examples:

- Total Fuel
- Total Expense
- Outstanding Amount
- Operating Profit

These values shall always be calculated.

---

# DNB-015 — Financial Year Reset

The following numbers shall reset every Financial Year:

- Trip Number
- Bill Number
- Submission Number

---

# DNB-016 — Immutable Financial Records

Payments shall never be deleted.

Financial history shall remain permanently available.

---

# DNB-017 — Soft Delete

Trips shall never be permanently deleted immediately.

Deleted trips shall remain in Trash for 30 days before automatic permanent deletion.

---

# DNB-018 — Backend Ownership

Business logic belongs in backend Services.

Business logic shall never exist inside React components.

---

# DNB-019 — Performance First

Performance shall always take priority over visual effects.

Animations shall never reduce productivity.

---

# DNB-020 — Native Desktop Experience

The application shall feel like native Windows software.

Web-like behaviour that negatively impacts usability shall be avoided.

---

# DNB-021 — No Assumptions

Developers and AI tools shall never invent:

- Business Rules
- Workflows
- Database Structures
- APIs

When documentation is incomplete,

implementation shall stop until clarification is obtained.

---

# DNB-022 — Version 1 Scope

Only approved Version 1 functionality shall be implemented.

No additional modules or workflows shall be introduced without approval.

---

# DNB-023 — Audit Trail

Every important business operation shall create an Activity Log.

Audit history shall never be removed.

---

# DNB-024 — Security

Passwords shall never be stored in plain text.

Sensitive configuration values shall never be stored inside the database when environment variables are appropriate.

---

# DNB-025 — Database Integrity

Referential integrity shall always be maintained.

The ERP shall never create orphan records.

---

# DNB-026 — Search Performance

Frequently searched fields shall always be indexed.

Search performance shall remain fast even with large datasets.

---

# DNB-027 — AI Development

AI is an implementation assistant.

AI shall not redesign business logic or architecture without explicit approval.

---

# Related Documents

- AI_RULES.md
- PROJECT.md
- BUSINESS_MODEL.md
- BUSINESS_WORKFLOWS.md
- BUSINESS_RULES.md
- DATABASE.md
- API.md

---

# Document Status

**Status:** Frozen

This document represents the constitutional principles of SSRL ERP.

Any implementation violating these rules shall be considered incorrect, regardless of technical correctness.
