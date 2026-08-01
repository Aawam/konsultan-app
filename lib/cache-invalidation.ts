import { revalidateTag } from 'next/cache'

import { CACHE_TAGS } from '@/lib/query-cache'

function expireTag(tag: string) {
  // Route Handlers need immediate expiry for read-your-own-writes behavior.
  // https://nextjs.org/docs/app/api-reference/functions/revalidateTag
  revalidateTag(tag, { expire: 0 })
}

export function invalidateProyekCache() {
  expireTag(CACHE_TAGS.proyek)
}

export function invalidatePerusahaanCache() {
  expireTag(CACHE_TAGS.perusahaan)
}

export function invalidateDinasCache() {
  expireTag(CACHE_TAGS.dinas)
  expireTag(CACHE_TAGS.proyek)
}
