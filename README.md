# Konsulindo Project Suite

Internal operations app for monitoring construction-consulting projects in Berau, East Kalimantan. The active product scope is project monitoring, project analytics, supporting company/Dinas data, CSV export, and Supabase-backed authentication.

The active product surface is intentionally small. RAB/AHSP application implementation has been separated from this repository so shared code stays focused on project monitoring.

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.2.12 App Router |
| Runtime | React 19, Node.js >=20.19.0 |
| UI | Tailwind CSS v4, shadcn/Radix primitives, lucide-react |
| Database/Auth | Supabase PostgreSQL + Supabase Auth |
| Validation | Zod, react-hook-form |
| Charts | Recharts |
| Export | Native CSV |
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
| Proyek | `/proyek`, `/proyek/baru`, `/proyek/[id]`, `/proyek/[id]/edit`, `/proyek/dashboard` | Project list, create/edit, detail, dashboard, progress monitoring, and CSV export. |
| Database Monitoring | `/database`, `/database/perusahaan/[id]` | Owner/Admin management of project-supporting company and Dinas/SKPD data. |
| API | `/api/proyek/*`, `/api/perusahaan/*`, `/api/dinas/*` | Authenticated monitoring endpoints with role checks. |

The app keeps two roles:

- `owner_admin`: manages projects and supporting reference data, including commercial fields.
- `tenaga_ahli`: reads technical project monitoring data without commercial fields.

RAB/AHSP formulas and application code now belong to a separate project. This repository retains only historical migrations/generated database types, dormant database objects, and fail-closed route/database controls needed for a safe transition. Reintegration only happens through a documented contract after the external calculation model is complete and verified. See [ADR-003](docs/decisions/ADR-003-separate-rab-implementation.md).

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

- `proxy.ts` protects page navigation and rejects retired RAB/AHSP URLs before routing.
- Active API route handlers authenticate themselves through `createAuthenticatedSupabaseServerClient()`.

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
