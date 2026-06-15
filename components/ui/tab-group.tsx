type TabGroupProps<T extends string | number> = {
  tabs: { label: string; value: T; accent?: string }[]
  value: T
  onChange: (value: T) => void
  className?: string
}

export function TabGroup<T extends string | number>({
  tabs,
  value,
  onChange,
  className = '',
}: TabGroupProps<T>) {
  return (
    <div
      className={`flex items-center gap-0.5 rounded-lg border border-border bg-muted p-1 ${className}`}
      style={{ scrollbarWidth: 'none' }}
    >
      {tabs.map((tab) => {
        const active = tab.value === value
        return (
          <button
            key={tab.value}
            onClick={() => onChange(tab.value)}
            className={[
              'px-3 py-1 rounded-md text-xs font-medium transition-all',
              active
                ? (tab.accent ?? 'bg-foreground text-background')
                : 'text-muted-foreground hover:text-foreground',
            ].join(' ')}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
