BEGIN;

-- Sample data extracted from /Users/awam/Downloads/AHSP Masterfile v0.4.xlsx.
-- Scope: a small Masterfile AHSP seed for UI/testing, not a complete AHSP import.

INSERT INTO public.satuan (nama_satuan)
SELECT v.nama_satuan
FROM (
  VALUES
    ('m'),
    ('m2'),
    ('OH'),
    ('OJ'),
    ('m3'),
    ('kg'),
    ('Liter'),
    ('Batang'),
    ('Lembar'),
    ('M'''),
    ('jam')
) AS v(nama_satuan)
WHERE NOT EXISTS (
  SELECT 1 FROM public.satuan s
  WHERE lower(s.nama_satuan) = lower(v.nama_satuan)
);

INSERT INTO public.kategori_pekerjaan_master (nama_kategori)
SELECT v.nama_kategori
FROM (
  VALUES
    ('Pekerjaan Persiapan'),
    ('Pekerjaan Jalan')
) AS v(nama_kategori)
WHERE NOT EXISTS (
  SELECT 1 FROM public.kategori_pekerjaan_master k
  WHERE lower(k.nama_kategori) = lower(v.nama_kategori)
);

INSERT INTO public.master_upah (nama_upah, satuan_id, harga_dasar)
SELECT v.nama_upah, s.id, v.harga_dasar
FROM (
  VALUES
    ('Pekerja', 'OH', 176000::numeric),
    ('Tukang Kayu', 'OH', 186000::numeric),
    ('Tukang Batu', 'OH', 186000::numeric),
    ('Kepala Tukang', 'OH', 196000::numeric),
    ('Mandor', 'OH', 206000::numeric)
) AS v(nama_upah, nama_satuan, harga_dasar)
JOIN public.satuan s ON lower(s.nama_satuan) = lower(v.nama_satuan)
WHERE NOT EXISTS (
  SELECT 1
  FROM public.master_upah u
  JOIN public.satuan su ON su.id = u.satuan_id
  WHERE lower(u.nama_upah) = lower(v.nama_upah)
    AND lower(su.nama_satuan) = lower(v.nama_satuan)
);

INSERT INTO public.master_bahan (nama_bahan, satuan_id, harga_dasar)
SELECT v.nama_bahan, s.id, v.harga_dasar
FROM (
  VALUES
    ('Kayu kaso 5/7', 'm3', 3950000::numeric),
    ('Kayu kaso 5/7', 'Batang', 70535.7142857143::numeric),
    ('Kayu papan 3/20', 'm3', 5500000::numeric),
    ('Paku biasa 2” - 5”', 'kg', 22000::numeric),
    ('Paku biasa 2” - 5”', 'M''', 22000::numeric),
    ('Semen portland', 'kg', 1820::numeric),
    ('Semen portland', 'm3', 1820::numeric),
    ('Pasir beton kg', 'kg', 474.428571428571::numeric),
    ('Pasir beton kg', 'm3', 474.428571428571::numeric),
    ('Kerikil kg', 'kg', 396.637037037037::numeric),
    ('Kerikil kg', 'm3', 396.637037037037::numeric),
    ('Air', 'Liter', 100::numeric),
    ('Residu', 'Liter', 57600::numeric),
    ('Seng gelombang', 'Lembar', 63500::numeric),
    ('Seng gelombang', 'kg', 63500::numeric),
    ('Agg Pokok', 'm3', 1::numeric),
    ('Agg Pengunci', 'm3', 1::numeric),
    ('Agg Penutup', 'kg', 1::numeric),
    ('Aspal', 'kg', 1::numeric)
) AS v(nama_bahan, nama_satuan, harga_dasar)
JOIN public.satuan s ON lower(s.nama_satuan) = lower(v.nama_satuan)
WHERE NOT EXISTS (
  SELECT 1
  FROM public.master_bahan b
  JOIN public.satuan sb ON sb.id = b.satuan_id
  WHERE lower(b.nama_bahan) = lower(v.nama_bahan)
    AND lower(sb.nama_satuan) = lower(v.nama_satuan)
);

INSERT INTO public.master_alat (nama_alat, satuan_id, harga_dasar)
SELECT v.nama_alat, s.id, v.harga_dasar
FROM (
  VALUES
    ('Wheel Loader', 'jam', 1::numeric),
    ('Dump Truck 1', 'jam', 1::numeric),
    ('Dump Truck 2', 'jam', 1::numeric),
    ('Dump Truck 3', 'jam', 1::numeric),
    ('Three Wheel Roller', 'jam', 1::numeric),
    ('Asphalt Distributor', 'jam', 1::numeric)
) AS v(nama_alat, nama_satuan, harga_dasar)
JOIN public.satuan s ON lower(s.nama_satuan) = lower(v.nama_satuan)
WHERE NOT EXISTS (
  SELECT 1
  FROM public.master_alat a
  JOIN public.satuan sa ON sa.id = a.satuan_id
  WHERE lower(a.nama_alat) = lower(v.nama_alat)
    AND lower(sa.nama_satuan) = lower(v.nama_satuan)
);

