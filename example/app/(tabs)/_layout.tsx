import { Tabs } from 'expo-router'

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: '#007AFF' }}>
      <Tabs.Screen name="chat" options={{ title: 'AI Chat' }} />
      <Tabs.Screen name="masonry" options={{ title: 'Masonry' }} />
      <Tabs.Screen name="rich-note" options={{ title: 'Rich Note' }} />
      <Tabs.Screen name="i18n" options={{ title: 'i18n' }} />
      <Tabs.Screen name="accuracy" options={{ title: 'Accuracy' }} />
    </Tabs>
  )
}
