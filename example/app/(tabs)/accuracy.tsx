import { useState } from 'react'
import { View, Text, StyleSheet, ScrollView, useWindowDimensions } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { sampleTexts } from '../../data/sample-texts'

// TODO: Use prepare() + layout() from expo-pretext and compare with onLayout

const testWidths = [200, 280, 360]

export default function AccuracyScreen() {
  const { width } = useWindowDimensions()
  const [results, setResults] = useState<
    { text: string; width: number; predicted: number; actual: number }[]
  >([])

  const texts = Object.entries(sampleTexts).slice(0, 4)

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Accuracy</Text>
      <Text style={styles.subtitle}>Predicted vs actual RN Text height</Text>

      <ScrollView contentContainerStyle={styles.list}>
        {texts.map(([lang, text]) => (
          <View key={lang} style={styles.section}>
            <Text style={styles.sectionTitle}>{lang}</Text>
            {testWidths.map(w => (
              <View key={w} style={styles.testRow}>
                <Text style={styles.widthLabel}>{w}px</Text>
                <View style={[styles.textBox, { width: w }]}>
                  <Text
                    style={styles.sampleText}
                    onLayout={e => {
                      const actual = e.nativeEvent.layout.height
                      // TODO: Compare with expo-pretext prediction
                    }}
                  >
                    {text}
                  </Text>
                </View>
                {/* TODO: Show diff indicator */}
                <Text style={styles.statusOk}>--</Text>
              </View>
            ))}
          </View>
        ))}

        <View style={styles.legend}>
          <Text style={styles.legendText}>
            Accuracy test will compare expo-pretext predictions with actual RN Text onLayout measurements.
            Target: {'<'}1px difference.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  title: { fontSize: 24, fontWeight: '700', textAlign: 'center', marginTop: 16 },
  subtitle: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 16 },
  list: { padding: 16, gap: 16 },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: { fontSize: 14, fontWeight: '600', marginBottom: 12, textTransform: 'capitalize' },
  testRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  widthLabel: { fontSize: 11, color: '#999', width: 40, paddingTop: 4 },
  textBox: {
    backgroundColor: '#f8f8f8',
    borderRadius: 4,
    padding: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#ddd',
  },
  sampleText: { fontSize: 16, lineHeight: 24 },
  statusOk: { fontSize: 11, color: '#999', paddingTop: 4 },
  legend: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  legendText: { fontSize: 12, color: '#666', lineHeight: 18 },
})
