'use client'

import * as React from 'react'

export function useMediaQuery(query: string) {
  // Keep the server render and the browser's first render identical. The real
  // viewport value is applied after hydration.
  const [matches, setMatches] = React.useState(false)

  React.useEffect(() => {
    const mediaQuery = window.matchMedia(query)
    const handleChange = () => setMatches(mediaQuery.matches)

    handleChange()
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [query])

  return matches
}
