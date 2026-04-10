// src/hooks/useTypewriterLayout.ts
import { useMemo, useState, useCallback } from 'react'
import { prepareWithSegments } from '../prepare'
import { layoutWithLines } from '../layout'
import { getLineHeight } from '../font-utils'
import { buildTypewriterFrames, type TypewriterFrame } from '../typewriter'
import type { TextStyle } from '../types'

export type TypewriterLayoutResult = {
  /** All pre-computed frames (one per character) */
  frames: TypewriterFrame[]
  /** Current frame based on revealIndex */
  current: TypewriterFrame | null
  /** Total number of frames */
  totalFrames: number
  /** Current reveal index */
  revealIndex: number
  /** Advance to next character. Returns false if already complete. */
  advance: () => boolean
  /** Reset reveal to beginning */
  reset: () => void
  /** Jump to a specific index */
  seekTo: (index: number) => void
  /** Whether all text has been revealed */
  isComplete: boolean
  /** Height at current reveal position */
  height: number
  /** Line count at current reveal position */
  lineCount: number
}

export function useTypewriterLayout(
  text: string,
  style: TextStyle,
  maxWidth: number,
): TypewriterLayoutResult {
  const [revealIndex, setRevealIndex] = useState(-1)

  const frames = useMemo(() => {
    if (!text) return []
    const prepared = prepareWithSegments(text, style)
    const result = layoutWithLines(prepared, maxWidth)
    const lh = getLineHeight(style)
    return buildTypewriterFrames(result.lines, text, lh)
  }, [text, style.fontFamily, style.fontSize, style.fontWeight,
      style.fontStyle, style.lineHeight, maxWidth])

  const current = revealIndex >= 0 && revealIndex < frames.length
    ? frames[revealIndex]!
    : null

  const advance = useCallback((): boolean => {
    setRevealIndex(prev => {
      if (prev >= frames.length - 1) return prev
      return prev + 1
    })
    return revealIndex < frames.length - 1
  }, [frames.length, revealIndex])

  const reset = useCallback(() => {
    setRevealIndex(-1)
  }, [])

  const seekTo = useCallback((index: number) => {
    setRevealIndex(Math.max(-1, Math.min(index, frames.length - 1)))
  }, [frames.length])

  const isComplete = revealIndex >= frames.length - 1 && frames.length > 0

  return {
    frames,
    current,
    totalFrames: frames.length,
    revealIndex,
    advance,
    reset,
    seekTo,
    isComplete,
    height: current?.height ?? 0,
    lineCount: current?.lineCount ?? 0,
  }
}
