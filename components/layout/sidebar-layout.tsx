'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import type { ComponentType, ReactNode } from 'react'
import { useEffect, useState } from 'react'
import {
  Database,
  FolderKanban,
  Gauge,
  LogOut,
  Plus,
  UserRound,
} from 'lucide-react'

import { TopbarTitle } from '@/components/layout/topbar-title'
import { Button } from '@/components/ui/button'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'

type NavGroup = {
  group: string
  items: {
    label: string
    href: string | null
    icon: ComponentType<{ className?: string }>
  }[]
}

const NAV_GROUPS: NavGroup[] = [
  {
    group: 'Monitoring',
    items: [
      { label: 'Daftar Proyek', href: '/proyek', icon: FolderKanban },
      { label: 'Dashboard', href: '/proyek/dashboard', icon: Gauge },
    ],
  },
  {
    group: 'Referensi',
    items: [{ label: 'Database', href: '/database', icon: Database }],
  },
]

const SIDEBAR_STORAGE_KEY = 'konsultan:sidebar-open'

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
      <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">
        {days[now.getDay()]}, {now.getDate()} {months[now.getMonth()]} {now.getFullYear()}
      </p>
    </div>
  )
}

export function SidebarLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window === 'undefined') return true
    return window.localStorage.getItem(SIDEBAR_STORAGE_KEY) !== 'false'
  })

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

  useEffect(() => {
    window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(sidebarOpen))
  }, [sidebarOpen])

  const isActive = (href: string | null) => {
    if (!href) return false
    if (href === '/proyek/dashboard') return pathname.startsWith('/proyek/dashboard')
    if (href === '/proyek') {
      return pathname === '/proyek' || (pathname.startsWith('/proyek/') && !pathname.startsWith('/proyek/dashboard'))
    }
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
    <SidebarProvider open={sidebarOpen} onOpenChange={setSidebarOpen}>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <Link
            href="/proyek"
            className="flex min-w-0 items-center gap-3 group-data-[state=collapsed]/sidebar:justify-center"
          >
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-sidebar-primary/35 bg-sidebar-primary text-sidebar-primary-foreground shadow-sm shadow-black/10">
              <span className="text-sm font-black leading-none">K</span>
            </div>
            <div className="min-w-0 group-data-[state=collapsed]/sidebar:hidden">
              <p className="truncate text-sm font-bold leading-none tracking-tight text-sidebar-foreground">
                Konsultan App
              </p>
              <p className="mt-1 truncate text-[10px] leading-none text-sidebar-foreground/55">
                Monitoring proyek
              </p>
            </div>
          </Link>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname === '/proyek/baru'}>
                    <Link href="/proyek/baru">
                      <Plus />
                      <span className="group-data-[state=collapsed]/sidebar:hidden">Tambah Proyek</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {NAV_GROUPS.map((group) => (
            <SidebarGroup key={group.group}>
              <SidebarGroupLabel>{group.group}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.items.map((item) => {
                    const Icon = item.icon
                    const active = isActive(item.href)

                    return (
                      <SidebarMenuItem key={item.label}>
                        {item.href ? (
                          <SidebarMenuButton asChild isActive={active}>
                            <Link href={item.href}>
                              <Icon />
                              <span className="truncate group-data-[state=collapsed]/sidebar:hidden">
                                {item.label}
                              </span>
                            </Link>
                          </SidebarMenuButton>
                        ) : (
                          <SidebarMenuButton disabled>
                            <Icon />
                            <span className="truncate group-data-[state=collapsed]/sidebar:hidden">
                              {item.label}
                            </span>
                          </SidebarMenuButton>
                        )}
                      </SidebarMenuItem>
                    )
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </SidebarContent>

        <SidebarFooter>
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-xs font-bold text-primary">
              {initial || <UserRound className="size-4" />}
            </div>
            <div className="min-w-0 flex-1 group-data-[state=collapsed]/sidebar:hidden">
              <p className="truncate text-xs font-semibold leading-none text-sidebar-foreground">{displayName}</p>
              <p className="mt-1 truncate text-[10px] leading-none text-sidebar-foreground/55">
                {userEmail ?? 'Supabase user'}
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="group-data-[state=collapsed]/sidebar:hidden"
              onClick={handleLogout}
              aria-label="Keluar"
              title="Keluar"
            >
              <LogOut />
            </Button>
          </div>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      <SidebarInset>
        <header className="app-topbar sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border/70 px-5 backdrop-blur-md">
          <div className="flex min-w-0 items-center gap-2">
            <SidebarTrigger title={sidebarOpen ? 'Minimize sidebar' : 'Expand sidebar'} />
            <TopbarTitle />
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Clock />
          </div>
        </header>

        <main className="flex-1 px-5 py-5 md:px-6 md:py-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}

export type NavItem = { label: string; href: string | null }
