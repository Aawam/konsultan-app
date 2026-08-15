# ADR-004: Monitoring Performance Budget and Scaling Trigger

## Status

Accepted

## Date

2026-08-15

## Context

The monitoring checkpoint now supports responsive Owner/Admin and Tenaga Ahli
flows. A local production audit found fast authenticated ready times, but the
initial JavaScript for the project list and dashboard is slightly above a
generic 200 KB gzip target.

The dashboard currently receives the full role-appropriate project projection
and calculates portfolio summaries in the client. The project list is already
paginated, while technical filter options use a cached full projection. With
one active project this design is fast and simple. Replacing it now with a new
aggregate API or aggressively splitting small interaction components would add
complexity without evidence of a user-visible bottleneck.

See `docs/performance_audit_2026-08-15.md` for the measurements.

## Decision

Retain the current dashboard aggregation and paginated list architecture.

Use these production-build regression ceilings:

- `/proyek`: at most 240 KB gzip initial JavaScript;
- `/proyek/dashboard`: at most 230 KB gzip initial JavaScript;
- global CSS: at most 20 KB gzip;
- authenticated ready-time p95: at most 2 seconds under a representative
  staging dataset;
- deployed Core Web Vitals: LCP at most 2.5 seconds, INP at most 200 ms, and
  CLS at most 0.1.

The bundle ceilings are checkpoint guardrails, not substitutes for Core Web
Vitals. They allow limited maintenance headroom above the measured baseline
without normalizing unbounded growth.

Replace client-side full-project dashboard aggregation with a role-aware
aggregate query/RPC when any of these triggers occurs:

- active non-deleted projects reach 500;
- authenticated ready-time p95 exceeds 2 seconds;
- the list or dashboard exceeds its bundle ceiling;
- production real-user monitoring reports poor Core Web Vitals.

## Alternatives Considered

### Introduce aggregate RPCs immediately

Rejected because current runtime is fast, the dataset is small, and a new RPC
would expand the database contract and role-security review without solving a
measured problem.

### Dynamically import every secondary interaction

Rejected because the route-specific bundle increment is small and widespread
lazy loading would add loading states and interaction latency. Code splitting
remains appropriate for a future component shown by bundle analysis to be a
material contributor.

### Enforce the generic 200 KB limit immediately

Rejected because most of the baseline is shared framework and app-shell code,
while measured ready time remains healthy. The checkpoint-specific ceilings
are tighter regression guards than having no budget and more actionable than a
limit the current stack cannot meet without disproportionate work.

### Do not define a budget

Rejected because bundle and dataset growth would then be detected only after a
user-visible regression.

## Consequences

- No production code changes are required by the 2026-08-15 audit.
- Monitoring remains simple while the dataset is small.
- Bundle growth has explicit ceilings and dataset growth has an explicit
  architectural trigger.
- The dashboard payload still grows linearly until a trigger is reached.
- Lighthouse or real-user monitoring is required before making claims about
  deployed LCP, INP, or CLS.
