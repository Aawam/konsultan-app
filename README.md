# Konsulindo Project Suite

Internal operations app for a construction consulting workflow in Berau, East Kalimantan. The current production scope is project monitoring, company/reference data, project analytics, export, and Supabase-backed authentication.

The app is intentionally kept small: no document-maker module, no unused UI wrappers, and no duplicate Supabase singleton. Shared code is kept only where it is reused by active routes.

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.2.10 App Router |
| Runtime | React 19, Node.js >=20.19.0 |
| UI | Tailwind CSS v4, shadcn/Radix primitives, lucide-react |
| Database/Auth | Supabase PostgreSQL + Supabase Auth |
| Validation | Zod, react-hook-form |
| Charts | Recharts |
| Export | Native CSV, generated XLSX and PDF |
| Tests | Vitest |

## Getting Started

Use Node.js from `.nvmrc`.

```bash
nvm use
npm install
cp .env.example .env.local
npm run dev
```

Required environment variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=(Your SUPABASE URL)
NEXT_PUBLIC_SUPABASE_ANON_KEY=(Your SUPABASE ANON KEY)
```

Do not put Supabase service-role keys in browser-exposed `NEXT_PUBLIC_*` variables.

## Scripts

```bash
npm run dev            # local development
npm run build          # production build
npm run start          # run production server after build
npm run lint           # ESLint
npm run typecheck      # TypeScript without emit
npm test               # Vitest
npm run check          # lint + typecheck + test + build
npm run types:supabase # regenerate Supabase types
npm run db:export:data # export database data script
npm run latency -- https://your-domain.com 5 # measure deployed route latency
```

## Active Modules

| Module | Routes | Purpose |
|---|---|---|
| Auth | `/login`, `proxy.ts` | Supabase login, route protection, logout from app shell. |
| Proyek | `/proyek`, `/proyek/baru`, `/proyek/[id]`, `/proyek/[id]/edit`, `/proyek/dashboard` | Project list, create/edit, detail, dashboard, export, and workflow. |
| RAB/AHSP | `/proyek/rab`, `/proyek/[id]/rab`, `/database` | RAB Maker, approval/final lock, XLSX/PDF export, and controlled AHSP import. |
| Database | `/database`, `/database/perusahaan/[id]` | Company and master/reference data. |
| API | `/api/proyek/*`, `/api/master/*`, `/api/perusahaan/*`, `/api/dinas/*` | Authenticated domain endpoints. |

Document-generation modules are out of active scope. The product currently focuses on monitoring and database workflows.

## Project Structure

```text
konsultan-app/
├── app/                    # App Router pages, layouts, API route handlers
├── components/
│   ├── database/           # Database module client UI
│   ├── layout/             # Sidebar/topbar app shell
│   ├── proyek/             # Project module UI and forms
│   └── ui/                 # Used shadcn/Radix primitives and shared helpers
├── hooks/                  # Shared React hooks
├── lib/
│   ├── actions/            # Server-side data access and mutations
│   ├── constants/          # Domain constants
│   ├── types/              # Shared TypeScript domain types
│   ├── validations/        # Zod schemas
│   ├── proyek-analytics.ts
│   ├── supabase-browser.ts
│   ├── supabase-config.ts
│   ├── supabase-server.ts
│   └── utils.ts
├── docs/                   # Structure, status, UI conventions, SQL scripts
├── scripts/                # Operational scripts
├── vercel.json             # Vercel Function region config
└── tests are colocated beside lib files as *.test.ts
```

For the full maintained structure, read `docs/project_structure.md`.

## Conventions

- App Router routes live under `app/`; route handlers use `route.ts`.
- Server-side data access lives in `lib/actions/`.
- Shared domain types live in `lib/types/`.
- Zod validation lives in `lib/validations/`.
- Project constants and progress rules live in `lib/constants/proyek.ts`.
- Shared Supabase select strings live in `lib/queries/`.
- Client-heavy components use `'use client'` and usually `*-client.tsx`.
- Generic UI belongs in `components/ui/`; domain UI belongs in `components/proyek/` or `components/database/`.
- Keep unused primitives out of the repo. Re-add shadcn components only when an active screen imports them.

## Performance Notes

Most business pages are dynamic because they depend on Supabase auth and database reads. Static routes are limited to pages that do not need request-time data.

Production deploys run Vercel Functions in Singapore via `vercel.json`:

```json
{
  "regions": ["sin1"]
}
```

Keep the Supabase project in Singapore too. If Vercel runs in Singapore but Supabase is in another region, dynamic pages still pay database round-trip latency.

The `/proyek` list is paginated and filtered by the server. Keep that pattern for large tables: send `page`, `pageSize`, and filter params to the route, then let Supabase return only the rows needed for the current screen. Use full-table reads only for dashboard aggregation or explicit export jobs.

Auth is split deliberately:

- `proxy.ts` protects page navigation only: `/login`, `/proyek/*`, and `/database/*`.
- API route handlers authenticate themselves through `createAuthenticatedSupabaseServerClient()`.

This avoids a global proxy auth round trip for every API request while keeping API access protected.

To inspect Vercel cache behavior after deployment:

```bash
curl -I https://your-domain.com
curl -I https://your-domain.com/proyek
curl -I https://your-domain.com/api/proyek
```

Check `x-vercel-cache`:

| Value | Meaning |
|---|---|
| `HIT` | Served from Vercel cache. |
| `MISS` | Fetched from origin/function. |
| `STALE` | Served stale while refreshing. |
| `PRERENDER` | Served from static/prerendered storage. |
| `REVALIDATED` | Refreshed in foreground. |

To compare latency before and after deploys:

```bash
npm run latency -- https://your-domain.com 5
```

The script reports status code, Vercel cache header, Vercel edge region, average latency, p50, and p95 for `/`, `/login`, `/proyek`, and `/database`.

To verify production database indexes without changing data:

```bash
psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -f docs/DB_Index_Verification.sql
```

## Verification

Before pushing changes:

```bash
npm run check
```

CI runs the same lint, typecheck, test, and build gates on `experiment`,
`staging`, and `main`, plus a high-severity production-dependency audit.
