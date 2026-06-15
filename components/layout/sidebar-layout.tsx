'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ReactNode, useEffect, useState } from 'react'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { TopbarTitle } from '@/components/layout/topbar-title'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'

type NavGroup = {
  group: string
  items: { label: string; href: string | null }[]
}

const NAV_GROUPS: NavGroup[] = [
  {
    group: 'Monitoring',
    items: [
      { label: 'Daftar Proyek',    href: '/proyek' },
      { label: 'Dashboard',        href: '/proyek/dashboard' },
    ],
  },
  {
    group: 'Dokumen',
    items: [
      { label: 'Generator Penawaran', href: null },
      { label: 'Generator BAP',       href: null },
    ],
  },
  {
    group: 'Referensi',
    items: [
      { label: 'Database Perusahaan', href: '/database' },
    ],
  },
]

function Clock() {
  const [now, setNow] = useState<Date | null>(null)
  useEffect(() => {
    const tick = () => setNow(new Date())
    tick()
    const t = setInterval(tick, 1000)
    return () => clearInterval(t)
  }, [])

  if (!now) return null
  const pad = (n: number) => String(n).padStart(2, '0')
  const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
  return (
    <div className="text-right">
      <p className="font-mono text-xs font-semibold text-foreground tabular-nums tracking-wide">
        {pad(now.getHours())}:{pad(now.getMinutes())}:{pad(now.getSeconds())}
      </p>
      <p className="font-mono text-[10px] text-muted-foreground mt-0.5">
        {days[now.getDay()]}, {now.getDate()} {months[now.getMonth()]} {now.getFullYear()}
      </p>
    </div>
  )
}

export function SidebarLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [userEmail, setUserEmail] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    const supabase = createSupabaseBrowserClient()

    supabase.auth.getUser().then(({ data }) => {
      if (mounted) setUserEmail(data.user?.email ?? null)
    })

    return () => {
      mounted = false
    }
  }, [])

  const isActive = (href: string | null) => {
    if (!href) return false
    // Dashboard has its own exact match
    if (href === '/proyek/dashboard') return pathname.startsWith('/proyek/dashboard')
    // Daftar Proyek matches any /proyek/* path (including detail and edit)
    if (href === '/proyek') return pathname === '/proyek' || (pathname.startsWith('/proyek/') && !pathname.startsWith('/proyek/dashboard'))
    return pathname.startsWith(href)
  }

  const handleLogout = async () => {
    const supabase = createSupabaseBrowserClient()
    await supabase.auth.signOut()
    router.replace('/login')
    router.refresh()
  }

  const displayName = userEmail?.split('@')[0] ?? 'User'
  const initial = displayName.slice(0, 1).toUpperCase()

  return (
    <div className="flex flex-col">
      {/* ── Sidebar ─────────────────────────────────────── */}
      <aside className="w-56 shrink-0 flex flex-col fixed top-0 left-0 h-screen z-20" style={{ backgroundColor: 'var(--app-sidebar-bg)' }}>

        {/* Brand */}
        <div className="h-14 px-4 flex items-center gap-3 border-b sidebar-divider shrink-0">
          <div className="w-8 h-8 rounded-lg bg-brand/20 border border-brand/30 flex items-center justify-center shrink-0">
            <span className="text-sm font-black text-brand leading-none select-none">K</span>
          </div>
          <div>
            <p className="text-[13px] font-bold sidebar-text-primary leading-none tracking-tight">Awam&apos;s AI</p>
            <p className="text-[10px] sidebar-text-muted leading-none mt-0.5 tracking-wide">Consultant Helper</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
          {NAV_GROUPS.map((group) => (
            <div key={group.group}>
              <p className="text-[9px] font-bold sidebar-text-muted uppercase tracking-[0.14em] px-2 mb-1.5">
                {group.group}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const active = isActive(item.href)
                  return item.href ? (
                    <Link
                      key={item.label}
                      href={item.href}
                      className={[
                        'flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] transition-all relative',
                        active
                          ? 'bg-brand/10 text-brand font-medium'
                          : 'sidebar-nav-inactive font-normal',
                      ].join(' ')}
                    >
                      {active && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-brand rounded-r-full" />
                      )}
                      {item.label}
                    </Link>
                  ) : (
                    <span
                      key={item.label}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] sidebar-text-muted cursor-not-allowed opacity-40"
                    >
                      {item.label}
                    </span>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User footer */}
        <div className="px-4 py-3 border-t sidebar-divider flex items-center gap-2.5 shrink-0">
          <div className="w-7 h-7 rounded-full bg-brand/30 border border-brand/40 flex items-center justify-center shrink-0">
            <span className="text-[11px] font-bold text-brand">{initial}</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-semibold sidebar-text-primary leading-none truncate">{displayName}</p>
            <p className="text-[10px] sidebar-text-muted leading-none mt-0.5 truncate">{userEmail ?? 'Supabase user'}</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-md px-2 py-1 text-[10px] font-medium sidebar-nav-inactive hover:bg-black/5 dark:hover:bg-white/5"
          >
            Keluar
          </button>
        </div>
      </aside>

      {/* ── Main ────────────────────────────────────────── */}
      <div className="ml-56 flex flex-col min-h-screen">
        <header className="h-14 px-6 flex items-center justify-between border-b border-border bg-surface/80 backdrop-blur-md sticky top-0 z-10">
          <TopbarTitle />
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Clock />
          </div>
        </header>

        <main className="flex-1 px-6 py-6">
          {children}
        </main>
      </div>
    </div>
  )
}

/* Keep the old named export for any code that may import NavItem type */
export type NavItem = { label: string; href: string | null }
