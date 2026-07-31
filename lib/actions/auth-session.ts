'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

import { getSupabaseAuthErrorMessage } from '@/lib/supabase-config'
import { createSupabaseServerClient } from '@/lib/supabase-server'

const loginSchema = z.object({
  email: z.string().trim().email('Email tidak valid.').max(254, 'Email terlalu panjang.'),
  password: z.string().min(1, 'Password wajib diisi.').max(1_024, 'Password terlalu panjang.'),
})

type LoginActionState = {
  error: string | null
}

export async function loginAction(
  _previousState: LoginActionState,
  formData: FormData
): Promise<LoginActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? 'Email dan password tidak valid.',
    }
  }

  try {
    const supabase = await createSupabaseServerClient()
    const { error } = await supabase.auth.signInWithPassword(parsed.data)

    if (error) {
      return { error: getSupabaseAuthErrorMessage(error.message) }
    }
  } catch {
    return { error: 'Layanan autentikasi tidak dapat dihubungi.' }
  }

  redirect('/proyek')
}

export async function logoutAction() {
  const supabase = await createSupabaseServerClient()
  await supabase.auth.signOut({ scope: 'local' })

  revalidatePath('/', 'layout')
  redirect('/login')
}
