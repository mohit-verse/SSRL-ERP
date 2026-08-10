# API.md

```yaml
document:
  id: DOC-011
  title: API
  version: 1.0
  status: Frozen

purpose: Define all backend REST APIs for SSRL ERP.

depends_on:
  - DATABASE.md
  - MODULES.md
  - BUSINESS_RULES.md
  - BUSINESS_WORKFLOWS.md

used_by:
  - Backend
  - Frontend
  - Testing
  - API Documentation

last_updated: 2026-08-05
```

---

# 1. API Standards

## Base URL

```text
/api/v1
```

---

## Authentication

All APIs except Login require authentication.

Authentication Method:

```text
JWT Bearer Token
```

---

## Response Format

Successful Response

```json
{
  "success": true,
  "message": "Operation completed successfully.",
  "data": {}
}
```

---

Error Response

```json
{
  "success": false,
  "message": "Validation failed.",
  "errors": []
}
```

---

## HTTP Status Codes

| Code | Meaning                 |
| ---- | ----------------------- |
| 200  | Success                 |
| 201  | Created                 |
| 400  | Validation Error        |
| 401  | Unauthorized            |
| 403  | Forbidden               |
| 404  | Not Found               |
| 409  | Conflict                |
| 422  | Business Rule Violation |
| 500  | Internal Server Error   |

---

# 2. Authentication APIs

---

## API-001 — Login

### Purpose

Authenticate a user and return a JWT access token.

---

### Method

```http
POST
```

---

### Endpoint

```text
/api/v1/auth/login
```

---

### Authentication

Not Required

---

### Permissions

Public

---

### Request Body

```json
{
  "username": "admin",
  "password": "********"
}
```

---

### Success Response

```json
{
  "success": true,
  "message": "Login successful.",
  "data": {
    "accessToken": "...",
    "user": {}
  }
}
```

---

### Related Tables

- users

---

### Business Rules

- Only ACTIVE users may log in.
- Passwords shall be verified using hashed values.

---

### Possible Errors

- Invalid Username
- Invalid Password
- User Inactive

---

## API-002 — Logout

### Purpose

Terminate the current authenticated session.

---

### Method

```http
POST
```

---

### Endpoint

```text
/api/v1/auth/logout
```

---

### Authentication

Required

---

### Permissions

All Authenticated Users

---

### Request Body

None

---

### Success Response

```json
{
  "success": true,
  "message": "Logged out successfully."
}
```

---

## API-003 — Current User

### Purpose

Return the authenticated user's profile.

---

### Method

```http
GET
```

---

### Endpoint

```text
/api/v1/auth/me
```

---

### Authentication

Required

---

### Permissions

Authenticated Users

---

### Response

Returns:

- User Details
- Role
- Permissions

---

# 3. Dashboard APIs

---

## API-004 — Dashboard Summary

### Purpose

Return dashboard summary information.

---

### Method

```http
GET
```

---

### Endpoint

```text
/ api/v1/dashboard/summary
```

---

### Authentication

Required

---

### Permissions

All Authenticated Users

---

### Response

Returns:

- Today's Trips
- Pending POD Count
- Bills Pending Submission
- Outstanding Payments
- Vehicle Document Alerts
- Monthly Revenue
- Monthly Expenses
- Monthly Profit

---

### Related Tables

- trips
- bills
- submissions
- payments
- vehicle_documents

---

## API-005 — Dashboard Alerts

### Purpose

Return operational alerts displayed on the dashboard.

---

### Method

```http
GET
```

---

### Endpoint

```text
/api/v1/dashboard/alerts
```

---

### Response

Returns:

- Pending POD
- Document Expiry
- Outstanding Payments
- Other operational alerts

---

# 4. Trip APIs

---

## API-006 — Create Trip

### Purpose

Create a new transportation trip.

---

### Method

```http
POST
```

---

### Endpoint

```text
/api/v1/trips
```

---

### Authentication

Required

---

### Permissions

Super Admin

Admin

User

---

### Request Body

Contains:

- Customer Type
- Party
- Loading Date
- From City
- To City
- Vehicle Number
- Driver Mobile
- Freight
- Vehicle Rate
- Weight
- LR Number
- Remarks

---

### Business Rules

- Trip Number generated automatically.
- Vehicle Type detected automatically.
- Unknown vehicles automatically added to Vehicle Directory.
- Snapshot fields created automatically.

---

### Related Tables

- trips
- vehicle_directory
- number_sequences

---

### Possible Errors

