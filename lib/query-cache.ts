import { unstable_cache } from 'next/cache'

export const CACHE_TAGS = {
  dinas: 'reference:dinas',
  perusahaan: 'reference:perusahaan',
  proyek: 'data:proyek',
} as const

type QueryResult<T, E> = {
  data: T | null
  error: E | null
}

type CacheSuccessfulQueryOptions = {
  scope?: string | null
  keyParts: string[]
  tags: string[]
  revalidate?: number
}

export function getUserCacheScope(profile: { id: string; role: string } | null) {
  return profile ? `${profile.id}:${profile.role}` : undefined
}

export async function cacheSuccessfulQuery<T, E>(
  load: () => Promise<QueryResult<T, E>>,
  {
    scope,
    keyParts,
    tags,
    revalidate = 300,
  }: CacheSuccessfulQueryOptions
): Promise<QueryResult<T, E>> {
  if (!scope) return load()

  // The app has not enabled Cache Components, so Next 16's documented
  // previous-model API is the compatible persistent cache mechanism.
  // https://nextjs.org/docs/app/guides/caching-without-cache-components
  const loadCachedData = unstable_cache(
    async () => {
      const result = await load()
      if (result.error) throw result.error
      return result.data
    },
    [...keyParts, scope],
    { tags, revalidate }
  )

  try {
    return { data: await loadCachedData(), error: null }
  } catch (error) {
    return { data: null, error: error as E }
  }
}
