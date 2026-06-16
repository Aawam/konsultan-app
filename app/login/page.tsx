'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import { getSupabaseAuthErrorMessage } from '@/lib/supabase-config'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)

    let errorMessage: string | null = null

    try {
      const supabase = createSupabaseBrowserClient()
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      errorMessage = error ? getSupabaseAuthErrorMessage(error.message) : null
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan saat menyiapkan Supabase.'
    }

    setLoading(false)

    if (errorMessage) {
      toast.error(errorMessage)
      return
    }

    toast.success('Berhasil masuk')
    router.replace('/proyek')
    router.refresh()
  }

  return (
    <main className="min-h-screen grid place-items-center bg-background px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-sm"
      >
        <div className="mb-6">
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg border border-brand/30 bg-brand/15">
            <span className="text-sm font-black text-brand">K</span>
          </div>
          <h1 className="text-xl font-bold text-foreground">Masuk</h1>
          <p className="mt-1 text-sm text-muted-foreground">Gunakan akun Supabase yang terdaftar.</p>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>
        </div>

        <Button type="submit" className="mt-6 w-full" disabled={loading}>
          {loading ? 'Memproses...' : 'Masuk'}
        </Button>
      </form>
    </main>
  )
}