- Invalid Party
- Duplicate Trip Number
- Invalid Vehicle Data

---

## API-007 — Update Trip

### Method

```http
PUT
```

---

### Endpoint

```text
/api/v1/trips/{id}
```

---

### Purpose

Update editable trip information.

Historical snapshot fields shall remain unchanged.

---

## API-008 — Get Trip

### Method

```http
GET
```

---

### Endpoint

```text
/api/v1/trips/{id}
```

---

Returns complete trip details including:

- Expenses
- POD
- Timeline
- History

---

## API-009 — List Trips

### Method

```http
GET
```

---

### Endpoint

```text
/api/v1/trips
```

---

### Supported Filters

- Financial Year
- Party
- Vehicle
- Status
- Customer Type
- Vehicle Type
- Date Range

---

### Pagination

Mandatory

---

## API-010 — Delete Trip

### Method

```http
DELETE
```

---

### Endpoint

```text
/api/v1/trips/{id}
```

---

### Business Rules

Performs Soft Delete.

Permanent deletion is handled automatically after the retention period.

---

# End of Part 1

Part 2 continues with:

- Trip Documents APIs
- Party APIs
- Vehicle Directory APIs
- Own Fleet APIs

---

# 5. Trip Document APIs

---

## API-011 — Create Upload Session

### Purpose

Generate a secure upload session for ImageKit.

The frontend shall never receive permanent ImageKit credentials.

---

### Method

```http
POST
```

### Endpoint

```text
/api/v1/uploads/session
```

### Authentication

Required

### Permissions

Authenticated Users

---

### Request Body

```json
{
  "module": "trip_documents",
  "documentType": "POD"
}
```

---

### Success Response

```json
{
  "success": true,
  "data": {
    "uploadToken": "...",
    "expireAt": "...",
    "publicKey": "...",
    "folder": "/trips/pod/"
  }
}
```

---

### Business Rules

- Upload tokens shall expire automatically.
- Permanent ImageKit credentials shall never be exposed.

---

## API-012 — Save Uploaded POD

### Purpose

Create a POD record after successful upload to ImageKit.

---

### Method

```http
POST
```

### Endpoint

```text
/api/v1/trips/{tripId}/documents
```

---

### Authentication

Required

---

### Request Body

```json
{
  "documentType": "POD",
  "files": [
    {
      "imagekitFileId": "...",
      "imagekitUrl": "...",
      "originalFileName": "...",
      "displayOrder": 1
    }
  ]
}
```

---

### Business Rules

- One POD may contain multiple files.
- Files shall be inserted into `trip_document_files`.
- First successful POD upload changes trip status to `POD_RECEIVED`.

---

### Related Tables

- trip_documents
- trip_document_files
- trips

---

## API-013 — Get Trip Documents

### Method

```http
GET
```

### Endpoint

```text
/api/v1/trips/{tripId}/documents
```

---

### Response

Returns all document groups and associated files for the trip.

---

## API-014 — Delete Trip Document

### Method

```http
DELETE
```

### Endpoint

```text
/api/v1/trip-documents/{documentId}
```

---

### Business Rules

- Deletes document metadata.
- Removes associated file records.
- Backend handles ImageKit deletion.

---

# 6. Party APIs

---

## API-015 — Create Party

### Method

```http
POST
```

### Endpoint

```text
/api/v1/parties
```

---

### Business Rules

- Party Type is mandatory.
- Company Parties require Billing Type and Payment Type.
- GST Number shall be unique if provided.

---

## API-016 — Update Party

### Method

```http
PUT
```

### Endpoint

```text
/api/v1/parties/{id}
```

---

## API-017 — Get Party

### Method

```http
GET
```

### Endpoint

```text
/api/v1/parties/{id}
```

---

## API-018 — List Parties

### Method

```http
GET
```

### Endpoint

```text
/api/v1/parties
```

---

### Supported Filters

- Party Type
- Active Status
- City
- GST Number

---

## API-019 — Delete Party

### Method

```http
DELETE
```

### Endpoint

```text
/api/v1/parties/{id}
```

---

### Business Rules

A Party referenced by Trips, Bills, Submissions, or Payments shall not be deleted.

The API shall reject the request.

---

# 7. Vehicle Directory APIs

---

## API-020 — List Vehicles

### Method

```http
GET
```

### Endpoint

```text
/api/v1/vehicle-directory
```

---

### Purpose

Return all external vehicles.

---

## API-021 — Get Vehicle

### Method

```http
GET
```

### Endpoint

