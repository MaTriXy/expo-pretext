import { sampleTexts, markdownSample } from './sample-texts'

export type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  status: 'streaming' | 'complete'
  reactions?: string[]
}

const baseMessages: ChatMessage[] = [
  {
    id: '1',
    role: 'user',
    content: 'What is React Native?',
    timestamp: Date.now() - 60000,
    status: 'complete',
  },
  {
    id: '2',
    role: 'assistant',
    content: markdownSample,
    timestamp: Date.now() - 55000,
    status: 'complete',
    reactions: ['👍'],
  },
  {
    id: '3',
    role: 'user',
    content: 'Can you explain it in different languages?',
    timestamp: Date.now() - 50000,
    status: 'complete',
  },
  {
    id: '4',
    role: 'assistant',
    content: Object.values(sampleTexts).join('\n\n'),
    timestamp: Date.now() - 45000,
    status: 'complete',
  },
]

const generated: ChatMessage[] = Array.from({ length: 996 }, (_, i) => {
  const texts = Object.values(sampleTexts)
  return {
    id: String(i + 5),
    role: (i % 2 === 0 ? 'user' : 'assistant') as 'user' | 'assistant',
    content: texts[i % texts.length]!,
    timestamp: Date.now() - (44000 - i * 40),
    status: 'complete' as const,
  }
})

export const mockMessages: ChatMessage[] = [...baseMessages, ...generated]

export async function* mockStreamTokens(
  fullText: string
): AsyncGenerator<string> {
  const words = fullText.split(/(?<=\s)/)
  let accumulated = ''
  for (const word of words) {
    accumulated += word
    yield accumulated
    await new Promise(r => setTimeout(r, 30 + Math.random() * 40))
  }
}
