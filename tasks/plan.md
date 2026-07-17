# Implementation Plan: Operational UI Hierarchy Cleanup

## Overview

Bring the project list, dashboard, project detail, and database screens under one compact operational UI system. The change is visual only: no database, API, or workflow behavior will change. The goal is faster scanning, consistent typography, and fewer competing card treatments.

## Architecture Decisions

- Keep Inter Variable as the interface font and Geist Mono Variable for figures, dates, codes, and currency. Do not introduce another typeface.
- Keep the existing shadcn primitives and semantic color tokens. The work will consolidate their usage, not add a UI library.
- Maintain `section-card` for dense data panels, but make ordinary sections visually quieter. Semantic color remains for state, workflow, and status—not decoration.
- Make shared primitives the source of truth before changing consuming pages. Local detail-page card helpers will be replaced or aligned only after the primitives exist.
- Confirm the intended project-location data before removing the duplicate "Lokasi" / "Kecamatan" row; it may be a data-model gap rather than a presentation duplicate.

## Dependency Graph

```text
Typography + surface tokens
        |
        +-- Shared PageHeader / SectionCard / StatCard patterns
                |
                +-- Dashboard filter and metric layout
                |
                +-- Project list header and statistic strip
                |
                +-- Project-detail summary and information sections
                        |
                        +-- Browser visual and responsive verification
```

## Task List

### Phase 1: System foundation

#### Task 1: Define the compact type and surface contract

**Description:** Update the UI conventions and shared CSS classes with the final hierarchy: eyebrow, page title, section title, field label/value, and numeric text. Flatten ordinary cards while retaining semantic state treatments.

**Acceptance criteria:**
- [ ] A single documented type scale covers page, section, field, helper, and numeric content.
- [ ] Existing semantic color tokens remain the only source of color.
- [ ] Standard information panels no longer combine texture, card gradient, header gradient, and shadow by default.

**Verification:**
- [ ] Review light and dark tokens side by side.
- [ ] Run lint/build after the first consumer adopts the revised classes.

**Dependencies:** None.

**Files likely touched:**
- `app/globals.css`
- `docs/ui_conventions.md`

**Estimated scope:** Small.

#### Task 2: Normalize shared layout primitives

**Description:** Align `PageHeader`, `SectionCard`, and stat-card helpers with the new type and spacing contract so page implementations do not define competing local versions.

**Acceptance criteria:**
- [ ] Page titles, section headings, and stat cards use one spacing and typography model.
- [ ] Primitives preserve their current API unless a small, justified variant is necessary.
- [ ] No new custom UI primitive duplicates an existing shadcn or project component.

**Verification:**
- [ ] Type-check affected components.
- [ ] Inspect the project-list and database consumers for regressions.

**Dependencies:** Task 1.

**Files likely touched:**
- `components/ui/page-header.tsx`
- `components/ui/section-card.tsx`
- `components/ui/stat-card.tsx`
- `app/globals.css`

**Estimated scope:** Medium.

### Checkpoint: Foundation

- [ ] Typography and card rules are approved before page-specific work.
- [ ] `npm run lint` and `npm run build` pass.

### Phase 2: High-traffic project screens

#### Task 3: Simplify the project-list command area

**Description:** Replace the explanatory page-header sentence with live utility context, retain the primary action hierarchy, and align the statistic strip with shared stat cards.

**Acceptance criteria:**
- [ ] The list header prioritizes title, active result context, and actions.
- [ ] Export remains secondary; “Tambah Proyek” remains the only primary action.
- [ ] Metrics remain clickable and their active state is distinguishable without relying only on color.

**Verification:**
- [ ] Exercise search, filter, export, and add-project actions.
- [ ] Check desktop and narrow viewport wrapping.

**Dependencies:** Task 2.

**Files likely touched:**
- `components/proyek/proyek-table-client.tsx`

**Estimated scope:** Small.

