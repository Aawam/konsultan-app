import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatRupiah = (nilai: number | null): string => {
  if (nilai === null) return '-'
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(nilai)
}

export const formatTanggal = (tgl: string | null): string => {
  if (!tgl) return '-'
  return new Date(tgl).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export const parseNumberInput = (nilai: string | number | null | undefined): number => {
  if (nilai === null || nilai === undefined) return 0
  if (typeof nilai === 'number') return Number.isFinite(nilai) ? nilai : 0

  const cleaned = nilai.replace(/[^\d]/g, '')
  return cleaned ? Number(cleaned) : 0
}

export const formatNumberInput = (nilai: string | number | null | undefined): string => {
  const parsed = parseNumberInput(nilai)
  if (!parsed) return ''
  return new Intl.NumberFormat('id-ID').format(parsed)
}
