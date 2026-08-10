# DATABASE.md

```yaml
document:
  id: DOC-009
  title: DATABASE
  version: 1.0
  status: Draft

purpose: Define the complete PostgreSQL database architecture for SSRL ERP.

depends_on:
  - AI_RULES.md
  - GLOSSARY.md
  - PROJECT.md
  - BUSINESS_MODEL.md
  - BUSINESS_WORKFLOWS.md
  - BUSINESS_RULES.md
  - DO_NOT_BREAK.md

used_by:
  - Prisma Schema
  - Backend
  - API
  - Reports
  - Testing

last_updated: 2026-08-05
```

---

# 1. Introduction

This document defines the complete PostgreSQL database architecture for SSRL ERP.

The database has been designed to satisfy the following objectives:

- High Performance
- Historical Data Integrity
- Future Scalability
- Simple Maintenance
- AI-Friendly Development
- Referential Integrity

The database shall be implemented using PostgreSQL and Prisma ORM.

---

# 2. Database Principles

The following principles apply throughout the database.

---

## DBP-001 — Historical Integrity

Historical records shall never change due to future modifications of master data.

Snapshots shall always be preserved.

---

## DBP-002 — Referential Integrity

All relationships shall maintain foreign key integrity.

No orphan records shall exist.

---

## DBP-003 — Performance

Frequently searched fields shall be indexed.

The database shall be capable of supporting:

- 100,000+ Trips
- 10,000+ Bills
- 10,000+ Payments

without noticeable degradation.

---

## DBP-004 — Soft Delete

Only tables approved by business rules shall support soft deletion.

Trips shall remain in Trash for 30 days before permanent deletion.

---

## DBP-005 — Immutable Financial Records

Payments, Bills, and Submissions shall never lose historical information.

---

# 3. Naming Conventions

## Table Names

All table names shall use:

snake_case

Example:

```text
vehicle_directory

trip_expenses

payment_allocations
```

---

## Column Names

All column names shall use snake_case.

Example:

```text
loading_date

driver_mobile

vehicle_owner_name
```

---

## Primary Keys

Every table shall use:

```text
id UUID PRIMARY KEY
```

UUID Version 4 shall be used.

---

## Foreign Keys

Foreign keys shall follow:

```text
party_id

trip_id

payment_id
```

---

## Timestamps

Every transactional table shall contain:

```text
created_at

updated_at
```

Whenever applicable:

```text
created_by

updated_by
```

---

# 4. Financial Year Strategy

SSRL ERP operates using Financial Years.

A Financial Year controls:

- Trip Number Generation
- Bill Number Generation
- Submission Number Generation

Financial Years shall never overlap.

Only one Financial Year may remain Active.

---

## financial_years

### Purpose

Maintain Financial Year definitions.

---

### Columns

| Column       | Type        | Nullable | Notes                         |
| ------------ | ----------- | -------- | ----------------------------- |
| id           | UUID        | No       | Primary Key                   |
| display_name | VARCHAR(20) | No       | Example: 2026-27              |
| start_date   | DATE        | No       | Financial Year Start          |
| end_date     | DATE        | No       | Financial Year End            |
| is_active    | BOOLEAN     | No       | Only one record may be active |
| created_at   | TIMESTAMP   | No       | Creation Time                 |

---

### Relationships

Referenced by:

- trips
- bills
- submissions

---

# 5. Entity Overview

The database contains four categories of tables.

---

## Master Tables

These store relatively stable business information.

- users
- settings
- parties
- vehicle_directory
- own_vehicles
- financial_years

---

## Transaction Tables

These store day-to-day business operations.

- trips
- trip_expenses
- trip_documents
- bills
- bill_trips
- submissions
- submission_bills
- payments
- payment_allocations

---

## Document Tables

These manage uploaded files.

- vehicle_documents
- trip_documents

---

## System Tables

These support ERP operations.

- activity_logs

---

# 6. Entity Relationship Overview

```text
Parties
   │
   ├────────────┐
   │            │
Trips        Bills
   │            │
   │         Bill Trips
   │            │
Trip Expenses  │
Trip Documents │
               │
          Submissions
               │
        Submission Bills
               │
           Payments
               │
    Payment Allocations

Own Vehicles
      │
Vehicle Documents

Vehicle Directory

Users
   │
Activity Logs

Settings

Financial Years
```

---

# 7. Table Specification

---

# users

## Purpose

Stores ERP user accounts.

---

## Columns

| Column        | Type         | Nullable | Description              |
| ------------- | ------------ | -------- | ------------------------ |
| id            | UUID         | No       | Primary Key              |
| full_name     | VARCHAR(120) | No       | User Name                |
| mobile        | VARCHAR(20)  | Yes      | Mobile Number            |
| username      | VARCHAR(80)  | No       | Login Username           |
| password_hash | TEXT         | No       | Hashed Password          |
| role          | ENUM         | No       | SUPER_ADMIN, ADMIN, USER |
| status        | ENUM         | No       | ACTIVE, INACTIVE         |
| created_at    | TIMESTAMP    | No       | Creation Time            |
| updated_at    | TIMESTAMP    | No       | Last Update              |

---

## Indexes

- username (Unique)
- mobile

---

## Relationships

Referenced by:

- activity_logs

---

## Business Rules

- Passwords shall always be hashed.
- Only ACTIVE users may authenticate.

---

# settings

## Purpose

Store configurable ERP settings.

---

## Design

Settings shall use a Key-Value architecture.

This avoids unnecessary schema changes when adding future settings.

---

## Columns

| Column        | Type         | Nullable | Description          |
| ------------- | ------------ | -------- | -------------------- |
| id            | UUID         | No       | Primary Key          |
| setting_key   | VARCHAR(120) | No       | Unique Setting Key   |
| setting_value | TEXT         | Yes      | Setting Value        |
| description   | TEXT         | Yes      | Optional Description |
| updated_by    | UUID         | Yes      | User Reference       |
| updated_at    | TIMESTAMP    | No       | Last Updated         |

---

