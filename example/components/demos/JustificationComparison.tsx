import { useState, useMemo } from 'react'
import { View, Text, StyleSheet, ScrollView, useWindowDimensions, Pressable } from 'react-native'
import { prepareWithSegments, layoutWithLines } from 'expo-pretext'

const style = { fontFamily: 'Helvetica Neue', fontSize: 14, lineHeight: 20 }
const LH = 20

const sampleText = `The web renders text through a pipeline designed thirty years ago for static documents. A browser loads a font, shapes text into glyphs, measures their combined width, determines where lines break, and positions each line vertically. Every step requires the rendering engine to consult its internal layout tree. Pretext sidesteps this entirely.`

type Mode = 'left' | 'justified'

function RenderedParagraph({ text, width, mode }: { text: string; width: number; mode: Mode }) {
  const result = useMemo(() => {
    try {
      const prepared = prepareWithSegments(text, style)
      return layoutWithLines(prepared, width)
    } catch { return null }
  }, [text, width])

  if (!result) return <Text style={styles.error}>Layout error</Text>

  return (
    <View style={[styles.paragraph, { width }]}>
      {result.lines.map((line, i) => {
        const isLastLine = i === result.lines.length - 1

        if (mode === 'justified' && !isLastLine && line.text.trim().length > 0) {
          // Justify: distribute extra space between words
          const words = line.text.trim().split(/\s+/)
          const extraSpace = width - line.width
          const gaps = Math.max(1, words.length - 1)
          const gapWidth = extraSpace / gaps

          return (
            <View key={i} style={[styles.lineRow, { height: LH }]}>
              {words.map((word, wi) => (
                <Text key={wi} style={[styles.lineText, wi < words.length - 1 && { marginRight: gapWidth }]}>
                  {word}
                </Text>
              ))}
            </View>
          )
        }

        return (
          <Text key={i} style={[styles.lineText, { height: LH }]} numberOfLines={1}>
            {line.text}
          </Text>
        )
      })}
      <Text style={styles.lineMeta}>
        {result.lineCount} lines · {result.height}px · layoutWithLines()
      </Text>
    </View>
  )
}

export function JustificationComparisonDemo() {
  const { width } = useWindowDimensions()
  const colWidth = Math.floor((width - 60) / 2)
  const [textWidth, setTextWidth] = useState(colWidth)

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.info}>
        Same text, same prepare() — two layout modes. layoutWithLines() returns line text + width for custom rendering.
      </Text>

      <View style={styles.sliderRow}>
        <Text style={styles.sliderLabel}>Width: {textWidth}px</Text>
        <View style={styles.sliderBtns}>
          <Pressable onPress={() => setTextWidth(w => Math.max(120, w - 20))} style={styles.btn}>
            <Text style={styles.btnText}>-</Text>
          </Pressable>
          <Pressable onPress={() => setTextWidth(w => Math.min(width - 40, w + 20))} style={styles.btn}>
            <Text style={styles.btnText}>+</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.comparison}>
        <View>
          <Text style={styles.colTitle}>Left-aligned</Text>
          <RenderedParagraph text={sampleText} width={textWidth} mode="left" />
        </View>
        <View>
          <Text style={styles.colTitle}>Justified</Text>
          <RenderedParagraph text={sampleText} width={textWidth} mode="justified" />
        </View>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  info: { fontSize: 13, color: '#666', lineHeight: 18, marginBottom: 12, fontStyle: 'italic' },
  sliderRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 16, backgroundColor: '#f0f0f0', padding: 12, borderRadius: 8,
  },
  sliderLabel: { fontSize: 14, fontWeight: '600' },
  sliderBtns: { flexDirection: 'row', gap: 8 },
  btn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#007AFF', justifyContent: 'center', alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 20, fontWeight: '700' },
  comparison: { gap: 20 },
  colTitle: { fontSize: 13, fontWeight: '700', color: '#333', marginBottom: 6 },
  paragraph: {
    backgroundColor: '#fff', borderRadius: 8, padding: 12,
    borderWidth: StyleSheet.hairlineWidth, borderColor: '#ddd',
  },
  lineRow: { flexDirection: 'row' },
  lineText: { fontFamily: 'Helvetica Neue', fontSize: 14, lineHeight: 20, color: '#333' },
  lineMeta: { fontSize: 10, color: '#999', marginTop: 8, fontFamily: 'Menlo' },
  error: { color: '#dc3545', fontSize: 12 },
})
