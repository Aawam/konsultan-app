# Project Structure - Konsulindo Project Suite

**Tanggal:** 2026-07-03

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
├── vitest.config.mts       # Vitest config
└── vitest.setup.ts         # Test setup
```

Generated and machine-local folders such as `.next/`, `node_modules/`, `.claude/`, `.vscode/`, `supabase/.temp/`, and `.DS_Store` files are not part of the project structure.

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
│   ├── page.tsx
│   └── perusahaan/
│       └── [id]/page.tsx
└── api/
    ├── dinas/
    │   ├── route.ts
    │   └── [id]/route.ts
    ├── perusahaan/
    │   ├── route.ts
    │   └── [id]/route.ts
    └── proyek/
        ├── route.ts
        ├── export/route.ts
        └── [id]/
            ├── route.ts
            └── override/route.ts
```

Key responsibilities:

| File/Folder | Purpose |
|---|---|
| `app/layout.tsx` | Root layout, font imports, theme bootstrap script, Sonner toaster. |
| `app/page.tsx` | Redirect entry route. |
| `app/globals.css` | Tailwind v4 imports, theme variables, shared component classes. |
| `app/login/page.tsx` | Supabase login screen. |
| `app/proyek/*` | Main project management routes. |
| `app/database/*` | Company/database dashboard and company detail page. |
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
| `form-create-proyek.tsx` | Create-project entry wrapper around the shared form shell. |
| `form-edit-proyek.tsx` | Edit-project workflow with responsive drawer/sheet editing. |
| `proyek-form-shell.tsx` | Shared create/edit project form logic, validation, draft, and override flow. |
| `proyek-table-client.tsx` | Filterable/searchable table, export entry point, slide-over launcher. |
| `dashboard-client.tsx` | Stats, charts, phase distribution, top dinas/company summaries. |
| `proyek-slideover.tsx` | Right-side project detail panel. |
| `proyek-actions.tsx` | Edit/delete actions. |
| `badges.tsx` | Domain badges for jenis, tahap, override state. |
| `progress-cell.tsx` | Table progress display. |

### database/

| File | Purpose |
|---|---|
| `database-client.tsx` | Tabs for perusahaan, all projects, and Dinas/SKPD aggregation. |

### ui/

Generic shadcn/Radix primitives and shared helpers live here. Domain-specific code should not be added to `components/ui/`.

| File | Purpose |
|---|---|
| `button.tsx`, `input.tsx`, `label.tsx`, `select.tsx`, `textarea.tsx`, `table.tsx` | shadcn-style primitives used by forms and tables. |
| `alert-dialog.tsx`, `confirm-dialog.tsx`, `dialog.tsx`, `drawer.tsx`, `sheet.tsx` | Dialog, drawer, sheet, and confirmation primitives. |
| `back-button.tsx`, `theme-toggle.tsx`, `sonner.tsx`, `sidebar.tsx` | Shared app utilities and shell helpers. |
| `field.tsx`, `section-card.tsx`, `kv-field.tsx`, `stat-card.tsx`, `tab-group.tsx`, `page-error.tsx` | Reusable display/workflow helpers. |

---

## hooks/

| File | Purpose |
|---|---|
| `use-media-query.ts` | Shared responsive-state hook for drawer/sheet decisions. |

---

## lib/

```text
lib/
├── actions/
├── constants/
├── types/
├── validations/
├── database.types.ts
├── proyek-analytics.ts
├── supabase-browser.ts
├── supabase-config.ts
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
| `proyek-analytics.ts` | Project analytics calculations. |
| `supabase-browser.ts` | Browser client for Client Components. |
| `supabase-config.ts` | Shared Supabase environment config helpers. |
| `supabase-server.ts` | Server client and current user helper. |
| `utils.ts` | `cn`, number/currency/date formatting helpers. |

---

## Tests

Tests are colocated with the logic they cover:

```text
lib/actions/proyek.test.ts
lib/constants/proyek.test.ts
lib/proyek-analytics.test.ts
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
├── DB_Add_Dinas_SKPD.sql
├── DB_Audit.sql
├── DB_Production_Core_Fix.sql
├── DB_SUPABASE_DEPLOY.sql
├── DB_Simplification_Audit.sql
├── DB_Simplification_Cleanup.sql
└── RLS_Policies.sql
```

Markdown docs use lowercase snake_case. SQL files remain uppercase because they are standalone admin/reference scripts.

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
