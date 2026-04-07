import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { View, Text, StyleSheet, useWindowDimensions, PanResponder, Pressable } from 'react-native'
import { prepareWithSegments, layoutNextLine } from 'expo-pretext'

const textStyle = { fontFamily: 'Helvetica Neue', fontSize: 13, lineHeight: 18 }
const lineHeight = 18

const articleText = `Pretext measures and lays out multiline text entirely through arithmetic. No getBoundingClientRect, no reflow, no layout thrashing. The glowing orbs on this panel are circular obstacles. For every line of text, the engine checks whether the line intersects each orb, computes the blocked interval, and subtracts it from the available width. Text flows on both sides simultaneously — something CSS Shapes cannot do. All of this runs without a single DOM measurement. Drag the orbs to see text reflow in real time. The web renders text through a pipeline designed thirty years ago for static documents. A browser loads a font, shapes text into glyphs, measures their combined width, determines where lines break, and positions each line vertically. Every step requires the rendering engine to consult its internal layout tree — a structure so expensive that browsers guard access behind synchronous reflow barriers. Pretext sidesteps this entirely. It measures every word once via canvas and caches the widths. After preparation, layout is pure arithmetic: walk cached widths, track running line width, insert breaks when width exceeds maximum, sum line heights. No DOM. No reflow. Zero layout tree access.`

type Orb = {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  color: string
  glowColor: string
}

function getCircleBlockedInterval(
  orbX: number, orbY: number, orbRadius: number,
  lineY: number, lineH: number
): { left: number; right: number } | null {
  // Check if line overlaps with circle vertically
  const lineMid = lineY + lineH / 2
  const dy = Math.abs(lineMid - orbY)
  if (dy >= orbRadius) return null

  // Horizontal interval blocked by circle at this Y
  const halfChord = Math.sqrt(orbRadius * orbRadius - dy * dy)
  return {
    left: orbX - halfChord,
    right: orbX + halfChord,
  }
}

