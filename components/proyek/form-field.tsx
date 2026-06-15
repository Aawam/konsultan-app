import { Label } from '@/components/ui/label'

type FormFieldProps = {
  label: string
  required?: boolean
  className?: string
  children: React.ReactNode
}

export function FormField({ label, required, className, children }: FormFieldProps) {
  return (
    <div className={className}>
      <Label className="text-slate-400 text-xs">
        {label}{required && ' *'}
      </Label>
      {children}
    </div>
  )
}
