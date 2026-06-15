import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { cn } from '@/lib/utils'

type ConfirmDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  confirmClassName?: string
  onConfirm: () => void
  children?: React.ReactNode
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Ya',
  cancelLabel = 'Batal',
  confirmClassName,
  onConfirm,
  children,
}: ConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-surface border-border">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-foreground">{title}</AlertDialogTitle>
          {(description || children) && (
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                {description && <p className="text-muted-foreground">{description}</p>}
                {children}
              </div>
            </AlertDialogDescription>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="border-border bg-muted text-foreground hover:bg-accent">
            {cancelLabel}
          </AlertDialogCancel>
          {/*
            I3: replaced AlertDialogAction (which wraps Radix DialogClose and closes the
            dialog unconditionally before onConfirm validation runs) with a plain <button>.
            Old behaviour: clicking "Simpan dengan Override" with an empty alasan closed
            the dialog instantly — toast.error fired but dialog was already gone.
            New behaviour: onConfirm runs first; callers control when to call onOpenChange(false).
          */}
          <button
            type="button"
            onClick={onConfirm}
            className={cn(
              'inline-flex items-center justify-center rounded-md text-sm font-medium',
              'h-9 px-4 py-2 transition-colors cursor-pointer',
              confirmClassName
            )}
          >
            {confirmLabel}
          </button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
