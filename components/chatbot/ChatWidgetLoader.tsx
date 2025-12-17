'use client';

import dynamic from 'next/dynamic';

// Lazy load ChatWidget - not critical for initial page render
// Contains framer-motion which is a heavy dependency
const ChatWidget = dynamic(
  () => import('./ChatWidget').then(mod => ({ default: mod.ChatWidget })),
  { ssr: false }
);

export default function ChatWidgetLoader() {
  return <ChatWidget />;
}



