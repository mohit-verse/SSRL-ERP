# SSRL ERP - Testing Documentation

This document outlines the testing strategy, frameworks, and procedures for the SSRL ERP frontend application.

## 1. Testing Framework
- **Test Runner:** Vitest (chosen for native Vite integration and speed)
- **DOM Testing:** React Testing Library (`@testing-library/react`)
- **Environment:** jsdom
- **API Mocking:** Not heavily relied upon; Component tests isolate the DOM, while E2E tests target the actual backend API.

## 2. Test Layers

### Unit Tests (`npm run test:unit`)
- **Scope:** Pure functions, utility helpers (e.g., `cn`, date formatters, currency formatters).
- **Location:** `tests/unit/`
- **Execution:** Runs instantly via Vitest without mounting React components.

### Component Tests (`npm run test:unit`)
- **Scope:** Critical UI boundaries (Login forms, routing guards, role checks).
- **Location:** `tests/component/`
- **Execution:** Mounts isolated React components into jsdom, stubbing `AuthContext` and `TanStack Query` hooks to observe UI behavior under different simulated server states.

### End-to-End (E2E) Tests (`npm run test:e2e`)
- **Scope:** Complete API integration workflows.
- **Location:** `tests/e2e/`
- **Requirements:** 
  - A live, running instance of the SSRL Backend.
  - A seeded test user (`superadmin` / `password123`).
- **Release Gate Policy:** E2E tests are configured to strictly **fail** if the backend is unavailable or test data does not exist. A missing environment is treated as a `VALIDATION-BLOCKED` or failed test state. False passes on ECONNREFUSED have been removed. 
- **Database Isolation:** E2E tests require a strictly isolated PostgreSQL database (`ssrl_erp_test`) spun up via `docker-compose.test.yml`. Test data is deterministically seeded using `backend/scripts/seed-test-db.ts` to ensure repeatable and consistent financial workflows.

## 3. CI/CD Integration
The project utilizes a GitHub Actions workflow (`.github/workflows/e2e.yml`) as its official Release Gate.
The pipeline automatically:
1. Provisions a fresh PostgreSQL container via Docker.
2. Pushes the Prisma schema (`migrate deploy`).
3. Seeds test users, financial years, and baseline master data.
4. Starts the backend Node server.
5. Executes all frontend Unit and Component tests.
6. Executes E2E tests against the active backend.
7. Teardowns the environment cleanly.

Any failure in building, seeding, or executing tests halts the deployment.
```bash
# Run all tests
npm run test

# Run only unit/component tests
npm run test:unit

# Run only API/E2E integration tests
npm run test:e2e
```

## 5. Known Limitations & Environment Blockers
- **E2E Backend Requirement:** If the backend server is offline or unreachable, the tests will fail aggressively. This guarantees the CI pipeline serves as an uncompromised release gate.
- **Reporting Engine Tests:** Validating PDF/Excel logic is strictly offloaded to the backend; the frontend only tests that the Blob response is received and processed.
