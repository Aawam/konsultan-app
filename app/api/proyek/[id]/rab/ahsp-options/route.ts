import { NextRequest } from 'next/server'

import { apiData, apiError } from '@/lib/api-response'
import { getCurrentUserProfile } from '@/lib/auth'
import { canAccessRabProject, getAvailableAhspForRab } from '@/lib/actions/rab'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { profile } = await getCurrentUserProfile()
  const canAccess = await canAccessRabProject(id, profile)

  if (!canAccess) {
    return apiError('FORBIDDEN', 'Tidak punya akses RAB proyek ini.', 403)
  }

  const url = new URL(req.url)
  const query = url.searchParams.get('q') ?? ''
  const bidang = url.searchParams.get('bidang')
  const kategoriId = url.searchParams.get('kategori') ?? 'all'
  const limit = Number(url.searchParams.get('limit') ?? 25)

  const { data, error } = await getAvailableAhspForRab(id, {
    query,
    bidang: bidang === 'CK' || bidang === 'SDA' ? bidang : 'all',
    kategoriId,
    limit,
  })

  if (error) return apiError('INTERNAL_ERROR', error.message, 500)

  return apiData(data)
}
