export type ChatTheme = {
  bodyStyle: { fontFamily: string; fontSize: number; lineHeight: number }
  boldStyle: { fontFamily: string; fontSize: number; lineHeight: number; fontWeight: '700' }
  codeStyle: { fontFamily: string; fontSize: number; lineHeight: number }
  bubblePadding: number
  codePadding: number
  blockSpacing: number
  itemPadding: number
  avatarSize: number
  avatarGap: number
  screenPadding: number
  timestampHeight: number
  reactionRowHeight: number
}

export const chatTheme: ChatTheme = {
  bodyStyle: { fontFamily: 'Inter', fontSize: 16, lineHeight: 24 },
  boldStyle: { fontFamily: 'Inter', fontSize: 16, lineHeight: 24, fontWeight: '700' },
  codeStyle: { fontFamily: 'JetBrainsMono', fontSize: 14, lineHeight: 20 },
  bubblePadding: 12,
  codePadding: 8,
  blockSpacing: 8,
  itemPadding: 4,
  avatarSize: 32,
  avatarGap: 8,
  screenPadding: 16,
  timestampHeight: 18,
  reactionRowHeight: 28,
}
