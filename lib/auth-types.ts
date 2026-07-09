import type { Database } from '@/lib/database.types'

export type AppRole = Database['public']['Enums']['app_role']

export type CurrentUserProfile = {
  id: string
  email: string
  nama: string
  role: AppRole
}

export function isOwnerAdmin(profile: CurrentUserProfile | null): boolean {
  return profile?.role === 'owner_admin'
}

export function getRoleLabel(role: AppRole | null | undefined): string {
  if (role === 'owner_admin') return 'Owner/Admin'
  if (role === 'tenaga_ahli') return 'Tenaga Ahli'
  return 'User'
}
