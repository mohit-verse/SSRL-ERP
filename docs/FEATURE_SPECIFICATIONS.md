# FEATURE_SPECIFICATIONS.md

```yaml
document:
  id: DOC-012
  title: FEATURE_SPECIFICATIONS
  version: 1.0
  status: Frozen

purpose: Define every functional feature of SSRL ERP.

depends_on:
  - PROJECT.md
  - BUSINESS_MODEL.md
  - BUSINESS_WORKFLOWS.md
  - BUSINESS_RULES.md
  - DATABASE.md
  - MODULES.md
  - API.md

used_by:
  - UI_UX.md
  - TESTING.md
  - DEVELOPMENT.md

last_updated: 2026-08-05
```

---

# Introduction

This document defines the functional behaviour of every feature available in SSRL ERP.

It intentionally excludes:

- Visual Design
- Layout
- Colors
- Typography
- CSS
- Animations

Those are defined separately in `UI_UX.md`.

This document answers one question only:

> **What should the feature do?**

---

# Feature Classification

| Category       | Description                  |
| -------------- | ---------------------------- |
| Core           | Daily operational features   |
| Financial      | Billing and payment features |
| Administrative | Settings and management      |
| Reporting      | Reports and analytics        |
| Utility        | Search, export, upload, etc. |

---

# FTR-001 — Dashboard

## Category

Core

---

## Purpose

Provide a real-time overview of the business.

---

## Features

- Today's Trips
- Pending PODs
- Bills Pending Submission
- Outstanding Payments
- Monthly Revenue
- Monthly Expense
- Monthly Profit
- Vehicle Document Expiry Alerts

---

## User Actions

- Open Dashboard
- View KPI Cards
- Navigate to related modules

---

## Related Module

Dashboard

---

# FTR-002 — Trip Management

## Category

Core

---

## Purpose

Manage transportation trips from creation until completion.

---

## Features

- Create Trip
- Edit Trip
- Delete Trip
- Restore Trip
- Search Trip
- Upload POD
- View Timeline
- View Expenses
- View Documents

---

## Supported Searches

- Trip Number
- LR Number
- Vehicle Number
- Party
- Driver Mobile

---

## Related Module

Trips

---

# FTR-003 — Party Management

## Category

Administrative

---

## Features

- Create Party
- Edit Party
- Configure Billing Type
- Configure Payment Type
- GST Management
- Party Ledger

---

# FTR-004 — Vehicle Directory

## Category

Core

---

## Features

- Auto Vehicle Creation
- Edit Owner
- Search Vehicle
- Vehicle History

---

# FTR-005 — Own Fleet

## Category

Core

---

## Features

- Register Vehicle
- Upload Documents
- Expiry Tracking
- Vehicle History

---

# FTR-006 — Billing

## Category

Financial

---

## Features

- Individual Bill
- Consolidated Bill
- Bill Preview
- Print Bill
- PDF Export
- Digital Signature
- Cancel Bill

---

# FTR-007 — Submission

## Category

Financial

---

## Features

- Create Submission
- Reissue Submission
- Submission History
- Print Submission List

---

# FTR-008 — Payments

## Category

Financial

---

## Features

- Standard Payment
- Bulk Payment
- FIFO Allocation
- Outstanding Summary
- Payment History

---

# FTR-009 — Reports & Analytics

## Category

Reporting

---

## Features

- Monthly Trip Register
- Party Ledger
- Vehicle Owner Ledger
- Outstanding Report
- Pending POD
- Financial Summary
- Profit Summary
- Export to Excel
- Export to PDF

---

# FTR-010 — User Management

## Category

Administrative

---

## Features

- Create User
- Edit User
- Reset Password
- Activate User
- Deactivate User

---

# FTR-011 — Settings

## Category

Administrative

---

## Features

- Company Information
- Number Prefixes
- Upload Settings
- Theme
- Digital Signature

---

# FTR-012 — Activity Logs

## Category

Utility

---

## Features

- View Logs
- Search Logs
- Filter Logs
- Audit Investigation

---

# Cross-Feature Capabilities

The following capabilities shall be available wherever applicable:

- Global Search
- Pagination
- Sorting
- Filtering
- Excel Export
- PDF Export
- Keyboard Navigation
- Role-Based Access
- Activity Logging
- Audit Trail
- Soft Delete (where supported)

---

# Related Documents

- MODULES.md
- API.md
- DATABASE.md
- UI_UX.md
- TESTING.md

---

# Document Status

**Status:** Frozen

This document defines the functional scope of every feature implemented in SSRL ERP Version 1.

Visual presentation is intentionally excluded and is defined separately in `UI_UX.md`.
