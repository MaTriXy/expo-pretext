// src/accessibility.ts
// Font scale change detection for Dynamic Type (iOS) and font scaling (Android).
// Allows consumers to invalidate caches and re-measure when the user changes
// their preferred text size in system settings.

import { AccessibilityInfo, Dimensions, PixelRatio, Platform } from 'react-native'
import { clearCache } from './layout'
import { getNativeModule } from './ExpoPretext'

type FontScaleListener = (fontScale: number) => void

const listeners = new Set<FontScaleListener>()
let currentScale = PixelRatio.getFontScale()
let subscribed = false

function notifyListeners(newScale: number): void {
  if (newScale === currentScale) return
  currentScale = newScale
  for (const listener of listeners) {
    listener(newScale)
  }
}

function subscribe(): void {
  if (subscribed) return
  subscribed = true

  // iOS: AccessibilityInfo fires contentSizeDidChange (not available on Android — no-op)
  // We use the generic 'change' event since 'contentSizeDidChange' may not be available on all RN versions
  if (Platform.OS === 'ios') {
    try {
      // @ts-ignore — contentSizeDidChange may not exist in all type definitions
      AccessibilityInfo.addEventListener('change', () => {
        notifyListeners(PixelRatio.getFontScale())
      })
    } catch {}
  }

  // Android: font scale changes trigger a configuration change → Dimensions event
  if (Platform.OS === 'android') {
    Dimensions.addEventListener('change', () => {
      notifyListeners(PixelRatio.getFontScale())
    })
  }
}

/**
 * Get the current system font scale multiplier.
 *
 * Returns `1.0` for default font size. Values > 1 mean the user has
 * increased their preferred text size (Dynamic Type on iOS, Font Size on Android).
 *
 * Use this to scale your `fontSize` before passing to expo-pretext:
 *
 * @example
 * ```ts
 * import { getFontScale, prepare, layout } from 'expo-pretext'
 *
 * const scale = getFontScale()
 * const style = { fontFamily: 'Inter', fontSize: 16 * scale, lineHeight: 24 * scale }
 * const prepared = prepare(text, style)
 * const height = layout(prepared, width).height
 * ```
 */
export function getFontScale(): number {
  return PixelRatio.getFontScale()
}

/**
 * Register a callback that fires when the system font scale changes.
 *
 * On iOS, this detects Dynamic Type changes (Settings > Accessibility > Larger Text).
 * On Android, this detects Font Size changes (Settings > Accessibility > Font Size).
 *
 * When the font scale changes, you should:
 * 1. Call `clearAllCaches()` to invalidate stale measurements
 * 2. Re-render components that use expo-pretext hooks (they will re-measure)
 *
 * Returns an unsubscribe function.
 *
 * @param callback - Called with the new font scale (e.g., 1.0, 1.35, 1.88)
 * @returns Function to remove the listener
 *
 * @example
 * ```ts
 * import { onFontScaleChange, clearAllCaches } from 'expo-pretext'
 *
 * // In your app's root component:
 * useEffect(() => {
 *   const unsubscribe = onFontScaleChange((newScale) => {
 *     clearAllCaches()
 *     // Force re-render to re-measure with new scale
 *     setFontScale(newScale)
 *   })
 *   return unsubscribe
 * }, [])
 * ```
 */
export function onFontScaleChange(callback: FontScaleListener): () => void {
  subscribe()
  listeners.add(callback)
  return () => {
    listeners.delete(callback)
  }
}

/**
 * Clear all measurement caches — both JavaScript-side and native-side.
 *
 * Call this when the system font scale changes, or when fonts are loaded/unloaded.
 * This is more thorough than `clearCache()` which only clears JS-side caches.
 *
 * @example
 * ```ts
 * import { clearAllCaches, onFontScaleChange } from 'expo-pretext'
 *
 * onFontScaleChange(() => {
 *   clearAllCaches() // Invalidates JS cache + native UIFont/TextPaint caches
 * })
 * ```
 */
export function clearAllCaches(): void {
  clearCache()
  try {
    const native = getNativeModule()
    if (native) {
      native.clearNativeCache()
    }
  } catch {}
}