#### Task 4: Rebuild dashboard information hierarchy

**Description:** Separate persistent year controls from secondary filters, make filter state legible, and rationalize metric/card density without changing dashboard calculations or destinations.

**Acceptance criteria:**
- [ ] Year selection is immediately visible; type, company, and status are visually secondary.
- [ ] Filter controls remain keyboard usable and communicate the number of filtered projects.
- [ ] Metrics, distributions, and recent projects follow the shared heading/card system.

**Verification:**
- [ ] Exercise every filter combination and metric link.
- [ ] Verify light/dark mode and a 375px-wide viewport.

**Dependencies:** Task 2.

**Files likely touched:**
- `components/proyek/dashboard-client.tsx`

**Estimated scope:** Medium.

#### Task 5: Recompose project-detail content around operational priority

**Description:** Align the detail page’s local metric/detail patterns with shared primitives; make workflow, identity, execution, commercial data, notes, and audit information scan in priority order.

**Acceptance criteria:**
- [ ] The header, project summary, metrics, and information rows use the shared type scale.
- [ ] Labels are subordinate to values; values are no longer all semibold.
- [ ] The page has a predictable desktop two-column composition and a single-column mobile flow.
- [ ] The duplicate location output is resolved only after confirming the intended data field.

**Verification:**
- [ ] Verify Owner/Admin and non-commercial roles.
- [ ] Check long project names, long notes, empty values, and override history.

**Dependencies:** Task 2; location decision.

**Files likely touched:**
- `app/proyek/[id]/page.tsx`
- Potentially `lib/types/proyek.ts` only if the location decision exposes a missing field.

**Estimated scope:** Medium.

### Checkpoint: Project flows

- [ ] `npm run lint` and `npm run build` pass.
- [ ] List → detail → RAB navigation still works.
- [ ] No permission-gated commercial data appears to unauthorized users.

### Phase 3: Cross-screen validation and documentation

#### Task 6: Validate responsive appearance and codify the system

**Description:** Verify the app in a browser at desktop and mobile widths, fix only discovered visual regressions, then record the final rules and examples in the UI conventions.

**Acceptance criteria:**
- [ ] No horizontal overflow in project list, dashboard filters, or detail headers at 375px.
- [ ] Dark and light themes retain readable hierarchy and accessible focus states.
- [ ] UI conventions include final examples for headings, cards, statistics, filters, and information rows.

**Verification:**
- [ ] Browser screenshot comparison at 375px, 768px, and 1440px.
- [ ] Keyboard-test filters, links, dialogs, and action buttons.

**Dependencies:** Tasks 3–5.

**Files likely touched:**
- `docs/ui_conventions.md`
- Only files with verified visual defects

**Estimated scope:** Small.

## Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Flattening cards removes useful status cues | Medium | Keep accent color and tinted treatment only for semantic states. |
| Shared CSS alters database/form pages unintentionally | Medium | Inspect all `section-card` consumers before changing global classes. |
| Detail-page location is genuinely two distinct data concepts | High | Confirm the data source before deleting or renaming the row. |
| Responsive filters become hidden rather than usable | Medium | Test keyboard and 375px layouts before accepting the dashboard change. |

## Approval Gate

Start implementation after approval of the foundation direction: compact hierarchy, quieter cards, and a two-level dashboard filter layout.

## Delivery Status

- Completed: shared theme, typography, page/section/stat primitives, project list, dashboard, project detail, and UI conventions.
- Verified: `npm run lint`, `npm test`, and `npm run build` all pass.
- Pending local follow-up: inspect authenticated project screens at 390px, 768px, and 1440px in both themes once the in-app browser session is signed in.

---

# Follow-up Plan: Workflow UX Refinement

## Scope

Improve the existing frontend workflow only. No data model, Supabase query, permission, calculation, or workflow-rule changes.

## Task List

### Task 1: Preserve dashboard context in project-list navigation

