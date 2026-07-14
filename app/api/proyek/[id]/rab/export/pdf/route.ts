import { NextRequest } from 'next/server'

import { apiError } from '@/lib/api-response'
import { getCurrentUserProfile } from '@/lib/auth'
import { getProyekById } from '@/lib/actions/proyek'
import { canAccessRabProject, getRabMakerSnapshotByProyekId } from '@/lib/actions/rab'
import { buildRabPdfFilename, createRabPdf } from '@/lib/rab-pdf'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export const runtime = 'nodejs'

type RecordRabExportHistoryRpcClient = {
  rpc: (
    fn: 'record_rab_export_history',
    args: {
      target_rab_maker_id: string
      export_format: string
      file_name: string
      file_size_bytes: number
    }
  ) => Promise<{ data: number | null; error: { message: string } | null }>
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { profile } = await getCurrentUserProfile()
  const canAccess = await canAccessRabProject(id, profile)

  if (!canAccess) {
    return apiError('FORBIDDEN', 'Tidak punya akses export RAB proyek ini.', 403)
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

  if (!snapshot.maker || !['validated', 'final'].includes(snapshot.maker.status)) {
    return apiError('CONFLICT', 'PDF hanya bisa dibuat dari RAB yang sudah disetujui atau final.', 409)
  }

  const pdf = createRabPdf(project, snapshot)
  const filename = buildRabPdfFilename(project)
  const supabase = await createSupabaseServerClient()
  const { data: version, error: historyError } = await (supabase as unknown as RecordRabExportHistoryRpcClient).rpc(
    'record_rab_export_history',
    {
      target_rab_maker_id: snapshot.maker.id,
      export_format: 'pdf',
      file_name: filename,
      file_size_bytes: pdf.byteLength,
    }
  )

  if (historyError) return apiError('INTERNAL_ERROR', historyError.message, 500)

  return new Response(pdf, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
      ...(version ? { 'X-RAB-Export-Version': String(version) } : {}),
    },
  })
}
