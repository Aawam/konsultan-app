import { beforeEach, describe, expect, it, vi } from 'vitest'

const { rpc } = vi.hoisted(() => ({
  rpc: vi.fn(),
}))

vi.mock('@/lib/supabase-server', () => ({
  createSupabaseServerClient: vi.fn(async () => ({ rpc })),
}))

import { getDaftarProyek, getDaftarProyekPage } from '@/lib/actions/proyek'

describe('getDaftarProyekPage', () => {
  beforeEach(() => {
    rpc.mockReset()
  })

  it('uses the paginated technical RPC for non-commercial project lists', async () => {
    rpc.mockResolvedValueOnce({
      data: {
        rows: [
          {
            id: '00000000-0000-4000-8000-000000000001',
            nama_proyek: 'Perencanaan Drainase',
            paket_pekerjaan_induk: 'Drainase Kota',
            nomor_kontrak: null,
            jenis_pekerjaan: 'Perencanaan',
            kategori_pekerjaan: 'SDA',
            tahun_anggaran: 2026,
            sumber_dana: 'APBD',
            dinas: 'Dinas PUPR',
            lokasi_kecamatan: 'Tanjung Redeb',
            nama_ppk: 'Budi',
            perusahaan_id: '00000000-0000-4000-8000-000000000002',
            perusahaan_nama: 'Konsultan Berau',
            perusahaan_adalah_perusahaan_sendiri: true,
            tanggal_mulai: '2026-01-01',
            tanggal_selesai: '2026-02-01',
            durasi_hari: 30,
            tahap_progress: 'Konsep Desain',
            persentase_progress: 40,
            pernah_dioverride: false,
            status_proyek: 'Work',
            jalur_masuk: 'manual',
            created_at: '2026-01-01T00:00:00Z',
            updated_at: '2026-01-02T00:00:00Z',
            is_deleted: false,
          },
        ],
        total: 51,
        page: 2,
        pageSize: 25,
        pageCount: 3,
      },
      error: null,
    })

    const result = await getDaftarProyekPage({
      page: 2,
      pageSize: 25,
      year: 2026,
      jenis: 'Perencanaan',
      status: 'Work',
      progress: 'berjalan',
      perusahaanId: '00000000-0000-4000-8000-000000000002',
      search: ' drainase ',
    }, { includeSensitive: false })

    expect(rpc).toHaveBeenCalledWith('get_proyek_teknis_page', {
      target_page: 2,
      target_page_size: 25,
      target_tahun_anggaran: 2026,
      target_jenis_pekerjaan: 'Perencanaan',
      target_status_proyek: 'Work',
      target_perusahaan_id: '00000000-0000-4000-8000-000000000002',
      target_progress: 'berjalan',
      target_search: 'drainase',
    })
    expect(result).toMatchObject({
      data: {
        total: 51,
        page: 2,
        pageSize: 25,
        pageCount: 3,
        rows: [{ id: '00000000-0000-4000-8000-000000000001', pagu_dana: null, nilai_penawaran: null }],
      },
      error: null,
    })
  })

  it('rejects a malformed paginated technical RPC response', async () => {
    rpc.mockResolvedValueOnce({
      data: {
        rows: [],
        total: 0,
      },
      error: null,
    })

    const result = await getDaftarProyekPage({
      page: 1,
      pageSize: 25,
      year: 'semua',
      jenis: 'Semua',
      status: 'Semua',
      progress: 'semua',
      perusahaanId: 'Semua',
      search: '',
    }, { includeSensitive: false })

    expect(result.data).toBeNull()
    expect(result.error).toMatchObject({
      code: 'INVALID_RPC_RESPONSE',
    })
    expect(rpc).toHaveBeenCalledWith('get_proyek_teknis_page', {
      target_page: 1,
      target_page_size: 25,
      target_tahun_anggaran: undefined,
      target_jenis_pekerjaan: undefined,
      target_status_proyek: undefined,
      target_perusahaan_id: undefined,
      target_progress: undefined,
      target_search: undefined,
    })
  })

  it('re-queries the last valid commercial page when the requested page is out of range', async () => {
    const range = vi.fn()
      .mockResolvedValueOnce({ data: [], error: null, count: 51 })
      .mockResolvedValueOnce({
        data: [{
          id: 'project-51',
          nama_proyek: 'Pengawasan Jalan',
          tahun_anggaran: 2026,
        }],
        error: null,
        count: 51,
      })

    const query = {
      select: vi.fn(),
      eq: vi.fn(),
      or: vi.fn(),
      is: vi.fn(),
      lt: vi.fn(),
      order: vi.fn(),
      range,
    }
    for (const method of ['select', 'eq', 'or', 'is', 'lt', 'order'] as const) {
      query[method].mockReturnValue(query)
    }

    const client = {
      from: vi.fn(() => query),
    }

    const result = await getDaftarProyekPage({
      page: 999,
      pageSize: 25,
      year: 'semua',
      jenis: 'Semua',
      status: 'Semua',
      progress: 'semua',
      perusahaanId: 'Semua',
      search: '',
    }, {
      client: client as never,
      includeSensitive: true,
    })

    expect(range).toHaveBeenNthCalledWith(1, 24_950, 24_974)
    expect(range).toHaveBeenNthCalledWith(2, 50, 74)
    expect(result).toMatchObject({
      data: {
        rows: [{ id: 'project-51' }],
        total: 51,
        page: 3,
        pageSize: 25,
        pageCount: 3,
      },
      error: null,
    })
  })

  it('rejects a malformed legacy technical RPC response', async () => {
    rpc.mockResolvedValueOnce({
      data: [{ id: 'not-a-uuid' }],
      error: null,
    })

    const result = await getDaftarProyek({ includeSensitive: false })

    expect(result.data).toBeNull()
    expect(result.error).toMatchObject({ code: 'INVALID_RPC_RESPONSE' })
  })
})
