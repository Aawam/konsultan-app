'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2Icon, Loader2Icon } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'

type WorkflowTransitionActionProps = {
  projectId: string
}

type ApiResult = {
  error?: string
}

async function parseApiResponse(response: Response): Promise<ApiResult> {
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    return { error: typeof payload.error === 'string' ? payload.error : 'Request gagal.' }
  }

  return payload
}

export function WorkflowTransitionAction({ projectId }: WorkflowTransitionActionProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function markRabReady() {
    setSubmitting(true)
    let result: ApiResult = {}

    try {
      const response = await fetch(`/api/proyek/${projectId}/workflow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transition: 'mark_rab_ready' }),
      })
      result = await parseApiResponse(response)
    } catch (error) {
      result = { error: error instanceof Error ? error.message : 'Terjadi kesalahan koneksi.' }
    } finally {
      setSubmitting(false)
    }

    if (result.error) {
      toast.error(result.error)
      return
    }

    setOpen(false)
    toast.success('Workflow proyek ditandai siap RAB.')
    router.refresh()
  }

  return (
    <>
      <Button
        type="button"
        size="lg"
        onClick={() => setOpen(true)}
        disabled={submitting}
        className="h-9 border-emerald/20 bg-emerald/10 px-3 text-sm font-semibold text-emerald hover:bg-emerald/15"
      >
        {submitting ? <Loader2Icon className="animate-spin" /> : <CheckCircle2Icon />}
        Tandai Siap RAB
      </Button>

      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Tandai proyek siap RAB?"
        description="Tahap progress proyek akan dipindahkan ke Penyusunan Laporan Akhir & RAB. Setelah itu tim bisa mulai menyusun RAB/EE dari AHSP."
        confirmLabel={submitting ? 'Menyimpan...' : 'Tandai Siap RAB'}
        confirmClassName="bg-emerald/15 text-emerald border border-emerald/20 hover:bg-emerald/25"
        onConfirm={markRabReady}
      />
    </>
  )
}
