import { NextRequest, NextResponse } from 'next/server'
import { getPengalamanPerusahaan } from '@/lib/actions/proyek'

export async function GET(req: NextRequest) {
  const perusahaanId = req.nextUrl.searchParams.get('perusahaan_id') ?? undefined
  const kategori = req.nextUrl.searchParams.get('kategori') ?? undefined

  if (!perusahaanId) {
    return NextResponse.json({ error: 'perusahaan_id is required' }, { status: 400 })
  }

  const { data, error } = await getPengalamanPerusahaan(perusahaanId, kategori)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}