# Project Structure - Konsulindo Project Suite

**Tanggal:** 2026-06-16

Dokumen ini mengikuti struktur aktual aplikasi. Next.js 16 memakai App Router berbasis folder di `app/`; file khusus seperti `page.tsx`, `layout.tsx`, `route.ts`, dan `proxy.ts` mengikuti dokumentasi lokal di `node_modules/next/dist/docs/`.

---

## Top Level

```text
konsultan-app/
├── app/                    # Routes, layouts, API handlers, global CSS
├── .github/workflows/      # GitHub Actions CI
├── components/             # React components by domain and shared UI
├── docs/                   # Project docs, SQL notes, audit scripts
├── lib/                    # Data access, Supabase clients, types, validation
├── public/                 # Static assets served by Next.js
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
├── vitest.config.ts        # Vitest config
└── vitest.setup.ts         # Test setup
```

Generated and machine-local folders such as `.next/`, `node_modules/`, `.claude/`, `.vscode/`, `supabase/.temp/`, and `.DS_Store` files are not part of the project structure.

---

## .github/

```text
.github/
└── workflows/
    └── ci.yml
```

CI runs on pushes and pull requests to `main`:

- `npm ci`
- `npm run lint`
- `npm test`

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
│   ├── page.tsx
│   ├── baru/page.tsx
│   ├── dashboard/page.tsx
│   └── [id]/
│       ├── page.tsx
│       └── edit/page.tsx
├── database/
│   ├── layout.tsx
│   └── page.tsx
└── api/
    ├── proyek/
    │   ├── route.ts
    │   ├── export/route.ts
    │   └── [id]/
    │       ├── route.ts
    │       └── override/route.ts
```

Key responsibilities:

| File/Folder | Purpose |
|---|---|
| `app/layout.tsx` | Root layout, font imports, theme bootstrap script, Sonner toaster. |
| `app/page.tsx` | Redirect entry route. |
| `app/globals.css` | Tailwind v4 imports, theme variables, shared component classes. |
| `app/login/page.tsx` | Supabase login screen. |
| `app/proyek/*` | Main project management routes. |
| `app/database/*` | Company/database dashboard. |
| `app/api/**/route.ts` | Route Handlers for CRUD, export, and override workflows. |

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
| `form-proyek.tsx` | Client create/edit wizard with validation warnings and override flow. |
| `proyek-table-client.tsx` | Filterable/searchable table, export entry point, slide-over launcher. |
| `dashboard-client.tsx` | Stats, charts, phase distribution, top dinas/company summaries. |
| `proyek-slideover.tsx` | Right-side project detail panel. |
| `proyek-actions.tsx` | Edit/delete actions. |
| `badges.tsx` | Domain badges for jenis, tahap, override state. |
| `progress-cell.tsx` | Table progress display. |
| `form-field.tsx` | Form label/required wrapper. |
| `section.tsx` | Domain section wrapper. |

### database/

| File | Purpose |
|---|---|
| `database-client.tsx` | Tabs for perusahaan, all projects, and Dinas/SKPD aggregation. |

### ui/

Generic primitives and shared helpers live here. Domain-specific code should not be added to `components/ui/`.

| File | Purpose |
|---|---|
| `button.tsx`, `input.tsx`, `label.tsx`, `select.tsx`, `textarea.tsx`, `table.tsx`, `badge.tsx`, `card.tsx` | shadcn-style primitives. |
| `alert-dialog.tsx`, `confirm-dialog.tsx` | Dialog primitives and confirmation wrapper. |
| `back-button.tsx`, `theme-toggle.tsx`, `tooltip.tsx`, `sonner.tsx` | Shared app utilities. |
| `section-card.tsx`, `kv-field.tsx`, `stat-card.tsx`, `tab-group.tsx`, `step-wizard.tsx`, `page-error.tsx` | Reusable display/workflow helpers. |

---

## lib/

```text
lib/
├── actions/
├── constants/
├── types/
├── validations/
├── database.types.ts
├── supabase.ts
├── supabase-browser.ts
├── supabase-server.ts
└── utils.ts
```

### actions/

| File | Main exports |
|---|---|
| `proyek.ts` | Project queries/mutations, payload builder, override log, delete. |
| `perusahaan.ts` | Company list and projects by company. |

### constants/

| File | Purpose |
|---|---|
| `proyek.ts` | Project categories, phases, progress percentages, progress colors. |

### types/

| File | Purpose |
|---|---|
| `proyek.ts` | Project display/detail/form/payload types. |
| `perusahaan.ts` | Company detail type. |

### validations/

| File | Purpose |
|---|---|
| `proyek.ts` | Zod schema for project form/API validation. |

### Root lib files

| File | Purpose |
|---|---|
| `database.types.ts` | Generated Supabase database types. |
| `supabase.ts` | General singleton client. |
| `supabase-browser.ts` | Browser client for Client Components. |
| `supabase-server.ts` | Server client and current user helper. |
| `utils.ts` | `cn`, `formatRupiah`, `formatTanggal`. |

---

## Tests

Tests are colocated with the logic they cover:

```text
lib/actions/proyek.test.ts
lib/constants/proyek.test.ts
lib/utils.test.ts
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
├── project_status.md
├── project_structure.md
├── ui_conventions.md
├── DB_Audit.sql
├── DB_Simplification_Audit.sql
├── DB_Simplification_Cleanup.sql
└── RLS_Policies.sql
```

Markdown docs use lowercase snake_case. SQL files remain uppercase because they are standalone admin/reference scripts.

---

## public/

```text
public/
└── templates/
    └── [optional local reference assets]
```

`public/templates/` is intentionally ignored by git because it may contain local/static business reference files. Keep optional assets here, but do not use `public/` as a staging folder for copied source code.

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

---

## Cleanup Rules

Safe to delete when present:

- `.next/`
- `tsconfig.tsbuildinfo`
- `.DS_Store`
- `.claude/`
- `.vscode/` when empty or only local preferences
- `supabase/.temp/`
- Empty `supabase/` folders with no migrations/config
- Empty staging folders such as `public/external/`

Do not delete without checking references:

- `.env.example`
- `public/templates/`
- `lib/database.types.ts`
- `proxy.ts`
- Route files under `app/api/`
- Config files used by Next, Tailwind, ESLint, shadcn, Vitest, or TypeScript.
