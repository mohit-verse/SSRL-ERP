# DEVELOPMENT_GUIDE.md

```yaml
document:
  id: DOC-014
  title: DEVELOPMENT_GUIDE
  version: 1.0
  status: Frozen

purpose: Define mandatory development standards, architecture, and implementation guidelines for SSRL ERP Version 1.

depends_on:
  - PROJECT.md
  - DATABASE.md
  - API.md
  - MODULES.md
  - UI_UX.md
  - DO_NOT_BREAK.md

used_by:
  - Developers
  - Antigravity IDE
  - Code Review
  - QA

last_updated: 2026-08-05
```

---

# 1. Technology Stack

## Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- React Router
- TanStack Query
- React Hook Form
- Zod

---

## Backend

- Node.js
- Express.js
- TypeScript
- Prisma ORM

---

## Database

- PostgreSQL

---

## Desktop

- Tauri

---

## Storage

- ImageKit

---

# 2. General Rules

## DEV-001

Use TypeScript in strict mode.

---

## DEV-002

Never use `any`.

---

## DEV-003

Never disable TypeScript errors to make code compile.

---

## DEV-004

Every file shall have a single responsibility.

---

## DEV-005

Prefer composition over inheritance.

---

# 3. Project Structure

```
frontend/

backend/

shared/

docs/

scripts/
```

---

# 4. Frontend Structure

```
src/

components/

pages/

layouts/

hooks/

services/

routes/

types/

utils/

constants/

assets/
```

---

# 5. Backend Structure

```
src/

controllers/

services/

repositories/

middleware/

routes/

validators/

utils/

config/

prisma/
```

---

# 6. Layer Responsibilities

## Controller

Responsible for:

- Request parsing
- Validation
- Calling services
- Returning responses

Controllers shall not contain business logic.

---

## Service

Responsible for:

- Business rules
- Workflow execution
- Calculations

Most business logic belongs here.

---

## Repository

Responsible only for database access.

Repositories shall not implement business rules.

---

# 7. Validation

Every incoming request shall be validated using Zod.

Invalid requests shall never reach business logic.

---

# 8. Database Access

All database access shall use Prisma.

Raw SQL shall only be used when performance requires it and shall be documented.

---

# 9. Error Handling

The backend shall use centralized error handling.

Controllers shall not return ad-hoc error responses.

---

# 10. Logging

Errors shall be logged.

Important business operations shall create Activity Logs.

---

# 11. Transactions

Database transactions are mandatory for operations involving:

- Bill Generation
- Submission Creation
- Payment Recording
- FIFO Allocation
- Number Generation

---

# 12. Naming Conventions

Variables

```
camelCase
```

Classes

```
PascalCase
```

Files

```
kebab-case
```

Database

```
snake_case
```

---

# 13. API Standards

- RESTful endpoints.
- JWT authentication.
- Role-based authorization.
- Standard success responses.
- Standard error responses.
- Idempotency where defined.

---

# 14. Frontend Standards

- Pages shall not contain business logic.
- API calls belong in services.
- Forms shall use React Hook Form.
- Validation shall use Zod.
- Server state shall use TanStack Query.

---

# 15. Backend Standards

- Controllers remain thin.
- Services own business logic.
- Repositories own persistence.
- Middleware handles cross-cutting concerns.

---

# 16. Security

- Hash passwords.
- Never expose ImageKit credentials.
- Validate every request.
- Sanitize inputs.
- Use environment variables for secrets.

---

# 17. Performance

- Use pagination.
- Avoid N+1 queries.
- Index searchable fields.
- Lazy-load large datasets where appropriate.

---

# 18. Code Quality

Every pull request should:

- Compile successfully.
- Pass linting.
- Pass formatting.
- Pass tests.
- Preserve approved business rules.

---

# 19. Documentation

Every new feature shall update:

- API.md (if APIs change)
- DATABASE.md (if schema changes)
- BUSINESS_RULES.md (if business rules change)

No implementation shall silently diverge from documentation.

---

# 20. Definition of Done

A feature is complete only when:

- Business rules are implemented.
- Database changes are migrated.
- APIs are implemented.
- Frontend is complete.
- Validation is complete.
- Activity logging is implemented.
- Error handling is complete.
- Documentation is updated.

---

# Related Documents

- DO_NOT_BREAK.md
- DATABASE.md
- API.md
- UI_UX.md
- MODULES.md

---

# Document Status

**Status:** Frozen

This document defines the mandatory engineering standards for SSRL ERP Version 1.

All code generated manually or by AI shall comply with these standards.
