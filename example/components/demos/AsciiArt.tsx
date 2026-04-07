import { useState, useMemo } from 'react'
import { View, Text, StyleSheet, ScrollView, useWindowDimensions, Pressable } from 'react-native'
import { prepareWithSegments, layoutWithLines } from 'expo-pretext'

const monoStyle = { fontFamily: 'Menlo', fontSize: 12, lineHeight: 16 }
const proportionalStyle = { fontFamily: 'Helvetica Neue', fontSize: 12, lineHeight: 16 }

const sampleText = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz 0123456789 !@#$%^&*() The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs.'

type FontMode = 'mono' | 'proportional'

function CharGrid({ text, fontStyle, width }: { text: string; fontStyle: any; width: number }) {
  const result = useMemo(() => {
    try {
      const prepared = prepareWithSegments(text, fontStyle)
      return layoutWithLines(prepared, width)
    } catch { return null }
  }, [text, fontStyle, width])

  if (!result) return <Text style={styles.error}>Layout error</Text>

  return (
    <View style={[styles.grid, { width }]}>
      {result.lines.map((line, i) => (
        <View key={i} style={styles.charRow}>
          {[...line.text].map((char, ci) => (
            <Text
              key={ci}
              style={[
                styles.charCell,
                { fontFamily: fontStyle.fontFamily, fontSize: fontStyle.fontSize },
                char === ' ' && styles.spaceChar,
              ]}
            >
              {char === ' ' ? '·' : char}
            </Text>
          ))}
        </View>
      ))}
      <Text style={styles.gridMeta}>
        {result.lineCount} lines · {result.lines.reduce((s, l) => s + [...l.text].length, 0)} chars
      </Text>
    </View>
  )
}

export function AsciiArtDemo() {
  const { width } = useWindowDimensions()
  const gridWidth = width - 48
  const [mode, setMode] = useState<FontMode>('mono')

  const fontStyle = mode === 'mono' ? monoStyle : proportionalStyle

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.info}>
        prepareWithSegments() measures individual character widths.
        Same text, different fonts — see how proportional vs monospace affects layout.
      </Text>

      <View style={styles.toggleRow}>
        <Pressable
          style={[styles.toggle, mode === 'mono' && styles.toggleActive]}
          onPress={() => setMode('mono')}
        >
          <Text style={[styles.toggleText, mode === 'mono' && styles.toggleTextActive]}>Monospace</Text>
        </Pressable>
        <Pressable
          style={[styles.toggle, mode === 'proportional' && styles.toggleActive]}
          onPress={() => setMode('proportional')}
        >
          <Text style={[styles.toggleText, mode === 'proportional' && styles.toggleTextActive]}>Proportional</Text>
        </Pressable>
      </View>

      <CharGrid text={sampleText} fontStyle={fontStyle} width={gridWidth} />

      <Text style={styles.fontInfo}>
        Font: {fontStyle.fontFamily} {fontStyle.fontSize}px
      </Text>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  info: { fontSize: 13, color: '#666', lineHeight: 18, marginBottom: 12, fontStyle: 'italic' },
  toggleRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  toggle: {
    flex: 1, paddingVertical: 10, borderRadius: 8,
    backgroundColor: '#f0f0f0', alignItems: 'center',
  },
  toggleActive: { backgroundColor: '#1a1a1a' },
  toggleText: { fontSize: 14, fontWeight: '600', color: '#333' },
  toggleTextActive: { color: '#fff' },
  grid: {
    backgroundColor: '#1a1a1a', borderRadius: 12, padding: 12, overflow: 'hidden',
  },
  charRow: { flexDirection: 'row', flexWrap: 'wrap' },
  charCell: {
    color: '#4CAF50', textAlign: 'center',
  },
  spaceChar: { color: '#333' },
  gridMeta: { fontSize: 10, color: '#666', marginTop: 8, fontFamily: 'Menlo' },
  fontInfo: { fontSize: 11, color: '#999', textAlign: 'center', marginTop: 8 },
  error: { color: '#dc3545' },
})
