import { useState, useCallback } from 'react'
import { View, Text, StyleSheet, useWindowDimensions, Pressable } from 'react-native'
import { FlashList } from '@shopify/flash-list'
import Markdown from '@ronradtke/react-native-markdown-display'
import { mockMessages, mockStreamTokens, type ChatMessage } from '../../data/mock-messages'
import { markdownSample } from '../../data/sample-texts'
import { useTextHeight } from 'expo-pretext'

const textStyle = { fontFamily: 'System', fontSize: 16, lineHeight: 24 }

const mdStylesAssistant = {
  body: { fontSize: 16, lineHeight: 24, color: '#1a1a1a' },
  strong: { fontWeight: '700' as const },
  em: { fontStyle: 'italic' as const },
  code_inline: {
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
    fontFamily: 'Menlo',
    fontSize: 14,
    color: '#d63384',
  },
  fence: {
    backgroundColor: '#1e1e1e',
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
  },
  code_block: {
    fontFamily: 'Menlo',
    fontSize: 13,
    lineHeight: 20,
    color: '#d4d4d4',
  },
  link: { color: '#007AFF' },
  paragraph: { marginTop: 0, marginBottom: 8 },
}

const mdStylesUser = {
  ...mdStylesAssistant,
  body: { ...mdStylesAssistant.body, color: '#fff' },
  code_inline: {
    ...mdStylesAssistant.code_inline,
    backgroundColor: 'rgba(255,255,255,0.2)',
    color: '#fff',
  },
  link: { color: '#a0d8ff' },
}

function ChatBubble({ message, maxWidth }: { message: ChatMessage; maxWidth: number }) {
  const predictedHeight = useTextHeight(message.content, textStyle, maxWidth)
  const isUser = message.role === 'user'

  return (
    <View
      style={[
        styles.bubble,
        isUser ? styles.userBubble : styles.assistantBubble,
      ]}
    >
      <Markdown style={isUser ? mdStylesUser : mdStylesAssistant}>
        {message.content}
      </Markdown>
      {message.reactions && (
        <Text style={styles.reactions}>{message.reactions.join(' ')}</Text>
      )}
    </View>
  )
}

export default function ChatScreen() {
  const { width } = useWindowDimensions()
  const bubbleMaxWidth = width * 0.75
  const [messages] = useState<ChatMessage[]>(mockMessages)
  const [streamingText, setStreamingText] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)

  const startStreaming = useCallback(async () => {
    if (isStreaming) return
    setIsStreaming(true)
    const stream = mockStreamTokens(markdownSample)
    for await (const text of stream) {
      setStreamingText(text)
    }
    setStreamingText('')
    setIsStreaming(false)
  }, [isStreaming])

  const renderMessage = useCallback(
    ({ item }: { item: ChatMessage }) => (
      <ChatBubble message={item} maxWidth={bubbleMaxWidth} />
    ),
    [bubbleMaxWidth]
  )

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>
          {messages.length} messages | FlashList + expo-pretext
        </Text>
      </View>

      <FlashList
        data={messages}
        renderItem={renderMessage}
        estimatedItemSize={100}
        keyExtractor={msg => msg.id}
      />

      {streamingText !== '' && (
        <View style={[styles.bubble, styles.assistantBubble, styles.streamingBubble]}>
          <Markdown style={mdStylesAssistant}>{streamingText}</Markdown>
          <View style={styles.cursor} />
        </View>
      )}

      <Pressable style={styles.streamBtn} onPress={startStreaming} disabled={isStreaming}>
        <Text style={styles.streamBtnText}>
          {isStreaming ? 'Streaming...' : 'Simulate AI Response'}
        </Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    backgroundColor: '#e8e8e8',
  },
  headerText: { fontSize: 12, color: '#666', textAlign: 'center' },
  bubble: {
    padding: 12,
    borderRadius: 16,
    maxWidth: '80%',
    marginBottom: 8,
    marginHorizontal: 16,
  },
  userBubble: {
    backgroundColor: '#007AFF',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: '#fff',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  streamingBubble: {
    position: 'absolute',
    bottom: 80,
    left: 0,
  },
  reactions: { fontSize: 14, marginTop: 4 },
  cursor: {
    width: 2,
    height: 16,
    backgroundColor: '#007AFF',
    marginTop: 4,
  },
  streamBtn: {
    margin: 16,
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  streamBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
})
