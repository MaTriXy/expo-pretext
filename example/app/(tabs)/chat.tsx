import { useState, useCallback } from 'react'
import { View, Text, StyleSheet, useWindowDimensions, Pressable, ScrollView } from 'react-native'
import { FlashList } from '@shopify/flash-list'
import { mockMessages, mockStreamTokens, type ChatMessage } from '../../data/mock-messages'
import { markdownSample } from '../../data/sample-texts'
import { useTextHeight } from 'expo-pretext'

const textStyle = { fontFamily: 'System', fontSize: 16, lineHeight: 24 }

function ChatBubble({ message, maxWidth }: { message: ChatMessage; maxWidth: number }) {
  const predictedHeight = useTextHeight(message.content, textStyle, maxWidth)

  return (
    <View
      style={[
        styles.bubble,
        message.role === 'user' ? styles.userBubble : styles.assistantBubble,
      ]}
    >
      <Text style={styles.messageText}>{message.content}</Text>
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
        estimatedItemSize={80}
        keyExtractor={msg => msg.id}
      />

      {streamingText !== '' && (
        <View style={[styles.bubble, styles.assistantBubble, styles.streamingBubble]}>
          <Text style={styles.messageText}>{streamingText}</Text>
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
  messageText: { fontSize: 16, lineHeight: 24 },
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
