import { NextResponse } from 'next/server'
import { getAllProyekForExport } from '@/lib/actions/proyek'

export async function GET() {
  const { data, error } = await getAllProyekForExport()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data: data ?? [] })
}
