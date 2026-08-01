# UI Conventions - Konsulindo Project Suite

**Tanggal:** 2026-06-16

Panduan ini menjelaskan pola UI yang sedang dipakai. Aplikasi adalah tool operasional internal, jadi desain harus padat, mudah dipindai, dan tidak bergaya landing page.

---

## Theme

Theme diatur di `app/globals.css` dengan Tailwind CSS v4, shadcn tokens, dan CSS variables. Root layout menjalankan script kecil sebelum hydration:

- `localStorage.theme === "light"` menghapus class `dark`.
- Selain itu aplikasi memakai dark mode default.

Gunakan token Tailwind/CSS variable, bukan hex/rgb hardcoded. Light mode memakai canvas netral-biru yang tenang; dark mode memisahkan canvas, card, dan control dengan jelas. Jangan menambah kembali border putih transparan atau gradient dekoratif pada card.

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
| `border-border-subtle` | Internal divider dan separator baris tabel. |
| `border-border` | Boundary card, panel, dan control standar. |
| `border-border-strong` / `border-input` | Input, control terpilih, dan boundary kuat. |
| `bg-sidebar` / `var(--app-sidebar-bg)` | Sidebar background. |

### Surface Hierarchy

- `bg-background` adalah canvas halaman.
- `bg-card` adalah panel atau table container yang dibatasi.
- `bg-muted` untuk control recessed, soft header, hover state, atau emphasis ringan.
- Input memakai `bg-background border-input` agar tetap terbaca di dalam card pada kedua theme.
- Card standar bersifat flat. Semantic tint hanya untuk workflow, warning, completion, atau destructive state yang nyata.

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
<aside className="fixed inset-y-0 left-0 w-48 min-[360px]:w-52 sm:w-56 lg:sticky lg:w-[4.35rem]" />
<div className="flex min-h-screen min-w-0 flex-1 flex-col">
  <header className="sticky top-0 h-12 px-3 lg:h-14 lg:px-5" />
  <main className="flex-1 px-3 py-4 lg:px-6 lg:py-6" />
</div>
```

Conventions:

- Drawer width is `w-48` below 360px, `w-52` from 360px, and `w-56` from 640px through 1023px.
- Desktop sidebar is permanently icon-only at `w-[4.35rem]` from 1024px.
- Header is `h-12 px-3` on compact viewports and `h-14 px-5` on desktop.
- Main content uses `px-3 py-4` on compact viewports and `px-6 py-6` on desktop.
- Prefer compact sections and tables over large marketing-style blocks.
- Do not nest cards inside cards unless the inner card is a repeated data item.

---

## Shared CSS Classes

Defined in `app/globals.css`.

### Field Input

```tsx
<Input className="field-input" />
```

Use for form inputs. It applies an inset surface, strong control border, text color, placeholder color, and top margin.

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

### Typography

- Gunakan `page-eyebrow` untuk konteks halaman, `page-title` untuk satu `h1`, dan `page-summary` hanya untuk konteks operasional yang hidup.
- Gunakan `section-title` pada header data panel dan `detail-label` untuk label field.
- Value memakai `text-sm font-medium`; jangan membuat label dan value sama-sama bold.
- Gunakan `font-mono` hanya untuk currency, angka, persentase, tanggal, kode, dan durasi. Tambahkan `tabular-nums` jika alignment kolom penting.

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
<div className="overflow-hidden rounded-xl border border-border bg-card">
  <Table className="table-fixed">
    <TableHeader>
      <TableRow className="border-border bg-muted/45 hover:bg-transparent">
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
| Primary | `bg-brand text-primary-foreground hover:bg-brand/90` |
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

- Owner/Admin: Tambah Proyek, Monitoring (Daftar Proyek, Dashboard), dan Database (Perusahaan, Tenaga Ahli).
- Tenaga Ahli: Monitoring (Daftar Proyek, Dashboard).

Active nav uses `bg-brand/10 text-brand` and a thin left brand rail. Disabled items use muted text and `cursor-not-allowed`.

- Every enabled navigation item exposes its label in a tooltip on pointer hover and keyboard focus.
- The account identity in the sidebar footer is the account-menu trigger. Its menu opens upward and contains the logout action.
- At `1024px` and wider, the sidebar is permanently icon-only and does not expose an expand/collapse control.
- Below `1024px`, navigation uses an overlay drawer with complete labels. It is 192px on narrow phones, 208px from 360px, and 224px from 640px so it does not consume a fixed proportion of every screen. Selecting a navigation item closes the drawer.
- Navigation rows are 40px high below 1024px with 13px labels on narrow phones and 14px labels from 640px; desktop icon rows remain 36px high.

Responsive foundation:

- Monitoring pages must remain readable at `320px`, `375px`, `768px`, `1024px`, and `1440px` without document-level horizontal overflow.
- Dense monitoring tables may switch to compact cards or use a clearly labelled, locally scrollable table container on smaller screens.
- Desktop-only workflow editors may provide a mobile notice instead of full mobile feature parity, but navigation and account actions must remain available.

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
