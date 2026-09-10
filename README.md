# Resident Profiling Database — Web (Next.js + Supabase)

A web app for social workers to record and search resident profiles during
barangay visits. Rewritten from the original Python/pywebview desktop
version into a modern Next.js + Supabase application.

## Features
- Card-based search over all residents (name, barangay, occupation, contact, religion)
- Full record form: Personal, Address (province → city → barangay), Family, Household, Flags & Consent, Notes
- Religion breakdown stats with visual bars
- Ledger-style sidebar with running record total
- Delete confirmation modal and toast notifications

## Stack
- **Next.js 16** (App Router, React 19, TypeScript, Tailwind CSS v4)
- **Supabase** (PostgreSQL via `@supabase/supabase-js`)

## Setup

### 1. Supabase
1. Create a project at [supabase.com](https://supabase.com)
2. Open the **SQL Editor** and run `supabase/migrations/0001_init.sql`
   (creates the `residents` table + search indexes)

### 2. Environment
Create `.env.local` (see `.env.example`):

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Run
```bash
npm install
npm run dev
```

Open http://localhost:3000 — the app redirects `/` to `/records`.

## Project structure
```
src/
├── app/
│   ├── layout.tsx              ← Root layout + sidebar shell
│   ├── page.tsx                ← Redirect → /records
│   ├── records/
│   │   ├── page.tsx            ← Search + card grid
│   │   ├── new/page.tsx        ← New record form
│   │   └── [id]/page.tsx       ← Edit record
│   └── stats/page.tsx          ← Religion breakdown
├── components/
│   ├── LedgerSidebar.tsx       ← Vertical tab sidebar
│   ├── AppProvider.tsx         ← Toast + confirm modal context
│   ├── RecordForm.tsx          ← Full record form
│   ├── form/                   ← Address + Notes sections
│   ├── records/                ← Cards, grid, empty state
│   └── ui/                     ← FormField, Chip, Section
└── lib/
    ├── supabase.ts             ← Client + config check
    ├── residents.ts            ← All CRUD/search/stats queries
    ├── constants.ts            ← Dropdown option arrays
    ├── locations.ts            ← Province/City/Barangay data
    └── types.ts                ← Resident types + helpers
```

## Migrating data from the old SQLite app
Export rows from `residents.db`, converting the old columns to the new
Postgres types (`0/1` flags → `true/false` booleans), then insert through
Supabase's table editor or a script. See the column mapping in
`supabase/migrations/0001_init.sql`.

## Data & privacy
"Consent given" should only be checked if the resident explicitly agreed to
have their information recorded — religion is sensitive personal information
under the Data Privacy Act (RA 10173).