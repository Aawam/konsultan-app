# UI Conventions - Konsulindo Project Suite

**Tanggal:** 2026-06-16

Panduan ini menjelaskan pola UI yang sedang dipakai. Aplikasi adalah tool operasional internal, jadi desain harus padat, mudah dipindai, dan tidak bergaya landing page.

---

## Theme

Theme diatur di `app/globals.css` dengan Tailwind CSS v4, shadcn tokens, dan CSS variables. Root layout menjalankan script kecil sebelum hydration:

- `localStorage.theme === "light"` menghapus class `dark`.
- Selain itu aplikasi memakai dark mode default.

Gunakan token Tailwind/CSS variable, bukan hex/rgb hardcoded.

### Core Tokens

| Token | Use |
|---|---|
| `bg-background` | Page background. |
| `bg-card` | Cards, sections, contained panels. |
| `bg-surface` | Topbar and elevated shell surfaces. |
| `bg-surface-2` | Secondary elevated surface. |
| `bg-muted` | Inputs, table hover, soft fills. |
| `text-foreground` | Primary text. |
| `text-muted-foreground` | Labels, metadata, secondary text. |
| `border-border` | Standard borders. |
| `bg-sidebar` / `var(--app-sidebar-bg)` | Sidebar background. |

### Semantic Accents

| Alias | Use |
|---|---|
| `brand` | Primary action, active nav, main accent. |
| `teal` | Pengawasan and secondary positive accent. |
| `violet` | Perencanaan and design/planning accent. |
| `amber` | Warnings, overrides, contract totals. |
| `emerald` | Completed/success states. |
| `rose` / `destructive` | Errors and delete actions. |

Use opacity modifiers for soft fills: `bg-brand/10`, `border-brand/20`, `bg-amber/15`.

---

## Layout Shell

The main app shell lives in `components/layout/sidebar-layout.tsx`.

```tsx
<aside className="fixed left-0 top-0 z-20 h-screen w-56" />
<div className="ml-56 flex min-h-screen flex-col">
  <header className="sticky top-0 z-10 h-14 bg-surface/80 backdrop-blur-md" />
  <main className="flex-1 px-6 py-6" />
</div>
```

Conventions:

- Sidebar width is `w-56`.
- Header height is `h-14`.
- Main content starts at `px-6 py-6`.
- Prefer compact sections and tables over large marketing-style blocks.
- Do not nest cards inside cards unless the inner card is a repeated data item.

---

## Shared CSS Classes

Defined in `app/globals.css`.

### Field Input

```tsx
<Input className="field-input" />
```

Use for form inputs. It applies muted light/dark backgrounds, borders, text color, placeholder color, and top margin.

### Select

```tsx
<SelectContent className="select-content">
  <SelectItem className="select-item">...</SelectItem>
</SelectContent>
```

Use on Radix/shadcn Select menus so dropdowns match app surfaces.

### Table Head

```tsx
<TableHead className="table-head">Nama</TableHead>
```

Use for compact uppercase table headers.

### Stat Card

```tsx
<div className="stat-card">
  <p className="stat-label">Total</p>
  <p className="stat-value">24</p>
</div>
```

Used by dashboard/list metrics.

### Section Card

```tsx
<div className="section-card">
  <div className="section-header">
    <p className="section-title">Identitas</p>
  </div>
  <div className="section-body">...</div>
</div>
```

Use for bounded operational sections. Avoid decorative oversized cards.

---

## Components

Keep `components/ui/` for primitives and shared helpers that are actually used by the app. Domain wrappers belong in `components/proyek/` or `components/database/`.

### TabGroup

```tsx
<TabGroup
  tabs={[{ label: 'Semua', value: 'semua' }, { label: '2026', value: 2026 }]}
  value={active}
  onChange={setActive}
/>
```

Use for filter-style tabs. Active state is high contrast; inactive state uses muted text.

### StatCard and MiniBar

```tsx
<StatCard label="Selesai" value={12} color="text-emerald" sub="dari total" />
<MiniBar label="Persiapan" count={5} total={20} colorClass="bg-brand" />
```

Use for dashboard summaries and compact distributions.

### ConfirmDialog

Use for destructive actions and business-rule overrides. Button text must describe the action clearly.

### PageError

Use for server/page errors when a data fetch fails.

---

## Domain Badges

### BadgeJenis

- `Perencanaan`: violet.
- `Pengawasan`: teal.

### BadgeTahap

Phase colors are defined in `components/proyek/badges.tsx`. Keep phase labels aligned with `lib/constants/proyek.ts`.

### BadgeOverride

Small amber `!` indicator for records with `pernah_dioverride === true`.

---

## Tables

Use compact data tables for operational screens.

```tsx
<div className="rounded-xl border border-border bg-card overflow-hidden">
  <Table className="table-fixed">
    <TableHeader>
      <TableRow className="border-border bg-muted/40 hover:bg-transparent">
        <TableHead className="table-head">Kolom</TableHead>
      </TableRow>
    </TableHeader>
  </Table>
</div>
```

Conventions:

- Use `table-fixed` where column stability matters.
- Use `truncate` on long project/company/dinas names.
- Use `font-mono` for numbers, dates, codes, and currency values.
- Hover rows with `hover:bg-muted/40`.

---

## Buttons and Actions

Prefer existing `components/ui/button.tsx` where practical.

| Type | Pattern |
|---|---|
| Primary | `bg-brand text-white hover:bg-brand/90` |
| Secondary | `border border-border bg-card text-foreground hover:bg-muted` |
| Destructive | `bg-rose/10 text-rose border border-rose/20 hover:bg-rose/20` |
| Warning/Override | `bg-amber/15 text-amber border border-amber/20 hover:bg-amber/25` |
| Disabled nav | muted text, `cursor-not-allowed`, reduced opacity |

Use icons from `lucide-react` for icon buttons when adding new controls.

---

## Forms

Conventions:

- Use two-column grids on desktop: `grid grid-cols-2 gap-4`.
- Use `col-span-2` for long text, addresses, notes, and section-wide controls.
- Apply `field-input` to inputs.
- Keep validation messages close to the field or section they affect.
- Business rule violations can warn and require override reason, but schema validation still belongs in `lib/validations/`.

---

## Sidebar

Sidebar nav groups currently:

- Monitoring: Daftar Proyek, Dashboard.
- Dokumen: Generator Penawaran, Generator BAP, disabled in nav.
- Referensi: Database Perusahaan.

Active nav uses `bg-brand/10 text-brand` and a thin left brand rail. Disabled items use muted text and `cursor-not-allowed`.

---

## Content Rules

- Use Indonesian labels in the product UI.
- Keep table and card labels concise.
- Use `formatRupiah` and `formatTanggal` from `lib/utils.ts` for display formatting.
- Do not add instructional text to the app UI unless it resolves a real empty/error state.
- Keep screens dense enough for repeated internal use.

---

## Accessibility

- Keep visible focus styles from Tailwind/shadcn defaults.
- Use semantic buttons for actions and links for navigation.
- Dialog actions must be keyboard reachable.
- Do not rely on color alone for destructive or override decisions; include clear labels.

---

## When Adding New UI

1. Check `components/ui/` before creating a new primitive.
2. Put domain-specific components under their domain folder.
3. Use theme tokens from `app/globals.css`.
4. Keep card radius aligned with existing `rounded-xl` sections unless using a shadcn primitive.
5. Add tests for non-trivial formatting, validation, or business logic in `lib/`.
