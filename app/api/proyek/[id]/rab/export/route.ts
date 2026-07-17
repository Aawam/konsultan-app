import { NextRequest } from 'next/server'

import { apiError } from '@/lib/api-response'
import { getCurrentUserProfile } from '@/lib/auth'
import { getProyekById } from '@/lib/actions/proyek'
import { canAccessRabProject, getRabMakerSnapshotByProyekId } from '@/lib/actions/rab'
import { buildRabExportFilename, createRabXlsx } from '@/lib/rab-export'
import { rabExportRecordSchema } from '@/lib/rpc-contracts'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export const runtime = 'nodejs'

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

  const workbook = createRabXlsx(project, snapshot)
  let filename = buildRabExportFilename(project)
  let exportVersion: number | null = null

  if (snapshot.maker) {
    const supabase = await createSupabaseServerClient()
    const { data: exportRecord, error: historyError } = await supabase.rpc(
      'record_rab_export_file',
      {
        target_rab_maker_id: snapshot.maker.id,
        export_format: 'xlsx',
        base_file_name: filename,
        file_size_bytes: workbook.byteLength,
      }
    )

    if (historyError) return apiError('INTERNAL_ERROR', historyError.message, 500)
    const parsedExportRecord = rabExportRecordSchema.safeParse(exportRecord)
    if (!parsedExportRecord.success) {
      return apiError('INTERNAL_ERROR', 'Respons pencatatan export RAB tidak valid.', 500)
    }
    exportVersion = parsedExportRecord.data.versionNumber
    filename = parsedExportRecord.data.fileName
  }

  return new Response(workbook, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
      ...(exportVersion ? {
        'X-RAB-Export-Version': String(exportVersion),
        'X-RAB-Export-Filename': filename,
      } : {}),
    },
  })
}
