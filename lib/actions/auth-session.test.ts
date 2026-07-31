import { beforeEach, describe, expect, it, vi } from 'vitest'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { loginAction, logoutAction } from '@/lib/actions/auth-session'
import { createSupabaseServerClient } from '@/lib/supabase-server'

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}))

vi.mock('@/lib/supabase-server', () => ({
  createSupabaseServerClient: vi.fn(),
}))

const createSupabaseServerClientMock = vi.mocked(createSupabaseServerClient)
const redirectMock = vi.mocked(redirect)
const revalidatePathMock = vi.mocked(revalidatePath)

function loginForm(email: string, password: string) {
  const formData = new FormData()
  formData.set('email', email)
  formData.set('password', password)
  return formData
}

describe('loginAction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('rejects invalid credentials before contacting Supabase', async () => {
    const result = await loginAction(
      { error: null },
      loginForm('bukan-email', '')
    )

    expect(result.error).toBeTruthy()
    expect(createSupabaseServerClientMock).not.toHaveBeenCalled()
  })

  it('returns the mapped Supabase authentication error', async () => {
    const signInWithPassword = vi.fn().mockResolvedValue({
      error: { message: 'Invalid login credentials' },
    })
    createSupabaseServerClientMock.mockResolvedValue({
      auth: { signInWithPassword },
    } as never)

    await expect(
      loginAction(
        { error: null },
        loginForm('user@example.com', 'password')
      )
    ).resolves.toEqual({ error: 'Invalid login credentials' })

    expect(redirectMock).not.toHaveBeenCalled()
  })

  it('redirects to the project page after a successful sign in', async () => {
    const signInWithPassword = vi.fn().mockResolvedValue({ error: null })
    createSupabaseServerClientMock.mockResolvedValue({
      auth: { signInWithPassword },
    } as never)

    await loginAction(
      { error: null },
      loginForm(' user@example.com ', 'password')
    )

    expect(signInWithPassword).toHaveBeenCalledWith({
      email: 'user@example.com',
      password: 'password',
    })
    expect(redirectMock).toHaveBeenCalledWith('/proyek')
  })
})

describe('logoutAction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('removes the local session, invalidates the shell, and redirects', async () => {
    const signOut = vi.fn().mockResolvedValue({ error: null })
    createSupabaseServerClientMock.mockResolvedValue({
      auth: { signOut },
    } as never)

    await logoutAction()

    expect(signOut).toHaveBeenCalledWith({ scope: 'local' })
    expect(revalidatePathMock).toHaveBeenCalledWith('/', 'layout')
    expect(redirectMock).toHaveBeenCalledWith('/login')
  })
})
