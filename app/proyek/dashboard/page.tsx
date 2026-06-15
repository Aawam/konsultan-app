import { getDaftarProyek } from '@/lib/actions/proyek'
import { PageError } from '@/components/ui/page-error'
import { DashboardClient } from '@/components/proyek/dashboard-client'

export default async function DashboardPage() {
  const { data: proyek, error } = await getDaftarProyek()
  if (error) return <PageError error={error} />
  return <DashboardClient proyek={proyek ?? []} />
}
