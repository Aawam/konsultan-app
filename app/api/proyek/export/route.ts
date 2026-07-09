import { apiData, apiError } from '@/lib/api-response'
import { getAllProyekForExport } from '@/lib/actions/proyek'
import { getCurrentUserProfile, isOwnerAdmin } from '@/lib/auth'

export async function GET() {
  const { profile } = await getCurrentUserProfile()
  if (!isOwnerAdmin(profile)) {
    return apiError('FORBIDDEN', 'Export proyek hanya untuk Owner/Admin.', 403)
  }

  const { data, error } = await getAllProyekForExport()

  if (error) return apiError('INTERNAL_ERROR', error.message, 500)
  return apiData(data ?? [])
}
