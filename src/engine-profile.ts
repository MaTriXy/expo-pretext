// src/engine-profile.ts
import { Platform } from 'react-native'

export type EngineProfile = {
  lineFitEpsilon: number
  carryCJKAfterClosingQuote: boolean
  preferPrefixWidthsForBreakableRuns: boolean
  preferEarlySoftHyphenBreak: boolean
}

let cachedProfile: EngineProfile | null = null

export function getEngineProfile(): EngineProfile {
  if (cachedProfile !== null) return cachedProfile

  cachedProfile = Platform.select({
    ios: {
      lineFitEpsilon: -3.0, // conservative: RN Text breaks lines earlier than CTLine segment sums predict
      carryCJKAfterClosingQuote: true,
      preferPrefixWidthsForBreakableRuns: false,
      preferEarlySoftHyphenBreak: false,
    },
    android: {
      lineFitEpsilon: 0.02,
      carryCJKAfterClosingQuote: false,
      preferPrefixWidthsForBreakableRuns: false,
      preferEarlySoftHyphenBreak: false,
    },
    default: {
      lineFitEpsilon: 0.01,
      carryCJKAfterClosingQuote: false,
      preferPrefixWidthsForBreakableRuns: false,
      preferEarlySoftHyphenBreak: false,
    },
  })!

  return cachedProfile
}
