'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import Link from 'next/link'
import { toast } from 'sonner'

export function TombolAksi({ id, editLabel = 'Edit' }: { id: string; editLabel?: string }) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)
  const [open, setOpen] = useState(false)

  const handleHapus = async () => {
    setOpen(false)
    setDeleting(true)
    let json: { error?: string } = {}
    let ok = false

    try {
      const res = await fetch(`/api/proyek/${id}`, { method: 'DELETE' })
      json = await res.json() as { error?: string }
      ok = res.ok
    } catch (error) {
      json = { error: error instanceof Error ? error.message : 'Terjadi kesalahan koneksi' }
    } finally {
      setDeleting(false)
    }

    if (!ok || json.error) {
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
        size="lg"
        asChild
        className="h-10 rounded-lg border-amber bg-amber/10 px-6 text-sm font-semibold text-amber hover:bg-amber/15"
      >
        <Link href={`/proyek/${id}/edit`}>{editLabel}</Link>
      </Button>

      <Button
        size="lg"
        disabled={deleting}
        onClick={() => setOpen(true)}
        className="h-10 rounded-lg border border-rose bg-rose/10 px-6 text-sm font-semibold text-rose hover:bg-rose/15"
      >
        Hapus
      </Button>

      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Hapus proyek ini?"
        description="Data proyek akan disembunyikan dari daftar proyek, dashboard, dan export. Aksi ini tidak menghapus data permanen dari database."
        confirmLabel="Ya, Hapus"
        confirmClassName="bg-rose/15 text-rose border border-rose/20 hover:bg-rose/25"
        onConfirm={handleHapus}
      />
    </div>
  )
}
