import { cache } from 'react'

import { createSupabaseServerClient } from '@/lib/supabase-server'
import type { CurrentUserProfile } from '@/lib/auth-types'
export { getRoleLabel, isOwnerAdmin, type AppRole, type CurrentUserProfile } from '@/lib/auth-types'

async function loadCurrentUserProfile(): Promise<{
  user: { id: string; email?: string | null } | null
  profile: CurrentUserProfile | null
  error: { message: string; source: 'auth' | 'profile' } | null
}> {
  const supabase = await createSupabaseServerClient()
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims()

  if (claimsError) {
    return {
      user: null,
      profile: null,
      error: { message: claimsError.message, source: 'auth' },
    }
  }

  const subject = claimsData?.claims?.sub
  if (!subject) return { user: null, profile: null, error: null }

  const email = claimsData.claims.email
  const user = {
    id: subject,
    email: typeof email === 'string' ? email : null,
  }

  const { data, error } = await supabase
    .from('users')
    .select('id, email, nama, role')
    .eq('id', user.id)
    .maybeSingle()

  if (error) return { user, profile: null, error: { message: error.message, source: 'profile' } }

  return {
    user,
    profile: data
      ? {
          id: data.id,
          email: data.email,
          nama: data.nama,
          role: data.role,
        }
      : null,
    error: null,
  }
}

export const getCurrentUserProfile = cache(loadCurrentUserProfile)
