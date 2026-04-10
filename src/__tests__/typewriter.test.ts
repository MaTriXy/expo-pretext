globalThis.__DEV__ = false

import { describe, test, expect } from 'bun:test'
import { prepareWithSegments } from '../prepare'
import { layoutWithLines } from '../layout'
import { buildTypewriterFrames } from '../typewriter'
import type { TextStyle } from '../types'

const STYLE: TextStyle = { fontFamily: 'System', fontSize: 16, lineHeight: 24 }

describe('typewriter frame computation', () => {
  test('empty text produces zero frames', () => {
    const prepared = prepareWithSegments('', STYLE)
    const result = layoutWithLines(prepared, 200)
    const frames = buildTypewriterFrames(result.lines, '', 24)
    expect(frames).toEqual([])
  })

  test('single-line text produces one frame per character', () => {
    const text = 'Hello'
    const prepared = prepareWithSegments(text, STYLE)
    const result = layoutWithLines(prepared, 200)
    const frames = buildTypewriterFrames(result.lines, text, 24)
    expect(frames.length).toBe(5)
    expect(frames[0]!.revealedText).toBe('H')
    expect(frames[1]!.revealedText).toBe('He')
    expect(frames[2]!.revealedText).toBe('Hel')
    expect(frames[3]!.revealedText).toBe('Hell')
    expect(frames[4]!.revealedText).toBe('Hello')
  })

  test('each frame has correct lineCount and height', () => {
    const text = 'Hello'
    const prepared = prepareWithSegments(text, STYLE)
    const result = layoutWithLines(prepared, 200)
    const frames = buildTypewriterFrames(result.lines, text, 24)
    for (const frame of frames) {
      expect(frame.lineCount).toBe(1)
      expect(frame.height).toBe(24)
    }
  })

  test('multi-line text transitions lineCount at line boundaries', () => {
    const text = 'The quick brown fox jumps over'
    const prepared = prepareWithSegments(text, STYLE)
    const result = layoutWithLines(prepared, 80)
    const frames = buildTypewriterFrames(result.lines, text, 24)
    expect(frames[0]!.lineCount).toBe(1)
    expect(frames[0]!.height).toBe(24)
    const lastFrame = frames[frames.length - 1]!
    expect(lastFrame.lineCount).toBe(result.lineCount)
    expect(lastFrame.height).toBe(result.lineCount * 24)
    expect(lastFrame.revealedText).toBe(text)
    let prevLineCount = 0
    for (const frame of frames) {
      expect(frame.lineCount).toBeGreaterThanOrEqual(prevLineCount)
      prevLineCount = frame.lineCount
    }
  })

  test('frame count equals text length', () => {
    const text = 'ABCDEFGHIJ'
    const prepared = prepareWithSegments(text, STYLE)
    const result = layoutWithLines(prepared, 200)
    const frames = buildTypewriterFrames(result.lines, text, 24)
    expect(frames.length).toBe(text.length)
  })

  test('isComplete is true only on last frame', () => {
    const text = 'Test'
    const prepared = prepareWithSegments(text, STYLE)
    const result = layoutWithLines(prepared, 200)
    const frames = buildTypewriterFrames(result.lines, text, 24)
    for (let i = 0; i < frames.length - 1; i++) {
      expect(frames[i]!.isComplete).toBe(false)
    }
    expect(frames[frames.length - 1]!.isComplete).toBe(true)
  })
})

describe('typewriter with streaming text', () => {
  test('appending text extends frames', () => {
    const text1 = 'Hello'
    const text2 = 'Hello world'
    const prepared1 = prepareWithSegments(text1, STYLE)
    const result1 = layoutWithLines(prepared1, 200)
    const frames1 = buildTypewriterFrames(result1.lines, text1, 24)
    const prepared2 = prepareWithSegments(text2, STYLE)
    const result2 = layoutWithLines(prepared2, 200)
    const frames2 = buildTypewriterFrames(result2.lines, text2, 24)
    expect(frames2.length).toBe(text2.length)
    expect(frames2.length).toBeGreaterThan(frames1.length)
    for (let i = 0; i < frames1.length; i++) {
      expect(frames2[i]!.revealedText).toBe(frames1[i]!.revealedText)
    }
  })
})
