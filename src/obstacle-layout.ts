// obstacle-layout.ts
// High-level text layout around obstacles (circles, rectangles).
// Used by editorial engine, dynamic layout, and any reflow-around-obstacles demo.
//
// Core idea: for each text line Y, compute blocked intervals from obstacles,
// carve free slots, and fill each slot with layoutNextLine().
// prepareWithSegments() is called ONCE. layoutNextLine() is called N times per frame.

import { layoutNextLine, type LayoutCursor, type PreparedTextWithSegments } from './layout'
import type { LayoutLine } from './types'

// --- Types ---

export type Interval = {
  left: number
  right: number
}

export type CircleObstacle = {
  cx: number
  cy: number
  r: number
  hPad?: number
  vPad?: number
}

export type RectObstacle = {
  x: number
  y: number
  w: number
  h: number
}

export type LayoutRegion = {
  x: number
  y: number
  width: number
  height: number
}

export type PositionedLine = {
  x: number
  y: number
  width: number
  text: string
}

export type LayoutColumnResult = {
  lines: PositionedLine[]
  cursor: LayoutCursor
}

// --- Interval arithmetic ---

/**
 * Compute the horizontal interval blocked by a circle at a given line band.
 * Returns null if the circle doesn't intersect this band.
 */
export function circleIntervalForBand(
  cx: number,
  cy: number,
  r: number,
  bandTop: number,
  bandBottom: number,
  hPad: number = 0,
  vPad: number = 0,
): Interval | null {
  const top = bandTop - vPad
  const bottom = bandBottom + vPad
  if (top >= cy + r || bottom <= cy - r) return null
  const minDy = cy >= top && cy <= bottom ? 0 : cy < top ? top - cy : cy - bottom
  if (minDy >= r) return null
  const maxDx = Math.sqrt(r * r - minDy * minDy)
  return { left: cx - maxDx - hPad, right: cx + maxDx + hPad }
}

/**
 * Compute the horizontal interval blocked by a rectangle at a given line band.
 * Returns null if the rect doesn't intersect this band.
 */
export function rectIntervalForBand(
  rect: RectObstacle,
  bandTop: number,
  bandBottom: number,
): Interval | null {
  if (bandBottom <= rect.y || bandTop >= rect.y + rect.h) return null
  return { left: rect.x, right: rect.x + rect.w }
}

/**
 * Carve a base interval into free text slots by subtracting blocked intervals.
 * Returns slots wider than minSlotWidth (default 30px).
 */
export function carveTextLineSlots(
  base: Interval,
  blocked: Interval[],
  minSlotWidth: number = 30,
): Interval[] {
  let slots = [base]
  for (let i = 0; i < blocked.length; i++) {
    const interval = blocked[i]!
    const next: Interval[] = []
    for (let j = 0; j < slots.length; j++) {
      const slot = slots[j]!
      if (interval.right <= slot.left || interval.left >= slot.right) {
        next.push(slot)
        continue
      }
      if (interval.left > slot.left) next.push({ left: slot.left, right: interval.left })
      if (interval.right < slot.right) next.push({ left: interval.right, right: slot.right })
    }
    slots = next
  }
  return slots.filter(s => s.right - s.left >= minSlotWidth)
}

/**
 * Layout text in a rectangular region, flowing around circle and rect obstacles.
 * Text fills all free slots on each line (both sides of obstacles).
 *
 * prepare() is called ONCE before this. layoutNextLine() is called per slot per line.
 * This is Pretext's core "editorial engine" pattern.
 */
export function layoutColumn(
  prepared: PreparedTextWithSegments,
  startCursor: LayoutCursor,
  region: LayoutRegion,
  lineHeight: number,
  circleObstacles: CircleObstacle[] = [],
  rectObstacles: RectObstacle[] = [],
  singleSlotOnly: boolean = false,
): LayoutColumnResult {
  let cursor: LayoutCursor = startCursor
  let lineTop = region.y
  const lines: PositionedLine[] = []
  let textExhausted = false

  while (lineTop + lineHeight <= region.y + region.height && !textExhausted) {
    const bandTop = lineTop
    const bandBottom = lineTop + lineHeight
    const blocked: Interval[] = []

    for (const circle of circleObstacles) {
      const interval = circleIntervalForBand(
        circle.cx, circle.cy, circle.r,
        bandTop, bandBottom,
        circle.hPad ?? 0, circle.vPad ?? 0,
      )
      if (interval) blocked.push(interval)
    }

    for (const rect of rectObstacles) {
      const interval = rectIntervalForBand(rect, bandTop, bandBottom)
      if (interval) blocked.push(interval)
    }

    const base: Interval = { left: region.x, right: region.x + region.width }
    const slots = carveTextLineSlots(base, blocked)

    if (slots.length === 0) {
      lineTop += lineHeight
      continue
    }

    // If singleSlotOnly, pick the widest slot
    const orderedSlots = singleSlotOnly
      ? [slots.reduce((best, slot) =>
          (slot.right - slot.left) > (best.right - best.left) ? slot : best
        )]
      : [...slots].sort((a, b) => a.left - b.left)

    for (const slot of orderedSlots) {
      if (textExhausted) break
      const slotWidth = slot.right - slot.left
      const line = layoutNextLine(prepared, cursor, slotWidth)
      if (!line) {
        textExhausted = true
        break
      }
      lines.push({
        x: Math.round(slot.left),
        y: Math.round(lineTop),
        text: line.text,
        width: line.width,
      })
      cursor = line.end
    }

    lineTop += lineHeight
  }

  return { lines, cursor }
}
