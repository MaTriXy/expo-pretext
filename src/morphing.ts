// src/morphing.ts
// Text morphing: compute interpolation data between two text layouts.
// Used for "Thinking..." → final response transitions in AI chat.

import type { LayoutLine } from './types'

/**
 * A single line in a text morphing transition.
 *
 * Each line has a `from` and `to` state. During animation, interpolate
 * opacity, y-position, and text content between these states.
 */
export type MorphLine = {
  /** Text content for this line in the `from` state, or '' if line doesn't exist in `from` */
  fromText: string
  /** Text content for this line in the `to` state, or '' if line doesn't exist in `to` */
  toText: string
  /** Line width in the `from` state (0 if line doesn't exist in `from`) */
  fromWidth: number
  /** Line width in the `to` state (0 if line doesn't exist in `to`) */
  toWidth: number
  /** Whether this line exists in the `from` state */
  existsInFrom: boolean
  /** Whether this line exists in the `to` state */
  existsInTo: boolean
}

/**
 * Result of computing a text morph transition.
 */
export type TextMorphResult = {
  /** Per-line morph data — length equals max(fromLineCount, toLineCount) */
  lines: MorphLine[]
  /** Height of the `from` state */
  fromHeight: number
  /** Height of the `to` state */
  toHeight: number
  /** Line count of the `from` state */
  fromLineCount: number
  /** Line count of the `to` state */
  toLineCount: number
  /** Interpolated height at a given progress (0 = from, 1 = to) */
  heightAt: (progress: number) => number
  /** Number of lines visible at a given progress (0 = from count, 1 = to count) */
  visibleLinesAt: (progress: number) => number
}

/**
 * Compute morph transition data between two sets of layout lines.
 *
 * Pairs up lines from `fromLines` and `toLines` by index. Lines that exist
 * in only one state get empty counterparts in the other. Use `progress`
 * (0 to 1) to interpolate height and visible line count.
 *
 * @param fromLines - Layout lines from the source state (e.g., "Thinking...")
 * @param toLines - Layout lines from the target state (e.g., final response)
 * @param lineHeight - Height per line in pixels
 * @returns Morph data with per-line info and interpolation functions
 *
 * @example
 * ```ts
 * import { prepareWithSegments, layoutWithLines, buildTextMorph } from 'expo-pretext'
 *
 * const fromPrepared = prepareWithSegments('Thinking...', style)
 * const toPrepared = prepareWithSegments(finalResponse, style)
 * const fromLayout = layoutWithLines(fromPrepared, width)
 * const toLayout = layoutWithLines(toPrepared, width)
 *
 * const morph = buildTextMorph(fromLayout.lines, toLayout.lines, 24)
 *
 * // At progress 0.5: halfway between heights
 * const midHeight = morph.heightAt(0.5)
 * ```
 */
export function buildTextMorph(
  fromLines: LayoutLine[],
  toLines: LayoutLine[],
  lineHeight: number,
): TextMorphResult {
  const maxLines = Math.max(fromLines.length, toLines.length)
  const lines: MorphLine[] = []

  for (let i = 0; i < maxLines; i++) {
    const from = i < fromLines.length ? fromLines[i]! : null
    const to = i < toLines.length ? toLines[i]! : null
    lines.push({
      fromText: from?.text ?? '',
      toText: to?.text ?? '',
      fromWidth: from?.width ?? 0,
      toWidth: to?.width ?? 0,
      existsInFrom: from !== null,
      existsInTo: to !== null,
    })
  }

  const fromHeight = fromLines.length * lineHeight
  const toHeight = toLines.length * lineHeight
  const fromLineCount = fromLines.length
  const toLineCount = toLines.length

  return {
    lines,
    fromHeight,
    toHeight,
    fromLineCount,
    toLineCount,
    heightAt(progress: number): number {
      const p = Math.max(0, Math.min(1, progress))
      return fromHeight + (toHeight - fromHeight) * p
    },
    visibleLinesAt(progress: number): number {
      const p = Math.max(0, Math.min(1, progress))
      return Math.round(fromLineCount + (toLineCount - fromLineCount) * p)
    },
  }
}
