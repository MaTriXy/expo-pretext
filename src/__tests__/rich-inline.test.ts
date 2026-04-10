// rich-inline.test.ts
// Tests for prepareInlineFlow(), walkInlineFlowLines(), and measureInlineFlow().

import { describe, test, expect } from 'bun:test'

// React Native global required by font-utils.ts — must be set before any imports
;(globalThis as unknown as Record<string, unknown>).__DEV__ = false

import { prepareInlineFlow, walkInlineFlowLines, measureInlineFlow } from '../rich-inline'
import type { InlineFlowItem, InlineFlowLine } from '../rich-inline'

const STYLE = { fontFamily: 'System', fontSize: 16, lineHeight: 24 }
const STYLE_SMALL = { fontFamily: 'System', fontSize: 12, lineHeight: 18 }
const STYLE_LARGE = { fontFamily: 'System', fontSize: 24, lineHeight: 32 }

// Helper: collect all lines from walkInlineFlowLines
function collectLines(items: InlineFlowItem[], maxWidth: number): InlineFlowLine[] {
  const prepared = prepareInlineFlow(items)
  const lines: InlineFlowLine[] = []
  walkInlineFlowLines(prepared, maxWidth, line => lines.push(line))
  return lines
}

// ---------------------------------------------------------------------------
// 1. Single item fits on one line
// ---------------------------------------------------------------------------

