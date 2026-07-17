import { NextRequest, NextResponse } from 'next/server'

import { requireOwnerAdminApi } from '@/lib/api-auth'
import { apiData, apiError, readJsonBody } from '@/lib/api-response'
import { getProyekById } from '@/lib/actions/proyek'
import { evaluateProjectWorkflowTransition, type ProjectWorkflowTransition } from '@/lib/project-workflow'
import { createAuthenticatedSupabaseServerClient } from '@/lib/supabase-server'

type WorkflowRequestBody = {
  transition?: unknown
}

function parseTransition(value: unknown): ProjectWorkflowTransition | null {
  return value === 'mark_rab_ready' ? value : null
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const forbidden = await requireOwnerAdminApi('Hanya Owner/Admin yang boleh mengubah workflow proyek.')
  if (forbidden) return forbidden

  const { data: body, error: bodyError } = await readJsonBody<WorkflowRequestBody>(req)
  if (bodyError) return bodyError

  const transition = parseTransition(body?.transition)
  if (!transition) {
    return apiError('VALIDATION_ERROR', 'Transisi workflow tidak valid.', 400)
  }

  const { supabase, authError } = await createAuthenticatedSupabaseServerClient()
  if (authError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: project, error: projectError } = await getProyekById(id, {
    client: supabase,
    includeSensitive: true,
  })

  if (projectError || !project) {
    if (projectError && projectError.code !== 'PGRST116') {
      return apiError('INTERNAL_ERROR', projectError.message, 500)
    }

    return apiError('NOT_FOUND', 'Proyek tidak ditemukan.', 404)
  }

  const transitionResult = evaluateProjectWorkflowTransition(project, transition, {
    includeCommercial: false,
  })

  if (!transitionResult.allowed || !transitionResult.update) {
    return apiError(
      'CONFLICT',
      'Workflow proyek belum bisa dipindahkan.',
      409,
      transitionResult
    )
  }

  const { data, error: transitionError } = await supabase.rpc(
    'transition_project_workflow_to_rab_ready',
    {
      target_proyek_id: id,
    }
  )

  if (transitionError) return apiError('INTERNAL_ERROR', transitionError.message, 500)

  return apiData({
    project: { id: data ?? id },
    transition,
    readiness: transitionResult,
  })
}
