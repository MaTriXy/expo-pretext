import { useState, useCallback, useMemo } from 'react'
import { View, Text, StyleSheet, useWindowDimensions, Pressable } from 'react-native'
import { FlashList } from '@shopify/flash-list'
import { useTextHeight, useFlashListHeights, prepare, layout } from 'expo-pretext'

const bodyStyle = { fontFamily: 'System', fontSize: 15, lineHeight: 22 }

// Generate 500 messages with varied content
const messages = generateMessages(500)

function generateMessages(count: number) {
  const templates = [
    'Hey, how are you?',
    'I just deployed the new version 🚀',
    'Can you review my PR? It fixes the **layout bug** we discussed.',
    'Sure, looking at it now.',
    'The `useTextHeight` hook is working perfectly for our chat virtualization.',
    'საქართველო მდიდარი ისტორიისა და კულტურის ქვეყანაა.',
    'What do you think about using `expo-pretext` for height prediction?',
    'It eliminates all the onLayout jumps we had before.',
    '春天到了，万物复苏，到处都是生机勃勃的景象。',
    'بدأت الرحلة في يوم مشمس من أيام الربيع',
    'The key insight is: prepare() once, layout() many times. Pure arithmetic on cached widths.',
    'I measured 1000 messages in under 5ms total — that includes the native measurement.',
    '👍',
    'This is exactly what we needed for FlashList integration.',
    'React Native is 🔥 and expo-pretext makes text height prediction accurate across العربية, 中文, 日本語, and ქართული!',
    'How does it handle streaming?',
    'Automatically detects append patterns. Only measures the new suffix.',
  ]
  return Array.from({ length: count }, (_, i) => ({
    id: String(i),
    role: (i % 3 === 0 ? 'user' : 'assistant') as 'user' | 'assistant',
    text: templates[i % templates.length]!,
  }))
}

type Message = { id: string; role: 'user' | 'assistant'; text: string }

// Tight-wrap: find minimum bubble width using binary search
function useTightWidth(text: string, maxWidth: number): number {
  return useMemo(() => {
    try {
      const prepared = prepare(text, bodyStyle)
      const full = layout(prepared, maxWidth)
      if (full.lineCount <= 1) return maxWidth

      let lo = 40, hi = maxWidth
      while (hi - lo > 1) {
        const mid = Math.floor((lo + hi) / 2)
        const r = layout(prepared, mid)
        if (r.lineCount <= full.lineCount) hi = mid
        else lo = mid
      }
      return hi
    } catch {
      return maxWidth
    }
  }, [text, maxWidth])
}

function ChatBubble({ message, maxWidth }: { message: Message; maxWidth: number }) {
  const isUser = message.role === 'user'
  const tightWidth = useTightWidth(message.text, maxWidth)
  const height = useTextHeight(message.text, bodyStyle, tightWidth)

  return (
    <View style={[
      styles.bubble,
      isUser ? styles.userBubble : styles.assistantBubble,
      { width: tightWidth + 24 } // +padding
    ]}>
      <Text style={[styles.bubbleText, isUser && styles.userText]}>
        {message.text}
      </Text>
    </View>
  )
}

export function MarkdownChatDemo() {
  const { width } = useWindowDimensions()
  const bubbleMax = Math.floor(width * 0.75)

  const { estimatedItemSize, overrideItemLayout } = useFlashListHeights(
    messages,
    (m: Message) => m.text,
    bodyStyle,
    bubbleMax
  )

  const renderItem = useCallback(
    ({ item }: { item: Message }) => (
      <ChatBubble message={item} maxWidth={bubbleMax} />
    ),
    [bubbleMax]
  )

  return (
    <View style={styles.container}>
      <Text style={styles.info}>
        {messages.length} messages · FlashList + useFlashListHeights + tight-wrap
      </Text>
      <FlashList
        data={messages}
        renderItem={renderItem}
        estimatedItemSize={estimatedItemSize}
        overrideItemLayout={overrideItemLayout}
        keyExtractor={m => m.id}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f0f0' },
  info: { fontSize: 11, color: '#999', textAlign: 'center', paddingVertical: 6, fontFamily: 'Menlo' },
  bubble: {
    padding: 12, borderRadius: 16, marginBottom: 6, marginHorizontal: 12,
  },
  userBubble: {
    backgroundColor: '#007AFF', alignSelf: 'flex-end', borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: '#fff', alignSelf: 'flex-start', borderBottomLeftRadius: 4,
    borderWidth: StyleSheet.hairlineWidth, borderColor: '#ddd',
  },
  bubbleText: { fontSize: 15, lineHeight: 22, color: '#1a1a1a' },
  userText: { color: '#fff' },
})