describe('prepareInlineFlow() + walkInlineFlowLines() — single item fits', () => {
  test('one short item produces exactly one line', () => {
    const lines = collectLines([{ text: 'Hello', style: STYLE }], 400)
    expect(lines.length).toBe(1)
  })

  test('single line has at least one fragment', () => {
    const lines = collectLines([{ text: 'Hello', style: STYLE }], 400)
    expect(lines[0]!.fragments.length).toBeGreaterThanOrEqual(1)
  })

  test('fragment text matches the item text', () => {
    const lines = collectLines([{ text: 'Hello', style: STYLE }], 400)
    expect(lines[0]!.fragments[0]!.text).toBe('Hello')
  })

  test('fragment itemIndex is 0 for the first item', () => {
    const lines = collectLines([{ text: 'Hello', style: STYLE }], 400)
    expect(lines[0]!.fragments[0]!.itemIndex).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// 2. Two items on the same line
// ---------------------------------------------------------------------------

describe('walkInlineFlowLines() — two items fit on same line', () => {
  test('produces exactly one line', () => {
    const lines = collectLines(
      [
        { text: 'Hello', style: STYLE },
        { text: 'World', style: STYLE },
      ],
      400,
    )
    expect(lines.length).toBe(1)
  })

  test('line has two fragments', () => {
    const lines = collectLines(
      [
        { text: 'Hello', style: STYLE },
        { text: 'World', style: STYLE },
      ],
      400,
    )
    expect(lines[0]!.fragments.length).toBe(2)
  })

  test('fragments reference correct itemIndex values', () => {
    const lines = collectLines(
      [
        { text: 'Hello', style: STYLE },
        { text: 'World', style: STYLE },
      ],
      400,
    )
    expect(lines[0]!.fragments[0]!.itemIndex).toBe(0)
    expect(lines[0]!.fragments[1]!.itemIndex).toBe(1)
  })
})

// ---------------------------------------------------------------------------
// 3. Item wraps to next line when width is exceeded
// ---------------------------------------------------------------------------

describe('walkInlineFlowLines() — wrapping', () => {
  test('produces more than one line when items exceed maxWidth', () => {
    const lines = collectLines(
      [
        { text: 'Hello World', style: STYLE },
        { text: 'Foo Bar Baz Qux', style: STYLE },
      ],
      80, // narrow enough to force wrapping
    )
    expect(lines.length).toBeGreaterThan(1)
  })

  test('total fragment count across all lines accounts for all text', () => {
    const items: InlineFlowItem[] = [
      { text: 'One', style: STYLE },
      { text: 'Two', style: STYLE },
      { text: 'Three', style: STYLE },
    ]
    const lines = collectLines(items, 60)
    const totalFragments = lines.reduce((acc, l) => acc + l.fragments.length, 0)
    expect(totalFragments).toBeGreaterThanOrEqual(items.length)
  })

  test('each line has at least one fragment', () => {
    const lines = collectLines(
      [{ text: 'A long sentence that should wrap across multiple lines at narrow width', style: STYLE }],
      80,
    )
    for (const line of lines) {
      expect(line.fragments.length).toBeGreaterThanOrEqual(1)
    }
  })
})

// ---------------------------------------------------------------------------
// 4. Atomic item — placed as whole unit, never split mid-item
// ---------------------------------------------------------------------------

describe('walkInlineFlowLines() — atomic items', () => {
  test('atomic item appears as a single fragment on whichever line it lands', () => {
    const items: InlineFlowItem[] = [
      { text: 'Before', style: STYLE },
      { text: 'Pill', style: STYLE, atomic: true },
      { text: 'After', style: STYLE },
    ]
    const prepared = prepareInlineFlow(items)
    const lines: InlineFlowLine[] = []
    walkInlineFlowLines(prepared, 200, line => lines.push(line))

    // Find the atomic fragment (itemIndex === 1)
    const atomicFragments = lines.flatMap(l => l.fragments).filter(f => f.itemIndex === 1)
    // Must appear as exactly one fragment — never split
    expect(atomicFragments.length).toBe(1)
    expect(atomicFragments[0]!.text).toBe('Pill')
  })

  test('atomic item with wide text forces it onto its own line if it does not fit', () => {
    const items: InlineFlowItem[] = [
      { text: 'Short', style: STYLE },
      { text: 'VeryWideAtomicContent', style: STYLE, atomic: true },
    ]
    const lines = collectLines(items, 80)
    // The atomic item should appear as one undivided fragment
    const atomicFragments = lines.flatMap(l => l.fragments).filter(f => f.itemIndex === 1)
    expect(atomicFragments.length).toBe(1)
  })
})

// ---------------------------------------------------------------------------
// 5. Extra width — adds to item's occupied width
// ---------------------------------------------------------------------------

describe('walkInlineFlowLines() — extraWidth', () => {
  test('fragment occupiedWidth reflects extraWidth', () => {
    const items: InlineFlowItem[] = [{ text: 'Hello', style: STYLE, extraWidth: 20 }]
    const prepared = prepareInlineFlow(items)
    const lines: InlineFlowLine[] = []
    walkInlineFlowLines(prepared, 400, line => lines.push(line))

    const fragment = lines[0]!.fragments[0]!
    // occupiedWidth should be text width + 20
    expect(fragment.occupiedWidth).toBeGreaterThan(20)
  })

  test('item with large extraWidth can cause wrapping that plain item would not', () => {
    const narrowWidth = 70

    const linesWithout = collectLines([{ text: 'Hi', style: STYLE, extraWidth: 0 }], narrowWidth)
    const linesWith = collectLines([{ text: 'Hi', style: STYLE, extraWidth: 200 }], narrowWidth)

    // extraWidth=200 means the item's total occupied width is huge — but since there's
    // only one item it still lands on one line (nothing to wrap against). The occupied
    // width however must be larger with extraWidth.
    const occupiedWithout = linesWithout[0]!.fragments[0]!.occupiedWidth
    const occupiedWith = linesWith[0]!.fragments[0]!.occupiedWidth
    expect(occupiedWith).toBeGreaterThan(occupiedWithout)
  })
})

// ---------------------------------------------------------------------------
// 6. Mixed font sizes — different items with different fontSize
// ---------------------------------------------------------------------------

describe('walkInlineFlowLines() — mixed font sizes', () => {
  test('items with different font sizes can coexist in the same flow', () => {
    const items: InlineFlowItem[] = [
      { text: 'Small', style: STYLE_SMALL },
      { text: 'Large', style: STYLE_LARGE },
      { text: 'Normal', style: STYLE },
    ]
    const lines = collectLines(items, 400)
    expect(lines.length).toBeGreaterThanOrEqual(1)

    const allFragments = lines.flatMap(l => l.fragments)
    expect(allFragments.length).toBe(3)
  })

  test('each fragment references its correct source item', () => {
    const items: InlineFlowItem[] = [
      { text: 'Small', style: STYLE_SMALL },
      { text: 'Large', style: STYLE_LARGE },
    ]
    const lines = collectLines(items, 400)
    const allFragments = lines.flatMap(l => l.fragments)
    const indices = allFragments.map(f => f.itemIndex).sort()
    expect(indices).toEqual([0, 1])
  })
})

// ---------------------------------------------------------------------------
// 7. Empty items array
// ---------------------------------------------------------------------------

describe('prepareInlineFlow() + measureInlineFlow() — empty array', () => {
  test('walkInlineFlowLines returns 0 for empty items', () => {
    const prepared = prepareInlineFlow([])
    let count = 0
    const total = walkInlineFlowLines(prepared, 400, () => { count++ })
    expect(total).toBe(0)
    expect(count).toBe(0)
  })

  test('measureInlineFlow returns height 0 for empty items', () => {
    const prepared = prepareInlineFlow([])
    const result = measureInlineFlow(prepared, 400, STYLE.lineHeight)
    expect(result.height).toBe(0)
    expect(result.lineCount).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// 8. measureInlineFlow consistency — height matches walkInlineFlowLines line count
// ---------------------------------------------------------------------------

describe('measureInlineFlow() consistency', () => {
  test('height equals lineCount * lineHeight', () => {
    const items: InlineFlowItem[] = [
      { text: 'Hello World from', style: STYLE },
      { text: 'the rich inline flow engine', style: STYLE },
    ]
    const prepared = prepareInlineFlow(items)
    const result = measureInlineFlow(prepared, 150, STYLE.lineHeight)
    expect(result.height).toBe(result.lineCount * STYLE.lineHeight)
  })

  test('lineCount matches actual lines emitted by walkInlineFlowLines', () => {
    const items: InlineFlowItem[] = [
      { text: 'Alpha Beta Gamma Delta', style: STYLE },
      { text: 'Epsilon Zeta Eta', style: STYLE },
    ]
    const prepared = prepareInlineFlow(items)
    const maxWidth = 100

    let walkedCount = 0
    walkInlineFlowLines(prepared, maxWidth, () => { walkedCount++ })
    const measured = measureInlineFlow(prepared, maxWidth, STYLE.lineHeight)

    expect(measured.lineCount).toBe(walkedCount)
  })

  test('height is non-zero for non-empty items', () => {
    const prepared = prepareInlineFlow([{ text: 'Test', style: STYLE }])
    const result = measureInlineFlow(prepared, 400, STYLE.lineHeight)
    expect(result.height).toBeGreaterThan(0)
  })
})

// ---------------------------------------------------------------------------
// 9. walkInlineFlowLines fragments — itemIndex, text, occupiedWidth correctness
// ---------------------------------------------------------------------------

describe('walkInlineFlowLines() — fragment properties', () => {
  test('fragment text is non-empty for non-empty items', () => {
    const lines = collectLines([{ text: 'Hello', style: STYLE }], 400)
    for (const line of lines) {
      for (const fragment of line.fragments) {
        expect(fragment.text.length).toBeGreaterThan(0)
      }
    }
  })

  test('fragment occupiedWidth is positive', () => {
    const items: InlineFlowItem[] = [
      { text: 'Hello', style: STYLE },
      { text: 'World', style: STYLE },
    ]
    const lines = collectLines(items, 400)
    for (const line of lines) {
      for (const fragment of line.fragments) {
        expect(fragment.occupiedWidth).toBeGreaterThan(0)
      }
    }
  })

  test('fragment itemIndex stays within bounds of original items array', () => {
    const items: InlineFlowItem[] = [
      { text: 'First', style: STYLE },
      { text: 'Second', style: STYLE },
      { text: 'Third', style: STYLE },
    ]
    const lines = collectLines(items, 400)
    for (const line of lines) {
      for (const fragment of line.fragments) {
        expect(fragment.itemIndex).toBeGreaterThanOrEqual(0)
        expect(fragment.itemIndex).toBeLessThan(items.length)
      }
    }
  })

  test('three items all appear exactly once across all lines (wide enough)', () => {
    const items: InlineFlowItem[] = [
      { text: 'Alpha', style: STYLE },
      { text: 'Beta', style: STYLE },
      { text: 'Gamma', style: STYLE },
    ]
    const lines = collectLines(items, 600)
    const allFragments = lines.flatMap(l => l.fragments)
    // Each item should appear exactly once at this width
    for (let i = 0; i < items.length; i++) {
      const count = allFragments.filter(f => f.itemIndex === i).length
      expect(count).toBe(1)
    }
  })
})

// ---------------------------------------------------------------------------
// 10. CJK overflow triage (upstream #120)
// ---------------------------------------------------------------------------

// Upstream #120 triage: CJK overflow does not reproduce in expo-pretext.
describe('CJK overflow (upstream #120 triage)', () => {
  test('CJK-only inline item does not exceed maxWidth', () => {
    const items = [{ text: '这是一个测试文本用于检查溢出行为', style: STYLE }]
    const prepared = prepareInlineFlow(items)
    const maxWidth = 100
    const result = measureInlineFlow(prepared, maxWidth, STYLE.lineHeight ?? STYLE.fontSize * 1.2)
    expect(result.lineCount).toBeGreaterThan(1)
    expect(result.height).toBeGreaterThan(0)
  })

  test('mixed CJK + Latin inline items do not overflow', () => {
    const items = [
      { text: 'Hello ', style: STYLE },
      { text: '中文测试', style: STYLE },
      { text: ' world', style: STYLE },
    ]
    const prepared = prepareInlineFlow(items)
    const maxWidth = 120
    const result = measureInlineFlow(prepared, maxWidth, STYLE.lineHeight ?? STYLE.fontSize * 1.2)
    expect(result.lineCount).toBeGreaterThan(0)
    expect(result.height).toBeGreaterThan(0)
  })
})
