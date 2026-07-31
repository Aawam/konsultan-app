'use client'

import { useActionState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { loginAction } from '@/lib/actions/auth-session'

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, { error: null })

  return (
    <main className="min-h-screen grid place-items-center bg-background px-4">
      <form
        action={formAction}
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
              name="email"
              type="email"
              autoComplete="email"
              aria-invalid={Boolean(state.error)}
              aria-describedby={state.error ? 'login-error' : undefined}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              aria-invalid={Boolean(state.error)}
              aria-describedby={state.error ? 'login-error' : undefined}
              required
            />
          </div>
        </div>

        {state.error ? (
          <p id="login-error" className="mt-4 text-sm text-destructive" role="alert">
            {state.error}
          </p>
        ) : null}

        <Button type="submit" className="mt-6 w-full" disabled={pending}>
          {pending ? 'Memproses...' : 'Masuk'}
        </Button>
      </form>
    </main>
  )
}
