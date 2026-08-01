'use client'

import { ChevronUp, LogOut, UserRound } from 'lucide-react'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { logoutAction } from '@/lib/actions/auth-session'
import { getRoleLabel, type CurrentUserProfile } from '@/lib/auth-types'

export function SidebarAccountMenu({ profile }: { profile: CurrentUserProfile | null }) {
  const displayName = profile?.nama || profile?.email.split('@')[0] || 'User'
  const initial = displayName.slice(0, 1).toUpperCase()
  const roleLabel = getRoleLabel(profile?.role)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`Buka menu akun ${displayName}`}
          className="flex w-full min-w-0 items-center gap-2.5 rounded-xl px-1 py-1 text-left outline-none transition-colors hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-sidebar-ring group-data-[state=collapsed]/sidebar:justify-center"
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-xs font-bold text-primary">
            {initial || <UserRound className="size-4" />}
          </span>
          <span className="min-w-0 flex-1 group-data-[state=collapsed]/sidebar:hidden">
            <span className="block truncate text-xs font-semibold leading-none text-sidebar-foreground">{displayName}</span>
            <span className="mt-1 block truncate text-[10px] leading-none text-sidebar-foreground/55">{roleLabel}</span>
          </span>
          <ChevronUp className="size-4 shrink-0 text-sidebar-foreground/55 group-data-[state=collapsed]/sidebar:hidden" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent side="top" align="start" collisionPadding={12} className="w-56">
        <DropdownMenuLabel className="space-y-1 px-2 py-2">
          <span className="block truncate text-sm font-semibold text-foreground">{displayName}</span>
          <span className="block truncate font-normal text-muted-foreground">{roleLabel}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <form action={logoutAction}>
          <DropdownMenuItem asChild className="text-destructive focus:bg-destructive/10 focus:text-destructive">
            <button type="submit" className="w-full">
              <LogOut />
              Keluar
            </button>
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
