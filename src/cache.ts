// src/cache.ts
// JS-side width cache to skip native calls when all segments are cached.

const widthCache = new Map<string, Map<string, number>>()

export function getCachedWidth(
  fontKey: string,
  segment: string
): number | undefined {
  return widthCache.get(fontKey)?.get(segment)
}

export function setCachedWidth(
  fontKey: string,
  segment: string,
  width: number
): void {
  let fontCache = widthCache.get(fontKey)
  if (!fontCache) {
    fontCache = new Map()
    widthCache.set(fontKey, fontCache)
  }
  fontCache.set(segment, width)
}

export function cacheNativeResult(
  fontKey: string,
  segments: string[],
  widths: number[]
): void {
  let fontCache = widthCache.get(fontKey)
  if (!fontCache) {
    fontCache = new Map()
    widthCache.set(fontKey, fontCache)
  }
  for (let i = 0; i < segments.length; i++) {
    fontCache.set(segments[i]!, widths[i]!)
  }
}

export function tryResolveAllFromCache(
  fontKey: string,
  segments: string[]
): number[] | null {
  const fontCache = widthCache.get(fontKey)
  if (!fontCache) return null

  const widths: number[] = new Array(segments.length)
  for (let i = 0; i < segments.length; i++) {
    const w = fontCache.get(segments[i]!)
    if (w === undefined) return null
    widths[i] = w
  }
  return widths
}

export function clearJSCache(): void {
  widthCache.clear()
}
