import { apiError } from '@/lib/api-response'
import { getCurrentUserProfile, isOwnerAdmin } from '@/lib/auth'

export async function requireOwnerAdminApi(message: string) {
  const { profile } = await getCurrentUserProfile()

  if (!isOwnerAdmin(profile)) {
    return apiError('FORBIDDEN', message, 403)
  }

  return null
}
