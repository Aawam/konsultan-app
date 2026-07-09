# Konsulindo Project Suite

Internal management tool for a construction consulting firm. Focused on project monitoring and company database management.

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI | React 19, Tailwind CSS v4, shadcn/ui (Radix UI) |
| Database | Supabase (PostgreSQL) |
| Language | TypeScript 5 |
| Notifications | Sonner (toast) |
| Export | Native CSV; RAB Excel export planned server-side |

## Getting Started

Use Node.js `>=20.19.0` (`.nvmrc` uses Node 22).

```bash
nvm use
npm install
cp .env.example .env.local
npm run dev
```

Environment variables required:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - use the browser-safe publishable/anon key, not a secret key

Optional local reference assets may live in `public/templates/` and are intentionally not committed.

## Project Structure

```
konsultan-app/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout (fonts, Toaster)
│   ├── page.tsx                  # Redirects to /proyek
│   ├── globals.css               # Tailwind v4 config + CSS design tokens
│   ├── proyek/                   # Project management module
│   │   ├── layout.tsx            # Wraps children in SidebarLayout
│   │   ├── page.tsx              # Project list (server)
│   │   ├── baru/page.tsx         # New project form (server)
│   │   ├── dashboard/page.tsx    # Analytics dashboard (server)
│   │   └── [id]/
│   │       ├── page.tsx          # Project detail (server)
│   │       └── edit/page.tsx     # Edit project form (server)
│   ├── database/                 # Company database module
│   │   ├── layout.tsx
│   │   └── page.tsx
│   └── api/
│       ├── proyek/[id]/route.ts        # GET project + override logs
│       └── proyek/export/route.ts      # GET project export data
│
├── components/
│   ├── layout/
│   │   ├── sidebar-layout.tsx    # Shared sidebar + topbar shell
│   │   └── topbar-title.tsx      # Dynamic breadcrumb title
│   ├── proyek/
│   │   ├── form-create-proyek.tsx # Create project form wrapper
│   │   ├── form-edit-proyek.tsx  # Edit project form wrapper
│   │   ├── proyek-form-shell.tsx # Shared project form UI
│   │   ├── proyek-table-client.tsx  # Filterable project table (client)
│   │   ├── proyek-slideover.tsx  # Quick-view side panel (client)
│   │   ├── dashboard-client.tsx  # Analytics dashboard (client)
│   │   ├── proyek-actions.tsx    # Edit + Delete action buttons (client)
│   │   ├── badges.tsx            # BadgeJenis, BadgeTahap, BadgeOverride
│   │   └── progress-cell.tsx     # Progress bar + label for tables
│   ├── database/
│   │   └── database-client.tsx   # Company database viewer (client)
│   └── ui/                       # Generic UI primitives
│       ├── kv-field.tsx          # Key-value display field (label + value)
│       ├── section-card.tsx      # Card with titled header section
│       ├── confirm-dialog.tsx    # AlertDialog wrapper for confirmations
│       ├── back-button.tsx       # Navigation back button
│       ├── page-error.tsx        # Error boundary display
│       ├── theme-toggle.tsx      # Dark/light mode toggle
│       └── [shadcn primitives]   # button, input, select, table, etc.
│
├── lib/
│   ├── supabase-browser.ts       # Browser Supabase client
│   ├── supabase-server.ts        # Server Supabase client
│   ├── utils.ts                  # cn(), formatRupiah(), formatTanggal()
│   ├── constants/
│   │   └── proyek.ts             # FASE_*, TAHAP_BAR_COLOR, getPersentaseFromFase()
│   ├── types/
│   │   ├── proyek.ts             # Perusahaan, ProyekFormData, ProyekPayload, ProyekDisplay
│   │   └── perusahaan.ts         # PerusahaanDetail
│   └── actions/
│       ├── proyek.ts             # Project CRUD (getDaftarProyek, simpanProyek, hapusProyek…)
│       └── perusahaan.ts         # getPerusahaanDetailList, getProyekByPerusahaan
│
├── docs/
│   ├── project_status.md         # Module status and feature list
│   ├── project_structure.md      # Detailed structure documentation
│   └── ui_conventions.md         # Design system conventions
│
└── public/
    └── templates/                # Optional local reference assets
```

## Modules

### Proyek (Project Management)
- List, filter, search, and export projects
- Create, edit, delete projects with 4-step form
- Budget validation with override log (HPS ≤ Pagu, Penawaran ≤ HPS)
- Progress tracking by phase (Perencanaan / Pengawasan)
- Quick-view side panel + full detail page

### Database (Company Reference)
- View all company records with linked project history

## Conventions

- All components use `kebab-case.tsx` filenames
- Client components are marked `'use client'` and named `*-client.tsx` where disambiguation helps
- Types live in `lib/types/`, never in `components/`
- Data fetching in pages uses `lib/actions/` functions — never raw `supabase` calls in pages
- Constants (`FASE_*`, `TAHAP_BAR_COLOR`) live in `lib/constants/proyek.ts`
- Shared display primitives (`KvField`, `SectionCard`) live in `components/ui/`

## Known Technical Debt

- `ProyekRow` in `proyek-slideover.tsx` uses `Record<string, unknown>` — needs a proper typed DB row type once Supabase types are generated
- `lib/database.types.ts` still reflects legacy document-related tables until Supabase types are regenerated from the simplified schema
