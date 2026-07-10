'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ShieldAlertIcon } from 'lucide-react'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'

type AccessDeniedReason = 'forbidden' | 'not-planning'

const accessDeniedCopy: Record<AccessDeniedReason, { title: string; description: string }> = {
  forbidden: {
    title: 'Mohon maaf, Anda tidak diizinkan membuka ini',
    description:
      'Akses RAB hanya tersedia untuk Owner/Admin atau tenaga ahli yang terdaftar pada proyek ini.',
  },
  'not-planning': {
    title: 'Mohon maaf, RAB tidak tersedia untuk proyek ini',
    description: 'RAB hanya dapat dibuat untuk proyek dengan jenis pekerjaan Perencanaan.',
  },
}

export function RabAccessDeniedDialog({
  reason,
  backHref = '/proyek/rab',
}: {
  reason: AccessDeniedReason
  backHref?: string
}) {
  const router = useRouter()
  const [open, setOpen] = React.useState(true)
  const copy = accessDeniedCopy[reason]

  function returnToList() {
    setOpen(false)
    router.replace(backHref)
  }

  return (
    <div className="pb-10">
      <section className="mx-auto mt-16 max-w-xl rounded-xl border border-border bg-card p-6 text-center shadow-sm">
        <div className="mx-auto flex size-11 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <ShieldAlertIcon className="size-5" aria-hidden="true" />
        </div>
        <h1 className="mt-4 text-lg font-semibold text-foreground">{copy.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{copy.description}</p>
        <Button asChild className="mt-5">
          <Link href={backHref}>Kembali ke Daftar RAB</Link>
        </Button>
      </section>

      <AlertDialog
        open={open}
        onOpenChange={(nextOpen) => {
          if (nextOpen) {
            setOpen(true)
            return
          }

          returnToList()
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia>
              <ShieldAlertIcon aria-hidden="true" />
            </AlertDialogMedia>
            <AlertDialogTitle>{copy.title}</AlertDialogTitle>
            <AlertDialogDescription>{copy.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={returnToList}>Kembali ke Daftar RAB</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
