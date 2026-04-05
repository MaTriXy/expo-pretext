// src/engine-profile.ts
import { Platform } from 'react-native'

export type EngineProfile = {
  lineFitEpsilon: number
  preferEarlySoftHyphenBreak: boolean
}

let cachedProfile: EngineProfile | null = null

export function getEngineProfile(): EngineProfile {
  if (cachedProfile !== null) return cachedProfile

  cachedProfile = Platform.select({
    ios: { lineFitEpsilon: 0.01, preferEarlySoftHyphenBreak: false },
    android: { lineFitEpsilon: 0.02, preferEarlySoftHyphenBreak: false },
    default: { lineFitEpsilon: 0.01, preferEarlySoftHyphenBreak: false },
  })!

  return cachedProfile
}
