import { useState, useMemo, useRef } from 'react'
import { View, Text, StyleSheet, PanResponder, useWindowDimensions } from 'react-native'
import { prepareWithSegments, layoutColumn, type RectObstacle } from 'expo-pretext'

const STYLE = { fontFamily: 'Georgia', fontSize: 15, lineHeight: 22 }
const LH = 22

const TEXT = `In the rain there is nothing more peaceful than a well-fitted umbrella. The raindrops make their rhythm on the fabric overhead and the world below stays dry and contained. Reading a book under an umbrella becomes its own small ceremony — the words stay with you in a way they do not elsewhere. This demo shows text reflowing around a draggable umbrella rectangle. Touch and drag to move it around. The text below recalculates its layout in pure arithmetic, never blocking the UI thread, achieving sixty frames per second even as the obstacle moves continuously across the page.`

export function UmbrellaReflowDemo() {
  const { width } = useWindowDimensions()
  const stageW = width - 16
  const stageH = 600
  const pad = 16
  const innerW = stageW - pad * 2

  const [umbrella, setUmbrella] = useState({ x: innerW * 0.3, y: 60, w: innerW * 0.4, h: 120 })
  const umbrellaRef = useRef(umbrella)
  umbrellaRef.current = umbrella

  const pan = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderMove: (e, _g) => {
      const lx = e.nativeEvent.locationX - pad
      const ly = e.nativeEvent.locationY - pad
      setUmbrella(prev => ({
        ...prev,
        x: Math.max(0, Math.min(innerW - prev.w, lx - prev.w / 2)),
        y: Math.max(0, Math.min(stageH - prev.h - pad * 2, ly - prev.h / 2)),
      }))
    },
  }), [innerW, stageH, pad])

  const lines = useMemo(() => {
    const prepared = prepareWithSegments(TEXT, STYLE)
    const rect: RectObstacle = {
      x: umbrella.x, y: umbrella.y,
      w: umbrella.w, h: umbrella.h,
    }
    return layoutColumn(
      prepared,
      { segmentIndex: 0, graphemeIndex: 0 },
      { x: 0, y: 0, width: innerW, height: stageH - pad * 2 },
      LH, [], [rect],
    ).lines
  }, [umbrella, innerW, stageH])

  return (
    <View style={styles.container}>
      <View {...pan.panHandlers} style={[styles.stage, { width: stageW, height: stageH }]}>
        {lines.map((l, i) => (
          <View key={i} style={{
            position: 'absolute',
            top: pad + l.y,
            left: pad + l.x,
            width: l.width,
            height: LH,
            overflow: 'hidden',
          }}>
            <Text style={styles.line}>{l.text}</Text>
          </View>
        ))}
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: pad + umbrella.x,
            top: pad + umbrella.y,
            width: umbrella.w,
            height: umbrella.h,
            backgroundColor: 'rgba(180, 100, 60, 0.35)',
            borderWidth: 1,
            borderColor: 'rgba(180, 100, 60, 0.8)',
            borderRadius: 8,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Text style={styles.umbrellaLabel}>&#9730;</Text>
        </View>
      </View>
      <Text style={styles.info}>layoutColumn() · drag the umbrella to reflow text</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0c', alignItems: 'center', paddingTop: 4 },
  stage: { backgroundColor: '#0f0f14' },
  line: { fontFamily: 'Georgia', fontSize: 15, lineHeight: 22, color: '#e8e4dc' },
  umbrellaLabel: { fontSize: 48, color: '#fff' },
  info: { fontFamily: 'Menlo', fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 8 },
})
