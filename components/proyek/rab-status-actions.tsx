'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2Icon, Loader2Icon, LockIcon } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import type { RabMakerStatus } from '@/lib/rab-lock'

type RabStatusActionsProps = {
  projectId: string
  status: RabMakerStatus | null
  canManage: boolean
  hasMaker: boolean
}

async function parseApiResponse(response: Response): Promise<{ error?: string }> {
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    return { error: typeof payload.error === 'string' ? payload.error : 'Request gagal.' }
  }
  return {}
}

export function RabStatusActions({
  projectId,
  status,
  canManage,
  hasMaker,
}: RabStatusActionsProps) {
  const router = useRouter()
  const [busyAction, setBusyAction] = useState<'approve' | 'finalize' | null>(null)

  if (!canManage || !hasMaker) return null

  async function submit(action: 'approve' | 'finalize') {
    setBusyAction(action)
    const response = await fetch(`/api/proyek/${projectId}/rab/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    })
    const result = await parseApiResponse(response)
    setBusyAction(null)

    if (result.error) {
      toast.error(result.error)
      return
    }

    toast.success(action === 'approve' ? 'RAB disetujui.' : 'RAB difinalkan.')
    router.refresh()
  }

  if (status === 'final') {
    return (
      <Button type="button" variant="outline" disabled>
        <LockIcon />
        Final
      </Button>
    )
  }

  if (status === 'validated') {
    return (
      <Button type="button" onClick={() => submit('finalize')} disabled={busyAction !== null}>
        {busyAction === 'finalize' ? <Loader2Icon className="animate-spin" /> : <LockIcon />}
        Finalkan
      </Button>
    )
  }

  return (
    <Button type="button" onClick={() => submit('approve')} disabled={busyAction !== null}>
      {busyAction === 'approve' ? <Loader2Icon className="animate-spin" /> : <CheckCircle2Icon />}
      Setujui
    </Button>
  )
}
