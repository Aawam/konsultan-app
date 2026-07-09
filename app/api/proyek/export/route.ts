import { NextResponse } from 'next/server'
import { apiData, apiError } from '@/lib/api-response'
import { getAllProyekForExport } from '@/lib/actions/proyek'
import { createAuthenticatedSupabaseServerClient } from '@/lib/supabase-server'
import { getCurrentUserProfile, isOwnerAdmin } from '@/lib/auth'

export async function GET() {
  const { supabase, authError } = await createAuthenticatedSupabaseServerClient()
  if (authError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { profile } = await getCurrentUserProfile()
  if (!isOwnerAdmin(profile)) {
    return apiError('FORBIDDEN', 'Hanya Owner/Admin yang boleh mengekspor data proyek.', 403)
  }

  const { data, error } = await getAllProyekForExport(supabase)

  if (error) return apiError('INTERNAL_ERROR', error.message, 500)
  return apiData(data ?? [])
}
