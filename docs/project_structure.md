# Project Structure - Konsulindo Project Suite

**Tanggal:** 2026-07-31

Dokumen ini mengikuti struktur tracked aplikasi saat ini. Next.js 16 memakai App Router berbasis folder di `app/`; file khusus seperti `page.tsx`, `layout.tsx`, `route.ts`, dan `proxy.ts` mengikuti dokumentasi lokal di `node_modules/next/dist/docs/`.

---

## Top Level

```text
konsultan-app/
├── app/                    # Routes, layouts, API handlers, global CSS
├── .github/workflows/      # GitHub Actions CI
├── components/             # React components by domain and shared UI
├── docs/                   # Project docs and SQL admin/reference scripts
├── hooks/                  # Shared React hooks
├── lib/                    # Data access, Supabase clients, types, validation
├── public/                 # Static assets served by Next.js
├── supabase/migrations/    # Ordered runnable database migrations
├── .env.example            # Safe env template
├── AGENTS.md               # Agent instructions
├── .nvmrc                  # Node version for local/CI
├── components.json         # shadcn/ui config
├── eslint.config.mjs       # ESLint config
├── next.config.ts          # Next config
├── package.json            # Scripts and dependencies
├── postcss.config.mjs      # Tailwind/PostCSS config
├── proxy.ts                # Next proxy for Supabase auth protection
├── tsconfig.json           # TypeScript config
├── vercel.json             # Vercel Function region config
├── vitest.config.mts       # Vitest config
└── vitest.setup.ts         # Test setup
```

Generated and machine-local folders such as `.next/`, `node_modules/`, `.claude/`, `.vscode/`, `supabase/.temp/`, `.vercel/`, `tsconfig.tsbuildinfo`, and `.DS_Store` files are not part of the project structure.

---

## app/

```text
app/
├── layout.tsx
├── page.tsx
├── globals.css
├── favicon.ico
├── login/
│   └── page.tsx
├── proyek/
│   ├── layout.tsx
│   ├── loading.tsx
│   ├── page.tsx
│   ├── baru/page.tsx
│   ├── dashboard/page.tsx
│   ├── rab/page.tsx
│   └── [id]/
│       ├── page.tsx
│       ├── edit/page.tsx
│       └── rab/page.tsx
├── database/
│   ├── layout.tsx
│   ├── page.tsx
│   └── perusahaan/[id]/page.tsx
└── api/
    ├── dinas/
    │   ├── route.ts
    │   └── [id]/route.ts
    ├── perusahaan/
    │   ├── route.ts
    │   └── [id]/route.ts
    ├── master/
    │   ├── ahsp/
    │   ├── harga/
    │   ├── kategori/route.ts
    │   └── satuan/route.ts
    ├── proyek/
    │   ├── route.ts
    │   ├── export/route.ts
    │   └── [id]/
    │       ├── route.ts
    │       ├── override/route.ts
    │       └── rab/
```

Key responsibilities:

| File/Folder | Purpose |
|---|---|
| `app/layout.tsx` | Root layout, font imports, theme bootstrap script, Sonner toaster. |
| `app/page.tsx` | Redirect entry route. |
| `app/globals.css` | Tailwind v4 imports, theme variables, shared component classes. |
| `app/login/page.tsx` | Supabase login screen. |
| `app/proyek/*` | Main project management routes. |
| `app/proyek/rab/*` | Paused RAB source; requests are redirected by `proxy.ts`. |
| `app/database/*` | Active Owner/Admin surface for project, company, and Dinas/SKPD monitoring data. |
| `app/api/**/route.ts` | Active monitoring handlers plus paused RAB/AHSP handlers blocked by `proxy.ts`. |

---

## components/

```text
components/
├── layout/
├── proyek/
├── database/
└── ui/
```

### layout/

| File | Purpose |
|---|---|
| `sidebar-layout.tsx` | Client app shell: sidebar nav, topbar, clock, theme toggle, logout. |
| `topbar-title.tsx` | Dynamic title from current pathname. |

### proyek/

| File | Purpose |
|---|---|
| `form-create-proyek.tsx` | Create project form wrapper. |
| `form-edit-proyek.tsx` | Edit project form wrapper. |
| `proyek-form-shell.tsx` | Shared project form UI with validation warnings and override flow. |
| `proyek-table-client.tsx` | Filterable/searchable table, export entry point, slide-over launcher. |
| `dashboard-client.tsx` | Stats, charts, phase distribution, top dinas/company summaries. |
| `proyek-slideover.tsx` | Right-side project detail panel. |
| `proyek-actions.tsx` | Edit/delete actions. |
| `badges.tsx` | Domain badges for jenis, tahap, override state. |
| `progress-cell.tsx` | Table progress display. |
| `rab-maker-client.tsx` | Paused RAB Maker source retained for future reintegration work. |

### database/

