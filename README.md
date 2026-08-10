# SSRL ERP

Internal ERP for Shri Sanwariya Road Lines.

## Technology Stack

- **Desktop:** Tauri v2
- **Frontend:** React, TypeScript, Vite, Tailwind CSS
- **Backend:** Node.js, Express, TypeScript, Prisma
- **Database:** PostgreSQL
- **Storage:** ImageKit

## Folder Structure

- `docs/` - Project documentation
- `frontend/` - React frontend & Tauri application
- `backend/` - Express backend API
- `shared/` - Shared TypeScript types and constants
- `scripts/` - Utility scripts

## How to Run

### Install Dependencies

```bash
npm install
```

### Development Commands

```bash
# Run both frontend and backend concurrently
npm run dev

# Run frontend only
npm run dev:frontend

# Run backend only
npm run dev:backend

# Run Tauri desktop app
npm run tauri dev
```

### Build Commands

```bash
# Build all workspaces
npm run build

# Build Tauri app
npm run tauri build
```

## Project Rules

- The software adapts to the business, not the other way around.
- Historical records must never change.
- Business logic belongs in backend Services.
- Every database change must use Prisma migrations.
- Performance takes priority over visual effects.
- Use strict TypeScript and avoid `any`.

For more detailed guidelines, please refer to the documents in the `docs/` folder.
