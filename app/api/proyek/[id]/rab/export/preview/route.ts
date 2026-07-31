import { NextRequest } from 'next/server'

import { getProyekById } from '@/lib/actions/proyek'
import { canAccessRabProject, getRabMakerSnapshotByProyekId } from '@/lib/actions/rab'
import { apiData, apiError } from '@/lib/api-response'
import { requireCurrentUserProfileApi } from '@/lib/api-auth'
import { buildRabExportPreview } from '@/lib/rab-export'

export const runtime = 'nodejs'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { profile, response: authResponse } = await requireCurrentUserProfileApi()
  if (authResponse) return authResponse

  const canAccess = await canAccessRabProject(id, profile)

  if (!canAccess) {
    return apiError('FORBIDDEN', 'Tidak punya akses preview export RAB proyek ini.', 403)
  }

  const [
    { data: project, error: projectError },
    { data: snapshot, error: snapshotError },
  ] = await Promise.all([
    getProyekById(id, { includeSensitive: false }),
    getRabMakerSnapshotByProyekId(id),
  ])

  if (projectError) return apiError('INTERNAL_ERROR', projectError.message, 500)
  if (!project) return apiError('NOT_FOUND', 'Proyek tidak ditemukan.', 404)
  if (snapshotError) return apiError('INTERNAL_ERROR', snapshotError.message, 500)

  const response = apiData(buildRabExportPreview(project, snapshot))
  response.headers.set('Cache-Control', 'no-store')
  return response
}
