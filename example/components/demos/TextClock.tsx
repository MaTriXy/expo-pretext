import { useEffect, useState, useMemo } from 'react'
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native'
import { prepare, layout } from 'expo-pretext'

const DIGIT_STYLE = { fontFamily: 'Menlo', fontSize: 96, lineHeight: 96 }

function formatTime(date: Date): string {
  const h = String(date.getHours()).padStart(2, '0')
  const m = String(date.getMinutes()).padStart(2, '0')
  const s = String(date.getSeconds()).padStart(2, '0')
  return `${h}:${m}:${s}`
}

export function TextClockDemo() {
  const { width } = useWindowDimensions()
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const timeText = formatTime(now)

  const metrics = useMemo(() => {
    const prepared = prepare(timeText, DIGIT_STYLE)
    return layout(prepared, width - 32)
  }, [timeText, width])

  const dateStr = now.toDateString()

  return (
    <View style={styles.container}>
      <View style={styles.clockBox}>
        <Text style={styles.clock}>{timeText}</Text>
        <Text style={styles.date}>{dateStr}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.infoText}>prepare() + layout() · re-measured every tick</Text>
        <Text style={styles.infoText}>height: {metrics.height}px · {metrics.lineCount} line</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0c', justifyContent: 'center', alignItems: 'center' },
  clockBox: { alignItems: 'center', paddingVertical: 40 },
  clock: { fontFamily: 'Menlo', fontSize: 72, color: '#e8e4dc', letterSpacing: -2 },
  date: { fontFamily: 'Helvetica Neue', fontSize: 14, color: 'rgba(255,255,255,0.4)', marginTop: 16 },
  info: { position: 'absolute', bottom: 40, alignItems: 'center', gap: 4 },
  infoText: { fontFamily: 'Menlo', fontSize: 10, color: 'rgba(255,255,255,0.4)' },
})
