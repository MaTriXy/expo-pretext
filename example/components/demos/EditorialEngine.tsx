import { useState, useMemo, useEffect } from 'react'
import { View, Text, StyleSheet, useWindowDimensions, PanResponder, Pressable } from 'react-native'
import {
  prepareWithSegments,
  layoutColumn,
  type CircleObstacle,
} from 'expo-pretext'

// Match Pretext's editorial engine style exactly
const textStyle = { fontFamily: 'Georgia', fontSize: 15, lineHeight: 22 }
const LH = 22

const articleText = `Pretext measures and lays out multiline text entirely through arithmetic. No getBoundingClientRect, no reflow, no layout thrashing. The glowing orbs on this panel are circular obstacles. For every line of text, the engine checks whether the line intersects each orb, computes the blocked interval, and subtracts it from the available width. Text flows on both sides simultaneously — something CSS Shapes cannot do. All of this runs without a single DOM measurement. Drag the orbs to see text reflow in real time. The web renders text through a pipeline designed thirty years ago for static documents. A browser loads a font, shapes text into glyphs, measures their combined width, determines where lines break, and positions each line vertically. Every step requires the rendering engine to consult its internal layout tree — a structure so expensive that browsers guard access behind synchronous reflow barriers. Pretext sidesteps this entirely. It measures every word once via canvas and caches the widths. After preparation, layout is pure arithmetic: walk cached widths, track running line width, insert breaks when width exceeds maximum, sum line heights. No DOM. No reflow. Zero layout tree access.`

// Pretext's orb colors: gold, blue, pink, green, purple
type OrbDef = {
  fx: number; fy: number; r: number
  vx: number; vy: number
  color: [number, number, number]
}

const orbDefs: OrbDef[] = [
  { fx: 0.52, fy: 0.18, r: 55, vx: 0.5, vy: 0.35, color: [196, 163, 90] },   // gold
  { fx: 0.18, fy: 0.45, r: 42, vx: -0.4, vy: 0.5, color: [100, 140, 255] },   // blue
  { fx: 0.74, fy: 0.55, r: 48, vx: 0.35, vy: -0.45, color: [232, 100, 130] }, // pink
  { fx: 0.38, fy: 0.75, r: 38, vx: -0.55, vy: -0.3, color: [80, 200, 140] },  // green
]

type OrbState = {
  x: number; y: number; vx: number; vy: number
  r: number; color: [number, number, number]
}