INSERT INTO public.ahsp_items (
  kode_analisa,
  uraian_pekerjaan,
  kategori_id,
  satuan_id,
  profit_persen_default
)
SELECT v.kode_analisa, v.uraian_pekerjaan, k.id, s.id, v.profit_persen_default
FROM (
  VALUES
    (
      'A.1.1.1.1',
      'Pembuatan 1 m'' pagar sementara dari kayu tinggi 2 meter',
      'Pekerjaan Persiapan',
      'm',
      10::numeric
    ),
    (
      'A.1.1.1.2',
      'Pembuatan 1 m'' pagar sementara dari seng gelombang rangka kayu tinggi 2 meter',
      'Pekerjaan Persiapan',
      'm',
      10::numeric
    ),
    (
      'A.1.1.1.3',
      'Pembuatan 1 m2 pagar sementara dari kawat duri tinggi 2 meter',
      'Pekerjaan Persiapan',
      'm2',
      10::numeric
    ),
    (
      '1.1.2.5',
      'Pembuatan 1 m2 jalan sementara lapis macadam',
      'Pekerjaan Jalan',
      'm2',
      10::numeric
    )
) AS v(kode_analisa, uraian_pekerjaan, nama_kategori, nama_satuan, profit_persen_default)
JOIN public.kategori_pekerjaan_master k ON lower(k.nama_kategori) = lower(v.nama_kategori)
JOIN public.satuan s ON lower(s.nama_satuan) = lower(v.nama_satuan)
WHERE NOT EXISTS (
  SELECT 1 FROM public.ahsp_items ai
  WHERE ai.kode_analisa = v.kode_analisa
);

