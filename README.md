# Konsulindo Project Suite

Internal management tool for a construction consulting firm. Handles project tracking, bidding document generation, and company database.

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI | React 19, Tailwind CSS v4, shadcn/ui (Radix UI) |
| Database | Supabase (PostgreSQL) |
| Language | TypeScript 5 |
| Notifications | Sonner (toast) |
| Export | xlsx |
| Document gen | docxtemplater + PizZip (DOCX) |

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
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Local document templates are required for DOCX generation and are intentionally not committed:
- `public/templates/template_penawaran.docx`
- `public/templates/data_perusahaan.pdf`

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
│   ├── penawaran/                # Bidding document module
│   │   ├── layout.tsx
│   │   └── baru/page.tsx
│   ├── bap/                      # Payment report (BAP) module
│   │   ├── layout.tsx
│   │   └── baru/page.tsx
│   ├── database/                 # Company database module
│   │   ├── layout.tsx
│   │   └── page.tsx
│   └── api/
│       ├── proyek/[id]/route.ts        # GET project + override logs
│       ├── pengalaman/route.ts         # GET company experience (filtered)
│       └── penawaran/generate/route.ts # GET: fetch data + render DOCX
│
├── components/
│   ├── layout/
│   │   ├── sidebar-layout.tsx    # Shared sidebar + topbar shell
│   │   └── topbar-title.tsx      # Dynamic breadcrumb title
│   ├── proyek/
│   │   ├── form-proyek.tsx       # Create/edit project form (client)
│   │   ├── proyek-table-client.tsx  # Filterable project table (client)
│   │   ├── proyek-slideover.tsx  # Quick-view side panel (client)
│   │   ├── dashboard-client.tsx  # Analytics dashboard (client)
│   │   ├── proyek-actions.tsx    # Edit + Delete action buttons (client)
│   │   ├── badges.tsx            # BadgeJenis, BadgeTahap, BadgeOverride
│   │   ├── progress-cell.tsx     # Progress bar + label for tables
│   │   ├── form-field.tsx        # Label + required marker for forms
│   │   └── section.tsx           # Section card wrapper (used in BAP form)
│   ├── penawaran/
│   │   └── form-penawaran.tsx    # Bidding document generator form (client)
│   ├── bap/
│   │   └── form-bap.tsx          # BAP generator form (client)
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
│   ├── supabase.ts               # Supabase client singleton
│   ├── utils.ts                  # cn(), formatRupiah(), formatTanggal()
│   ├── generate-penawaran.ts     # DOCX generation via docxtemplater
│   ├── constants/
│   │   └── proyek.ts             # FASE_*, TAHAP_BAR_COLOR, getPersentaseFromFase()
│   ├── types/
│   │   ├── proyek.ts             # Perusahaan, ProyekFormData, ProyekPayload, ProyekDisplay
│   │   └── perusahaan.ts         # PerusahaanDetail
│   └── actions/
│       ├── proyek.ts             # Project CRUD (getDaftarProyek, simpanProyek, hapusProyek…)
│       ├── penawaran.ts          # simpanPenawaran, generateNomorPenawaran
│       ├── personil.ts           # getPersonilList, getPengalamanPerusahaan
│       └── perusahaan.ts         # getPerusahaanDetailList, getProyekByPerusahaan
│
├── docs/
│   ├── project_status.md         # Module status and feature list
│   ├── project_structure.md      # Detailed structure documentation
│   └── ui_conventions.md         # Design system conventions
│
└── public/
    └── templates/
        ├── template_penawaran.docx   # DOCX template for bidding docs
        └── data_perusahaan.pdf       # Company data reference
```

## Modules

### Proyek (Project Management)
- List, filter, search, and export projects
- Create, edit, delete projects with 4-step form
- Budget validation with override log (HPS ≤ Pagu, Penawaran ≤ HPS)
- Progress tracking by phase (Perencanaan / Pengawasan)
- Quick-view side panel + full detail page

### Penawaran (Bidding Documents)
- Multi-step form: project identity → budget → client → team → experience
- Auto-generates document number (`{n}/PEN/{company}/{project}/{month}/{year}`)
- Saves project to DB and generates downloadable DOCX

### BAP (Payment Report)
- 3-step form linking to an existing contracted project
- Generates BAP DOCX for a billing period

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

- `dilakukan_oleh` in `override_log` is hardcoded as `'admin'` — needs auth integration
- `ProyekRow` in `proyek-slideover.tsx` uses `Record<string, unknown>` — needs a proper typed DB row type once Supabase types are generated
- Province `'Kalimantan Timur'` is hardcoded in the penawaran generate API — should be a company setting