```text
/api/v1/vehicle-directory/{id}
```

---

## API-022 — Update Vehicle

### Method

```http
PUT
```

### Endpoint

```text
/api/v1/vehicle-directory/{id}
```

---

### Business Rules

Historical Trips shall never be modified.

Only the master record is updated.

---

# 8. Own Fleet APIs

---

## API-023 — Create Own Vehicle

### Method

```http
POST
```

### Endpoint

```text
/api/v1/own-vehicles
```

---

## API-024 — Update Own Vehicle

### Method

```http
PUT
```

### Endpoint

```text
/api/v1/own-vehicles/{id}
```

---

## API-025 — List Own Vehicles

### Method

```http
GET
```

### Endpoint

```text
/api/v1/own-vehicles
```

---

## API-026 — Upload Vehicle Document

### Method

```http
POST
```

### Endpoint

```text
/api/v1/own-vehicles/{vehicleId}/documents
```

---

### Business Rules

Uses the secure upload session flow.

Files are stored in ImageKit.

Only metadata is stored in PostgreSQL.

---

## API-027 — Get Vehicle Documents

### Method

```http
GET
```

### Endpoint

```text
/api/v1/own-vehicles/{vehicleId}/documents
```

---

## API-028 — Delete Vehicle Document

### Method

```http
DELETE
```

### Endpoint

```text
/api/v1/vehicle-documents/{documentId}
```

---

### Business Rules

Deletes metadata.

Backend removes ImageKit files.

---

# End of Part 2

Completed APIs

- Upload APIs
- Trip Document APIs
- Party APIs
- Vehicle Directory APIs
- Own Fleet APIs

Part 3 continues with:

- Billing APIs
- Submission APIs
- Payment APIs
- Reports APIs
- Users APIs
- Settings APIs
- Activity Log APIs

---

# 9. Billing APIs

---

## API-029 — Generate Bill

### Purpose

Generate a new customer bill.

Supports:

- Individual Billing
- Consolidated Billing

---

### Method

```http
POST
```

### Endpoint

```text
/api/v1/bills/generate
```

---

### Authentication

Required

---

### Permissions

- Super Admin
- Admin

---

### Headers

```text
Idempotency-Key: UUID
```

---

### Request Body

```json
{
  "partyId": "uuid",
  "billingType": "INDIVIDUAL",
  "tripIds": ["uuid"],
  "billDate": "2026-08-01",
  "digitalSignature": true
}
```

---

### Business Rules

- Billing Type must match Party configuration.
- Trips must belong to the same company.
- Trips must not already be billed.
- POD must be received.
- Bill Number generated automatically.
- Bill Snapshot created automatically.

---

### Related Tables

- bills
- bill_trips
- trips
- number_sequences

---

### Response

Returns:

- Bill ID
- Bill Number
- Bill Preview URL

---

## API-030 — Get Bill

### Method

```http
GET
```

### Endpoint

```text
/api/v1/bills/{id}
```

---

Returns complete bill details.

---

## API-031 — List Bills

### Method

```http
GET
```

### Endpoint

```text
/api/v1/bills
```

---

### Standard Query Parameters

- page
- pageSize
- sortBy
- sortOrder
- search
- filters

---

## API-032 — Print Bill

### Method

```http
GET
```

### Endpoint

```text
/api/v1/bills/{id}/print
```

---

Returns printable PDF.

---

## API-033 — Cancel Bill

### Method

```http
POST
```

### Endpoint

```text
/api/v1/bills/{id}/cancel
```

---

### Headers

```text
Idempotency-Key: UUID
```

---

### Request Body

```json
{
  "reason": "Incorrect freight amount"
}
```

---

### Business Rules

- Bill status becomes `CANCELLED`.
- Historical record remains.
- Trips become eligible for new billing according to business rules.
- Cancellation is recorded in Activity Logs.

---

# 10. Submission APIs

---

## API-034 — Create Submission

### Method

```http
POST
```

### Endpoint

```text
/api/v1/submissions
```

---

### Headers

```text
Idempotency-Key: UUID
```

---

### Request Body

```json
{
  "partyId": "uuid",
  "billIds": ["bill_1", "bill_2"]
}
```

---

### Business Rules

- All bills belong to one company.
- Submission Number generated automatically.
- Bills linked through `submission_bills`.

---

## API-035 — Reissue Submission

### Method

```http
POST
```

### Endpoint

```text
/api/v1/submissions/{id}/reissue
```

---

### Business Rules

