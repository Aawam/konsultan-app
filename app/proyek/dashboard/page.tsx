import { getDaftarProyek } from '@/lib/actions/proyek'
import { PageError } from '@/components/ui/page-error'
import { DashboardClient } from '@/components/proyek/dashboard-client'
import { getCurrentUserProfile, isOwnerAdmin } from '@/lib/auth'

export default async function DashboardPage() {
  const { profile } = await getCurrentUserProfile()
  const canViewCommercial = isOwnerAdmin(profile)
  const { data: proyek, error } = await getDaftarProyek({ includeSensitive: canViewCommercial })
  if (error) return <PageError error={error} />
  return <DashboardClient proyek={proyek ?? []} canViewCommercial={canViewCommercial} />
}