## Example Keys

```text
company_name

company_mobile

company_address

trip_prefix

bill_prefix

submission_prefix

theme

digital_signature_enabled

allowed_file_types

max_upload_size_mb
```

---

## Business Rules

- ImageKit credentials shall NOT be stored in the database.
- Sensitive server configuration shall remain in environment variables.
- Only Super Admin may modify settings.

---

# End of Part 1

Part 2 continues with:

- parties
- vehicle_directory
- own_vehicles

---

# 8. Master Tables

Master Tables store relatively stable business information.

Unlike transactional tables, master records may be updated over time.

Historical records shall always preserve snapshots and shall never depend on the current values stored in master tables.

---

# parties

## Purpose

Stores all customers (Parties) that provide transportation work.

A Party may represent either:

- Market Customer
- Company Customer

Every trip references one Party.

---

## Columns

| Column         | Type         | Nullable | Description              |
| -------------- | ------------ | -------- | ------------------------ |
| id             | UUID         | No       | Primary Key              |
| party_name     | VARCHAR(200) | No       | Customer Name            |
| party_type     | ENUM         | No       | MARKET, COMPANY          |
| gst_number     | VARCHAR(20)  | Yes      | GST Number               |
| contact_person | VARCHAR(120) | Yes      | Contact Person           |
| mobile         | VARCHAR(20)  | Yes      | Mobile Number            |
| email          | VARCHAR(120) | Yes      | Email Address            |
| address        | TEXT         | Yes      | Office Address           |
| city           | VARCHAR(120) | Yes      | City                     |
| state          | VARCHAR(120) | Yes      | State                    |
| billing_type   | ENUM         | Yes      | INDIVIDUAL, CONSOLIDATED |
| payment_type   | ENUM         | Yes      | STANDARD, BULK           |
| is_active      | BOOLEAN      | No       | Active Status            |
| created_at     | TIMESTAMP    | No       | Creation Time            |
| updated_at     | TIMESTAMP    | No       | Last Update              |

---

## Business Rules

- Every Company Party shall have exactly one Billing Type.
- Every Company Party shall have exactly one Payment Type.
- Market Parties shall not require Billing Configuration.
- One Party shall have only one GST Number.
- Historical trips shall preserve Party snapshots.

---

## Indexes

- party_name
- gst_number (Unique)
- mobile

---

## Relationships

Referenced by:

- trips
- bills
- submissions
- payments

---

# vehicle_directory

## Purpose

Stores the latest known information for externally hired vehicles.

This table is not intended to preserve historical ownership.

Historical information is stored inside Trip Snapshots.

---

## Columns

| Column         | Type         | Nullable | Description                 |
| -------------- | ------------ | -------- | --------------------------- |
| id             | UUID         | No       | Primary Key                 |
| vehicle_number | VARCHAR(30)  | No       | Vehicle Registration Number |
| owner_name     | VARCHAR(150) | No       | Latest Owner Name           |
| owner_mobile   | VARCHAR(20)  | No       | Latest Owner Mobile         |
| is_active      | BOOLEAN      | No       | Active Status               |
| created_at     | TIMESTAMP    | No       | Creation Time               |
| updated_at     | TIMESTAMP    | No       | Last Update                 |

---

## Business Rules

- Unknown vehicles shall be created automatically.
- Vehicle Number shall be unique.
- Owner information may change over time.
- Historical trips shall never be modified.

---

## Indexes

- vehicle_number (Unique)
- owner_mobile
- owner_name

---

## Relationships

Referenced by:

- trips

---

# own_vehicles

## Purpose

Stores vehicles owned by Shri Sanwariya Road Lines.

These vehicles are automatically recognized during trip creation.

---

## Columns

| Column             | Type         | Nullable | Description                 |
| ------------------ | ------------ | -------- | --------------------------- |
| id                 | UUID         | No       | Primary Key                 |
| vehicle_number     | VARCHAR(30)  | No       | Vehicle Registration Number |
| vehicle_type       | VARCHAR(80)  | Yes      | Vehicle Type                |
| brand              | VARCHAR(80)  | Yes      | Manufacturer                |
| model              | VARCHAR(80)  | Yes      | Vehicle Model               |
| manufacturing_year | INTEGER      | Yes      | Manufacturing Year          |
| chassis_number     | VARCHAR(100) | Yes      | Chassis Number              |
| engine_number      | VARCHAR(100) | Yes      | Engine Number               |
| registration_date  | DATE         | Yes      | Registration Date           |
| purchase_date      | DATE         | Yes      | Purchase Date               |
| status             | ENUM         | No       | ACTIVE, INACTIVE, SOLD      |
| created_at         | TIMESTAMP    | No       | Creation Time               |
| updated_at         | TIMESTAMP    | No       | Last Update                 |

---

## Business Rules

- Driver information shall not be stored.
- Own Fleet detection shall be based only on Vehicle Number.
- Vehicle Number shall be unique.
- Only ACTIVE vehicles may be used in new trips.

---

## Indexes

- vehicle_number (Unique)
- status

---

## Relationships

Referenced by:

- trips
- vehicle_documents

---

# settings

## Updated Design

Settings shall be organized into categories.

---

## Additional Column

| Column   | Type        | Nullable | Description                                       |
| -------- | ----------- | -------- | ------------------------------------------------- |
| category | VARCHAR(50) | No       | COMPANY, NUMBERING, DOCUMENTS, APPEARANCE, SYSTEM |

---

## Example Structure

| Category   | Setting Key               |
| ---------- | ------------------------- |
| COMPANY    | company_name              |
| COMPANY    | company_mobile            |
| COMPANY    | company_address           |
| NUMBERING  | bill_prefix               |
| NUMBERING  | submission_prefix         |
| NUMBERING  | trip_prefix               |
| DOCUMENTS  | allowed_file_types        |
| DOCUMENTS  | max_upload_size_mb        |
| APPEARANCE | theme                     |
| SYSTEM     | digital_signature_enabled |

---

## Business Rules

