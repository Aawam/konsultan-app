import { ReactNode } from 'react'
import { SidebarLayout } from '@/components/layout/sidebar-layout'

export default function BapLayout({ children }: { children: ReactNode }) {
  return <SidebarLayout>{children}</SidebarLayout>
}
