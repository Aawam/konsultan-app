import { NextResponse } from 'next/server'
import { getAllProyekForExport } from '@/lib/actions/proyek'
import { createAuthenticatedSupabaseServerClient } from '@/lib/supabase-server'

export async function GET() {
  const { supabase, authError } = await createAuthenticatedSupabaseServerClient()
  if (authError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await getAllProyekForExport(supabase)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data: data ?? [] })
}
