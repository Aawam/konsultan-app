import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { buildProyekPayload } from '@/lib/actions/proyek'
import { proyekSchema } from '@/lib/validations/proyek'
import type { ProyekFormData } from '@/lib/types/proyek'
import { parseNumberInput } from '@/lib/utils'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createSupabaseServerClient()

  const { data: proyek, error } = await supabase
    .from('proyek')
    .select(`*, perusahaan:perusahaan_id (nama_perusahaan, adalah_perusahaan_sendiri)`)
    .eq('id', id)
    .eq('is_deleted', false)
    .single()

  if (error || !proyek) {
    if (error && error.code !== 'PGRST116') {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const { data: overrideLogs } = await supabase
    .from('override_log')
    .select('*')
    .eq('proyek_id', id)
    .order('dilakukan_pada', { ascending: false })

  return NextResponse.json({ proyek, overrideLogs: overrideLogs ?? [] })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const form = await req.json() as ProyekFormData
  const supabase = await createSupabaseServerClient()

  const parsed = proyekSchema.safeParse({
    ...form,
    id,
    pagu_dana: parseNumberInput(form.pagu_dana),
    hps: form.hps ? parseNumberInput(form.hps) : null,
    nilai_penawaran: form.nilai_penawaran ? parseNumberInput(form.nilai_penawaran) : null,
    status_proyek: form.status_proyek || null,
  })

  if (!parsed.success) {
    const message = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')
    return NextResponse.json({ error: message }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('proyek')
    .update(buildProyekPayload(form))
    .eq('id', id)
    .eq('is_deleted', false)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createSupabaseServerClient()

  const { error } = await supabase
    .from('proyek')
    .update({ is_deleted: true })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
