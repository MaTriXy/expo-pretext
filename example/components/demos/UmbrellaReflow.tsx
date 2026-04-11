// Umbrella Text Reflow — Matrix-style digital rain that stops at a draggable umbrella.
// Inspired by the original pretextjs.dev umbrella demo by @janmukeer.
// Each vertical column of characters is a stream that "rains" down; the umbrella shape
// casts a shadow — columns whose x-coordinate lands inside the umbrella body stop early,
// as if the umbrella is blocking the rain.

import { useState, useEffect, useMemo, useRef } from 'react'
import { View, Text, StyleSheet, PanResponder, useWindowDimensions } from 'react-native'
import { prepareWithSegments, measureNaturalWidth } from 'expo-pretext'

const CHAR_STYLE = { fontFamily: 'Menlo', fontSize: 14, lineHeight: 18 }
const LH = 18

// Matrix-style character pool (katakana + digits + latin) — looks like rain
const CHAR_POOL = 'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉ0123456789ABCDEF'

function randomChar(): string {
  return CHAR_POOL[Math.floor(Math.random() * CHAR_POOL.length)]!
}

type Stream = {
  col: number              // column index
  x: number                // x position in pixels
  head: number             // current head y in pixel units
  speed: number            // pixels per tick
  length: number           // length of the trail
  chars: string[]          // current rendered characters (top to bottom)
}

type Umbrella = {
  // Circular canopy (ellipse) + handle (thin rectangle)
  cx: number    // center x of canopy
  cy: number    // center y of canopy (top of umbrella body)
  rx: number    // canopy half-width
  ry: number    // canopy half-height
  handleW: number
  handleH: number
}

// Is a given (x, y) point inside the umbrella body (canopy OR handle)?
// Using the circular/elliptical canopy and rectangular handle.
function pointInUmbrella(x: number, y: number, u: Umbrella): boolean {
  // Canopy: upper half of an ellipse (cy is the flat bottom of the canopy)
  if (y <= u.cy) {
    const dx = (x - u.cx) / u.rx
    const dy = (y - u.cy) / u.ry
    if (dx * dx + dy * dy <= 1) return true
  }
  // Handle: thin rectangle hanging from canopy center
  const handleLeft = u.cx - u.handleW / 2
  const handleRight = u.cx + u.handleW / 2
  const handleTop = u.cy
  const handleBottom = u.cy + u.handleH
  if (x >= handleLeft && x <= handleRight && y >= handleTop && y <= handleBottom) {
    return true
  }
  return false
}

