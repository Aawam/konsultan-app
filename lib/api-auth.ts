import { apiError, apiUnauthorized } from '@/lib/api-response'
import { getCurrentUserProfile, isOwnerAdmin } from '@/lib/auth'

export async function requireCurrentUserProfileApi(message = 'User belum terdaftar sebagai anggota aplikasi.') {
  const { user, profile, error } = await getCurrentUserProfile()

  if (error?.source === 'auth' || !user) {
    return { profile: null, response: apiUnauthorized() }
  }

  if (error) {
    return { profile: null, response: apiError('INTERNAL_ERROR', error.message, 500) }
  }

  if (!profile) {
    return { profile: null, response: apiError('FORBIDDEN', message, 403) }
  }

  return { profile, response: null }
}

export async function requireOwnerAdminProfileApi(message: string) {
  const { profile, response } = await requireCurrentUserProfileApi()
  if (response) return { profile: null, response }

  if (!isOwnerAdmin(profile)) {
    return { profile: null, response: apiError('FORBIDDEN', message, 403) }
  }

  return { profile, response: null }
}

export async function requireOwnerAdminApi(message: string) {
  const { response } = await requireOwnerAdminProfileApi(message)
  return response
}
