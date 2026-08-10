# MODULES.md

```yaml
document:
  id: DOC-010
  title: MODULES
  version: 1.0
  status: Frozen

purpose: Define every functional module of SSRL ERP and their responsibilities.

depends_on:
  - PROJECT.md
  - BUSINESS_MODEL.md
  - BUSINESS_WORKFLOWS.md
  - BUSINESS_RULES.md
  - DATABASE.md

used_by:
  - API.md
  - UI_UX.md
  - DEVELOPMENT_GUIDE.md
  - TESTING.md

last_updated: 2026-08-05
```

---

# 1. Introduction

The SSRL ERP is organized into independent functional modules.

Each module owns a specific business responsibility.

Modules communicate through approved APIs and shared business rules.

Business logic shall reside in backend services, not inside the frontend.

---

# 2. Module Overview

| Module ID | Module            | Version 1 |
| --------- | ----------------- | --------- |
| MOD-001   | Dashboard         | ✅        |
| MOD-002   | Trips             | ✅        |
| MOD-003   | Parties           | ✅        |
| MOD-004   | Vehicle Directory | ✅        |
| MOD-005   | Own Fleet         | ✅        |
| MOD-006   | Billing           | ✅        |
| MOD-007   | Submissions       | ✅        |
| MOD-008   | Payments          | ✅        |
| MOD-009   | Reports           | ✅        |
| MOD-010   | Users             | ✅        |
| MOD-011   | Settings          | ✅        |
| MOD-012   | Activity Logs     | ✅        |

---

# MOD-001 — Dashboard

## Purpose

Provide a real-time operational overview of the business.

---

## Responsibilities

- Display today's operational summary.
- Display pending operational tasks.
- Display financial summaries.
- Display alerts requiring user attention.

---

## Dashboard Widgets

Version 1 shall include:

- Today's Trips
- Pending PODs
- Bills Pending Submission
- Outstanding Payments
- Vehicle Document Expiry Alerts
- Monthly Revenue Summary
- Monthly Expense Summary
- Monthly Profit Summary

---

## Module Permissions

| Role        | Access    |
| ----------- | --------- |
| Super Admin | Full      |
| Admin       | Full      |
| User        | View Only |

---

## Related Tables

- trips
- bills
- submissions
- payments
- vehicle_documents

---

# MOD-002 — Trips

## Purpose

Manage the complete lifecycle of transportation trips.

---

## Responsibilities

- Create Trip
- Edit Trip
- View Trip
- Search Trip
- Upload POD
- Manage Trip Timeline
- View Trip History

---

## Supported Trip Types

Customer Type:

- Market
- Company

Vehicle Type:

- Own Fleet
- External Vehicle

---

## Features

- Auto Trip Number Generation
- Automatic Vehicle Detection
- Vehicle Directory Auto Save
- Historical Snapshots
- POD Upload
- Timeline Tracking
- LR Search
- Vehicle Search
- Party Search

---

## Related Tables

- trips
- trip_documents
- trip_document_files
- trip_expenses

---

## Permissions

| Action  | Super Admin | Admin | User |
| ------- | ----------- | ----- | ---- |
| Create  | ✅          | ✅    | ✅   |
| Edit    | ✅          | ✅    | ✅   |
| Delete  | ✅          | ✅    | ❌   |
| Restore | ✅          | ✅    | ❌   |

---

# MOD-003 — Parties

## Purpose

Manage all customer records.

---

## Responsibilities

- Create Party
- Edit Party
- Configure Billing Type
- Configure Payment Type
- Maintain GST Information
- View Party Ledger

---

## Features

- Company Parties
- Market Parties
- Billing Configuration
- Payment Configuration
- Party Search

---

## Related Tables

- parties

---

## Permissions

| Action | Super Admin | Admin | User |
| ------ | ----------- | ----- | ---- |
| Create | ✅          | ✅    | ❌   |
| Edit   | ✅          | ✅    | ❌   |
| Delete | ✅          | ❌    | ❌   |

