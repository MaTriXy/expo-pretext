// Text Path — characters flow along an animated sine curve, each rotated
// to follow the tangent of the path. Per-character widths come from
// measureNaturalWidth() so the spacing matches the actual font metrics.
// Polished UI matching the PinchToZoom / BreakoutText design language.

import { useMemo, useState, useEffect, useRef } from 'react'
import { View, Text, StyleSheet, useWindowDimensions, PanResponder } from 'react-native'
import { prepareWithSegments, measureNaturalWidth } from 'expo-pretext'

const STYLE = { fontFamily: 'Georgia', fontSize: 26, lineHeight: 32 }
const TEXT = 'pretext flows along a curve'
const CONTAINER_PADDING = 16

export function TextPathDemo() {
  const { width } = useWindowDimensions()
  const [phase, setPhase] = useState(0)
  const [amplitude, setAmplitude] = useState(40)
  const [waves, setWaves] = useState(2)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (paused) return
    const timer = setInterval(() => setPhase(p => p + 0.04), 33)
    return () => clearInterval(timer)
  }, [paused])

  // Per-character measured widths — real glyph widths from measureNaturalWidth
  const charData = useMemo(() => {
    const chars = [...TEXT]
    const widths: number[] = []
    for (const ch of chars) {
      if (ch === ' ') {
        widths.push(STYLE.fontSize * 0.35)
      } else {
        const prepared = prepareWithSegments(ch, STYLE)
        widths.push(measureNaturalWidth(prepared))
      }
    }
    const total = widths.reduce((a, b) => a + b, 0)
    return { chars, widths, total }
  }, [])

  // Horizontal padding so characters stay within the visible stage
  const stageW = width - CONTAINER_PADDING * 2
  const stageH = 260
  const H_PAD = 32
  const pathWidth = stageW - H_PAD * 2
  const scale = Math.min(1, pathWidth / charData.total)
  const effectiveTotal = charData.total * scale
  const startX = (stageW - effectiveTotal) / 2
  const centerY = stageH / 2

  // Amplitude slider (drag to change the wave height)
  const AMP_MIN = 5
  const AMP_MAX = 70
  const sliderTrackWidth = stageW - 48

  const ampPan = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (e) => {
      const x = e.nativeEvent.pageX - CONTAINER_PADDING - 12
      updateAmp(x)
    },
    onPanResponderMove: (_e, gs) => {
      const x = gs.moveX - CONTAINER_PADDING - 12
      updateAmp(x)
    },
    onPanResponderTerminationRequest: () => false,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [sliderTrackWidth])

  function updateAmp(locationX: number) {
    const clamped = Math.max(0, Math.min(sliderTrackWidth, locationX))
    const t = clamped / sliderTrackWidth
    setAmplitude(AMP_MIN + t * (AMP_MAX - AMP_MIN))
  }

  const ampThumb = ((amplitude - AMP_MIN) / (AMP_MAX - AMP_MIN)) * sliderTrackWidth

  // Compute per-character center position + tangent angle
  const positions = useMemo(() => {
    const out: Array<{ char: string; cx: number; cy: number; angle: number; hue: number }> = []
    let cum = 0
    const k = (Math.PI * waves * 2) / Math.max(effectiveTotal, 1)
    for (let i = 0; i < charData.chars.length; i++) {
      const ch = charData.chars[i]!
      const w = charData.widths[i]! * scale
      const localX = cum + w / 2
      const t = charData.total > 0 ? localX / (charData.total * scale) : 0
      const x = startX + localX
      const theta = t * Math.PI * waves * 2 + phase
      const y = centerY + Math.sin(theta) * amplitude
      const slope = amplitude * k * Math.cos(theta)
      const angle = Math.atan(slope) * (180 / Math.PI)
      out.push({ char: ch, cx: x, cy: y, angle, hue: t * 360 })
      cum += w
    }
    return out
  }, [charData, startX, scale, effectiveTotal, phase, amplitude, waves, centerY])

  const toggleWaves = () => {
    setWaves(w => (w === 4 ? 1 : w + 1))
  }

  return (
    <View style={styles.container}>
      {/* Stage */}
      <View style={[styles.stage, { width: stageW, height: stageH }]}>
        {/* Center baseline hint */}
        <View style={[styles.baseline, { top: centerY, left: H_PAD, right: H_PAD }]} />

        {/* Characters on the curve */}
        {positions.map((p, i) => (
          <Text
            key={i}
            style={[
              styles.char,
              {
                position: 'absolute',
                left: p.cx - STYLE.fontSize / 2,
                top: p.cy - STYLE.fontSize / 2,
                width: STYLE.fontSize,
                height: STYLE.fontSize,
                textAlign: 'center',
                color: `hsl(${42 + Math.sin((p.cx / stageW) * Math.PI * 4 + phase) * 25}, 85%, 70%)`,
                transform: [{ rotate: `${p.angle}deg` }],
              },
            ]}
          >
            {p.char}
          </Text>
        ))}
      </View>

      {/* Controls panel */}
      <View style={styles.panel}>
        <View style={styles.metricsHeader}>
          <Text style={styles.panelTitle}>CURVE CONTROLS</Text>
          <View style={styles.livePill}>
            <View style={[styles.liveDot, paused && styles.liveDotPaused]} />
            <Text style={styles.liveText}>{paused ? 'PAUSED' : 'LIVE'}</Text>
          </View>
        </View>

        {/* Metrics grid */}
        <View style={styles.metricsGrid}>
          <View style={styles.metricCell}>
            <Text style={styles.metricLabel}>CHARS</Text>
            <Text style={styles.metricValue}>{charData.chars.length}</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricCell}>
            <Text style={styles.metricLabel}>WAVES</Text>
            <Text style={styles.metricValue}>{waves}</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricCell}>
            <Text style={styles.metricLabel}>AMP</Text>
            <Text style={styles.metricValue}>{Math.round(amplitude)}<Text style={styles.metricUnit}>px</Text></Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricCell}>
            <Text style={styles.metricLabel}>WIDTH</Text>
            <Text style={styles.metricValue}>{Math.round(charData.total)}<Text style={styles.metricUnit}>px</Text></Text>
          </View>
        </View>

        {/* Amplitude slider */}
        <View style={styles.sliderSection}>
          <View style={styles.sliderHeader}>
            <Text style={styles.sliderTitle}>AMPLITUDE</Text>
            <View style={styles.sliderValueBadge}>
              <Text style={styles.sliderValueText}>{Math.round(amplitude)}px</Text>
            </View>
          </View>
          <View {...ampPan.panHandlers} style={styles.sliderContainer}>
            <View style={styles.sliderTrack} pointerEvents="none">
              <View style={[styles.sliderFill, { width: ampThumb + 6 }]} />
              <View style={[styles.sliderThumb, { left: ampThumb }]}>
                <View style={styles.sliderThumbInner} />
              </View>
            </View>
          </View>
        </View>

        {/* Action row */}
        <View style={styles.actionRow}>
          <View
            style={styles.btn}
            onTouchEnd={() => setPaused(p => !p)}
          >
            <Text style={styles.btnText}>{paused ? 'RESUME' : 'PAUSE'}</Text>
          </View>
          <View style={styles.btn} onTouchEnd={toggleWaves}>
            <Text style={styles.btnText}>WAVES · {waves}</Text>
          </View>
        </View>

        <Text style={styles.footerText}>
          measureNaturalWidth() per character · rotates along sine tangent
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0c',
    paddingHorizontal: CONTAINER_PADDING,
    paddingTop: CONTAINER_PADDING,
  },
  stage: {
    backgroundColor: '#1a1a22',
    borderWidth: 1,
    borderColor: 'rgba(255,211,105,0.18)',
    borderRadius: 14,
    overflow: 'hidden',
    alignSelf: 'center',
    shadowColor: '#ffd369',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
  },
  baseline: {
    position: 'absolute',
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  char: {
    fontFamily: 'Georgia',
    fontSize: 26,
  },

  panel: {
    marginTop: 16,
    backgroundColor: '#0d0d12',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,211,105,0.15)',
    paddingTop: 12,
  },
  metricsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  panelTitle: {
    fontFamily: 'Menlo',
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: 1.5,
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(74,158,93,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(74,158,93,0.5)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4a9e5d',
  },
  liveDotPaused: {
    backgroundColor: '#c44e5a',
  },
  liveText: {
    fontFamily: 'Menlo',
    fontSize: 9,
    fontWeight: '700',
    color: '#6dd184',
    letterSpacing: 0.5,
  },
  metricsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a22',
    borderWidth: 1,
    borderColor: 'rgba(255,211,105,0.18)',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  metricCell: {
    flex: 1,
    alignItems: 'center',
  },
  metricDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  metricLabel: {
    fontFamily: 'Menlo',
    fontSize: 9,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 1,
    marginBottom: 4,
  },
  metricValue: {
    fontFamily: 'Menlo',
    fontSize: 17,
    fontWeight: '800',
    color: '#ffd369',
    letterSpacing: -0.3,
  },
  metricUnit: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255,211,105,0.6)',
  },
  sliderSection: {
    marginTop: 14,
  },
  sliderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  sliderTitle: {
    fontFamily: 'Menlo',
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: 1.5,
  },
  sliderValueBadge: {
    backgroundColor: '#ffd369',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
  },
  sliderValueText: {
    fontFamily: 'Menlo',
    fontSize: 11,
    fontWeight: '800',
    color: '#0a0a0c',
  },
  sliderContainer: {
    height: 32,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  sliderTrack: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 3,
    position: 'relative',
  },
  sliderFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: 6,
    backgroundColor: '#ffd369',
    borderRadius: 3,
  },
  sliderThumb: {
    position: 'absolute',
    top: -11,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ffd369',
    borderWidth: 3,
    borderColor: '#0a0a0c',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#ffd369',
    shadowOpacity: 0.7,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
  sliderThumbInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#0a0a0c',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  btn: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255,211,105,0.5)',
    paddingVertical: 11,
    borderRadius: 999,
    alignItems: 'center',
  },
  btnText: {
    fontFamily: 'Menlo',
    fontSize: 11,
    fontWeight: '800',
    color: '#ffd369',
    letterSpacing: 1,
  },
  footerText: {
    fontFamily: 'Menlo',
    fontSize: 9,
    color: 'rgba(255,255,255,0.3)',
    marginTop: 12,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
})
