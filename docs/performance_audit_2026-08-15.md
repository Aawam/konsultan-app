# Monitoring Performance and Stability Audit — 2026-08-15

## Scope

Audit the monitoring-only checkpoint on commit `cf1ab95` for:

- production build stability;
- authenticated Owner/Admin and Tenaga Ahli monitoring flows;
- local server latency and route bundle size;
- role separation at the rendered UI/data boundary;
- observable browser errors and warnings.

The audit used `next start` with the production build and the configured local
Supabase environment. The active dataset contained one non-deleted project.

## Verdict

Accepted as the current monitoring performance baseline. No performance code
change is justified by the measured runtime data.

There were no build, test, unhandled application, browser-console,
authentication, or role-boundary failures. The monitoring route bundles are
slightly above the generic 200 KB gzip target, but every measured authenticated
flow reached ready content in less than 1.7 seconds. Immediate code splitting
or dashboard re-architecture would therefore be premature.

## Stability gates

| Gate | Result |
|---|---:|
| ESLint | Passed |
| TypeScript | Passed |
| Vitest | 29 files, 111 tests passed |
| Production build | Passed |
| Dependency audit | 0 known vulnerabilities at checkpoint |
| Browser console | 0 errors and 0 warnings in tested flows |
| Login network recovery | Passed; safe error state returned |

### Transient Supabase diagnostic

Two `ENOTFOUND` diagnostics appeared in the server process while Supabase DNS
was temporarily unavailable during login. `@supabase/auth-js` logs the native
fetch error before converting it to `AuthRetryableFetchError`. The existing
`loginAction` catches that failure and returns the generic message `Layanan
autentikasi tidak dapat dihubungi.` instead of exposing a stack trace or
crashing the form.

Audit commit `ab33d1a` adds a regression test for this recovery path. The raw
dependency diagnostic remains useful server-side evidence and is not
suppressed; it must not be confused with an uncaught application exception or
a browser-console failure.

## Public route latency

Twenty sequential requests were made against the local production server.

| Route | Mode | p50 | p95 |
|---|---|---:|---:|
| `/` | warm | 4 ms | 18 ms |
| `/login` | warm | 5 ms | 12 ms |
| `/` | cache bypass | 5 ms | 20 ms |
| `/login` | cache bypass | 4 ms | 12 ms |

Protected routes were not measured by the CLI because copying browser session
cookies into another process would weaken the test boundary. Their complete
ready time was measured in the authenticated browser instead.

## Authenticated ready time

The figures include navigation, server rendering, Supabase reads, React Server
Component streaming, and the transition from the loading state to ready UI.
They are synthetic local timings, not production Core Web Vitals.

| Role | Flow | Median | Slowest sample |
|---|---|---:|---:|
| Owner/Admin | Project list | 581 ms | 1,156 ms |
| Owner/Admin | Dashboard | 568 ms | 1,247 ms |
| Owner/Admin | Project detail | — | 1,665 ms |
| Tenaga Ahli | Project list | 587 ms | 1,224 ms |
| Tenaga Ahli | Dashboard | 544 ms | 650 ms |
| Tenaga Ahli | Project detail | — | 951 ms |

All measured samples remained below the 2.5-second user-experience target.

## Bundle baseline

Bundle totals come from `.next/diagnostics/route-bundle-stats.json`; gzip sizes
were calculated from the emitted production chunks.

| Route/resource | Raw | Gzip |
|---|---:|---:|
| `/login` JavaScript | 595,873 B | 171,933 B |
| `/proyek/dashboard` JavaScript | 753,397 B | 222,587 B |
| `/proyek` JavaScript | 785,364 B | 230,759 B |
| Global stylesheet | 99,901 B | 17,803 B |

The list and dashboard exceed a generic 200 KB JavaScript target by about
15% and 11%. Most of the cost is shared Next.js/React and app-shell code; the
route-specific increment is comparatively small. The accepted regression
ceilings are defined in ADR-004.

## Browser UAT

| Scenario | Owner/Admin | Tenaga Ahli |
|---|---|---|
| Project list renders | Passed | Passed |
| Search/filter updates URL and results | Passed | Covered by shared list path |
| Project preview opens | Passed | Covered by shared preview path |
| Dashboard renders | Passed | Passed |
| Project detail renders | Passed | Passed |
| Account popup on mobile drawer | Passed | Shared component path |
| Account popup on desktop icon rail | Passed | Passed |
| Logout redirects to `/login` | Passed | Shared server action path |
| Add/edit/delete/export controls | Present | Absent |
| Database navigation | Present | Absent |
| Pagu/HPS/contract value/catatan | Present | Absent |
| Override history | Role-gated | Absent |

The first account-menu probe targeted the hidden mobile drawer while the
670-pixel browser panel was closed. The trigger was only 8 pixels wide and the
menu correctly stayed closed. Opening the drawer produced a 199-pixel trigger
and a working popup. A separate 1440-pixel viewport produced a 45-pixel desktop
trigger and the same working popup. This was a test setup issue, not an app bug.

## Risks and triggers

- The dashboard intentionally loads the full project projection and performs
  aggregation in the client. This is acceptable for the current dataset but
  grows linearly with project count.
- Technical filter options also derive years and companies from the complete
  technical projection, although the result is cached per user for five
  minutes.
- Re-run the density audit against the 36-project staging fixture before a
  release that materially changes dashboard analytics or project fields.
- Replace client aggregation with a role-aware aggregate RPC when active
  projects reach 500, authenticated ready-time p95 exceeds 2 seconds, or the
  route crosses its bundle ceiling.

## Limitations

- The database contained only one active project; this is not a high-density
  rendering test.
- Measurements were local and used a warm authenticated browser profile.
- LCP, INP, and CLS were not captured because the available browser surface did
  not expose a performance trace. Production claims require Lighthouse and/or
  real-user monitoring on the deployed URL.
- Vercel edge latency, Supabase network variance, and low-end mobile CPU cost
  are outside this local baseline.

## Follow-up

1. Keep the current implementation; do not add memoization or code splitting
   without a measured regression.
2. Run Lighthouse on staging and record LCP, INP, and CLS before calling the
   performance work production-complete.
3. Re-run this audit with the 36-project staging fixture and again at the
   500-project scaling trigger.
