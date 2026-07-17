import { NextRequest } from 'next/server'

import { requireOwnerAdminApi } from '@/lib/api-auth'
import { apiData, apiError } from '@/lib/api-response'
import {
  buildAhspImportWorkbookPayload,
} from '@/lib/ahsp-import'
import { ahspImportResultSchema } from '@/lib/rpc-contracts'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export const runtime = 'nodejs'

const MAX_IMPORT_BYTES = 15 * 1024 * 1024

export async function POST(req: NextRequest) {
  const forbidden = await requireOwnerAdminApi('Hanya Owner/Admin yang boleh import AHSP.')
  if (forbidden) return forbidden

  const form = await req.formData().catch(() => null)
  const file = form?.get('file')

  if (!(file instanceof File)) {
    return apiError('VALIDATION_ERROR', 'File XLSX wajib diunggah pada field "file".', 400)
  }

  if (file.size <= 0 || file.size > MAX_IMPORT_BYTES) {
    return apiError('VALIDATION_ERROR', 'Ukuran file XLSX tidak valid atau terlalu besar.', 400)
  }

  if (!file.name.toLowerCase().endsWith('.xlsx')) {
    return apiError('VALIDATION_ERROR', 'Import AHSP saat ini hanya menerima file .xlsx.', 400)
  }

  try {
    const { preview, payload } = buildAhspImportWorkbookPayload(Buffer.from(await file.arrayBuffer()))

    if (!preview.canImport) {
      return apiError('CONFLICT', 'Import AHSP dibatalkan karena masih ada blocker.', 409, preview)
    }

    const supabase = await createSupabaseServerClient()
    const { data, error } = await supabase.rpc(
      'import_ahsp_masterfile',
      { import_payload: payload }
    )

    if (error) return apiError('INTERNAL_ERROR', error.message, 500)
    const parsedResult = ahspImportResultSchema.safeParse(data)
    if (!parsedResult.success) {
      return apiError('INTERNAL_ERROR', 'Respons import AHSP tidak sesuai kontrak API.', 500)
    }
    return apiData({ result: parsedResult.data, preview })
  } catch (error) {
    return apiError(
      'VALIDATION_ERROR',
      error instanceof Error ? error.message : 'File XLSX tidak bisa dibaca.',
      400
    )
  }
}
