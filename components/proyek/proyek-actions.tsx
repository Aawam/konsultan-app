'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import Link from 'next/link'
import { toast } from 'sonner'

export function TombolAksi({ id }: { id: string }) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)
  const [open, setOpen] = useState(false)

  const handleHapus = async () => {
    setOpen(false)
    setDeleting(true)
    const res = await fetch(`/api/proyek/${id}`, { method: 'DELETE' })
    const json = await res.json() as { error?: string }
    setDeleting(false)

    if (!res.ok || json.error) {
      toast.error(`Gagal menghapus: ${json.error ?? 'Terjadi kesalahan'}`)
      return
    }

    toast.success('Proyek berhasil dihapus')
    router.push('/proyek')
    router.refresh()
  }

  return (
    <div className="flex items-center gap-2 shrink-0">
      <Button
        variant="outline"
        size="sm"
        asChild
        className=""
      >
        <Link href={`/proyek/${id}/edit`}>Edit</Link>
      </Button>

      <Button
        size="sm"
        disabled={deleting}
        onClick={() => setOpen(true)}
        className="bg-red-500/15 text-red-400 border border-red-500/20 hover:bg-red-500/25 hover:text-red-300"
      >
        Hapus
      </Button>

      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Hapus proyek ini?"
        description="Data proyek akan disembunyikan dari daftar proyek dan export."
        confirmLabel="Ya, Hapus"
        confirmClassName="bg-red-500/20 text-red-300 border border-red-500/20 hover:bg-red-500/30"
        onConfirm={handleHapus}
      />
    </div>
  )
}
