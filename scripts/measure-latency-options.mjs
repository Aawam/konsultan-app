const PUBLIC_PATHS = ['/', '/login']
const PROTECTED_PATHS = ['/proyek', '/database']

export function buildRequestHeaders({ bypassCache, cookie } = {}) {
  const headers = {
    'User-Agent': 'konsultan-app-latency-check/1.0',
  }

  if (bypassCache) headers['Cache-Control'] = 'no-cache'
  if (cookie) headers.Cookie = cookie

  return headers
}

export function getMeasuredPaths(cookie) {
  return cookie
    ? [...PUBLIC_PATHS, ...PROTECTED_PATHS]
    : PUBLIC_PATHS
}
