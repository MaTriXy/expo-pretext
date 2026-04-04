// src/engine-profile.ts
import { Platform } from 'react-native'

export type EngineProfile = {
  lineFitEpsilon: number
}

let cachedProfile: EngineProfile | null = null

export function getEngineProfile(): EngineProfile {
  if (cachedProfile !== null) return cachedProfile

  cachedProfile = Platform.select({
    ios: { lineFitEpsilon: 0.01 },
    android: { lineFitEpsilon: 0.02 },
    default: { lineFitEpsilon: 0.01 },
  })!

  return cachedProfile
}
