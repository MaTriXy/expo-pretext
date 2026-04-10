// src/hooks/useCollapsibleHeight.ts
// Hook for collapsible text sections with pre-computed heights and smooth animation.
// Requires react-native-reanimated >= 3.0.0.

import { useMemo, useEffect } from 'react'
import { useSharedValue, withTiming, withSpring, type SharedValue, type WithTimingConfig, type WithSpringConfig } from 'react-native-reanimated'
import { prepare } from '../prepare'
import { layout } from '../layout'
import type { TextStyle } from '../types'

/**
 * Result returned by {@link useCollapsibleHeight}.
 */
export type CollapsibleHeightResult = {
  /** Animated height value — use in useAnimatedStyle */
  animatedHeight: SharedValue<number>
  /** Pre-computed height of the expanded state */
  expandedHeight: number
  /** Pre-computed height of the collapsed state */
  collapsedHeight: number
  /** Current target height (expanded or collapsed) */
  targetHeight: number
}

/**
 * React hook for collapsible text sections with smooth Reanimated animation.
 *
 * Pre-computes heights for both expanded and collapsed text states on mount
 * and when text/style/width changes. Animates between them when `isExpanded`
 * toggles. Both `prepare()` and `layout()` are pure arithmetic — no layout
 * jumps or measurement delays.
 *
 * Requires `react-native-reanimated` >= 3.0.0.
 *
 * @param expandedText - Full text shown in expanded state
 * @param collapsedText - Truncated/summary text shown in collapsed state
 * @param style - Text style (fontFamily, fontSize, lineHeight, etc.)
 * @param maxWidth - Container width in pixels
 * @param isExpanded - Whether the section is currently expanded
 * @param animConfig - Optional: timing or spring animation config
 * @returns Animated height, pre-computed heights, and current target
 *
 * @example
 * ```tsx
 * import { useCollapsibleHeight } from 'expo-pretext'
 * import Animated, { useAnimatedStyle } from 'react-native-reanimated'
 *
 * function CollapsiblePost({ fullText }) {
 *   const [expanded, setExpanded] = useState(false)
 *   const preview = fullText.slice(0, 100) + '...'
 *
 *   const { animatedHeight } = useCollapsibleHeight(
 *     fullText, preview, style, width, expanded,
 *   )
 *
 *   const animStyle = useAnimatedStyle(() => ({
 *     height: animatedHeight.value,
 *     overflow: 'hidden',
 *   }))
 *
 *   return (
 *     <View>
 *       <Animated.View style={animStyle}>
 *         <Text>{expanded ? fullText : preview}</Text>
 *       </Animated.View>
 *       <Pressable onPress={() => setExpanded(!expanded)}>
 *         <Text>{expanded ? 'Show less' : 'Show more'}</Text>
 *       </Pressable>
 *     </View>
 *   )
 * }
 * ```
 *
 * @example
 * ```tsx
 * // With spring animation
 * const { animatedHeight, expandedHeight, collapsedHeight } = useCollapsibleHeight(
 *   fullText, preview, style, width, isExpanded,
 *   { spring: { damping: 20, stiffness: 200 } },
 * )
 * ```
 */
export function useCollapsibleHeight(
  expandedText: string,
  collapsedText: string,
  style: TextStyle,
  maxWidth: number,
  isExpanded: boolean,
  animConfig?: { timing?: WithTimingConfig; spring?: WithSpringConfig },
): CollapsibleHeightResult {
  const expandedHeight = useMemo(() => {
    if (!expandedText) return 0
    const prepared = prepare(expandedText, style)
    return layout(prepared, maxWidth).height
  }, [expandedText, style.fontFamily, style.fontSize, style.fontWeight,
      style.fontStyle, style.lineHeight, maxWidth])

  const collapsedHeight = useMemo(() => {
    if (!collapsedText) return 0
    const prepared = prepare(collapsedText, style)
    return layout(prepared, maxWidth).height
  }, [collapsedText, style.fontFamily, style.fontSize, style.fontWeight,
      style.fontStyle, style.lineHeight, maxWidth])

  const targetHeight = isExpanded ? expandedHeight : collapsedHeight
  const animatedHeight = useSharedValue(targetHeight)

  useEffect(() => {
    if (animConfig?.spring) {
      animatedHeight.value = withSpring(targetHeight, animConfig.spring)
    } else {
      animatedHeight.value = withTiming(targetHeight, animConfig?.timing ?? { duration: 300 })
    }
  }, [targetHeight])

  return {
    animatedHeight,
    expandedHeight,
    collapsedHeight,
    targetHeight,
  }
}