---

# MOD-004 — Vehicle Directory

## Purpose

Maintain the latest information for externally hired vehicles.

---

## Responsibilities

- Auto-create vehicle records.
- Update owner details.
- Search vehicles.
- View vehicle history.

---

## Features

- Automatic record creation.
- Owner information updates.
- Vehicle number search.
- Owner mobile search.

---

## Related Tables

- vehicle_directory

---

## Permissions

| Action | Super Admin | Admin | User |
| ------ | ----------- | ----- | ---- |
| View   | ✅          | ✅    | ✅   |
| Edit   | ✅          | ✅    | ❌   |

---

# MOD-005 — Own Fleet

## Purpose

Manage company-owned vehicles and statutory documents.

---

## Responsibilities

- Register Own Vehicles
- Upload Vehicle Documents
- Monitor Document Expiry
- View Own Fleet History

---

## Features

- RC Management
- Insurance Management
- Fitness Management
- Permit Management
- PUC Management
- Expiry Reminders

---

## Related Tables

- own_vehicles
- vehicle_documents

---

## Permissions

| Action | Super Admin | Admin | User |
| ------ | ----------- | ----- | ---- |
| View   | ✅          | ✅    | ✅   |
| Edit   | ✅          | ✅    | ❌   |

---

# End of Part 1

Part 2 continues with:

- MOD-006 Billing
- MOD-007 Submissions
- MOD-008 Payments
- MOD-009 Reports
- MOD-010 Users
- MOD-011 Settings
- MOD-012 Activity Logs

---

# MOD-006 — Billing

## Purpose

Generate, manage, and print customer bills.

Supports both:

- Individual Billing
- Consolidated Billing

Billing follows the configuration defined for each Company Party.

---

## Responsibilities

- Generate Individual Bills
- Generate Consolidated Bills
- Preview Bills
- Print Bills
- Export Bills to PDF
- Apply Digital Signature
- Cancel Bills
- View Billing History

---

## Features

- Auto Bill Number Generation
- Financial Year Number Reset
- Company Billing Configuration
- Digital Signature Support
- Company-Specific Print Layouts
- Bill Snapshot Preservation
- Bill Cancellation
- Bill History

---

## Related Tables

- bills
- bill_trips
- trips
- parties
- financial_years
- number_sequences

---

## Module Inputs

Receives completed trips from:

- Trips Module

---

## Module Outputs

Provides generated bills to:

- Submission Module

---

## Permissions

| Action     | Super Admin | Admin | User |
| ---------- | ----------- | ----- | ---- |
| Generate   | ✅          | ✅    | ❌   |
| Cancel     | ✅          | ✅    | ❌   |
| Print      | ✅          | ✅    | ✅   |
| Export PDF | ✅          | ✅    | ✅   |

---

# MOD-007 — Submissions

## Purpose

Manage submission of generated bills to companies.

Every submission represents one business event.

Submission history shall remain permanently available.

---

## Responsibilities

- Create Submission
- Reissue Submission
- Print Submission List
- View Submission History

---

## Features

- Auto Submission Number
- Multiple Bills per Submission
- Submission Reissue
- Submission History
- Financial Year Reset

---

## Related Tables

- submissions
- submission_bills
- bills
- number_sequences

---

## Module Inputs

Receives bills from:

- Billing Module

---

## Module Outputs

Provides submitted bills to:

- Payments Module

---

## Permissions

| Action  | Super Admin | Admin | User |
| ------- | ----------- | ----- | ---- |
| Create  | ✅          | ✅    | ❌   |
| Reissue | ✅          | ✅    | ❌   |
| Print   | ✅          | ✅    | ✅   |

---

# MOD-008 — Payments

## Purpose

Manage all customer payment records.

Supports:

- Standard Payment
- Bulk Payment (FIFO)

---