- Categories are used only for organization.
- Setting Keys remain globally unique.
- ImageKit credentials shall never be stored in the database.
- Environment variables shall store sensitive configuration.

---

# Relationships Summary

```text
Parties
   │
   └──────── Trips

Vehicle Directory
   │
   └──────── Trips

Own Vehicles
   │
   ├──────── Trips
   └──────── Vehicle Documents

Settings

Users
```

---

# End of Part 2

Part 3 continues with:

- trips
- trip_expenses
- trip_documents

These tables form the operational core of SSRL ERP.

# trips

## Purpose

Stores every transportation trip executed by Shri Sanwariya Road Lines.

This is the primary transactional table of the ERP.

It supports:

- Market Trips
- Company Trips
- Own Fleet Trips
- External Vehicle Trips

Historical information is preserved using snapshot fields.

---

## Primary Key

| Column | Type | Nullable | Description |
| ------ | ---- | -------- | ----------- |
| id     | UUID | No       | Primary Key |

---

## Human Identifier

| Column            | Type        | Nullable | Description                |
| ----------------- | ----------- | -------- | -------------------------- |
| trip_number       | VARCHAR(30) | No       | Auto Generated Trip Number |
| financial_year_id | UUID        | No       | Financial Year Reference   |

---

## Trip Classification

| Column        | Type | Nullable | Description         |
| ------------- | ---- | -------- | ------------------- |
| customer_type | ENUM | No       | MARKET, COMPANY     |
| vehicle_type  | ENUM | No       | OWN_FLEET, EXTERNAL |
| status        | ENUM | No       | Current Trip Status |

---

## Timeline

| Column                 | Type | Nullable | Description             |
| ---------------------- | ---- | -------- | ----------------------- |
| loading_date           | DATE | No       | Loading Date            |
| unloading_date         | DATE | Yes      | Delivery Date           |
| pod_received_date      | DATE | Yes      | POD Received Date       |
| bill_generated_date    | DATE | Yes      | Bill Generation Date    |
| submission_date        | DATE | Yes      | Submission Date         |
| payment_completed_date | DATE | Yes      | Payment Completion Date |

---

## Party Reference

| Column   | Type | Nullable | Description     |
| -------- | ---- | -------- | --------------- |
| party_id | UUID | No       | Party Reference |

---

## Party Snapshot

| Column              | Type         | Nullable | Description             |
| ------------------- | ------------ | -------- | ----------------------- |
| party_name_snapshot | VARCHAR(200) | No       | Party Name at Trip Time |
| gst_number_snapshot | VARCHAR(20)  | Yes      | GST Number at Trip Time |

---

## Route Information

| Column    | Type         | Nullable | Description      |
| --------- | ------------ | -------- | ---------------- |
| from_city | VARCHAR(120) | No       | Loading City     |
| to_city   | VARCHAR(120) | No       | Destination City |

---

## Vehicle Information

| Column         | Type        | Nullable | Description          |
| -------------- | ----------- | -------- | -------------------- |
| vehicle_number | VARCHAR(30) | No       | Vehicle Number       |
| driver_mobile  | VARCHAR(20) | No       | Driver Mobile Number |

---

## External Vehicle Snapshot

Applicable only when Vehicle Type = EXTERNAL.

| Column                        | Type         | Nullable | Description  |
| ----------------------------- | ------------ | -------- | ------------ |
| vehicle_owner_name_snapshot   | VARCHAR(150) | Yes      | Owner Name   |
| vehicle_owner_mobile_snapshot | VARCHAR(20)  | Yes      | Owner Mobile |

---

## Commercial Information

| Column       | Type          | Nullable | Description        |
| ------------ | ------------- | -------- | ------------------ |
| weight       | DECIMAL(10,2) | Yes      | Weight             |
| freight_rate | DECIMAL(12,2) | No       | Customer Freight   |
| vehicle_rate | DECIMAL(12,2) | Yes      | Vehicle Owner Rate |
| lr_number    | VARCHAR(80)   | Yes      | LR Number          |

---

## Customer Payment

| Column           | Type          | Nullable | Description      |
| ---------------- | ------------- | -------- | ---------------- |
| customer_advance | DECIMAL(12,2) | No       | Advance Received |
| customer_balance | DECIMAL(12,2) | No       | Remaining Amount |

---

## Vehicle Owner Payment

Applicable only for External Vehicles.

| Column        | Type          | Nullable | Description     |
| ------------- | ------------- | -------- | --------------- |
| owner_advance | DECIMAL(12,2) | Yes      | Vehicle Advance |
| owner_balance | DECIMAL(12,2) | Yes      | Vehicle Balance |

---

## Other Charges

| Column    | Type          | Nullable | Description       |
| --------- | ------------- | -------- | ----------------- |
| detention | DECIMAL(12,2) | Yes      | Detention Charges |
| deduction | DECIMAL(12,2) | Yes      | Deduction         |

---

## Financial Summary

These values are maintained automatically by the ERP.

| Column  | Type          | Nullable | Description               |
| ------- | ------------- | -------- | ------------------------- |
| revenue | DECIMAL(12,2) | No       | Customer Freight          |
| expense | DECIMAL(12,2) | No       | Total Operational Expense |
| profit  | DECIMAL(12,2) | No       | Calculated Profit         |

---

## Billing Reference

| Column  | Type | Nullable | Description            |
| ------- | ---- | -------- | ---------------------- |
| bill_id | UUID | Yes      | Current Bill Reference |

---

## Snapshot Information

| Column           | Type    | Nullable | Description             |
| ---------------- | ------- | -------- | ----------------------- |
| snapshot_version | INTEGER | No       | Snapshot Schema Version |

Default Value

```text
1
```

---

## Remarks

| Column  | Type | Nullable | Description      |
| ------- | ---- | -------- | ---------------- |
| remarks | TEXT | Yes      | Internal Remarks |

---

## Audit Information

