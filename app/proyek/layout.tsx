import { ReactNode } from 'react'
import { SidebarLayout } from '@/components/layout/sidebar-layout'
import { getCurrentUserProfile } from '@/lib/auth'

export default async function ProyekLayout({ children }: { children: ReactNode }) {
  const { profile } = await getCurrentUserProfile()
  return <SidebarLayout profile={profile}>{children}</SidebarLayout>
}