| File | Purpose |
|---|---|
| `database-client.tsx` | Tabs for perusahaan, all projects, and Dinas/SKPD aggregation. |
| `database-display.tsx` | Presentational heading, search, stats, and Dinas/SKPD slide-over pieces for `database-client`. |
| `database-forms.tsx` | Responsive form shell plus Dinas/SKPD and Perusahaan forms. |
| `reference-database-client.tsx` | Paused AHSP/master-price management source. |
| `reference-database-tables.tsx` | Paused AHSP, harga dasar, and AHSP detail table components. |
| `master-reference-page.tsx` | Paused server wrapper for master reference pages. |

### ui/

Generic shadcn/Radix primitives and shared helpers live here. Domain-specific code should not be added to `components/ui/`.

| File | Purpose |
|---|---|
| `button.tsx`, `input.tsx`, `label.tsx`, `select.tsx`, `textarea.tsx`, `table.tsx` | shadcn-style primitives. |
| `alert-dialog.tsx`, `confirm-dialog.tsx` | Dialog primitives and confirmation wrapper. |
| `back-button.tsx`, `theme-toggle.tsx`, `sonner.tsx` | Shared app utilities. |
| `section-card.tsx`, `kv-field.tsx`, `stat-card.tsx`, `tab-group.tsx`, `page-error.tsx` | Reusable display/workflow helpers. |

---

## lib/

```text
lib/
├── actions/
├── constants/
├── queries/
├── types/
├── validations/
├── database.types.ts
├── supabase-browser.ts
├── supabase-config.ts
├── supabase-server.ts
└── utils.ts
```

### actions/

| File | Main exports |
|---|---|
| `proyek.ts` | Project queries/mutations, form reference loaders, payload builder, override log, delete. |
| `perusahaan.ts` | Company list and projects by company. |
| `ahsp.ts` | Paused AHSP/master-data actions retained for future reintegration. |
| `rab.ts` | Paused RAB Maker actions retained for future reintegration. |

### queries/

| File | Purpose |
|---|---|
| `proyek-selects.ts` | Shared exact Supabase select strings for project detail, mutation returns, and override logs. |

### constants/

| File | Purpose |
|---|---|
| `proyek.ts` | Project categories, phases, progress percentages, progress colors. |

### types/

| File | Purpose |
|---|---|
| `proyek.ts` | Project display/detail/form/payload types. |
| `perusahaan.ts` | Company detail type. |
| `ahsp.ts` | Paused AHSP, master harga, and RAB Maker snapshot types. |

### validations/

| File | Purpose |
|---|---|
| `proyek.ts` | Zod schema for project form/API validation. |
| `ahsp.ts` | Paused AHSP/master-data validation and normalization. |

### Root lib files

| File | Purpose |
|---|---|
| `database.types.ts` | Generated Supabase database types. |
| `api-response.ts` | Shared API response helpers for Route Handlers. |
| `auth.ts`, `auth-types.ts` | Current-user profile helpers and role checks. |
| `rab-maker.ts` | Paused RAB Maker parsing and override normalization helpers. |
| `supabase-browser.ts` | Browser client for Client Components. |
| `supabase-config.ts` | Shared Supabase environment config helpers. |
| `supabase-server.ts` | Server client, authenticated API client helper, and current user helper. |
| `utils.ts` | `cn`, number/currency/date formatting helpers. |

---

## Tests

Tests are colocated with the logic they cover:

```text
lib/actions/proyek.test.ts
lib/constants/proyek.test.ts
lib/rab-maker.test.ts
lib/utils.test.ts
lib/validations/ahsp.test.ts
lib/validations/proyek.test.ts
```

Run:

```bash
npm test
```

---

## docs/

```text
docs/
├── decisions/
├── PRD_Gap_Audit.md
├── domain_boundaries.md
├── project_status.md
├── project_structure.md
├── ui_conventions.md
├── DB_Add_Dinas_SKPD.sql
├── DB_Audit.sql
├── DB_Production_Core_Fix.sql
├── DB_SUPABASE_DEPLOY.sql
├── DB_Simplification_Audit.sql
├── DB_Simplification_Cleanup.sql
└── RLS_Policies.sql
```

Markdown docs use lowercase snake_case except PRD/audit documents that retain their established title. SQL files remain uppercase because they are standalone admin/reference, seed, deployment, or verification scripts unless promoted into `supabase/migrations/`.

---

## supabase/

```text
supabase/
└── migrations/
    └── README.md
```

`supabase/migrations/` is reserved for ordered runnable migrations. Existing `docs/DB_*.sql` files are not automatically migrations.

---

## Naming Conventions

| Pattern | Use |
|---|---|
| `kebab-case.tsx` | Components and route-local files where possible. |
| `*-client.tsx` | Components with browser state/events or heavy client interactivity. |
| `page.tsx` | Public page route. |
| `layout.tsx` | Shared route layout. |
| `route.ts` | API Route Handler. |
| `*.test.ts` | Unit tests colocated near logic. |
| `lib/actions/*` | Server-side data access and mutations. |
| `lib/types/*` | Shared TypeScript domain types. |
| `lib/validations/*` | Zod schemas. |
