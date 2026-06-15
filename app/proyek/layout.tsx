import { ReactNode } from 'react'
import { SidebarLayout } from '@/components/layout/sidebar-layout'

export default function ProyekLayout({ children }: { children: ReactNode }) {
  return <SidebarLayout>{children}</SidebarLayout>
}
