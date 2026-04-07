import { describe, test, expect } from 'bun:test'
import {
  carveTextLineSlots,
  circleIntervalForBand,
  rectIntervalForBand,
} from '../obstacle-layout'

describe('circleIntervalForBand', () => {
  test('returns null when band is above circle', () => {
    expect(circleIntervalForBand(100, 100, 30, 0, 20)).toBeNull()
  })

  test('returns null when band is below circle', () => {
    expect(circleIntervalForBand(100, 100, 30, 140, 160)).toBeNull()
  })

  test('returns interval when band intersects circle center', () => {
    const iv = circleIntervalForBand(100, 100, 50, 90, 110)
    expect(iv).not.toBeNull()
    expect(iv!.left).toBeLessThan(100)
    expect(iv!.right).toBeGreaterThan(100)
    // At center, chord width = 2 * radius
    expect(iv!.right - iv!.left).toBeCloseTo(100, 0)
  })

  test('returns narrower interval when band is near edge', () => {
    const center = circleIntervalForBand(100, 100, 50, 95, 105)
    const edge = circleIntervalForBand(100, 100, 50, 140, 150)
    expect(center).not.toBeNull()
    expect(edge).not.toBeNull()
    expect(center!.right - center!.left).toBeGreaterThan(edge!.right - edge!.left)
  })

  test('respects hPad', () => {
    const without = circleIntervalForBand(100, 100, 50, 95, 105, 0, 0)
    const withPad = circleIntervalForBand(100, 100, 50, 95, 105, 10, 0)
    expect(withPad!.left).toBeLessThan(without!.left)
    expect(withPad!.right).toBeGreaterThan(without!.right)
    expect((withPad!.right - withPad!.left) - (without!.right - without!.left)).toBeCloseTo(20, 0)
  })
})

describe('rectIntervalForBand', () => {
  test('returns null when band is above rect', () => {
    expect(rectIntervalForBand({ x: 50, y: 100, w: 80, h: 40 }, 0, 20)).toBeNull()
  })

  test('returns null when band is below rect', () => {
    expect(rectIntervalForBand({ x: 50, y: 100, w: 80, h: 40 }, 150, 170)).toBeNull()
  })

  test('returns interval when band intersects rect', () => {
    const iv = rectIntervalForBand({ x: 50, y: 100, w: 80, h: 40 }, 110, 130)
    expect(iv).not.toBeNull()
    expect(iv!.left).toBe(50)
    expect(iv!.right).toBe(130)
  })
})

describe('carveTextLineSlots', () => {
  test('returns full base when no obstacles', () => {
    const slots = carveTextLineSlots({ left: 0, right: 300 }, [])
    expect(slots).toEqual([{ left: 0, right: 300 }])
  })

  test('splits base around one obstacle', () => {
    const slots = carveTextLineSlots(
      { left: 0, right: 300 },
      [{ left: 100, right: 200 }]
    )
    expect(slots.length).toBe(2)
    expect(slots[0]).toEqual({ left: 0, right: 100 })
    expect(slots[1]).toEqual({ left: 200, right: 300 })
  })

  test('filters slots narrower than minSlotWidth', () => {
    const slots = carveTextLineSlots(
      { left: 0, right: 300 },
      [{ left: 10, right: 290 }],
      30
    )
    expect(slots.length).toBe(0) // both remaining slots < 30px
  })

  test('handles obstacle at left edge', () => {
    const slots = carveTextLineSlots(
      { left: 0, right: 300 },
      [{ left: -10, right: 80 }]
    )
    expect(slots.length).toBe(1)
    expect(slots[0]!.left).toBe(80)
    expect(slots[0]!.right).toBe(300)
  })

  test('handles obstacle at right edge', () => {
    const slots = carveTextLineSlots(
      { left: 0, right: 300 },
      [{ left: 250, right: 350 }]
    )
    expect(slots.length).toBe(1)
    expect(slots[0]!.left).toBe(0)
    expect(slots[0]!.right).toBe(250)
  })

  test('handles multiple obstacles', () => {
    const slots = carveTextLineSlots(
      { left: 0, right: 400 },
      [{ left: 50, right: 100 }, { left: 200, right: 280 }]
    )
    expect(slots.length).toBe(3)
    expect(slots[0]).toEqual({ left: 0, right: 50 })
    expect(slots[1]).toEqual({ left: 100, right: 200 })
    expect(slots[2]).toEqual({ left: 280, right: 400 })
  })

  test('handles overlapping obstacles', () => {
    const slots = carveTextLineSlots(
      { left: 0, right: 300 },
      [{ left: 80, right: 150 }, { left: 120, right: 200 }]
    )
    // After first: [0,80] [150,300]
    // After second removes from [150,300]: [200,300]
    expect(slots.length).toBe(2)
    expect(slots[0]).toEqual({ left: 0, right: 80 })
    expect(slots[1]).toEqual({ left: 200, right: 300 })
  })
})
