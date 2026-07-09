import { createSupabaseServerClient } from '@/lib/supabase-server'
import type { CurrentUserProfile } from '@/lib/auth-types'
export { getRoleLabel, isOwnerAdmin, type AppRole, type CurrentUserProfile } from '@/lib/auth-types'

export async function getCurrentUserProfile(): Promise<{
  profile: CurrentUserProfile | null
  error: { message: string } | null
}> {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError) return { profile: null, error: { message: userError.message } }
  if (!user) return { profile: null, error: null }

  const { data, error } = await supabase
    .from('users')
    .select('id, email, nama, role')
    .eq('id', user.id)
    .maybeSingle()

  if (error) return { profile: null, error: { message: error.message } }

  return {
    profile: data
      ? {
          id: data.id,
          email: data.email,
          nama: data.nama,
          role: data.role,
        }
      : {
          id: user.id,
          email: user.email ?? '',
          nama: user.email?.split('@')[0] ?? 'User',
          role: 'tenaga_ahli',
        },
    error: null,
  }
}
