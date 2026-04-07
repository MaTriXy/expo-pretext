import { useState, useMemo, useEffect } from 'react'
import { View, Text, StyleSheet, useWindowDimensions, PanResponder, Pressable } from 'react-native'
import {
  prepareWithSegments,
  layoutColumn,
  type CircleObstacle,
  type PositionedLine,
} from 'expo-pretext'

const textStyle = { fontFamily: 'Helvetica Neue', fontSize: 13, lineHeight: 18 }
const LH = 18

const articleText = `Pretext measures and lays out multiline text entirely through arithmetic. No getBoundingClientRect, no reflow, no layout thrashing. The glowing orbs on this panel are circular obstacles. For every line of text, the engine checks whether the line intersects each orb, computes the blocked interval, and subtracts it from the available width. Text flows on both sides simultaneously — something CSS Shapes cannot do. All of this runs without a single DOM measurement. Drag the orbs to see text reflow in real time. The web renders text through a pipeline designed thirty years ago for static documents. A browser loads a font, shapes text into glyphs, measures their combined width, determines where lines break, and positions each line vertically. Every step requires the rendering engine to consult its internal layout tree — a structure so expensive that browsers guard access behind synchronous reflow barriers. Pretext sidesteps this entirely. It measures every word once via canvas and caches the widths. After preparation, layout is pure arithmetic: walk cached widths, track running line width, insert breaks when width exceeds maximum, sum line heights. No DOM. No reflow. Zero layout tree access. Each individual bears a coat of irregular brown patches separated by pale lines, a pattern as unique as a fingerprint.`

type Orb = {
  x: number; y: number; vx: number; vy: number
  radius: number; color: string; glowColor: string
}

export function EditorialEngineDemo() {
  const { width } = useWindowDimensions()
  const colW = width - 48
  const colH = 520
  const [paused, setPaused] = useState(false)
  const [dragIdx, setDragIdx] = useState<number | null>(null)

  const [orbs, setOrbs] = useState<Orb[]>([
    { x: colW * 0.6, y: 90, vx: 0.4, vy: 0.6, radius: 50, color: '#FF6B3518', glowColor: '#FF6B35' },
    { x: colW * 0.25, y: 260, vx: -0.3, vy: 0.4, radius: 40, color: '#4CAF5018', glowColor: '#4CAF50' },
    { x: colW * 0.7, y: 380, vx: 0.2, vy: -0.5, radius: 45, color: '#2196F318', glowColor: '#2196F3' },
  ])

  // Physics
  useEffect(() => {
    if (paused) return
    const iv = setInterval(() => {
      setOrbs(prev => prev.map((o, i) => {
        if (i === dragIdx) return o
        let { x, y, vx, vy } = o
        x += vx; y += vy
        if (x - o.radius < 0 || x + o.radius > colW) vx = -vx
        if (y - o.radius < 0 || y + o.radius > colH) vy = -vy
        return { ...o, x: Math.max(o.radius, Math.min(colW - o.radius, x)), y: Math.max(o.radius, Math.min(colH - o.radius, y)), vx, vy }
      }))
    }, 33)
    return () => clearInterval(iv)
  }, [paused, dragIdx, colW, colH])

  // Drag
  const pan = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderGrant: (e) => {
      const { locationX: lx, locationY: ly } = e.nativeEvent
      const idx = orbs.findIndex(o => Math.hypot(lx - o.x, ly - o.y) < o.radius + 15)
      setDragIdx(idx >= 0 ? idx : null)
    },
    onPanResponderMove: (e) => {
      if (dragIdx === null) return
      const { locationX: lx, locationY: ly } = e.nativeEvent
      setOrbs(prev => prev.map((o, i) => i === dragIdx ? { ...o, x: Math.max(o.radius, Math.min(colW - o.radius, lx)), y: Math.max(o.radius, Math.min(colH - o.radius, ly)) } : o))
    },
    onPanResponderRelease: () => setDragIdx(null),
  }), [dragIdx, colW, colH, orbs])

  // Layout — using layoutColumn from expo-pretext!
  const lines = useMemo(() => {
    const prepared = prepareWithSegments(articleText, textStyle)
    const obstacles: CircleObstacle[] = orbs.map(o => ({
      cx: o.x, cy: o.y, r: o.radius, hPad: 8, vPad: 2,
    }))
    const { lines } = layoutColumn(
      prepared,
      { segmentIndex: 0, graphemeIndex: 0 },
      { x: 0, y: 0, width: colW, height: colH },
      LH,
      obstacles,
    )
    return lines
  }, [orbs, colW, colH])

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Editorial Engine</Text>
        <Pressable onPress={() => setPaused(!paused)}>
          <Text style={styles.pauseBtn}>{paused ? '▶ Resume' : '⏸ Pause'}</Text>
        </Pressable>
      </View>
      <Text style={styles.sub}>Drag orbs · Text flows on BOTH sides · 0 native calls per frame</Text>

      <View {...pan.panHandlers} style={[styles.area, { width: colW, height: colH }]}>
        {lines.map((s, i) => (
          <Text key={i} style={[styles.line, { position: 'absolute', top: s.y, left: s.x, width: s.width }]} numberOfLines={1}>
            {s.text}
          </Text>
        ))}
        {orbs.map((o, i) => (
          <View key={i} style={[styles.orb, { position: 'absolute', left: o.x - o.radius, top: o.y - o.radius, width: o.radius * 2, height: o.radius * 2, borderRadius: o.radius, backgroundColor: o.color, borderColor: o.glowColor, shadowColor: o.glowColor }]} />
        ))}
      </View>
      <Text style={styles.stats}>{lines.length} spans · layoutColumn() from expo-pretext</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 8 },
  title: { fontSize: 18, fontWeight: '700' },
  pauseBtn: { fontSize: 13, color: '#007AFF', fontWeight: '600' },
  sub: { fontSize: 11, color: '#999', paddingHorizontal: 16, marginBottom: 8 },
  area: { marginHorizontal: 16, backgroundColor: '#1a1a1a', borderRadius: 12, padding: 8, overflow: 'hidden' },
  line: { fontFamily: 'Helvetica Neue', fontSize: 13, lineHeight: 18, color: '#d4d4d4' },
  orb: { borderWidth: 1.5, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.7, shadowRadius: 25 },
  stats: { fontSize: 10, color: '#999', textAlign: 'center', marginTop: 6, fontFamily: 'Menlo' },
})
