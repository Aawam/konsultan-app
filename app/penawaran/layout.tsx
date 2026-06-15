import { ReactNode } from 'react'
import { SidebarLayout } from '@/components/layout/sidebar-layout'

export default function PenawaranLayout({ children }: { children: ReactNode }) {
  return <SidebarLayout>{children}</SidebarLayout>
}