| Column     | Type      | Nullable | Description      |
| ---------- | --------- | -------- | ---------------- |
| created_by | UUID      | No       | User Reference   |
| updated_by | UUID      | Yes      | User Reference   |
| created_at | TIMESTAMP | No       | Creation Time    |
| updated_at | TIMESTAMP | No       | Last Update      |
| deleted_at | TIMESTAMP | Yes      | Soft Delete Time |

---

## Relationships

Belongs To

- Parties
- Financial Years

Has Many

- Trip Expenses
- Trip Documents
- Activity Logs

Belongs To (Optional)

- Bills

---

## Status Lifecycle

```text
CREATED

↓

IN_PROGRESS

↓

DELIVERED

↓

POD_RECEIVED

↓

BILLED

↓

SUBMITTED

↓

PAYMENT_PENDING

↓

PAID

↓

CLOSED
```

---

## Notes

- Historical snapshot fields shall never be modified.
- Driver information belongs only to the trip.
- Own Fleet detection is automatic.
- Unknown vehicle numbers are automatically stored in Vehicle Directory.
- Timeline fields are updated automatically according to business workflows.
- Revenue, Expense and Profit are maintained automatically by the ERP.

---

# trips (Part 3A-2)

## Index Strategy

The following indexes shall be created to ensure fast searching and reporting.

### Primary Index

| Columns | Type        |
| ------- | ----------- |
| id      | Primary Key |

---

### Unique Indexes

| Columns     | Purpose            |
| ----------- | ------------------ |
| trip_number | Unique Trip Number |

---

### Foreign Key Indexes

| Columns           | Purpose               |
| ----------------- | --------------------- |
| financial_year_id | Financial Year Lookup |
| party_id          | Party Lookup          |
| created_by        | User Lookup           |
| updated_by        | User Lookup           |

---

### Operational Indexes

| Columns           | Purpose                     |
| ----------------- | --------------------------- |
| loading_date      | Daily Trip List             |
| unloading_date    | Delivery Reports            |
| pod_received_date | POD Reports                 |
| status            | Dashboard & Filters         |
| customer_type     | Market / Company Filter     |
| vehicle_type      | Own Fleet / External Filter |
| vehicle_number    | Vehicle Search              |
| driver_mobile     | Driver Search               |
| lr_number         | LR Search                   |
| from_city         | Route Reports               |
| to_city           | Route Reports               |

---

### Composite Indexes

| Columns                          | Purpose          |
| -------------------------------- | ---------------- |
| (party_id, loading_date)         | Party Ledger     |
| (status, loading_date)           | Daily Operations |
| (vehicle_number, loading_date)   | Vehicle History  |
| (customer_type, status)          | Dashboard        |
| (financial_year_id, trip_number) | Number Lookup    |

---

# Relationships

## Belongs To

- financial_years
- parties
- users (created_by)
- users (updated_by)

---

## Has Many

- trip_expenses
- trip_documents
- activity_logs
- bill_trips

---

# Derived Values

The following values shall **never** be manually entered.

They shall always be calculated by the ERP.

| Field            | Formula                         |
| ---------------- | ------------------------------- |
| expense          | Sum of all Trip Expenses        |
| revenue          | Freight Rate                    |
| profit           | Revenue − Expense               |
| customer_balance | Freight Rate − Customer Advance |
| owner_balance    | Vehicle Rate − Owner Advance    |

---

# Status Lifecycle

Every trip shall follow the approved lifecycle.

```text
CREATED
    ↓
IN_PROGRESS
    ↓
DELIVERED
    ↓
POD_RECEIVED
    ↓
BILLED
    ↓
SUBMITTED
    ↓
PAYMENT_PENDING
    ↓
PAID
    ↓
CLOSED
```

Status changes shall occur only through approved business workflows.

Manual status manipulation is prohibited.

---

# Business Rules

## DBR-001

Trip Number shall be generated automatically.

---

## DBR-002

Trip Number shall reset every Financial Year.

---

## DBR-003

Every trip belongs to exactly one Party.

---

## DBR-004

Every trip belongs to exactly one Financial Year.

---

## DBR-005

A trip shall be classified as either:

- Market
- Company

Never both.

---

## DBR-006

Vehicle Type shall always be determined automatically.

Allowed values:

- OWN_FLEET
- EXTERNAL

Users shall not manually select the vehicle type.

---

## DBR-007

Historical snapshot fields shall never be modified after trip creation.

---

## DBR-008

Driver information belongs only to the trip.

Driver information shall not be stored in master tables.

---

## DBR-009

Revenue, Expense and Profit shall always be maintained by the ERP.

Users shall never edit these values directly.

---

## DBR-010

Timeline fields shall only move forward.

For example:

- bill_generated_date cannot exist before pod_received_date.
- submission_date cannot exist before bill_generated_date.
- payment_completed_date cannot exist before submission_date.

---

## DBR-011

Soft deletion shall move the trip to Trash.

Permanent deletion shall occur automatically after 30 days.

---

## DBR-012

Trips participating in billing shall preserve all historical snapshot data permanently.

---

# Performance Notes

The Trips table is expected to become the largest table in the ERP.

The implementation shall therefore:

- Use pagination for listings.
- Avoid `SELECT *` in production queries.
- Load related entities only when required.
- Use indexed filtering for reports.
- Prefer server-side filtering and sorting.
- Optimize queries for financial-year-based searches.

---

# Migration Notes

Future schema changes shall never invalidate historical trips.

If snapshot structure changes in future versions:

- Increment `snapshot_version`.
- Preserve compatibility with previous versions.
- Do not rewrite historical snapshot data.

---

# Design Decisions

- UUID is the internal identifier.
- Trip Number is the business identifier.
- Snapshot fields preserve historical values.
- Timeline fields preserve operational milestones.
- Revenue, Expense and Profit are system-maintained.
- Historical integrity has priority over storage optimization.
- Business workflows take precedence over database convenience.

---

# End of Trips Table

The `trips` table is the central transactional entity of SSRL ERP.

The next section of `DATABASE.md` continues with:

- `trip_expenses`
- `trip_documents`

These tables extend the trip entity while maintaining historical integrity and financial accuracy.