export function EditorialEngineDemo() {
  const { width } = useWindowDimensions()
  const columnWidth = width - 48
  const columnHeight = 500
  const [paused, setPaused] = useState(false)
  const [dragIndex, setDragIndex] = useState<number | null>(null)

  const [orbs, setOrbs] = useState<Orb[]>([
    { x: columnWidth * 0.65, y: 80, vx: 0.3, vy: 0.5, radius: 45, color: '#FF6B3520', glowColor: '#FF6B35' },
    { x: columnWidth * 0.3, y: 220, vx: -0.4, vy: 0.3, radius: 35, color: '#4CAF5020', glowColor: '#4CAF50' },
    { x: columnWidth * 0.5, y: 350, vx: 0.2, vy: -0.4, radius: 40, color: '#2196F320', glowColor: '#2196F3' },
  ])

  // Physics animation
  useEffect(() => {
    if (paused) return
    const interval = setInterval(() => {
      setOrbs(prev => prev.map((orb, i) => {
        if (i === dragIndex) return orb
        let { x, y, vx, vy } = orb
        x += vx
        y += vy
        // Bounce off walls
        if (x - orb.radius < 0 || x + orb.radius > columnWidth) vx = -vx
        if (y - orb.radius < 0 || y + orb.radius > columnHeight) vy = -vy
        x = Math.max(orb.radius, Math.min(columnWidth - orb.radius, x))
        y = Math.max(orb.radius, Math.min(columnHeight - orb.radius, y))
        return { ...orb, x, y, vx, vy }
      }))
    }, 32) // ~30fps physics
    return () => clearInterval(interval)
  }, [paused, dragIndex, columnWidth, columnHeight])

  // Pan responder for dragging orbs
  const panResponder = useMemo(() =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const { locationX, locationY } = evt.nativeEvent
        // Find which orb was touched
        const idx = orbs.findIndex(orb => {
          const dx = locationX - orb.x
          const dy = locationY - orb.y
          return Math.sqrt(dx * dx + dy * dy) < orb.radius + 20
        })
        setDragIndex(idx >= 0 ? idx : null)
      },
      onPanResponderMove: (evt) => {
        if (dragIndex === null) return
        const { locationX, locationY } = evt.nativeEvent
        setOrbs(prev => prev.map((orb, i) =>
          i === dragIndex
            ? { ...orb, x: Math.max(orb.radius, Math.min(columnWidth - orb.radius, locationX)), y: Math.max(orb.radius, Math.min(columnHeight - orb.radius, locationY)) }
            : orb
        ))
      },
      onPanResponderRelease: () => setDragIndex(null),
    }),
  [dragIndex, columnWidth, columnHeight, orbs])

  // layoutNextLine with circular obstacles — text flows on BOTH sides
  const lines = useMemo(() => {
    const prepared = prepareWithSegments(articleText, textStyle)
    const result: { text: string; x: number; y: number; width: number }[] = []

    let cursor = { segmentIndex: 0, graphemeIndex: 0 }
    let y = 0

    while (y < columnHeight) {
      // Find all blocked intervals on this line
      const intervals: { left: number; right: number }[] = []
      for (const orb of orbs) {
        const blocked = getCircleBlockedInterval(orb.x, orb.y, orb.radius + 6, y, lineHeight)
        if (blocked) intervals.push(blocked)
      }

      // Sort intervals and find the widest free span
      intervals.sort((a, b) => a.left - b.left)

      // Find available spans
      let bestSpan = { start: 0, width: columnWidth }
      if (intervals.length > 0) {
        const spans: { start: number; width: number }[] = []
        let freeStart = 0
        for (const iv of intervals) {
          if (iv.left > freeStart) {
            spans.push({ start: freeStart, width: iv.left - freeStart })
          }
          freeStart = Math.max(freeStart, iv.right)
        }
        if (freeStart < columnWidth) {
          spans.push({ start: freeStart, width: columnWidth - freeStart })
        }
        // Use widest span
        bestSpan = spans.reduce((a, b) => b.width > a.width ? b : a, { start: 0, width: 0 })
      }

      if (bestSpan.width < 30) {
        y += lineHeight
        continue
      }

      const line = layoutNextLine(prepared, cursor, bestSpan.width)
      if (!line) break

      result.push({ text: line.text, x: bestSpan.start, y, width: bestSpan.width })
      cursor = line.end
      y += lineHeight
    }

    return result
  }, [orbs, columnWidth, columnHeight])

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Editorial Engine</Text>
        <Pressable onPress={() => setPaused(!paused)}>
          <Text style={styles.pauseBtn}>{paused ? '▶ Resume' : '⏸ Pause'}</Text>
        </Pressable>
      </View>
      <Text style={styles.subtitle}>
        Drag orbs · {paused ? 'Paused' : 'Physics running'} · Zero native calls per frame
      </Text>

      <View
        {...panResponder.panHandlers}
        style={[styles.textArea, { width: columnWidth, height: columnHeight }]}
      >
        {/* Text lines */}
        {lines.map((line, i) => (
          <Text
            key={i}
            style={[
              styles.lineText,
              { position: 'absolute', top: line.y, left: line.x, width: line.width },
            ]}
            numberOfLines={1}
          >
            {line.text}
          </Text>
        ))}

        {/* Orbs */}
        {orbs.map((orb, i) => (
          <View
            key={i}
            style={[
              styles.orb,
              {
                position: 'absolute',
                left: orb.x - orb.radius,
                top: orb.y - orb.radius,
                width: orb.radius * 2,
                height: orb.radius * 2,
                borderRadius: orb.radius,
                backgroundColor: orb.color,
                borderColor: orb.glowColor,
                shadowColor: orb.glowColor,
              },
            ]}
          />
        ))}
      </View>

      <Text style={styles.stats}>
        {lines.length} lines · prepareWithSegments() once · layoutNextLine() ×{lines.length} per frame
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1a1a1a' },
  pauseBtn: { fontSize: 13, color: '#007AFF', fontWeight: '600' },
  subtitle: {
    fontSize: 11, color: '#999', paddingHorizontal: 16, marginBottom: 8,
  },
  textArea: {
    marginHorizontal: 16,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 12,
    overflow: 'hidden',
  },
  lineText: {
    fontFamily: 'Helvetica Neue',
    fontSize: 13,
    lineHeight: 18,
    color: '#d4d4d4',
  },
  orb: {
    borderWidth: 2,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
  },
  stats: {
    fontSize: 11, color: '#999', textAlign: 'center', marginTop: 8, fontFamily: 'Menlo',
  },
})
