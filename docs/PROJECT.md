# PROJECT.md

```yaml
document:
  id: DOC-004
  title: PROJECT
  version: 1.0
  status: Frozen

purpose: Define the identity, objectives, scope, and success criteria of SSRL ERP.

depends_on:
  - 00_READ_FIRST.md
  - AI_RULES.md
  - GLOSSARY.md

used_by:
  - All Modules
  - Database
  - API
  - UI
  - Print Engine
  - Development Guide

last_updated: 2026-08-05
```

---

# 1. Project Identity

## Project Name

**SSRL ERP**

## Owner

**Shri Sanwariya Road Lines**

## Project Type

Private Internal Enterprise Resource Planning (ERP) System

## Intended Use

SSRL ERP is developed exclusively for the internal operations of Shri Sanwariya Road Lines.

It is **not** intended to be:

- A public SaaS platform
- A generic Transport Management System (TMS)
- A commercially distributed ERP solution

---

# 2. Project Vision

SSRL ERP aims to replace Excel-based business operations with a modern, reliable, high-performance desktop application that follows the exact operational workflow of Shri Sanwariya Road Lines.

The software shall minimize repetitive manual work, improve record management, automate recurring tasks, and provide accurate business information while preserving historical data.

---

# 3. Problem Statement

The current business relies heavily on Microsoft Excel and manual processes.

This creates several operational challenges:

- Time spent searching historical trip records.
- Manual preparation of bills.
- Difficulty tracking POD status.
- Manual outstanding payment calculations.
- Repetitive entry of customer and vehicle information.
- Separate Excel sheets for different business activities.
- Higher possibility of human error.
- Limited visibility into business performance.

The objective of SSRL ERP is to eliminate these inefficiencies without changing the existing business workflow.

---

# 4. Project Objectives

Version 1 of SSRL ERP shall achieve the following objectives:

- Replace Excel for daily operational work.
- Reduce bill preparation time.
- Simplify trip creation.
- Automate repetitive data entry.
- Maintain complete historical records.
- Provide accurate financial reporting.
- Track POD status efficiently.
- Track outstanding company payments.
- Track own fleet profitability.
- Improve record retrieval through fast search.
- Provide a native desktop experience.

---

# 5. Target Users

Version 1 supports internal office staff only.

## Super Admin

Responsible for:

- Complete system administration
- User management
- Settings management
- Full operational access

---

## Admin

Responsible for:

- Daily operations
- Trip management
- Billing
- Payments
- Reports

---

## User

Responsible for operational tasks according to assigned permissions.

---

# 6. Version 1 Scope

The following modules are included in Version 1.

## Dashboard

Operational summary and business insights.

---

## Trips

Management of:

- Market Trips
- Company Trips
- Own Fleet Trips

---

## Parties

Management of companies and market customers.

---

## Vehicle Directory

Management of external vehicle information.

---

## Own Fleet

Management of Shri Sanwariya Road Lines' vehicles and operational expenses.

---

## Billing

Support for:

- Individual Trip Bills
- Consolidated Monthly Bills

---

## Payments

Support for:

- Standard Payments
- Bulk Payments
- Automatic FIFO allocation

---

## Reports

Business and financial reports.

---

## Settings

System configuration and administration.

---

## Users

Authentication and role-based access.

---

## Document Management

Storage and retrieval of:

- POD
- RC
- Insurance
- Fitness
- Permit
- PUC

using ImageKit.

---

# 7. Out of Scope

The following features are intentionally excluded from Version 1.

- Customer Portal
- Vehicle Owner Portal
- Driver Management Module
- Mobile Application
- GPS Tracking
- Live Vehicle Tracking
- Fuel Card Integration
- WhatsApp Automation
- Email Automation
- AI-Based Analytics
- Multi-Company Support
- SaaS Features
- Online Booking System
- Accounting Software Integration
- E-Way Bill Integration

These features may be considered in future versions but shall not be implemented in Version 1 without explicit approval.

---

# 8. Success Criteria

Version 1 shall be considered successful when:

- Daily office operations can be performed without Microsoft Excel.
- Trips are managed entirely within SSRL ERP.
- Bills are generated entirely within SSRL ERP.
- Payments are recorded entirely within SSRL ERP.
- POD tracking is performed entirely within SSRL ERP.
- Reports are generated directly from SSRL ERP.
- Historical records remain accurate.
- Users can retrieve required records quickly.
- Business workflows remain unchanged from existing operations.

---

# 9. Technology Summary

## Desktop Application

- Tauri v2

## Frontend

- React
- Vite
- TypeScript
- Tailwind CSS

## Backend

- Node.js
- Express.js
- TypeScript

## Database

- PostgreSQL

## ORM

- Prisma

## File Storage

- ImageKit

---

# 10. Project Principles

The following principles govern the development of SSRL ERP.

1. The software adapts to the business.
2. Performance is more important than visual effects.
3. Historical records are immutable.
4. Business logic belongs in the backend.
5. The system should minimize repetitive work.
6. The application should feel like native desktop software.
7. Every feature must solve a real business requirement.
8. Simplicity is preferred over unnecessary complexity.

---

# 11. Related Documents

- 00_READ_FIRST.md
- AI_RULES.md
- GLOSSARY.md
- BUSINESS_WORKFLOWS.md
- BUSINESS_RULES.md
- DATABASE.md
- API.md
- MODULES.md
- DEVELOPMENT_GUIDE.md

---

# Document Status

**Status:** Frozen

This document defines the identity, purpose, scope, and objectives of SSRL ERP Version 1.

Changes to this document shall only be made when the project's business objectives or Version 1 scope change.
