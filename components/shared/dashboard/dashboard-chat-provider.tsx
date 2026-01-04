"use client";

import { ChatWindowsProvider } from "./chat-windows-manager";

export default function DashboardChatProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ChatWindowsProvider>{children}</ChatWindowsProvider>;
}







