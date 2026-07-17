'use client'

import { useEffect, useState } from 'react'

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(true)

  useEffect(() => {
    queueMicrotask(() => {
      setIsDark(localStorage.getItem('theme') !== 'light')
    })
  }, [])

  const toggle = () => {
    const html = document.documentElement
    if (isDark) {
      html.classList.remove('dark')
      setIsDark(false)
      localStorage.setItem('theme', 'light')
    } else {
      html.classList.add('dark')
      setIsDark(true)
      localStorage.setItem('theme', 'dark')
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? 'Gunakan mode terang' : 'Gunakan mode gelap'}
      aria-pressed={isDark}
      title={isDark ? 'Gunakan mode terang' : 'Gunakan mode gelap'}
      className="flex items-center gap-2 rounded-full border border-border bg-muted px-2 py-1 transition-colors hover:bg-accent"
    >
      <span aria-hidden="true" className="text-base leading-none select-none">
        {isDark ? '🌙' : '☀️'}
      </span>
      <div aria-hidden="true" className="relative w-9 h-5 rounded-full bg-border transition-colors">
        <div
          className={[
            'absolute top-0.5 w-4 h-4 rounded-full bg-foreground shadow-sm transition-all duration-200',
            isDark ? 'left-[calc(100%-1.125rem)]' : 'left-0.5',
          ].join(' ')}
        />
      </div>
    </button>
  )
}
