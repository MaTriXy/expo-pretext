import { useState, useMemo, useEffect } from 'react'
import { View, Text, StyleSheet, useWindowDimensions, PanResponder, Pressable } from 'react-native'
import { prepareWithSegments, layoutNextLine } from 'expo-pretext'

const textStyle = { fontFamily: 'Helvetica Neue', fontSize: 13, lineHeight: 18 }
const LH = 18

const articleText = `Pretext measures and lays out multiline text entirely through arithmetic. No getBoundingClientRect, no reflow, no layout thrashing. The glowing orbs on this panel are circular obstacles. For every line of text, the engine checks whether the line intersects each orb, computes the blocked interval, and subtracts it from the available width. Text flows on both sides simultaneously — something CSS Shapes cannot do. All of this runs without a single DOM measurement. Drag the orbs to see text reflow in real time. The web renders text through a pipeline designed thirty years ago for static documents. A browser loads a font, shapes text into glyphs, measures their combined width, determines where lines break, and positions each line vertically. Every step requires the rendering engine to consult its internal layout tree — a structure so expensive that browsers guard access behind synchronous reflow barriers. Pretext sidesteps this entirely. It measures every word once via canvas and caches the widths. After preparation, layout is pure arithmetic: walk cached widths, track running line width, insert breaks when width exceeds maximum, sum line heights. No DOM. No reflow. Zero layout tree access. Each individual bears a coat of irregular brown patches separated by pale lines, a pattern as unique as a fingerprint.`

type Orb = {
  x: number; y: number; vx: number; vy: number
  radius: number; color: string; glowColor: string
}

type LineSpan = { text: string; x: number; y: number; width: number }

function circleBlockAt(ox: number, oy: number, r: number, lineY: number): { left: number; right: number } | null {
  const dy = Math.abs(lineY + LH / 2 - oy)
  if (dy >= r) return null
  const half = Math.sqrt(r * r - dy * dy)
  return { left: ox - half, right: ox + half }
}

// Merge overlapping intervals
function mergeIntervals(ivs: { left: number; right: number }[]): { left: number; right: number }[] {
  if (ivs.length === 0) return []
  ivs.sort((a, b) => a.left - b.left)
  const merged = [ivs[0]!]
  for (let i = 1; i < ivs.length; i++) {
    const prev = merged[merged.length - 1]!
    const cur = ivs[i]!
    if (cur.left <= prev.right) {
      prev.right = Math.max(prev.right, cur.right)
    } else {
      merged.push(cur)
    }
  }
  return merged
}

// Get free spans on a line after subtracting blocked intervals
function getFreeSpans(blocked: { left: number; right: number }[], totalWidth: number): { start: number; width: number }[] {
  const merged = mergeIntervals(blocked)
  const spans: { start: number; width: number }[] = []
  let pos = 0
  for (const iv of merged) {
    const clampedLeft = Math.max(0, iv.left)
    if (clampedLeft > pos) {
      spans.push({ start: pos, width: clampedLeft - pos })
    }
    pos = Math.max(pos, Math.min(totalWidth, iv.right))
  }
  if (pos < totalWidth) {
    spans.push({ start: pos, width: totalWidth - pos })
  }
  return spans.filter(s => s.width > 20)
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

  // TEXT REFLOW: layoutNextLine across multiple free spans per line
  const spans = useMemo(() => {
    const prepared = prepareWithSegments(articleText, textStyle)
    const result: LineSpan[] = []
    let cursor = { segmentIndex: 0, graphemeIndex: 0 }
    let y = 0
    let done = false

    while (y < colH && !done) {
      // Blocked intervals from all orbs at this Y
      const blocked: { left: number; right: number }[] = []
      for (const o of orbs) {
        const b = circleBlockAt(o.x, o.y, o.radius + 8, y)
        if (b) blocked.push(b)
      }

      const freeSpans = getFreeSpans(blocked, colW)

      if (freeSpans.length === 0) {
        y += LH
        continue
      }

      // Fill each free span with text from the same cursor
      for (const span of freeSpans) {
        if (done) break
        const line = layoutNextLine(prepared, cursor, span.width)
        if (!line) { done = true; break }
        result.push({ text: line.text, x: span.start, y, width: span.width })
        cursor = line.end
      }

      y += LH
    }

    return result
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
        {spans.map((s, i) => (
          <Text key={i} style={[styles.line, { position: 'absolute', top: s.y, left: s.x, width: s.width }]} numberOfLines={1}>
            {s.text}
          </Text>
        ))}
        {orbs.map((o, i) => (
          <View key={i} style={[styles.orb, { position: 'absolute', left: o.x - o.radius, top: o.y - o.radius, width: o.radius * 2, height: o.radius * 2, borderRadius: o.radius, backgroundColor: o.color, borderColor: o.glowColor, shadowColor: o.glowColor }]} />
        ))}
      </View>
      <Text style={styles.stats}>{spans.length} spans · prepareWithSegments() once · layoutNextLine() ×{spans.length}/frame</Text>
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