- Creates a new Submission.
- Generates a new Submission Number.
- Preserves historical submissions.

---

## API-036 — Get Submission

### Method

```http
GET
```

### Endpoint

```text
/api/v1/submissions/{id}
```

---

## API-037 — List Submissions

### Method

```http
GET
```

### Endpoint

```text
/api/v1/submissions
```

---

### Standard Query Parameters

- page
- pageSize
- sortBy
- sortOrder
- search
- filters

---

# 11. Payment APIs

---

## API-038 — Record Payment

### Method

```http
POST
```

### Endpoint

```text
/api/v1/payments
```

---

### Headers

```text
Idempotency-Key: UUID
```

---

### Request Body

```json
{
  "partyId": "uuid",
  "amount": 150000,
  "paymentDate": "2026-08-05",
  "referenceNumber": "UTR123456",
  "remarks": "NEFT"
}
```

---

### Business Rules

- Payment Type determined automatically from Party configuration.
- Standard Payments allocate against bills.
- Bulk Payments allocate month-wise using FIFO.
- Allocation records created automatically.
- Payment Number generated automatically.

---

### Related Tables

- payments
- payment_allocations
- number_sequences

---

## API-039 — Get Payment

### Method

```http
GET
```

### Endpoint

```text
/api/v1/payments/{id}
```

---

Returns payment details with allocation history.

---

## API-040 — List Payments

### Method

```http
GET
```

### Endpoint

```text
/api/v1/payments
```

---

### Standard Query Parameters

- page
- pageSize
- sortBy
- sortOrder
- search
- filters

---

## API-041 — Get Company Outstanding

### Method

```http
GET
```

### Endpoint

```text
/api/v1/payments/outstanding/{partyId}
```

---

### Response

Returns:

- Total Outstanding
- Month-wise Outstanding
- Payment History
- FIFO Allocation Summary

---

# 12. Reports APIs

---

## API-042 — Generate Report

### Method

```http
POST
```

### Endpoint

```text
/api/v1/reports/generate
```

---

### Request Body

```json
{
  "reportType": "MONTHLY_TRIPS",
  "filters": {}
}
```

---

### Supported Reports

- Monthly Trips
- Party Ledger
- Vehicle Owner Ledger
- Outstanding Report
- Pending POD
- Payment Summary
- Profit Summary
- Financial Summary

---

## API-043 — Export Report

### Method

```http
POST
```

### Endpoint

```text
/api/v1/reports/export
```

---

### Supported Formats

- Excel
- PDF

---

# End of Part 3

Completed APIs

- Billing APIs
- Submission APIs
- Payment APIs
- Reports APIs

Part 4 continues with:

- Users APIs
- Settings APIs
- Activity Log APIs
- Global API conventions
- Error codes
- Validation standards
- API versioning
- Final API freeze

---

# 13. User APIs

---

## API-044 — Create User

### Method

```http
POST
```

### Endpoint

```text
/api/v1/users
```

---

### Permissions

Super Admin

---

### Business Rules

- Username must be unique.
- Password shall be hashed before storage.
- Role must be one of:

  - SUPER_ADMIN
  - ADMIN
  - USER

---

## API-045 — Update User

### Method

```http
PUT
```

### Endpoint

```text
/api/v1/users/{id}
```

---

## API-046 — List Users

### Method

```http
GET
```

### Endpoint

```text
/api/v1/users
```

---

### Standard Query Parameters

- page
- pageSize
- sortBy
- sortOrder
- search
- filters

---

## API-047 — Reset Password

### Method

```http
POST
```

### Endpoint

```text
/api/v1/users/{id}/reset-password
```

---

### Business Rules

- Only Super Admin may reset passwords.
- Passwords shall always be hashed.

---

## API-048 — Deactivate User

### Method

```http
POST
```

### Endpoint

```text
/api/v1/users/{id}/deactivate
```

---

### Business Rules

- User status becomes INACTIVE.
- Existing historical records remain unchanged.

---

# 14. Settings APIs

---

## API-049 — Get Settings

### Method

```http
GET
```

### Endpoint

```text
/api/v1/settings
```

---

## API-050 — Update Settings

### Method

```http
PUT
```

### Endpoint

```text
/api/v1/settings
```

---

### Permissions

Super Admin

---

### Business Rules

- ImageKit credentials shall never be stored through this API.
- Environment variables manage sensitive configuration.
- Only approved setting categories may be updated.

---

# 15. Activity Log APIs

---

## API-051 — List Activity Logs

### Method

