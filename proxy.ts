import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { apiError } from '@/lib/api-response'
import { NextResponse, type NextRequest } from 'next/server'

type RateLimitEntry = {
  count: number
  resetAt: number
}

const API_MUTATION_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])
const API_MUTATION_LIMIT = 90
const API_MUTATION_WINDOW_MS = 60_000
const mutationRateLimits = new Map<string, RateLimitEntry>()

function pruneExpiredRateLimits(now: number) {
  if (mutationRateLimits.size < 1_000) return

  for (const [key, entry] of mutationRateLimits) {
    if (entry.resetAt <= now) mutationRateLimits.delete(key)
  }
}

function getClientIdentifier(request: NextRequest) {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'unknown'
}

function checkMutationRateLimit(request: NextRequest) {
  if (!request.nextUrl.pathname.startsWith('/api/')) return null
  if (!API_MUTATION_METHODS.has(request.method)) return null

  const now = Date.now()
  pruneExpiredRateLimits(now)

  const key = `${getClientIdentifier(request)}:${request.method}:${request.nextUrl.pathname}`
  const current = mutationRateLimits.get(key)

  if (!current || current.resetAt <= now) {
    mutationRateLimits.set(key, {
      count: 1,
      resetAt: now + API_MUTATION_WINDOW_MS,
    })
    return null
  }

  current.count += 1

  if (current.count <= API_MUTATION_LIMIT) return null

  const retryAfter = Math.max(1, Math.ceil((current.resetAt - now) / 1000))
  const response = apiError(
    'TOO_MANY_REQUESTS',
    'Terlalu banyak request. Coba lagi sebentar lagi.',
    429
  )
  response.headers.set('Retry-After', String(retryAfter))
  return response
}

export async function proxy(request: NextRequest) {
  const rateLimitResponse = checkMutationRateLimit(request)
  if (rateLimitResponse) return rateLimitResponse

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({
            request: { headers: request.headers },
          })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({
            request: { headers: request.headers },
          })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const isApiRoute = request.nextUrl.pathname.startsWith('/api/')

  // Aturan Satpam:
  // Jika user belum login DAN mencoba masuk ke halaman selain /login, 
  // maka tendang (redirect) ke /login
  if (!user && !request.nextUrl.pathname.startsWith('/login')) {
    if (isApiRoute) {
      return apiError('UNAUTHORIZED', 'Unauthorized', 401)
    }

    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Jika user sudah login tapi mencoba buka halaman /login, 
  // arahkan langsung ke /proyek
  if (user && request.nextUrl.pathname.startsWith('/login')) {
    const url = request.nextUrl.clone()
    url.pathname = '/proyek'
    return NextResponse.redirect(url)
  }

  return response
}

// Protect app pages only. API routes authenticate inside each handler so
// ordinary API/static requests do not pay the global proxy auth round trip.
export const config = {
  matcher: [
    '/login',
    '/proyek/:path*',
    '/database/:path*',
  ],
}
