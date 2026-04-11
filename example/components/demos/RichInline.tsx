import { useMemo } from 'react'
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native'
import { prepareInlineFlow, walkInlineFlowLines, type InlineFlowItem } from 'expo-pretext'

const BODY = { fontFamily: 'Helvetica Neue', fontSize: 16, lineHeight: 24 }
const BOLD = { fontFamily: 'Helvetica Neue', fontSize: 16, lineHeight: 24, fontWeight: '700' as const }
const CODE = { fontFamily: 'Menlo', fontSize: 14, lineHeight: 24 }
const MENTION = { fontFamily: 'Helvetica Neue', fontSize: 15, lineHeight: 24, fontWeight: '600' as const }

export function RichInlineDemo() {
  const { width } = useWindowDimensions()
  const maxWidth = width - 32

  const items: InlineFlowItem[] = useMemo(() => [
    { text: 'Hey ', style: BODY },
    { text: '@juba', style: MENTION, atomic: true, extraWidth: 12 },
    { text: ', I pushed a fix for ', style: BODY },
    { text: '#1234', style: MENTION, atomic: true, extraWidth: 12 },
    { text: '. The issue was in ', style: BODY },
    { text: 'layoutNextLine()', style: CODE, atomic: true, extraWidth: 8 },
    { text: ' — it was missing the ', style: BODY },
    { text: 'epsilon', style: CODE, atomic: true, extraWidth: 8 },
    { text: ' check on sub-pixel widths. ', style: BODY },
    { text: 'Can you review it? ', style: BOLD },
    { text: 'Thanks!', style: BODY },
  ], [])

  const lines = useMemo(() => {
    const prepared = prepareInlineFlow(items)
    type LineData = {
      fragments: Array<{ itemIndex: number; text: string; gapBefore: number; occupiedWidth: number }>
      y: number
    }
    const result: LineData[] = []
    let y = 0
    walkInlineFlowLines(prepared, maxWidth, (line) => {
      result.push({ fragments: line.fragments, y })
      y += 26
    })
    return result
  }, [items, maxWidth])

  const totalHeight = lines.length * 26 + 32

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Rich Inline Flow</Text>
      <View style={[styles.bubble, { minHeight: totalHeight }]}>
        {lines.map((line, lineIdx) => {
          let x = 0
          return (
            <View key={lineIdx} style={{ position: 'absolute', top: line.y + 16, left: 16, right: 16, height: 26 }}>
              {line.fragments.map((frag, fi) => {
                const itemX = x + frag.gapBefore
                x = itemX + frag.occupiedWidth
                const item = items[frag.itemIndex]!
                const isAtomic = !!item.atomic
                const isCode = item.style === CODE
                return (
                  <View
                    key={fi}
                    style={{
                      position: 'absolute',
                      left: itemX,
                      top: 0,
                      height: 26,
                      paddingHorizontal: isAtomic ? 6 : 0,
                      backgroundColor: isAtomic ? (isCode ? '#1e1e24' : '#2563eb') : 'transparent',
                      borderRadius: isAtomic ? 6 : 0,
                      justifyContent: 'center',
                    }}
                  >
                    <Text style={{
                      fontFamily: item.style.fontFamily,
                      fontSize: item.style.fontSize,
                      lineHeight: 20,
                      fontWeight: (item.style as typeof BOLD).fontWeight,
                      color: isAtomic && !isCode ? '#fff' : '#e8e4dc',
                    }}>{frag.text}</Text>
                  </View>
                )
              })}
            </View>
          )
        })}
      </View>
      <View style={styles.info}>
        <Text style={styles.infoText}>prepareInlineFlow() + walkInlineFlowLines()</Text>
        <Text style={styles.infoText}>Atomic pills stay whole · mixed fonts on same baseline</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0c', padding: 16 },
  title: { color: '#e8e4dc', fontSize: 14, fontFamily: 'Helvetica Neue', fontWeight: '600', marginBottom: 16 },
  bubble: { backgroundColor: '#1a1a1e', borderRadius: 16, position: 'relative' },
  info: { marginTop: 24, alignItems: 'center', gap: 4 },
  infoText: { fontFamily: 'Menlo', fontSize: 10, color: 'rgba(255,255,255,0.4)' },
})
