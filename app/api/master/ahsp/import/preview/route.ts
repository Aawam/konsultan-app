import { NextRequest } from 'next/server'

import { requireOwnerAdminApi } from '@/lib/api-auth'
import { apiData, apiError } from '@/lib/api-response'
import { previewAhspImportWorkbook } from '@/lib/ahsp-import'

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
    return apiData(previewAhspImportWorkbook(Buffer.from(await file.arrayBuffer())))
  } catch (error) {
    return apiError(
      'VALIDATION_ERROR',
      error instanceof Error ? error.message : 'File XLSX tidak bisa dibaca.',
      400
    )
  }
}
