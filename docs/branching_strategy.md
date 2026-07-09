# Branching Strategy

Status: active

Project ini memakai tiga branch utama.

## Branch Utama

| Branch | Fungsi | Aturan |
|---|---|---|
| `experiment` | Kerja utama dan uji coba fitur/refactor. | Semua perubahan awal masuk ke sini lebih dulu. |
| `staging` | Kandidat uji sebelum production. | Hanya menerima perubahan yang sudah hijau di `experiment`. |
| `main` | Deploy production. | Hanya menerima perubahan yang sudah lolos staging. |

## Alur Kerja

1. Kerjakan perubahan di `experiment`.
2. Jalankan verifikasi minimal: `npm run lint`, `npm test`, dan `npm run build`.
3. Push ke `experiment`.
4. Jika siap diuji sebagai kandidat deploy, fast-forward atau merge ke `staging`.
5. Jika staging sudah diterima, merge ke `main` untuk production.

## Catatan

- Branch sementara boleh dibuat untuk pekerjaan besar, tetapi harus pendek umur.
- Jangan langsung push pekerjaan eksperimen ke `main`.
- `staging` tidak dipakai untuk eksplorasi; isinya harus merepresentasikan kandidat deploy berikutnya.
- Archive branch hanya untuk riwayat transisi, bukan target kerja harian.