## Responsibilities

- Record Payment
- Automatic FIFO Allocation
- View Outstanding
- Payment History
- Company Ledger

---

## Features

- Standard Payments
- Bulk Payments
- FIFO Allocation
- Outstanding Calculation
- Payment Reference Tracking
- Company Payment Summary

---

## Related Tables

- payments
- payment_allocations
- parties
- bills

---

## Module Inputs

Receives submitted bills from:

- Submission Module

---

## Module Outputs

Updates:

- Reports & Analytics
- Dashboard

---

## Permissions

| Action         | Super Admin | Admin | User |
| -------------- | ----------- | ----- | ---- |
| Record Payment | ✅          | ✅    | ❌   |
| View History   | ✅          | ✅    | ✅   |

---

# MOD-009 — Reports & Analytics

## Purpose

Provide operational, financial, and analytical reporting.

This module is the primary business intelligence module of SSRL ERP.

---

## Responsibilities

- Generate Reports
- Export Reports
- Business Analytics
- Financial Analytics
- Operational Analytics

---

## Standard Reports

### Trip Reports

- Monthly Trip Register
- Trip Search
- Vehicle-wise Trips
- Party-wise Trips
- Own Fleet Trips
- External Vehicle Trips

---

### Billing Reports

- Individual Bills
- Consolidated Bills
- Bills Pending Submission
- Cancelled Bills

---

### Payment Reports

- Outstanding Summary
- Company Ledger
- Monthly Collections
- Payment History
- FIFO Allocation Summary

---

### Financial Reports

- Vehicle Owner Ledger
- Monthly Financial Summary
- Profit Summary
- Revenue Summary
- Expense Summary

---

### Operational Reports

- Pending POD Report
- Vehicle Document Expiry
- Daily Operations
- Activity Summary

---

## Export Formats

- Excel
- PDF

---

## Related Tables

Reads from all transactional tables.

No business data is modified by this module.

---

# MOD-010 — Users

## Purpose

Manage ERP users and role-based permissions.

---

## Responsibilities

- Create Users
- Edit Users
- Activate Users
- Deactivate Users
- Reset Passwords
- Assign Roles

---

## Supported Roles

- Super Admin
- Admin
- User

---

## Related Tables

- users

---

## Permissions

Only Super Admin may manage users.

---

# MOD-011 — Settings

## Purpose

Maintain configurable ERP settings.

---

## Responsibilities

- Company Information
- Number Prefixes
- Upload Configuration
- Theme Settings
- Digital Signature Settings

---

## Categories

- Company
- Numbering
- Documents
- Appearance
- System

---

## Business Rules

- ImageKit credentials shall never be stored here.
- Environment variables store sensitive configuration.
- Only Super Admin may modify settings.

---

## Related Tables

- settings
- number_sequences

---

# MOD-012 — Activity Logs

## Purpose

Maintain a permanent audit trail of important ERP operations.

---

## Responsibilities

- Record Activity
- Search Activity
- Filter Activity
- Audit Investigation

---

## Logged Events

- Login
- Logout
- Trip Creation
- Trip Update
- Trip Deletion
- Bill Generation
- Bill Cancellation
- Submission Creation
- Payment Recording
- Settings Modification
- User Management

---

## Related Tables

- activity_logs

---

## Business Rules

- Logs are append-only.
- Logs cannot be edited.
- Logs cannot be deleted.

---

# Module Dependency Flow

```text
Dashboard

│

├──────── Reports & Analytics

│

Trips
│
├──────── Vehicle Directory
├──────── Own Fleet
│
▼
Billing
│
▼
Submissions
│
▼
Payments
│
▼
Reports & Analytics

Users

Settings

Activity Logs
```

---

# End of MODULES.md

## Document Status

**Status:** Frozen

This document defines the official functional module architecture of SSRL ERP Version 1.

All APIs, frontend screens, backend services, and permissions shall follow this module structure.
