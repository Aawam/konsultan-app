import { apiData, apiError } from '@/lib/api-response'
import { getAllProyekForExport } from '@/lib/actions/proyek'
import { createAuthenticatedSupabaseServerClient } from '@/lib/supabase-server'

export async function GET() {
  const { supabase, authError } = await createAuthenticatedSupabaseServerClient()
  if (authError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await getAllProyekForExport(supabase)

  if (error) return apiError('INTERNAL_ERROR', error.message, 500)
  return apiData(data ?? [])
}