export function EditorialEngineDemo() {
  const { width } = useWindowDimensions()
  const colW = width - 32
  const colH = 560
  const pad = 12
  const innerW = colW - pad * 2
  const innerH = colH - pad * 2
  const [paused, setPaused] = useState(false)
  const [dragIdx, setDragIdx] = useState<number | null>(null)

  const [orbs, setOrbs] = useState<OrbState[]>(() =>
    orbDefs.map(d => ({
      x: d.fx * innerW, y: d.fy * innerH,
      vx: d.vx, vy: d.vy, r: d.r, color: d.color,
    }))
  )

  // Physics — bounce off walls
  useEffect(() => {
    if (paused) return
    const iv = setInterval(() => {
      setOrbs(prev => prev.map((o, i) => {
        if (i === dragIdx) return o
        let { x, y, vx, vy } = o
        x += vx; y += vy
        if (x - o.r < 0 || x + o.r > innerW) vx = -vx
        if (y - o.r < 0 || y + o.r > innerH) vy = -vy
        return {
          ...o, vx, vy,
          x: Math.max(o.r, Math.min(innerW - o.r, x)),
          y: Math.max(o.r, Math.min(innerH - o.r, y)),
        }
      }))
    }, 33)
    return () => clearInterval(iv)
  }, [paused, dragIdx, innerW, innerH])

  // Drag orbs
  const pan = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderGrant: (e) => {
      const lx = e.nativeEvent.locationX - pad
      const ly = e.nativeEvent.locationY - pad
      const idx = orbs.findIndex(o => Math.hypot(lx - o.x, ly - o.y) < o.r + 10)
      if (idx >= 0) setDragIdx(idx)
      else setPaused(p => !p) // tap background = pause/resume
    },
    onPanResponderMove: (e) => {
      if (dragIdx === null) return
      const lx = e.nativeEvent.locationX - pad
      const ly = e.nativeEvent.locationY - pad
      setOrbs(prev => prev.map((o, i) => i === dragIdx ? {
        ...o,
        x: Math.max(o.r, Math.min(innerW - o.r, lx)),
        y: Math.max(o.r, Math.min(innerH - o.r, ly)),
      } : o))
    },
    onPanResponderRelease: () => setDragIdx(null),
  }), [dragIdx, innerW, innerH, orbs, pad])

  // Layout text around orbs
  const lines = useMemo(() => {
    const prepared = prepareWithSegments(articleText, textStyle)
    const obstacles: CircleObstacle[] = orbs.map(o => ({
      cx: o.x, cy: o.y, r: o.r, hPad: 10, vPad: 3,
    }))
    return layoutColumn(
      prepared,
      { segmentIndex: 0, graphemeIndex: 0 },
      { x: 0, y: 0, width: innerW, height: innerH },
      LH,
      obstacles,
    ).lines
  }, [orbs, innerW, innerH])

  return (
    <View style={styles.container}>
      {/* Hint bar */}
      <View style={styles.hint}>
        <Text style={styles.hintText}>
          Drag orbs · Tap to {paused ? 'resume' : 'pause'} · Zero native calls per frame
        </Text>
      </View>

      {/* Stage */}
      <View {...pan.panHandlers} style={[styles.stage, { width: colW, height: colH }]}>
        {/* Text lines */}
        {lines.map((s, i) => (
          <Text
            key={i}
            style={[styles.line, {
              position: 'absolute',
              top: pad + s.y,
              left: pad + s.x,
              width: s.width,
            }]}
            numberOfLines={1}
          >
            {s.text}
          </Text>
        ))}

        {/* Orbs with radial gradient effect */}
        {orbs.map((o, i) => {
          const [r, g, b] = o.color
          return (
            <View key={i} style={[styles.orbOuter, {
              position: 'absolute',
              left: pad + o.x - o.r - 20,
              top: pad + o.y - o.r - 20,
              width: (o.r + 20) * 2,
              height: (o.r + 20) * 2,
              borderRadius: o.r + 20,
              // Outer glow
              shadowColor: `rgb(${r},${g},${b})`,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.25,
              shadowRadius: 40,
            }]}>
              <View style={[styles.orbInner, {
                width: o.r * 2,
                height: o.r * 2,
                borderRadius: o.r,
                backgroundColor: `rgba(${r},${g},${b},0.12)`,
                borderColor: `rgba(${r},${g},${b},0.25)`,
                // Inner glow highlight (top-left)
                shadowColor: `rgb(${r},${g},${b})`,
                shadowOffset: { width: -o.r * 0.3, height: -o.r * 0.3 },
                shadowOpacity: 0.35,
                shadowRadius: o.r * 0.6,
              }]} />
            </View>
          )
        })}
      </View>

      {/* Stats */}
      <Text style={styles.stats}>
        {lines.length} spans · layoutColumn() · prepareWithSegments() once
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0c' },
  hint: {
    alignSelf: 'center', marginTop: 8, marginBottom: 8,
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 18, paddingVertical: 8, borderRadius: 999,
  },
  hintText: {
    fontSize: 12, color: 'rgba(255,255,255,0.22)',
    fontFamily: 'Helvetica Neue',
  },
  stage: {
    alignSelf: 'center',
    backgroundColor: '#0f0f14',
    borderRadius: 8,
    overflow: 'hidden',
  },
  line: {
    fontFamily: 'Georgia',
    fontSize: 15,
    lineHeight: 22,
    color: '#e8e4dc',
  },
  orbOuter: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  orbInner: {
    borderWidth: 1,
  },
  stats: {
    fontSize: 10, color: 'rgba(255,255,255,0.28)',
    textAlign: 'center', marginTop: 8, fontFamily: 'Menlo',
  },
})