```http
GET
```

### Endpoint

```text
/api/v1/activity-logs
```

---

### Filters

- User
- Module
- Entity
- Date Range
- Action
- Source

---

## API-052 — Get Activity Log

### Method

```http
GET
```

### Endpoint

```text
/api/v1/activity-logs/{id}
```

---

### Business Rules

- Activity Logs are read-only.
- Activity Logs shall never be edited or deleted.

---

# 16. Standard Query Parameters

All list APIs shall support the following query parameters.

| Parameter | Description                 |
| --------- | --------------------------- |
| page      | Current page number         |
| pageSize  | Number of records per page  |
| sortBy    | Column to sort by           |
| sortOrder | asc / desc                  |
| search    | Global search text          |
| filters   | JSON or query-based filters |

Example:

```text
GET /api/v1/trips?page=1&pageSize=25&sortBy=loading_date&sortOrder=desc
```

---

# 17. Standard Error Response

Every failed request shall return the following structure.

```json
{
  "success": false,
  "message": "Validation failed.",
  "errors": [
    {
      "code": "ERROR_CODE",
      "field": "fieldName",
      "message": "Human readable message."
    }
  ]
}
```

---

# 18. Standard Success Response

```json
{
  "success": true,
  "message": "Operation completed successfully.",
  "data": {}
}
```

---

# 19. Error Code Standards

Application-specific error codes shall be used for predictable client-side handling.

Examples:

| Code                   | Meaning                         |
| ---------------------- | ------------------------------- |
| PARTY_NOT_FOUND        | Party does not exist            |
| TRIP_NOT_FOUND         | Trip does not exist             |
| TRIP_ALREADY_BILLED    | Trip has already been billed    |
| POD_REQUIRED           | POD is required before billing  |
| INVALID_PAYMENT_TYPE   | Payment type mismatch           |
| BILL_ALREADY_CANCELLED | Bill has already been cancelled |
| DUPLICATE_GST          | GST number already exists       |
| DUPLICATE_VEHICLE      | Vehicle number already exists   |
| INVALID_FINANCIAL_YEAR | Financial year is invalid       |
| UNAUTHORIZED_ACTION    | User lacks permission           |

---

# 20. API Versioning

All APIs shall be versioned.

Current Version:

```text
/api/v1
```

Future breaking changes shall use:

```text
/api/v2
```

without modifying Version 1 endpoints.

---

# 21. API Security

The backend shall enforce:

- JWT Authentication
- Role-Based Authorization
- Request Validation
- Input Sanitization
- SQL Injection Protection
- Rate Limiting (where appropriate)
- Secure ImageKit Upload Flow

Sensitive operations shall require authentication and authorization before execution.

---

# 22. Logging

The following operations shall create Activity Logs automatically:

- Login
- Logout
- Trip Creation
- Trip Update
- Trip Deletion
- Bill Generation
- Bill Cancellation
- Submission Creation
- Payment Recording
- User Management
- Settings Updates

Financial and destructive operations should return the created Activity Log ID in the response.

---

# 23. Idempotency

The following APIs shall support the `Idempotency-Key` request header:

- Generate Bill
- Cancel Bill
- Create Submission
- Reissue Submission
- Record Payment

Duplicate requests using the same key shall not create duplicate business records.

---

# 24. API Design Principles

- RESTful resource naming.
- Stateless request handling.
- Consistent response structure.
- Standard pagination.
- Standard filtering.
- Standard sorting.
- Immutable financial operations.
- Business rules enforced on the server.
- No business logic in the frontend.

---

# Related Documents

- DATABASE.md
- MODULES.md
- BUSINESS_RULES.md
- BUSINESS_WORKFLOWS.md
- DO_NOT_BREAK.md

---

# Payments

## POST /payments
Create a payment

## GET /payments
List payments

## GET /payments/:id
Get payment

## POST /payments/:id/cancel
Cancel payment

## GET /payments/outstanding/:partyId
Get outstanding

# Dashboard

## GET /dashboard
Get dashboard

# Reports

## GET /reports/monthly-trip-register

## GET /reports/party-ledger

## GET /reports/vehicle-owner-ledger

## GET /reports/outstanding

## GET /reports/pending-pod

## GET /reports/financial-summary

## GET /reports/profit-summary

## POST /reports/export

## POST /reports/generate

# Document Status

**Status:** Frozen

This document defines the official REST API specification for SSRL ERP Version 1.

All backend services, frontend integrations, automated tests, and API documentation shall conform to this specification.

