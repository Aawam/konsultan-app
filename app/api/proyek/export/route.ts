import { NextResponse } from 'next/server'
import { apiData, apiError } from '@/lib/api-response'
import { getAllProyekForExport } from '@/lib/actions/proyek'
import { createAuthenticatedSupabaseServerClient } from '@/lib/supabase-server'
import { requireOwnerAdminApi } from '@/lib/api-auth'

export async function GET() {
  const { supabase, authError } = await createAuthenticatedSupabaseServerClient()
  if (authError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const forbidden = await requireOwnerAdminApi('Hanya Owner/Admin yang boleh mengekspor data proyek.')
  if (forbidden) return forbidden

  const { data, error } = await getAllProyekForExport(supabase)

  if (error) return apiError('INTERNAL_ERROR', error.message, 500)
  return apiData(data ?? [])
}
