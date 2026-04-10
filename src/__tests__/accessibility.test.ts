// accessibility.test.ts
// Tests for getFontScale, onFontScaleChange, and clearAllCaches.
// react-native + expo-modules-core are mocked in setup-mocks.ts preload.

import { describe, test, expect } from 'bun:test'
import { getFontScale, onFontScaleChange, clearAllCaches } from '../accessibility'

describe('getFontScale', () => {
  test('returns a number', () => {
    const scale = getFontScale()
    expect(typeof scale).toBe('number')
  })

  test('returns 1.0 for default mock', () => {
    expect(getFontScale()).toBe(1.0)
  })
})

describe('onFontScaleChange', () => {
  test('returns unsubscribe function', () => {
    const unsub = onFontScaleChange(() => {})
    expect(typeof unsub).toBe('function')
    unsub()
  })

  test('multiple listeners can be registered and unregistered', () => {
    const unsub1 = onFontScaleChange(() => {})
    const unsub2 = onFontScaleChange(() => {})
    unsub1()
    unsub2()
  })
})

describe('clearAllCaches', () => {
  test('does not throw', () => {
    expect(() => clearAllCaches()).not.toThrow()
  })

  test('can be called multiple times', () => {
    clearAllCaches()
    clearAllCaches()
    clearAllCaches()
  })
})
