import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Field, FieldLabel } from '@/components/ui/field'
import { Textarea } from '@/components/ui/textarea'
import type { LocalProjectDraft } from '@/components/proyek/form/proyek-form-schema'
import { parseNumberInput } from '@/lib/utils'

export function ProyekDraftDialog({
  open,
  drafts,
  onOpenChange,
  onResumeDraft,
  onDeleteDraft,
}: {
  open: boolean
  drafts: LocalProjectDraft[]
  onOpenChange: (open: boolean) => void
  onResumeDraft: (draft: LocalProjectDraft) => void
  onDeleteDraft: (draftId: string) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Draft Proyek Tersedia</DialogTitle>
          <DialogDescription>
            Pilih draft yang ingin dilanjutkan, atau hapus draft yang sudah tidak diperlukan.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] space-y-3 overflow-y-auto px-5 py-2">
          {drafts.length === 0 ? (
            <div className="rounded-2xl border border-border bg-muted/30 p-5 text-sm text-muted-foreground">
              Belum ada draft tersimpan di browser ini.
            </div>
          ) : (
            drafts.map((draft) => {
              const draftName = draft.data.nama_proyek?.trim() || 'Draft tanpa nama'
              const jenis = draft.data.jenis_pekerjaan || 'Jenis belum dipilih'
              const updatedAt = new Date(draft.updatedAt).toLocaleString('id-ID', {
                dateStyle: 'medium',
                timeStyle: 'short',
              })

              return (
                <div key={draft.id} className="rounded-2xl border border-border bg-card p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-foreground">{draftName}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {jenis} · Disimpan {updatedAt}
                      </p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        Dinas: {draft.data.dinas || 'Belum diisi'} · Nilai kontrak: Rp {parseNumberInput(draft.data.nilai_penawaran).toLocaleString('id-ID')}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Button type="button" size="sm" onClick={() => onResumeDraft(draft)}>
                        Lanjutkan
                      </Button>
                      <Button type="button" size="sm" variant="destructive" onClick={() => onDeleteDraft(draft.id)}>
                        Hapus
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Mulai Baru
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function ProyekOverrideDialog({
  open,
  warnings,
  alasanOverride,
  fieldClassName,
  onOpenChange,
  onAlasanOverrideChange,
  onConfirm,
}: {
  open: boolean
  warnings: string[]
  alasanOverride: string
  fieldClassName: string
  onOpenChange: (open: boolean) => void
  onAlasanOverrideChange: (value: string) => void
  onConfirm: () => void
}) {
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Ada pelanggaran aturan"
      confirmLabel="Simpan dengan Override"
      confirmClassName="bg-amber-500/15 text-amber-700 border border-amber-500/20 hover:bg-amber-500/25 dark:text-amber-300"
      onConfirm={onConfirm}
    >
      {warnings.map((warning) => (
        <p key={warning} className="text-sm text-amber-700 dark:text-amber-300">
          Peringatan: {warning}
        </p>
      ))}
      <Field className="pt-2">
        <FieldLabel htmlFor="alasan_override">Alasan override *</FieldLabel>
        <Textarea
          id="alasan_override"
          className={fieldClassName}
          value={alasanOverride}
          onChange={(event) => onAlasanOverrideChange(event.target.value)}
          placeholder="Jelaskan alasan penyimpangan ini..."
          rows={3}
        />
      </Field>
    </ConfirmDialog>
  )
}
