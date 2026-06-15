type KvFieldProps = {
  label: string
  value?: string | null
  mono?: boolean
  span2?: boolean
  accent?: boolean
}

export function KvField({ label, value, mono, span2, accent }: KvFieldProps) {
  return (
    <div className={span2 ? 'col-span-2' : ''}>
      <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
      <p className={[
        'text-sm leading-snug',
        value ? 'text-foreground font-medium' : 'text-muted-foreground',
        mono ? 'font-mono' : '',
        accent ? 'text-brand font-semibold' : '',
      ].join(' ')}>
        {value || '—'}
      </p>
    </div>
  )
}
