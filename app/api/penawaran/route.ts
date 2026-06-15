import { NextRequest, NextResponse } from 'next/server'
import { simpanPenawaran } from '@/lib/actions/penawaran'
import type { ProyekFormData } from '@/lib/types/proyek'

type PersonilPayload = {
  personil_id: string
  posisi: string
  durasi_bulan: number
}

export async function POST(req: NextRequest) {
  const { form, personilList } = await req.json() as {
    form?: ProyekFormData
    personilList?: PersonilPayload[]
  }

  if (!form || !Array.isArray(personilList)) {
    return NextResponse.json({ error: 'form and personilList are required' }, { status: 400 })
  }

  const { data, error } = await simpanPenawaran(form, personilList)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data }, { status: 201 })
}
