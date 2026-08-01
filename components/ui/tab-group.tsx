type TabGroupProps<T extends string | number> = {
  tabs: { label: string; value: T; accent?: string }[]
  value: T
  onChange: (value: T) => void
  ariaLabel?: string
  className?: string
  buttonClassName?: string
}

export function TabGroup<T extends string | number>({
  tabs,
  value,
  onChange,
  ariaLabel,
  className = '',
  buttonClassName = '',
}: TabGroupProps<T>) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={`flex max-w-full min-w-0 items-center gap-0.5 overflow-x-auto rounded-lg border border-border bg-muted/55 p-1 ${className}`}
      style={{ scrollbarWidth: 'none' }}
    >
      {tabs.map((tab) => {
        const active = tab.value === value
        return (
          <button
            type="button"
            key={tab.value}
            onClick={() => onChange(tab.value)}
            aria-pressed={active}
            className={[
              'shrink-0 rounded-md text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
              buttonClassName || 'px-3 py-1',
              active
                ? (tab.accent ?? 'bg-card text-foreground shadow-sm shadow-black/10')
                : 'text-muted-foreground hover:bg-card/70 hover:text-foreground',
            ].join(' ')}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