export function UmbrellaReflowDemo() {
  const { width } = useWindowDimensions()
  const stageW = width - 16
  const stageH = 600

  // Measure character cell width once (monospace — all chars same width)
  const cellWidth = useMemo(() => {
    const prepared = prepareWithSegments('0', CHAR_STYLE)
    return measureNaturalWidth(prepared)
  }, [])

  const cols = useMemo(() => Math.floor(stageW / cellWidth), [stageW, cellWidth])
  const rows = useMemo(() => Math.floor(stageH / LH), [stageH])

  // Umbrella state — draggable
  const [umbrella, setUmbrella] = useState<Umbrella>(() => ({
    cx: stageW / 2,
    cy: stageH * 0.45,
    rx: Math.min(120, stageW * 0.25),
    ry: 48,
    handleW: 6,
    handleH: 100,
  }))

  const umbrellaRef = useRef(umbrella)
  umbrellaRef.current = umbrella

  // Drag gesture
  const pan = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderMove: (e) => {
      const x = e.nativeEvent.locationX
      const y = e.nativeEvent.locationY
      setUmbrella(prev => ({
        ...prev,
        cx: Math.max(prev.rx, Math.min(stageW - prev.rx, x)),
        cy: Math.max(prev.ry, Math.min(stageH - prev.handleH - 20, y)),
      }))
    },
  }), [stageW, stageH])

  // Rain streams — initialized once, animated over time
  const streamsRef = useRef<Stream[]>([])
  const [tick, setTick] = useState(0)

  // Initialize streams lazily
  useEffect(() => {
    streamsRef.current = Array.from({ length: cols }, (_, col) => ({
      col,
      x: col * cellWidth,
      head: Math.random() * -stageH,
      speed: 1 + Math.random() * 2,
      length: 8 + Math.floor(Math.random() * 16),
      chars: Array.from({ length: 24 }, () => randomChar()),
    }))
  }, [cols, cellWidth, stageH])

  // Animation loop
  useEffect(() => {
    const timer = setInterval(() => {
      const streams = streamsRef.current
      for (const s of streams) {
        s.head += s.speed
        // Respawn when fully off-screen
        if (s.head - s.length * LH > stageH) {
          s.head = -Math.random() * stageH * 0.5
          s.speed = 1 + Math.random() * 2
          s.length = 8 + Math.floor(Math.random() * 16)
        }
        // Occasionally cycle a character to simulate flicker
        if (Math.random() < 0.1) {
          s.chars[Math.floor(Math.random() * s.chars.length)] = randomChar()
        }
      }
      setTick(t => t + 1)
    }, 50)
    return () => clearInterval(timer)
  }, [stageH])

  // Compute visible character cells — for each stream, each row from head-length to head.
  // If a cell falls inside the umbrella, it is hidden (the umbrella blocks the rain).
  const cells = useMemo(() => {
    const out: Array<{ key: string; x: number; y: number; char: string; brightness: number }> = []
    const streams = streamsRef.current
    for (const s of streams) {
      for (let i = 0; i < s.length; i++) {
        const y = s.head - i * LH
        if (y < 0 || y > stageH) continue
        // Check umbrella collision — skip if occluded
        if (pointInUmbrella(s.x + cellWidth / 2, y + LH / 2, umbrella)) continue
        // Brightness fades from head (1.0) to tail (0.2)
        const brightness = i === 0 ? 1 : Math.max(0.15, 1 - i / s.length)
        out.push({
          key: `${s.col}-${i}`,
          x: s.x,
          y,
          char: s.chars[i % s.chars.length]!,
          brightness,
        })
      }
    }
    return out
  // tick drives re-render
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, umbrella, stageH, cellWidth])

  return (
    <View style={styles.container}>
      <View {...pan.panHandlers} style={[styles.stage, { width: stageW, height: stageH }]}>
        {cells.map(cell => (
          <Text
            key={cell.key}
            style={[
              styles.char,
              {
                position: 'absolute',
                left: cell.x,
                top: cell.y,
                color: cell.brightness >= 0.95
                  ? '#d0f0ff'
                  : `rgba(80, 180, 255, ${cell.brightness})`,
              },
            ]}
          >
            {cell.char}
          </Text>
        ))}

        {/* Umbrella canopy (ellipse via border-radius trick) */}
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: umbrella.cx - umbrella.rx,
            top: umbrella.cy - umbrella.ry,
            width: umbrella.rx * 2,
            height: umbrella.ry * 2,
            borderTopLeftRadius: umbrella.rx,
            borderTopRightRadius: umbrella.rx,
            borderBottomLeftRadius: umbrella.rx * 0.2,
            borderBottomRightRadius: umbrella.rx * 0.2,
            backgroundColor: '#f5f5f5',
            overflow: 'hidden',
          }}
        >
          {/* canopy shading */}
          <View style={{
            position: 'absolute',
            left: 0, right: 0, bottom: 0, height: 12,
            backgroundColor: 'rgba(0,0,0,0.12)',
          }} />
        </View>

        {/* Umbrella handle */}
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: umbrella.cx - umbrella.handleW / 2,
            top: umbrella.cy,
            width: umbrella.handleW,
            height: umbrella.handleH,
            backgroundColor: '#e0e0e0',
            borderBottomLeftRadius: umbrella.handleW,
            borderBottomRightRadius: umbrella.handleW,
          }}
        />
      </View>
      <Text style={styles.info}>measureNaturalWidth() · drag the umbrella — digital rain casts into its shadow</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', alignItems: 'center', paddingTop: 4 },
  stage: { backgroundColor: '#000', overflow: 'hidden' },
  char: { fontFamily: 'Menlo', fontSize: 14, lineHeight: 18 },
  info: { fontFamily: 'Menlo', fontSize: 10, color: 'rgba(120,180,255,0.5)', marginTop: 8 },
})
