import Link from 'next/link'

type Props = {
  href: string
  label?: string
}

export function BackButton({ href, label = 'Kembali' }: Props) {
  return (
    <Link href={href}
      className="inline-flex items-center gap-1.5 mb-6 px-3 py-1.5 text-sm text-foreground border border-border rounded-lg bg-muted hover:bg-accent transition-colors">
      ← {label}
    </Link>
  )
}