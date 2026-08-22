# SSRL ERP — Development Setup & Execution Guide

## Prerequisites
- Node.js v20+ or v24+
- npm v10+
- Supabase Project (PostgreSQL + Supabase Auth)

---

## 1. Environment Setup

Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Configure your Supabase credentials in `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

---

## 2. Database Migration Execution

Execute the Phase 1 migration file directly on your Supabase PostgreSQL instance via Supabase CLI or SQL Editor:
```bash
npx supabase db push
# Or apply supabase/migrations/20260822000000_ssrl_erp_v1_2_schema.sql via Supabase Dashboard SQL Editor
```

---

## 3. Running Verification & Test Commands

### Run Unit & Domain Invariants Test Suite (Vitest):
```bash
npm run test
```

### Run TypeScript Compilation & Typecheck:
```bash
npm run typecheck
```

### Run ESLint Static Analysis:
```bash
npm run lint
```

### Run Production Build:
```bash
npm run build
```

### Start Development Server:
```bash
npm run dev
```
Open `http://localhost:3000` in your browser.
