# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

- `npm run dev` — Start dev server (http://localhost:3000)
- `npm run build` — Production build
- `npm run start` — Start production server
- `npm run lint` — Run ESLint (runs `eslint` with next config)

No test framework is configured.

## Environment

Requires `.env.local` with:
- `MONGODB_URI` — MongoDB Atlas connection string
- `JWT_SECRET` — (optional, defaults to fallback)

## Architecture

**Next.js 16 App Router** full-stack application for supplier tire/tyre product management. Dark-themed dashboard with CSV import, filtering, search, and analytics.

### Stack
- **Frontend:** React 19, TypeScript, Tailwind CSS 3 (dark theme with indigo/purple accents)
- **Backend:** Next.js API routes, Mongoose 9 ODM, MongoDB Atlas
- **Auth:** JWT + bcryptjs (currently disabled — middleware has early return bypassing all auth checks)
- **CSV:** PapaParse (client-side parsing), batch upsert via API

### Key Directories
- `app/api/` — REST API routes (auth, products CRUD, CSV import)
- `app/dashboard/` — Main dashboard UI (client components with `"use client"`)
- `components/` — Reusable React components (ProductTable, UploadCSV, SummaryCards, etc.)
- `lib/` — Utilities: `mongodb.ts` (connection pooling/caching), `auth.ts` (JWT helpers)
- `models/` — Mongoose schemas: Product (main domain), Supplier, User
- `types/` — TypeScript interfaces

### Data Flow
- `GET /api/products` is the primary endpoint — supports pagination (default 200/page, max 500), full-text search (across product_name, brand, sku, size), multi-field filtering, sorting, and returns aggregated summary stats + filter option lists in one response.
- CSV import uses `POST /api/products/import` with batch upsert keyed on `sku`.
- Product `size` field stores the original string; `plain_size` stores the extracted numeric value for range queries.

### Conventions
- TypeScript interfaces use `I` prefix (`IProduct`, `ISupplier`) and `Doc` suffix for Mongoose documents (`IProductDoc`)
- Database field names use snake_case; JS variables use camelCase
- Path alias: `@/*` maps to project root
- Debounced filter inputs (400ms) on dashboard
- No CSS modules — Tailwind utilities only, global styles in `app/globals.css`
