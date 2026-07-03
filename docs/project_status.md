# Project Status - Konsulindo Project Suite

**Tanggal:** 2026-06-16  
**Versi:** 0.4 internal  
**Framework:** Next.js 16.2.3 App Router  
**Status umum:** aktif dikembangkan, modul Proyek menjadi modul utama produksi.

---

## Stack

| Layer | Teknologi |
|---|---|
| Framework | Next.js 16 App Router, React 19 |
| Styling | Tailwind CSS v4, shadcn/ui, Radix UI |
| Database/Auth | Supabase PostgreSQL + Supabase Auth |
| Bahasa | TypeScript 5 |
| Validasi | Zod |
| Toast | Sonner |
| Export | xlsx |
| Charts | Recharts |
| Test | Vitest, Testing Library, jsdom |
| Runtime | Node.js >=20.19.0 (`.nvmrc` uses 22) |

---

## Modul

### Proyek

| Fitur | Status | Lokasi |
|---|---|---|
| Daftar proyek, filter, search, export | Selesai | `/proyek` |
| Dashboard proyek | Selesai | `/proyek/dashboard` |
| Detail proyek full page | Selesai | `/proyek/[id]` |
| Detail proyek slide-over | Selesai | inline dari tabel |
| Tambah proyek | Selesai | `/proyek/baru` |
| Edit proyek | Selesai | `/proyek/[id]/edit` |
| Hapus proyek | Selesai | slide-over dan API |
| Validasi anggaran/tanggal + override log | Selesai | form proyek + `/api/proyek/[id]/override` |
| Status bendera `Work`, `Borrowed`, `Get Borrowed` | Selesai | form, tabel, dashboard |

### Database Perusahaan

| Fitur | Status | Lokasi |
|---|---|---|
| Daftar perusahaan | Selesai | `/database` |
| Tab semua proyek | Selesai | `/database` |
| Agregasi Dinas/SKPD | Selesai | `/database` |
| Detail perusahaan expandable | Selesai | `components/database/database-client.tsx` |

### Dokumen

| Fitur | Status | Catatan |
|---|---|---|
| Penawaran | Dihapus dari scope aplikasi | Route, form, API, dan action sudah tidak menjadi bagian produk aktif. |
| BAP | Dihapus dari scope aplikasi | Modul dokumen pembayaran tidak lagi dipertahankan. |

### Auth

| Fitur | Status | Lokasi |
|---|---|---|
| Login Supabase | Selesai | `/login` |
| Proteksi route | Selesai | `proxy.ts` |
| Logout | Selesai | `SidebarLayout` |

---

## API Routes

| Route | Method | Tujuan |
|---|---|---|
| `/api/proyek` | POST | Buat proyek dari payload form. |
| `/api/proyek/[id]` | GET | Ambil detail proyek dan override log. |
| `/api/proyek/[id]` | PATCH | Update proyek. |
| `/api/proyek/[id]` | DELETE | Hapus proyek. |
| `/api/proyek/[id]/override` | POST | Simpan override log. |
| `/api/proyek/export` | GET | Data proyek untuk export. |
---

## Database Utama

Kode aktif saat ini bergantung pada tabel berikut:

- `proyek`
- `perusahaan`
- `override_log`
- `dinas_skpd`

Tabel legacy yang sebelumnya dipakai modul dokumen dan sekarang bisa ditinjau untuk dihapus setelah audit database:

- `personil`
- `personil_proyek`
- `pengalaman_perusahaan`
- `nomor_surat`
- `template_metodologi`
- `checklist_proyek`
- `termin_pembayaran`

Types Supabase berada di `lib/database.types.ts`. Client Supabase dipisah menjadi:

- `lib/supabase-browser.ts` untuk Client Components.
- `lib/supabase-config.ts` untuk helper konfigurasi environment Supabase.
- `lib/supabase-server.ts` untuk Server Components, Server Actions, dan Route Handlers.

---

## Business Logic

Progress proyek dihitung dari `tahap_progress` lewat `lib/constants/proyek.ts`.

- `Perencanaan`: Persiapan & SPMK sampai Selesai BAST.
- `Pengawasan`: Persiapan sampai Selesai BAST.
- Warna progress diatur oleh `TAHAP_BAR_COLOR`.

Validasi proyek ada di `lib/validations/proyek.ts` dan dites di `lib/validations/proyek.test.ts`. Form memberi warning untuk:

- HPS melebihi Pagu Dana.
- Nilai Penawaran melebihi HPS.
- Tanggal selesai sebelum tanggal mulai.

Pelanggaran bisa dioverride dengan alasan, lalu disimpan di `override_log`.

---

## Test Coverage

Test yang ada:

- `lib/actions/proyek.test.ts`
- `lib/constants/proyek.test.ts`
- `lib/utils.test.ts`
- `lib/validations/proyek.test.ts`

Konfigurasi:

- `vitest.config.ts`
- `vitest.setup.ts`

Jalankan dengan:

```bash
npm test
```

---

## Catatan Teknis

- `vercel.json` menjalankan Vercel Functions di region `sin1` agar dekat dengan pengguna Indonesia dan Supabase Singapore.
- `proxy.ts` hanya menjaga route halaman (`/login`, `/proyek/*`, `/database/*`). API route melakukan auth sendiri agar request API tidak selalu melewati proxy global.
- API route memakai helper authenticated Supabase server client dari `lib/supabase-server.ts`.
- Select detail proyek dan override log dipusatkan di `lib/queries/proyek-selects.ts` supaya payload Supabase tidak memakai `select('*')`.
- Create/edit proyek memakai loader referensi bersama agar daftar perusahaan dan dinas dibaca dengan satu client Supabase per request.
- `app/proyek/loading.tsx` dan `app/database/loading.tsx` memberi skeleton cepat untuk route dinamis yang menunggu Supabase.
- `public/templates/` masih boleh dipakai untuk aset referensi lokal, tetapi tidak lagi dibutuhkan untuk fitur inti aplikasi.
- `.env.example` disimpan sebagai template konfigurasi aman; `.env.local` tetap lokal dan di-ignore.
- GitHub Actions menjalankan `npm ci`, lint, dan test di `.github/workflows/ci.yml`.
- `.next/`, `tsconfig.tsbuildinfo`, `.DS_Store`, `.claude/`, `.vscode/`, dan `supabase/.temp/` adalah artefak lokal dan tidak perlu disimpan.
- `CLAUDE.md` dihapus karena hanya berisi pointer ke `AGENTS.md`; `AGENTS.md` tetap dipakai sebagai instruksi agent lintas tooling.
- Folder staging lama `public/external/fixes*` sudah tidak menjadi bagian struktur aplikasi. File di area itu adalah salinan patch/eksperimen, bukan source aktif.
- Docs sekarang memakai lowercase snake_case: `project_status.md`, `project_structure.md`, `ui_conventions.md`.
- Cleanup Supabase untuk scope monitoring-only disiapkan di `docs/DB_Simplification_Audit.sql` dan `docs/DB_Simplification_Cleanup.sql`.
