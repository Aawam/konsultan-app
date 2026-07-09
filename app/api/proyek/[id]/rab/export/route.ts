import { NextRequest } from 'next/server'

import { apiError } from '@/lib/api-response'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  return apiError(
    'NOT_IMPLEMENTED',
    'Export RAB belum aktif. Selesaikan schema AHSP/RAB, kalkulasi, dan permission role sebelum export dipakai.',
    501,
    { project_id: id }
  )
}