---

# trip_expenses

## Purpose

Stores all operational expenses incurred during Own Fleet trips.

External Vehicle trips shall not create Trip Expense records.

A trip may contain any number of expense entries.

---

## Primary Key

| Column | Type | Nullable | Description |
| ------ | ---- | -------- | ----------- |
| id     | UUID | No       | Primary Key |

---

## Relationships

| Column  | Type | Nullable | Description        |
| ------- | ---- | -------- | ------------------ |
| trip_id | UUID | No       | Reference to Trips |

---

## Expense Information

| Column       | Type          | Nullable | Description                                    |
| ------------ | ------------- | -------- | ---------------------------------------------- |
| expense_type | ENUM          | No       | FUEL, DRIVER_BATTA, FASTAG, MAINTENANCE, OTHER |
| amount       | DECIMAL(12,2) | No       | Expense Amount                                 |
| expense_date | DATE          | No       | Expense Date                                   |
| remarks      | TEXT          | Yes      | Optional Remarks                               |

---

## Audit Information

| Column     | Type      | Nullable | Description    |
| ---------- | --------- | -------- | -------------- |
| created_by | UUID      | No       | User Reference |
| created_at | TIMESTAMP | No       | Creation Time  |

---

## Relationships

Belongs To

- trips

---

## Indexes

- trip_id
- expense_type
- expense_date

---

## Business Rules

### DBR-013

Trip Expenses are allowed only for Own Fleet trips.

---

### DBR-014

Unlimited expense entries are permitted.

Example:

Fuel

- ₹4,000
- ₹3,000
- ₹5,000

Driver Batta

- ₹500
- ₹500

---

### DBR-015

Expense totals shall always be calculated dynamically.

The ERP shall never store:

- Total Fuel
- Total Expense
- Profit

---

### DBR-016

Expense records are immutable financial records.

They shall never be deleted.

---

# trip_documents

## Purpose

Stores uploaded documents associated with individual trips.

Actual files are stored in ImageKit.

The ERP stores only document metadata.

---

## Primary Key

| Column | Type | Nullable | Description |
| ------ | ---- | -------- | ----------- |
| id     | UUID | No       | Primary Key |

---

## Relationships

| Column  | Type | Nullable | Description    |
| ------- | ---- | -------- | -------------- |
| trip_id | UUID | No       | Trip Reference |

---

## Document Information

| Column           | Type         | Nullable | Description        |
| ---------------- | ------------ | -------- | ------------------ |
| document_type    | ENUM         | No       | POD                |
| file_name        | VARCHAR(255) | No       | Original File Name |
| imagekit_file_id | VARCHAR(255) | No       | ImageKit File ID   |
| imagekit_url     | TEXT         | No       | ImageKit URL       |
| file_size        | BIGINT       | Yes      | File Size (Bytes)  |
| mime_type        | VARCHAR(100) | Yes      | MIME Type          |

---

## Upload Information

| Column      | Type      | Nullable | Description    |
| ----------- | --------- | -------- | -------------- |
| uploaded_by | UUID      | No       | User Reference |
| uploaded_at | TIMESTAMP | No       | Upload Time    |

---

## Relationships

Belongs To

- trips

---

## Indexes

- trip_id
- document_type

---

## Business Rules

### DBR-017

Version 1 supports only the following Trip Document type:

- POD

---

### DBR-018

Actual files shall never be stored in PostgreSQL.

Only metadata shall be stored.

---

### DBR-019

ImageKit is the single source of truth for file storage.

---

### DBR-020

Uploading a POD shall automatically update the trip status to:

POD_RECEIVED

---

### DBR-021

Deleting a document shall not permanently remove it from ImageKit unless explicitly requested by the application.

---

# End of Part 3

The Trip entity is now fully specified.

Completed Tables:

- trips
- trip_expenses
- trip_documents

The next part of DATABASE.md covers:

- bills
- bill_trips
- submissions
- submission_bills

These tables implement the complete billing and submission architecture of SSRL ERP.

---

# trip_documents

## Purpose

Stores document containers associated with a trip.

A document represents a logical collection of one or more uploaded files.

Example:

Trip

↓

POD

↓

5 Images

The actual uploaded files are stored in the `trip_document_files` table.

---

## Primary Key

| Column | Type | Nullable | Description |
| ------ | ---- | -------- | ----------- |
| id     | UUID | No       | Primary Key |

---

## Relationships

| Column  | Type | Nullable | Description    |
| ------- | ---- | -------- | -------------- |
| trip_id | UUID | No       | Trip Reference |

---

## Document Information

| Column        | Type      | Nullable | Description      |
| ------------- | --------- | -------- | ---------------- |
| document_type | ENUM      | No       | POD              |
| remarks       | TEXT      | Yes      | Optional Remarks |
| uploaded_by   | UUID      | No       | User Reference   |
| created_at    | TIMESTAMP | No       | Creation Time    |

---

## Relationships

Belongs To

- trips

Has Many

- trip_document_files

---

## Indexes

- trip_id
- document_type

---

## Business Rules

### DBR-017

Version 1 supports only one Trip Document type:

- POD

---

### DBR-018

One document may contain multiple uploaded files.

---

### DBR-019

Deleting a document shall remove all associated file references.

Actual ImageKit deletion shall be handled by the backend.

---

### DBR-020

Uploading the first successful POD document shall automatically update the Trip Status to:

POD_RECEIVED

---

# trip_document_files

## Purpose

Stores every uploaded file belonging to a Trip Document.

One document may contain unlimited files.

Example:

POD

├── Image 1

├── Image 2

├── Image 3

└── Image 4

---

## Primary Key

| Column | Type | Nullable | Description |
| ------ | ---- | -------- | ----------- |
| id     | UUID | No       | Primary Key |

---

## Relationships

| Column      | Type | Nullable | Description             |
| ----------- | ---- | -------- | ----------------------- |
| document_id | UUID | No       | Trip Document Reference |

---

## File Information

