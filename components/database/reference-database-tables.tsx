import { ListTreeIcon, PencilIcon, Trash2Icon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { AhspDetailRow, AhspItemRow, MasterHargaRow } from '@/lib/types/ahsp'
import { formatRupiah, formatTanggal } from '@/lib/utils'

export function formatPercent(value: number) {
  return `${new Intl.NumberFormat('id-ID', { maximumFractionDigits: 2 }).format(value)}%`
}

function formatDecimal(value: number) {
  return new Intl.NumberFormat('id-ID', { maximumFractionDigits: 6 }).format(value)
}

function EmptyRow({ colSpan, label }: { colSpan: number; label: string }) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="h-28 text-center text-sm text-muted-foreground">
        {label}
      </TableCell>
    </TableRow>
  )
}

export function AhspTable({
  rows,
  canManage,
  detailCountByItem,
  onOpenDetail,
  onEdit,
}: {
  rows: AhspItemRow[]
  canManage: boolean
  detailCountByItem: Record<string, number>
  onOpenDetail: (row: AhspItemRow) => void
  onEdit: (row: AhspItemRow) => void
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card">
      <Table className="min-w-[1040px] table-fixed">
        <TableHeader>
          <TableRow className="border-border bg-muted/40 hover:bg-transparent">
            <TableHead className="table-head w-32">Kode</TableHead>
            <TableHead className="table-head">Uraian Pekerjaan</TableHead>
            <TableHead className="table-head w-24">Bidang</TableHead>
            <TableHead className="table-head w-52">Kategori</TableHead>
            <TableHead className="table-head w-28">Satuan</TableHead>
            <TableHead className="table-head w-24 text-right">Detail</TableHead>
            <TableHead className="table-head w-32 text-right">Profit Default</TableHead>
            <TableHead className="table-head w-40">Dibuat</TableHead>
            <TableHead className="table-head w-44 text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length > 0 ? (
            rows.map((row) => (
              <TableRow key={row.id} className="border-border hover:bg-muted/40">
                <TableCell className="font-mono text-xs font-semibold">{row.kode_analisa}</TableCell>
                <TableCell>
                  <span className="block truncate font-semibold text-foreground">{row.uraian_pekerjaan}</span>
                </TableCell>
                <TableCell className="font-mono text-xs font-semibold">{row.bidang}</TableCell>
                <TableCell className="text-muted-foreground">{row.kategori}</TableCell>
                <TableCell className="font-mono text-xs">{row.satuan}</TableCell>
                <TableCell className="text-right font-mono text-xs font-semibold">
                  {detailCountByItem[row.id] ?? 0}
                </TableCell>
                <TableCell className="text-right font-mono text-xs font-semibold">
                  {formatPercent(row.profit_persen_default)}
                </TableCell>
                <TableCell className="text-muted-foreground">{formatTanggal(row.created_at)}</TableCell>
                <TableCell>
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon-sm"
                      onClick={() => onOpenDetail(row)}
                      title="Detail AHSP"
                      aria-label={`Detail AHSP ${row.kode_analisa}`}
                    >
                      <ListTreeIcon />
                    </Button>
                    {canManage && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon-sm"
                        className="border-amber/25 text-amber hover:bg-amber/10"
                        onClick={() => onEdit(row)}
                        title="Edit AHSP"
                        aria-label={`Edit AHSP ${row.kode_analisa}`}
                      >
                        <PencilIcon />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <EmptyRow colSpan={9} label="Belum ada item AHSP." />
          )}
        </TableBody>
      </Table>
    </div>
  )
}

export function HargaTable({
  rows,
  canManage,
  onEdit,
}: {
  rows: MasterHargaRow[]
  canManage: boolean
  onEdit: (row: MasterHargaRow) => void
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card">
      <Table className="min-w-[760px] table-fixed">
        <TableHeader>
          <TableRow className="border-border bg-muted/40 hover:bg-transparent">
            <TableHead className="table-head">Nama Item</TableHead>
            <TableHead className="table-head w-28">Satuan</TableHead>
            <TableHead className="table-head w-44 text-right">Harga Dasar</TableHead>
            <TableHead className="table-head w-40">Update</TableHead>
            {canManage && <TableHead className="table-head w-24 text-right">Aksi</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length > 0 ? (
            rows.map((row) => (
              <TableRow key={row.id} className="border-border hover:bg-muted/40">
                <TableCell className="font-semibold text-foreground">{row.nama}</TableCell>
                <TableCell className="font-mono text-xs">{row.satuan}</TableCell>
                <TableCell className="text-right font-mono font-semibold">{formatRupiah(row.harga_dasar)}</TableCell>
                <TableCell className="text-muted-foreground">{formatTanggal(row.updated_at)}</TableCell>
                {canManage && (
                  <TableCell className="text-right">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon-sm"
                      className="border-amber/25 text-amber hover:bg-amber/10"
                      onClick={() => onEdit(row)}
                      title="Edit harga dasar"
                      aria-label={`Edit harga dasar ${row.nama}`}
                    >
                      <PencilIcon />
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))
          ) : (
            <EmptyRow colSpan={canManage ? 5 : 4} label="Belum ada harga pada kategori ini." />
          )}
        </TableBody>
      </Table>
    </div>
  )
}

export function AhspDetailTable({
  rows,
  canManage,
  onEdit,
  onDelete,
}: {
  rows: AhspDetailRow[]
  canManage: boolean
  onEdit: (row: AhspDetailRow) => void
  onDelete: (row: AhspDetailRow) => void
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card">
      <Table className="min-w-[760px] table-fixed">
        <TableHeader>
          <TableRow className="border-border bg-muted/40 hover:bg-transparent">
            <TableHead className="table-head w-24">Tipe</TableHead>
            <TableHead className="table-head">Komponen</TableHead>
            <TableHead className="table-head w-24">Satuan</TableHead>
            <TableHead className="table-head w-32 text-right">Koefisien</TableHead>
            <TableHead className="table-head w-40 text-right">Harga Dasar</TableHead>
            <TableHead className="table-head w-44 text-right">Jumlah</TableHead>
            {canManage && <TableHead className="table-head w-32 text-right">Aksi</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length > 0 ? (
            rows.map((row) => (
              <TableRow key={row.id} className="border-border hover:bg-muted/40">
                <TableCell className="font-mono text-xs font-semibold uppercase">{row.komponen_tipe}</TableCell>
                <TableCell className="font-semibold text-foreground">{row.nama_komponen}</TableCell>
                <TableCell className="font-mono text-xs">{row.satuan}</TableCell>
                <TableCell className="text-right font-mono">{formatDecimal(row.koefisien)}</TableCell>
                <TableCell className="text-right font-mono">{formatRupiah(row.harga_dasar)}</TableCell>
                <TableCell className="text-right font-mono font-semibold">
                  {formatRupiah(row.jumlah_harga_dasar)}
                </TableCell>
                {canManage && (
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon-sm"
                        className="border-amber/25 text-amber hover:bg-amber/10"
                        onClick={() => onEdit(row)}
                        title="Edit detail AHSP"
                        aria-label={`Edit detail AHSP ${row.nama_komponen}`}
                      >
                        <PencilIcon />
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon-sm"
                        onClick={() => onDelete(row)}
                        title="Hapus detail AHSP"
                        aria-label={`Hapus detail AHSP ${row.nama_komponen}`}
                      >
                        <Trash2Icon />
                      </Button>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))
          ) : (
            <EmptyRow colSpan={canManage ? 7 : 6} label="Belum ada detail komponen untuk AHSP ini." />
          )}
        </TableBody>
      </Table>
    </div>
  )
}