**Description:** Store dashboard filters in the URL and compose metric/list links from the active filter state.

**Acceptance criteria:**
- [ ] Reloading or sharing the dashboard retains the selected filters.
- [ ] Opening a metric or project list preserves year, type, company, and status context.
- [ ] Existing analytics calculations and destinations do not change.

**Files likely touched:**
- `components/proyek/dashboard-client.tsx`

**Estimated scope:** Small.

### Task 2: Compact the project form on narrow screens

**Description:** Keep the desktop progress and summary side panels, but replace them with a compact stepper and final-step summary on smaller viewports.

**Acceptance criteria:**
- [ ] The first editable field is visible without scrolling through a full progress panel on a 390px viewport.
- [ ] Users can still see the current step, validation state, and draft-saving action.
- [ ] Desktop three-column form behavior remains intact.

**Files likely touched:**
- `components/proyek/proyek-form-shell.tsx`
- `components/proyek/form/proyek-form-panels.tsx`

**Estimated scope:** Medium.

### Checkpoint: Core flow

- [ ] Dashboard → project list retains context.
- [ ] Create-project flow is usable at 390px and desktop widths.

### Task 3: Correct interaction and theme accessibility

**Description:** Align visual click targets with keyboard access, name icon-only controls, and use the new semantic error-border token.

**Acceptance criteria:**
- [ ] Every project-row preview action is keyboard reachable.
- [ ] Preview close and theme-toggle controls have Indonesian accessible names.
- [ ] Invalid form fields remain visible in dark mode without raw white border overrides.

**Files likely touched:**
- `components/proyek/proyek-table-client.tsx`
- `components/proyek/proyek-slideover.tsx`
- `components/proyek/proyek-form-shell.tsx`
- `components/ui/theme-toggle.tsx`

**Estimated scope:** Medium.

### Task 4: State the RAB mobile boundary

**Description:** Keep the existing dense RAB table for desktop, but present a clear compact-viewport state instead of an unannounced 1320px scrollable editor.

**Acceptance criteria:**
- [ ] Narrow screens receive a clear explanation and desktop access path.
- [ ] Desktop inline RAB editing remains unchanged.

**Files likely touched:**
- `components/proyek/rab-maker-client.tsx`

**Estimated scope:** Small.

### Checkpoint: Verification

- [x] `npm run lint`, targeted dashboard-filter test, and `npm run build` pass.
- [ ] Browser-check 390px, 768px, and 1440px in light and dark modes.
- [ ] Keyboard-check project preview, theme toggle, form stepper, and RAB mobile state.

## Follow-up Delivery Status

- Completed: URL-backed dashboard context, compact mobile project form, accessible project controls, semantic invalid-field borders, and the RAB compact-screen state.
- Verified: `npm run lint`, `npm test -- lib/dashboard-filters.test.ts`, and `npm run build` pass.
- Pending: authenticated browser walkthrough at the stated breakpoints and themes; no authenticated test session is available in this workspace.

## Production SQL Hardening

### Objective

Make the ordered Supabase migrations safe to promote from staging to a future
production project, while preserving current application behavior and staging
data.

### Phases

1. Fix active RPC blockers with forward-only migrations and rollback-only
   integration verification.
2. Verify the fixes against staging before considering any schema cleanup.
3. Remove only objects proven unused by runtime references and live database
   data, using explicit guards that abort on unexpected data.
4. Establish tracked Supabase migration history and a reproducible fresh-project
   baseline before production deployment.
5. Require a reachable production Supabase project, backup, and explicit final
   approval before any production mutation.

### Current safety boundary

- Staging may receive reviewed, reversible forward migrations.
- Production is read-only/unavailable until its configured host resolves.
- Dummy seed SQL is excluded from production deployment.
- `proyek_internal` is not a cleanup target until its planned commercial-data
  boundary is explicitly accepted or retired.