| Column             | Type         | Nullable | Description        |
| ------------------ | ------------ | -------- | ------------------ |
| original_file_name | VARCHAR(255) | No       | Original File Name |
| imagekit_file_id   | VARCHAR(255) | No       | ImageKit File ID   |
| imagekit_url       | TEXT         | No       | Image URL          |
| thumbnail_url      | TEXT         | Yes      | Thumbnail URL      |
| mime_type          | VARCHAR(100) | Yes      | MIME Type          |
| file_size          | BIGINT       | Yes      | File Size (Bytes)  |
| display_order      | INTEGER      | No       | Display Sequence   |

---

## Upload Information

| Column      | Type      | Nullable | Description    |
| ----------- | --------- | -------- | -------------- |
| uploaded_by | UUID      | No       | User Reference |
| uploaded_at | TIMESTAMP | No       | Upload Time    |

---

## Relationships

Belongs To

- trip_documents

---

## Indexes

- document_id
- display_order

---

## Business Rules

### DBR-021

One Trip Document may contain unlimited uploaded files.

---

### DBR-022

Display order shall determine image sequence inside the ERP.

---

### DBR-023

Actual files shall never be stored inside PostgreSQL.

Only ImageKit metadata shall be stored.

---

### DBR-024

Every uploaded file belongs to exactly one Trip Document.

---

### DBR-025

Files may include:

- JPG
- JPEG
- PNG
- PDF

Allowed formats shall be controlled through ERP Settings.

---

# bills

## Purpose

Stores generated customer bills.

A bill may represent:

- One Trip (Individual Billing)

or

- Multiple Trips (Consolidated Billing)

Trips are linked through the `bill_trips` junction table.

---

## Primary Key

| Column | Type | Nullable | Description |
| ------ | ---- | -------- | ----------- |
| id     | UUID | No       | Primary Key |

---

## Human Identifier

| Column            | Type        | Nullable | Description          |
| ----------------- | ----------- | -------- | -------------------- |
| bill_number       | VARCHAR(10) | No       | Business Bill Number |
| financial_year_id | UUID        | No       | Financial Year       |

---

## Bill Information

| Column            | Type          | Nullable | Description                     |
| ----------------- | ------------- | -------- | ------------------------------- |
| party_id          | UUID          | No       | Company Reference               |
| bill_type         | ENUM          | No       | INDIVIDUAL, CONSOLIDATED        |
| bill_date         | DATE          | No       | Bill Date                       |
| digital_signature | BOOLEAN       | No       | Apply Digital Signature         |
| total_amount      | DECIMAL(12,2) | No       | Calculated Bill Amount          |
| status            | ENUM          | No       | GENERATED, SUBMITTED, CANCELLED |

---

## Snapshot Information

| Column                   | Type         | Nullable | Description                       |
| ------------------------ | ------------ | -------- | --------------------------------- |
| party_name_snapshot      | VARCHAR(200) | No       | Party Name at Billing Time        |
| gst_number_snapshot      | VARCHAR(20)  | Yes      | GST Number at Billing Time        |
| billing_address_snapshot | TEXT         | Yes      | Billing Address at Billing Time   |

---

## Audit Information

| Column     | Type      | Nullable | Description    |
| ---------- | --------- | -------- | -------------- |
| created_by | UUID      | No       | User Reference |
| created_at | TIMESTAMP | No       | Creation Time  |

---

## Relationships

Belongs To

- parties
- financial_years

Has Many

- bill_trips
- submission_bills

---

## Business Rules

### DBR-026

Bill Numbers shall:

- Use the configured two-letter prefix.
- Contain a maximum of six characters including the prefix.
- Reset every Financial Year.

---

### DBR-027

Bills shall never directly store Trip IDs.

Relationships shall always use the `bill_trips` junction table.

---

### DBR-028

Bill layouts shall remain identical to the approved company formats.

Only data shall change.

---

# End of Part 4

Part 5 continues with:

- bill_trips
- submissions
- submission_bills
- payments
- payment_allocations
- vehicle_documents
- activity_logs
- database constraints
- indexing strategy
- migration strategy

---

# bill_trips

## Purpose

Maintains the relationship between Bills and Trips.

Supports both:

- Individual Billing
- Consolidated Billing

This table is also a permanent historical record of which trips were included in each bill.

Relationships shall never be deleted, even if a bill is cancelled.

---

## Primary Key

| Column | Type | Nullable | Description |
| ------ | ---- | -------- | ----------- |
| id     | UUID | No       | Primary Key |

---

## Relationships

| Column  | Type | Nullable | Description    |
| ------- | ---- | -------- | -------------- |
| bill_id | UUID | No       | Bill Reference |
| trip_id | UUID | No       | Trip Reference |

---

## Audit Information

| Column    | Type      | Nullable | Description                 |
| --------- | --------- | -------- | --------------------------- |
| linked_by | UUID      | No       | User who generated the bill |
| linked_at | TIMESTAMP | No       | Relationship Creation Time  |

---

## Relationships

Belongs To

- bills
- trips

---

## Indexes

- bill_id
- trip_id
- (bill_id, trip_id) UNIQUE

---

## Business Rules

### DBR-029

One Bill may contain multiple Trips.

---

### DBR-030

One Trip may belong to only one active Bill.

Historical Bill relationships shall remain preserved.

---

### DBR-031

Relationships shall never be deleted.

Cancelled Bills shall preserve historical mappings.

---

# submissions

## Purpose

Stores every submission made to a company.

A Submission represents one delivery event of one or more bills.

Multiple submissions may reference the same bill over time.

---

## Primary Key

| Column | Type | Nullable | Description |
| ------ | ---- | -------- | ----------- |
| id     | UUID | No       | Primary Key |

---

## Human Identifier

| Column            | Type        | Nullable | Description                |
| ----------------- | ----------- | -------- | -------------------------- |
| submission_number | VARCHAR(30) | No       | Business Submission Number |
| financial_year_id | UUID        | No       | Financial Year Reference   |

---

## Submission Information

