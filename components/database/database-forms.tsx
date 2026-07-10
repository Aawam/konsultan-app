'use client'

import type { ReactNode } from 'react'

import { useMediaQuery } from '@/hooks/use-media-query'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { PerusahaanFormData } from '@/lib/types/perusahaan'

export function DinasFormPanel({
  dinas,
  editing,
  saving,
  onChange,
  onCancel,
  onSubmit,
}: {
  dinas: string
  editing: boolean
  saving: boolean
  onChange: (value: string) => void
  onCancel: () => void
  onSubmit: () => void
}) {
  return (
    <div className="section-card">
      <div className="section-header">
        <p className="section-title">{editing ? 'Edit Dinas / SKPD' : 'Tambah Dinas / SKPD'}</p>
      </div>
      <div className="section-body space-y-4">
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Nama Dinas / SKPD</label>
          <Input value={dinas} onChange={(e) => onChange(e.target.value)} />
        </div>
        <div className="flex items-center justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onCancel}>Batal</Button>
          <Button type="button" onClick={onSubmit} disabled={saving}>
            {saving ? 'Menyimpan…' : editing ? 'Simpan Perubahan' : 'Tambah Dinas'}
          </Button>
        </div>
      </div>
    </div>
  )
}

export function PerusahaanFormPanel({
  form,
  editing,
  saving,
  onChange,
  onCancel,
  onSubmit,
}: {
  form: PerusahaanFormData
  editing: boolean
  saving: boolean
  onChange: (patch: Partial<PerusahaanFormData>) => void
  onCancel: () => void
  onSubmit: () => void
}) {
  return (
    <div className="section-card">
      <div className="section-header">
        <p className="section-title">{editing ? 'Edit Perusahaan' : 'Tambah Perusahaan'}</p>
      </div>
      <div className="section-body space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="mb-1 block text-xs text-muted-foreground">Nama Perusahaan</label>
            <Input value={form.nama_perusahaan} onChange={(e) => onChange({ nama_perusahaan: e.target.value })} />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Inisial</label>
            <Input value={form.inisial_perusahaan ?? ''} onChange={(e) => onChange({ inisial_perusahaan: e.target.value })} />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Kota</label>
            <Input value={form.kota ?? ''} onChange={(e) => onChange({ kota: e.target.value })} />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Telepon</label>
            <Input value={form.telepon ?? ''} onChange={(e) => onChange({ telepon: e.target.value })} />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Email</label>
            <Input value={form.email ?? ''} onChange={(e) => onChange({ email: e.target.value })} />
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-xs text-muted-foreground">Nama Direktur</label>
            <Input value={form.nama_direktur ?? ''} onChange={(e) => onChange({ nama_direktur: e.target.value })} />
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-xs text-muted-foreground">Alamat</label>
            <Textarea rows={3} value={form.alamat ?? ''} onChange={(e) => onChange({ alamat: e.target.value })} />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            checked={form.adalah_perusahaan_sendiri}
            onChange={(e) => onChange({ adalah_perusahaan_sendiri: e.target.checked })}
            className="h-4 w-4 rounded border-border"
          />
          Jadikan perusahaan utama
        </label>
        <div className="flex items-center justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onCancel}>Batal</Button>
          <Button type="button" onClick={onSubmit} disabled={saving}>
            {saving ? 'Menyimpan…' : editing ? 'Simpan Perubahan' : 'Tambah Perusahaan'}
          </Button>
        </div>
      </div>
    </div>
  )
}

export function ResponsiveFormShell({
  open,
  title,
  description,
  onClose,
  children,
}: {
  open: boolean
  title: string
  description?: string
  onClose: () => void
  children: ReactNode
}) {
  const isDesktop = useMediaQuery('(min-width: 768px)')

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
        <DialogContent className="p-0">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {description ? <DialogDescription>{description}</DialogDescription> : null}
          </DialogHeader>
          <div className="max-h-[85vh] overflow-y-auto p-5">{children}</div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Drawer open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle>{title}</DrawerTitle>
          {description ? <DrawerDescription>{description}</DrawerDescription> : null}
        </DrawerHeader>
        <div className="max-h-[80vh] overflow-y-auto px-5 pb-5">{children}</div>
      </DrawerContent>
    </Drawer>
  )
}