WITH detail_values AS (
  SELECT *
  FROM (
    VALUES
      ('A.1.1.1.1', 'upah', 'Pekerja', 'OH', 0.6::numeric),
      ('A.1.1.1.1', 'upah', 'Tukang Kayu', 'OH', 0.2::numeric),
      ('A.1.1.1.1', 'upah', 'Tukang Batu', 'OH', 0.2::numeric),
      ('A.1.1.1.1', 'upah', 'Kepala Tukang', 'OH', 0.04::numeric),
      ('A.1.1.1.1', 'upah', 'Mandor', 'OH', 0.013::numeric),
      ('A.1.1.1.1', 'bahan', 'Kayu kaso 5/7', 'm3', 0.0387::numeric),
      ('A.1.1.1.1', 'bahan', 'Kayu papan 3/20', 'm3', 0.0396::numeric),
      ('A.1.1.1.1', 'bahan', 'Paku biasa 2” - 5”', 'kg', 0.5872::numeric),
      ('A.1.1.1.1', 'bahan', 'Semen portland', 'kg', 26.406::numeric),
      ('A.1.1.1.1', 'bahan', 'Pasir beton kg', 'kg', 61.56::numeric),
      ('A.1.1.1.1', 'bahan', 'Kerikil kg', 'kg', 83.349::numeric),
      ('A.1.1.1.1', 'bahan', 'Air', 'Liter', 17.415::numeric),
      ('A.1.1.1.1', 'bahan', 'Residu', 'Liter', 0.4::numeric),
      ('A.1.1.1.2', 'upah', 'Pekerja', 'OH', 0.25::numeric),
      ('A.1.1.1.2', 'upah', 'Tukang Kayu', 'OH', 0.125::numeric),
      ('A.1.1.1.2', 'upah', 'Tukang Batu', 'OH', 0.125::numeric),
      ('A.1.1.1.2', 'upah', 'Kepala Tukang', 'OH', 0.025::numeric),
      ('A.1.1.1.2', 'upah', 'Mandor', 'OH', 0.008::numeric),
      ('A.1.1.1.2', 'bahan', 'Kayu kaso 5/7', 'm3', 0.031::numeric),
      ('A.1.1.1.2', 'bahan', 'Seng gelombang', 'Lembar', 1.3125::numeric),
      ('A.1.1.1.2', 'bahan', 'Paku biasa 2” - 5”', 'kg', 0.4271::numeric),
      ('A.1.1.1.2', 'bahan', 'Semen portland', 'kg', 26.406::numeric),
      ('A.1.1.1.2', 'bahan', 'Pasir beton kg', 'kg', 61.56::numeric),
      ('A.1.1.1.2', 'bahan', 'Kerikil kg', 'kg', 83.349::numeric),
      ('A.1.1.1.2', 'bahan', 'Air', 'Liter', 17.415::numeric),
      ('A.1.1.1.3', 'upah', 'Pekerja', 'OH', 0.308::numeric),
      ('A.1.1.1.3', 'upah', 'Tukang Kayu', 'OH', 0.154::numeric),
      ('A.1.1.1.3', 'upah', 'Tukang Batu', 'OH', 0.154::numeric),
      ('A.1.1.1.3', 'upah', 'Kepala Tukang', 'OH', 0.031::numeric),
      ('A.1.1.1.3', 'upah', 'Mandor', 'OH', 0.01::numeric),
      ('A.1.1.1.3', 'bahan', 'Kayu kaso 5/7', 'Batang', 1::numeric),
      ('A.1.1.1.3', 'bahan', 'Seng gelombang', 'kg', 2::numeric),
      ('A.1.1.1.3', 'bahan', 'Paku biasa 2” - 5”', 'M''', 25::numeric),
      ('A.1.1.1.3', 'bahan', 'Semen portland', 'm3', 0.005::numeric),
      ('A.1.1.1.3', 'bahan', 'Pasir beton kg', 'm3', 0.009::numeric),
      ('A.1.1.1.3', 'bahan', 'Kerikil kg', 'kg', 0.06::numeric),
      ('1.1.2.5', 'upah', 'Pekerja', 'OH', 2.0296::numeric),
      ('1.1.2.5', 'upah', 'Mandor', 'OH', 0.1309::numeric),
      ('1.1.2.5', 'bahan', 'Agg Pokok', 'm3', 1.0594::numeric),
      ('1.1.2.5', 'bahan', 'Agg Pengunci', 'm3', 0.3311::numeric),
      ('1.1.2.5', 'bahan', 'Agg Penutup', 'kg', 0.1854::numeric),
      ('1.1.2.5', 'bahan', 'Aspal', 'kg', 80::numeric),
      ('1.1.2.5', 'alat', 'Wheel Loader', 'jam', 0.0071::numeric),
      ('1.1.2.5', 'alat', 'Dump Truck 1', 'jam', 0.3189::numeric),
      ('1.1.2.5', 'alat', 'Dump Truck 2', 'jam', 0.3202::numeric),
      ('1.1.2.5', 'alat', 'Dump Truck 3', 'jam', 0.3237::numeric),
      ('1.1.2.5', 'alat', 'Three Wheel Roller', 'jam', 0.0655::numeric),
      ('1.1.2.5', 'alat', 'Asphalt Distributor', 'jam', 0.0157::numeric)
  ) AS v(kode_analisa, komponen_tipe, nama_komponen, nama_satuan, koefisien)
),
resolved_details AS (
  SELECT
    ai.id AS ahsp_item_id,
    dv.komponen_tipe::public.ahsp_component_type AS komponen_tipe,
    CASE
      WHEN dv.komponen_tipe = 'upah' THEN u.id
      ELSE NULL
    END AS upah_id,
    CASE
      WHEN dv.komponen_tipe = 'bahan' THEN b.id
      ELSE NULL
    END AS bahan_id,
    CASE
      WHEN dv.komponen_tipe = 'alat' THEN a.id
      ELSE NULL
    END AS alat_id,
    dv.koefisien
  FROM detail_values dv
  JOIN public.ahsp_items ai ON ai.kode_analisa = dv.kode_analisa
  LEFT JOIN public.master_upah u
    ON dv.komponen_tipe = 'upah'
   AND lower(u.nama_upah) = lower(dv.nama_komponen)
   AND u.satuan_id = (SELECT id FROM public.satuan WHERE lower(nama_satuan) = lower(dv.nama_satuan) LIMIT 1)
  LEFT JOIN public.master_bahan b
    ON dv.komponen_tipe = 'bahan'
   AND lower(b.nama_bahan) = lower(dv.nama_komponen)
   AND b.satuan_id = (SELECT id FROM public.satuan WHERE lower(nama_satuan) = lower(dv.nama_satuan) LIMIT 1)
  LEFT JOIN public.master_alat a
    ON dv.komponen_tipe = 'alat'
   AND lower(a.nama_alat) = lower(dv.nama_komponen)
   AND a.satuan_id = (SELECT id FROM public.satuan WHERE lower(nama_satuan) = lower(dv.nama_satuan) LIMIT 1)
)
INSERT INTO public.ahsp_details (
  ahsp_item_id,
  komponen_tipe,
  upah_id,
  bahan_id,
  alat_id,
  koefisien
)
SELECT
  rd.ahsp_item_id,
  rd.komponen_tipe,
  rd.upah_id,
  rd.bahan_id,
  rd.alat_id,
  rd.koefisien
FROM resolved_details rd
WHERE (
    (rd.komponen_tipe = 'upah' AND rd.upah_id IS NOT NULL)
    OR (rd.komponen_tipe = 'bahan' AND rd.bahan_id IS NOT NULL)
    OR (rd.komponen_tipe = 'alat' AND rd.alat_id IS NOT NULL)
  )
  AND NOT EXISTS (
    SELECT 1
    FROM public.ahsp_details ad
    WHERE ad.ahsp_item_id = rd.ahsp_item_id
      AND ad.komponen_tipe = rd.komponen_tipe
      AND ad.koefisien = rd.koefisien
      AND (
        (rd.komponen_tipe = 'upah' AND ad.upah_id = rd.upah_id)
        OR (rd.komponen_tipe = 'bahan' AND ad.bahan_id = rd.bahan_id)
        OR (rd.komponen_tipe = 'alat' AND ad.alat_id = rd.alat_id)
      )
  );

COMMIT;