| Column          | Type | Nullable | Description       |
| --------------- | ---- | -------- | ----------------- |
| party_id        | UUID | No       | Company Reference |
| submission_date | DATE | No       | Submission Date   |
| remarks         | TEXT | Yes      | Optional Remarks  |

---

## Audit Information

| Column     | Type      | Nullable | Description    |
| ---------- | --------- | -------- | -------------- |
| created_by | UUID      | No       | User Reference |
| created_at | TIMESTAMP | No       | Creation Time  |

---

## Relationships

Belongs To

- parties
- financial_years

Has Many

- submission_bills

---

## Indexes

- submission_number UNIQUE
- party_id
- submission_date

---

## Business Rules

### DBR-032

Submission Numbers shall reset every Financial Year.

---

### DBR-033

One Submission belongs to exactly one Company.

---

### DBR-034

One Submission may contain multiple Bills.

---

### DBR-035

Historical submissions shall never be modified.

---

# submission_bills

## Purpose

Stores the relationship between Submissions and Bills.

Supports multiple submissions for the same bill.

---

## Primary Key

| Column | Type | Nullable | Description |
| ------ | ---- | -------- | ----------- |
| id     | UUID | No       | Primary Key |

---

## Relationships

| Column        | Type | Nullable | Description          |
| ------------- | ---- | -------- | -------------------- |
| submission_id | UUID | No       | Submission Reference |
| bill_id       | UUID | No       | Bill Reference       |

---

## Submission Details

| Column            | Type      | Nullable | Description      |
| ----------------- | --------- | -------- | ---------------- |
| submission_reason | ENUM      | No       | INITIAL, REISSUE |
| linked_at         | TIMESTAMP | No       | Link Time        |

---

## Relationships

Belongs To

- submissions
- bills

---

## Indexes

- submission_id
- bill_id

---

## Business Rules

### DBR-036

One Bill may appear in multiple Submissions.

---

### DBR-037

Every re-submission shall create a new Submission.

---

### DBR-038

Submission history shall remain permanent.

---

# payments

## Purpose

Stores every payment received from companies.

Supports both:

- Standard Payment
- Bulk Payment

Payments are immutable financial records.

---

## Primary Key

| Column | Type | Nullable | Description |
| ------ | ---- | -------- | ----------- |
| id     | UUID | No       | Primary Key |

---

## Human Identifier

| Column         | Type        | Nullable | Description                   |
| -------------- | ----------- | -------- | ----------------------------- |
| payment_number | VARCHAR(30) | No       | Auto Generated Payment Number |

---

## Relationships

| Column   | Type | Nullable | Description       |
| -------- | ---- | -------- | ----------------- |
| party_id | UUID | No       | Company Reference |

---

## Payment Information

| Column           | Type          | Nullable | Description           |
| ---------------- | ------------- | -------- | --------------------- |
| payment_type     | ENUM          | No       | STANDARD, BULK        |
| amount           | DECIMAL(12,2) | No       | Received Amount       |
| payment_date     | DATE          | No       | Payment Date          |
| reference_number | VARCHAR(100)  | No       | Transaction Reference |
| remarks          | TEXT          | Yes      | Optional Remarks      |

---

## Audit Information

| Column     | Type      | Nullable | Description    |
| ---------- | --------- | -------- | -------------- |
| created_by | UUID      | No       | User Reference |
| created_at | TIMESTAMP | No       | Creation Time  |

---

## Relationships

Belongs To

- parties

Has Many

- payment_allocations

---

## Indexes

- payment_number UNIQUE
- payment_date
- reference_number
- party_id

---

## Business Rules

### DBR-039

Payments shall never be edited.

---

### DBR-040

Payments shall never be deleted.

---

### DBR-041

Payment Numbers shall be generated automatically.

---

### DBR-042

Reference Number is mandatory.

---

# payment_allocations

## Purpose

Stores automatic allocation of payments.

Supports:

- Standard Payments
- FIFO Bulk Payments

---

## Primary Key

| Column | Type | Nullable | Description |
| ------ | ---- | -------- | ----------- |
| id     | UUID | No       | Primary Key |

---

## Relationships

| Column            | Type | Nullable | Description                  |
| ----------------- | ---- | -------- | ---------------------------- |
| payment_id        | UUID | No       | Payment Reference            |
| bill_id           | UUID | Yes      | Bill Reference               |
| financial_year_id | UUID | No       | Financial Year               |
| allocation_month  | DATE | Yes      | Applicable for Bulk Payments |

---

## Allocation Information

| Column           | Type          | Nullable | Description      |
| ---------------- | ------------- | -------- | ---------------- |
| allocated_amount | DECIMAL(12,2) | No       | Allocated Amount |
| allocation_order | INTEGER       | No       | FIFO Sequence    |

---

## Relationships

Belongs To

- payments
- bills

---

## Business Rules

### DBR-043

Standard Payments allocate against Bills.

---

### DBR-044

Bulk Payments allocate month-wise.

---

### DBR-045

FIFO allocation is mandatory.

---

### DBR-046

Allocation records are generated automatically.

Users shall never edit allocation records.

---

# End of Part 5A

Completed Tables

- bill_trips
- submissions
- submission_bills
- payments
- payment_allocations

Part 5B completes the database with:

- vehicle_documents
- activity_logs
- Foreign Key Constraints
- Cascade Rules
- Index Strategy
- PostgreSQL Optimization
- Migration Strategy
- Final Database Freeze

---

# vehicle_documents

## Purpose

Stores statutory documents for Own Fleet vehicles.

Actual files are stored in ImageKit.

The ERP stores only document metadata.

Supported documents:

- RC
- Insurance
- Fitness
- Permit
- PUC

---

## Primary Key

| Column | Type | Nullable | Description |
| ------ | ---- | -------- | ----------- |
| id     | UUID | No       | Primary Key |

---

## Relationships

| Column         | Type | Nullable | Description           |
| -------------- | ---- | -------- | --------------------- |
| own_vehicle_id | UUID | No       | Own Vehicle Reference |

