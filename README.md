# Konsulindo Project Suite

Internal operations app for a construction consulting workflow in Berau, East Kalimantan. The current production scope is project monitoring, company/reference data, project analytics, export, and Supabase-backed authentication.

The app is intentionally kept small: no document-maker module, no unused UI wrappers, and no duplicate Supabase singleton. Shared code is kept only where it is reused by active routes.

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.2.3 App Router |
| Runtime | React 19, Node.js >=20.19.0 |
| UI | Tailwind CSS v4, shadcn/Radix primitives, lucide-react |
| Database/Auth | Supabase PostgreSQL + Supabase Auth |
| Validation | Zod, react-hook-form |
| Charts | Recharts |
| Export | xlsx |
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
npm test               # Vitest
npm run types:supabase # regenerate Supabase types
npm run db:export:data # export database data script
```

## Active Modules

| Module | Routes | Purpose |
|---|---|---|
| Auth | `/login`, `proxy.ts` | Supabase login, route protection, logout from app shell. |
| Proyek | `/proyek`, `/proyek/baru`, `/proyek/[id]`, `/proyek/[id]/edit`, `/proyek/dashboard` | Project list, create/edit, detail, dashboard, export, override log. |
| Database | `/database`, `/database/perusahaan/[id]` | Company records, project history, Dinas/SKPD aggregation. |
| API | `/api/proyek/*`, `/api/perusahaan/*`, `/api/dinas/*` | CRUD, export, override, and reference-data endpoints. |

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
└── tests are colocated beside lib files as *.test.ts
```

For the full maintained structure, read `docs/project_structure.md`.

## Conventions

- App Router routes live under `app/`; route handlers use `route.ts`.
- Server-side data access lives in `lib/actions/`.
- Shared domain types live in `lib/types/`.
- Zod validation lives in `lib/validations/`.
- Project constants and progress rules live in `lib/constants/proyek.ts`.
- Client-heavy components use `'use client'` and usually `*-client.tsx`.
- Generic UI belongs in `components/ui/`; domain UI belongs in `components/proyek/` or `components/database/`.
- Keep unused primitives out of the repo. Re-add shadcn components only when an active screen imports them.

## Performance Notes

Most business pages are dynamic because they depend on Supabase auth and database reads. Static routes are limited to pages that do not need request-time data.

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

## Verification

Before pushing changes:

```bash
npm test
npm run build
```

Current cleanup verification:

- `npm test`: 5 files, 20 tests passed.
- `npm run build`: production build passed on Next.js 16.2.3.
