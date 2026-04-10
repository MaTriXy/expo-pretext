// src/typewriter.ts
// Typewriter effect: pre-compute reveal frames from layoutWithLines() output.
// Each frame represents one more character revealed, with correct lineCount and height.

import type { LayoutLine } from './types'

export type TypewriterFrame = {
  /** Text revealed so far */
  revealedText: string
  /** Number of visible lines at this point */
  lineCount: number
  /** Total height at this point (lineCount * lineHeight) */
  height: number
  /** True when all text has been revealed */
  isComplete: boolean
}

/**
 * Build an array of typewriter frames from pre-computed layout lines.
 * Each frame represents one more character of text revealed.
 *
 * @param lines - Output from layoutWithLines().lines
 * @param text - The original source text
 * @param lineHeight - Height per line in pixels
 * @returns One frame per character in the text
 */
export function buildTypewriterFrames(
  lines: LayoutLine[],
  text: string,
  lineHeight: number,
): TypewriterFrame[] {
  if (!text || lines.length === 0) return []

  const frames: TypewriterFrame[] = []
  const totalChars = text.length

  // Build a map: for each character index, which line is it on?
  let charOffset = 0
  const charToLine: number[] = new Array(totalChars)

  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const lineText = lines[lineIdx]!.text
    for (let j = 0; j < lineText.length; j++) {
      if (charOffset < totalChars) {
        charToLine[charOffset] = lineIdx
        charOffset++
      }
    }
  }

  // Fill any remaining characters (spaces consumed between lines)
  while (charOffset < totalChars) {
    charToLine[charOffset] = lines.length - 1
    charOffset++
  }

  // Build frames
  for (let i = 0; i < totalChars; i++) {
    const lineIdx = charToLine[i]!
    const lineCount = lineIdx + 1
    frames.push({
      revealedText: text.slice(0, i + 1),
      lineCount,
      height: lineCount * lineHeight,
      isComplete: i === totalChars - 1,
    })
  }

  return frames
}