---

## Document Information

| Column          | Type         | Nullable | Description                         |
| --------------- | ------------ | -------- | ----------------------------------- |
| document_type   | ENUM         | No       | RC, INSURANCE, FITNESS, PERMIT, PUC |
| document_number | VARCHAR(120) | Yes      | Document Number                     |
| issue_date      | DATE         | Yes      | Issue Date                          |
| expiry_date     | DATE         | Yes      | Expiry Date                         |
| remarks         | TEXT         | Yes      | Optional Remarks                    |

---

## ImageKit Information

| Column           | Type         | Nullable | Description        |
| ---------------- | ------------ | -------- | ------------------ |
| imagekit_file_id | VARCHAR(255) | No       | ImageKit File ID   |
| imagekit_url     | TEXT         | No       | ImageKit URL       |
| file_name        | VARCHAR(255) | No       | Original File Name |
| mime_type        | VARCHAR(100) | Yes      | MIME Type          |
| file_size        | BIGINT       | Yes      | File Size          |

---

## Audit Information

| Column      | Type      | Nullable | Description    |
| ----------- | --------- | -------- | -------------- |
| uploaded_by | UUID      | No       | User Reference |
| uploaded_at | TIMESTAMP | No       | Upload Time    |

---

## Relationships

Belongs To

- own_vehicles

---

## Indexes

- own_vehicle_id
- document_type
- expiry_date

---

## Business Rules

### DBR-047

Only Own Fleet vehicles may have Vehicle Documents.

---

### DBR-048

Expiry reminders shall be generated before document expiry.

---

### DBR-049

Actual files shall remain in ImageKit.

Only metadata shall be stored inside PostgreSQL.

---

# activity_logs

## Purpose

Maintains a permanent audit trail of important ERP activities.

Activity Logs are append-only records.

---

## Primary Key

| Column | Type | Nullable | Description |
| ------ | ---- | -------- | ----------- |
| id     | UUID | No       | Primary Key |

---

## Activity Information

| Column      | Type        | Nullable | Description                |
| ----------- | ----------- | -------- | -------------------------- |
| user_id     | UUID        | Yes      | User Performing Action     |
| source      | ENUM        | No       | UI, API, SYSTEM, MIGRATION |
| module      | VARCHAR(80) | No       | Module Name                |
| entity_type | VARCHAR(80) | No       | Entity Type                |
| entity_id   | UUID        | Yes      | Related Entity             |
| action      | VARCHAR(80) | No       | Action Name                |
| description | TEXT        | Yes      | Human Readable Description |

---

## Timeline

| Column     | Type      | Nullable | Description   |
| ---------- | --------- | -------- | ------------- |
| created_at | TIMESTAMP | No       | Activity Time |

---

## Relationships

Belongs To

- users

---

## Indexes

- user_id
- module
- entity_type
- entity_id
- created_at

---

## Business Rules

### DBR-050

Activity Logs shall never be edited.

---

### DBR-051

Activity Logs shall never be deleted.

---

### DBR-052

Every important business action shall generate an Activity Log.

---

# number_sequences

## Purpose

Provides centralized numbering for all ERP business documents.

---

## Primary Key

| Column | Type | Nullable | Description |
| ------ | ---- | -------- | ----------- |
| id     | UUID | No       | Primary Key |

---

## Sequence Information

| Column            | Type        | Nullable | Description                     |
| ----------------- | ----------- | -------- | ------------------------------- |
| financial_year_id | UUID        | No       | Financial Year                  |
| sequence_key      | ENUM        | No       | TRIP, BILL, SUBMISSION, PAYMENT |
| prefix            | VARCHAR(10) | No       | Configured Prefix               |
| last_number       | INTEGER     | No       | Last Generated Number           |

---

## Relationships

Belongs To

- financial_years

---

## Indexes

- (financial_year_id, sequence_key) UNIQUE

---

## Business Rules

### DBR-053

Number generation shall always use this table.

---

### DBR-054

Sequence numbers shall increment atomically.

---

### DBR-055

Number sequences shall reset automatically when a new Financial Year becomes active.

---

# Foreign Key Strategy

The ERP shall enforce referential integrity using PostgreSQL foreign keys.

Relationships shall use:

- RESTRICT where historical integrity must be preserved.
- CASCADE only for dependent metadata that has no standalone business value.

Financial and operational records shall never be cascade deleted.

---

# Soft Delete Strategy

Soft Delete applies to:

- Trips

Hard Delete applies only after the approved retention period.

Financial records shall never be soft deleted or hard deleted.

---

# Index Strategy

Indexes shall be created for:

- Frequently searched fields.
- Foreign keys.
- Financial Year references.
- Human-readable business numbers.
- Dashboard filters.
- Report generation.

Indexes shall be reviewed periodically as the database grows.

---

# PostgreSQL Optimization

The implementation shall:

- Use UUID primary keys.
- Use transactions for financial operations.
- Use row-level locking where required for sequence generation.
- Avoid N+1 queries.
- Use pagination for list endpoints.
- Create composite indexes for common filters.
- Prefer server-side aggregation for reports.

---

# Migration Strategy

Database migrations shall:

- Preserve historical data.
- Never rewrite immutable financial records.
- Increment snapshot versions when snapshot structure changes.
- Be reversible whenever practical.

---

# Database Freeze

The database architecture defined in this document is the approved Version 1 schema for SSRL ERP.

Future changes shall:

- Preserve historical integrity.
- Preserve business workflows.
- Preserve financial accuracy.

No database change shall be made solely for implementation convenience if it violates approved business documentation.

---

# Related Documents

- PROJECT.md
- BUSINESS_MODEL.md
- BUSINESS_WORKFLOWS.md
- BUSINESS_RULES.md
- DO_NOT_BREAK.md
- API.md
- MODULES.md

---

# Document Status

**Status:** Frozen

This document defines the official PostgreSQL database architecture for SSRL ERP Version 1.

All Prisma models, migrations, backend services, APIs, reports, and business logic shall conform to this specification.
