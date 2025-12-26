"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Icon } from "@iconify/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ChatWindow from "./chat-window";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export interface ChatWindowData {
  bookingId: string;
  guestName: string;
  propertyTitle: string;
  unreadCount?: number;
}

interface OpenWindow extends ChatWindowData {
  position: { x: number; y: number };
  isMinimized: boolean;
  zIndex: number;
  hasNewMessage?: boolean;
}

interface Conversation {
  bookingId: string;
  guestName: string;
  propertyTitle: string;
  unreadCount: number;
  lastMessage?: {
    message: string;
    senderRole: string;
    createdAt: string;
  } | null;
}

interface ChatWindowsManagerProps {
  children?: React.ReactNode;
}

// Create a context to share the openChat function
import { createContext, useContext } from "react";

interface ChatContextType {
  openChat: (data: ChatWindowData) => void;
  openWindows: OpenWindow[];
  conversations: Conversation[];
  totalUnread: number;
}

const ChatContext = createContext<ChatContextType | null>(null);

export const useChatWindows = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChatWindows must be used within ChatWindowsProvider");
  }
  return context;
};

export function ChatWindowsProvider({ children }: ChatWindowsManagerProps) {
  const [windows, setWindows] = useState<OpenWindow[]>([]);
  const [nextZIndex, setNextZIndex] = useState(1);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [showTaskbar, setShowTaskbar] = useState(true);
  const previousUnreadRef = useRef<Map<string, number>>(new Map());
  const isFirstLoad = useRef(true);

  // Fetch conversations for the taskbar
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const response = await fetch("/api/rental-bookings/conversations");
        if (response.ok) {
          const data = await response.json();
          const newConversations: Conversation[] = data.conversations || [];
          
          // Check for new messages (only after first load)
          if (!isFirstLoad.current) {
            newConversations.forEach((conv) => {
              const prevUnread = previousUnreadRef.current.get(conv.bookingId) || 0;
              
              if (conv.unreadCount > prevUnread && conv.lastMessage?.senderRole === "customer") {
                // Mark window as having new message
                setWindows((prev) =>
                  prev.map((w) =>
                    w.bookingId === conv.bookingId ? { ...w, hasNewMessage: true } : w
                  )
                );
                
                // Play notification sound
                playNotificationSound();
                
                // Show toast if window not open or minimized
                const existingWindow = windows.find((w) => w.bookingId === conv.bookingId);
                if (!existingWindow || existingWindow.isMinimized) {
                  toast.message(`New message from ${conv.guestName}`, {
                    description: conv.lastMessage?.message?.substring(0, 50) + 
                      (conv.lastMessage?.message && conv.lastMessage.message.length > 50 ? "..." : ""),
                    duration: 5000,
                  });
                }
              }
            });
          }
          
          // Update previous unread counts
          const newPrevMap = new Map<string, number>();
          newConversations.forEach((conv) => {
            newPrevMap.set(conv.bookingId, conv.unreadCount);
          });
          previousUnreadRef.current = newPrevMap;
          
          isFirstLoad.current = false;
          setConversations(newConversations);
        }
      } catch (error) {
        console.error("Error fetching conversations for taskbar:", error);
      }
    };

    fetchConversations();
    const interval = setInterval(fetchConversations, 5000);
    return () => clearInterval(interval);
  }, [windows]);

  // Play notification sound
  const playNotificationSound = useCallback(() => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(1108.73, audioContext.currentTime + 0.1);
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (e) {}
  }, []);

  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

  const openChat = useCallback((data: ChatWindowData) => {
    setWindows((prev) => {
      // Check if window already exists
      const existingIndex = prev.findIndex((w) => w.bookingId === data.bookingId);
      
      if (existingIndex !== -1) {
        // If exists, bring to front, unminimize, and clear new message flag
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          isMinimized: false,
          zIndex: nextZIndex,
          hasNewMessage: false,
        };
        setNextZIndex((z) => z + 1);
        return updated;
      }

      // Calculate position for new window (cascade)
      const offset = (prev.length % 5) * 30;
      const baseX = 100 + offset;
      const baseY = 100 + offset;

      // Add new window
      setNextZIndex((z) => z + 1);
      return [
        ...prev,
        {
          ...data,
          position: { x: baseX, y: baseY },
          isMinimized: false,
          zIndex: nextZIndex,
          hasNewMessage: false,
        },
      ];
    });
  }, [nextZIndex]);

  const closeWindow = useCallback((bookingId: string) => {
    setWindows((prev) => prev.filter((w) => w.bookingId !== bookingId));
  }, []);

  const minimizeWindow = useCallback((bookingId: string) => {
    setWindows((prev) =>
      prev.map((w) =>
        w.bookingId === bookingId ? { ...w, isMinimized: true } : w
      )
    );
  }, []);

  const restoreWindow = useCallback((bookingId: string) => {
    setWindows((prev) =>
      prev.map((w) =>
        w.bookingId === bookingId
          ? { ...w, isMinimized: false, zIndex: nextZIndex, hasNewMessage: false }
          : w
      )
    );
    setNextZIndex((z) => z + 1);
  }, [nextZIndex]);

  const focusWindow = useCallback((bookingId: string) => {
    setWindows((prev) =>
      prev.map((w) =>
        w.bookingId === bookingId ? { ...w, zIndex: nextZIndex } : w
      )
    );
    setNextZIndex((z) => z + 1);
  }, [nextZIndex]);

  const updatePosition = useCallback(
    (bookingId: string, position: { x: number; y: number }) => {
      setWindows((prev) =>
        prev.map((w) => (w.bookingId === bookingId ? { ...w, position } : w))
      );
    },
    []
  );

  const minimizedWindows = windows.filter((w) => w.isMinimized);
  const conversationsWithUnread = conversations.filter((c) => c.unreadCount > 0);
  const openBookingIds = windows.filter(w => !w.isMinimized).map((w) => w.bookingId);

  return (
    <ChatContext.Provider value={{ openChat, openWindows: windows, conversations, totalUnread }}>
      {children}

      {/* Render all open windows */}
      {windows.map((window) => (
        <ChatWindow
          key={window.bookingId}
          bookingId={window.bookingId}
          guestName={window.guestName}
          propertyTitle={window.propertyTitle}
          onClose={() => closeWindow(window.bookingId)}
          onMinimize={() => minimizeWindow(window.bookingId)}
          isMinimized={window.isMinimized}
          position={window.position}
          onPositionChange={(pos) => updatePosition(window.bookingId, pos)}
          zIndex={window.zIndex}
          onFocus={() => focusWindow(window.bookingId)}
        />
      ))}

      {/* MSN-style Taskbar - Always visible when there are conversations */}
      {conversations.length > 0 && (
        <div className="fixed bottom-0 left-64 right-0 z-[2000]">
          {/* Taskbar toggle button */}
          <button
            onClick={() => setShowTaskbar(!showTaskbar)}
            className={cn(
              "absolute -top-8 right-4 px-3 py-1 rounded-t-lg text-xs font-medium transition-all",
              totalUnread > 0 
                ? "bg-blue-500 text-white animate-pulse" 
                : "bg-slate-700 text-slate-300 hover:bg-slate-600"
            )}
          >
            <div className="flex items-center gap-2">
              <Icon icon="ph:chat-circle-text" className="w-4 h-4" />
              <span>Messages</span>
              {totalUnread > 0 && (
                <Badge className="bg-white text-blue-600 text-[10px] px-1.5 py-0 h-4 min-w-4 flex items-center justify-center">
                  {totalUnread}
                </Badge>
              )}
              <Icon 
                icon={showTaskbar ? "ph:caret-down" : "ph:caret-up"} 
                className="w-3 h-3" 
              />
            </div>
          </button>

          {/* Taskbar content */}
          {showTaskbar && (
            <div className="bg-slate-800 border-t border-slate-700 px-3 py-2">
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {/* Minimized windows */}
                {minimizedWindows.map((window) => {
                  const conv = conversations.find(c => c.bookingId === window.bookingId);
                  const unread = conv?.unreadCount || 0;
                  
                  return (
                    <button
                      key={window.bookingId}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all",
                        "bg-slate-700 hover:bg-slate-600 text-white",
                        unread > 0 && "ring-2 ring-blue-400 bg-blue-900/50",
                        window.hasNewMessage && "animate-bounce"
                      )}
                      onClick={() => restoreWindow(window.bookingId)}
                    >
                      <div className="relative">
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                          unread > 0 ? "bg-blue-500" : "bg-slate-600"
                        )}>
                          {window.guestName.charAt(0).toUpperCase()}
                        </div>
                        {unread > 0 && (
                          <span className="absolute -top-1 -right-1 flex h-4 w-4">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-4 w-4 bg-blue-500 text-[10px] items-center justify-center text-white font-bold">
                              {unread}
                            </span>
                          </span>
                        )}
                      </div>
                      <div className="text-left max-w-[120px]">
                        <div className="font-medium truncate">{window.guestName}</div>
                        <div className="text-[10px] text-slate-400 truncate">Minimized</div>
                      </div>
                    </button>
                  );
                })}

                {/* Separator */}
                {minimizedWindows.length > 0 && conversationsWithUnread.length > 0 && (
                  <div className="w-px h-10 bg-slate-600 mx-1" />
                )}

                {/* Unread conversations not yet opened */}
                {conversationsWithUnread
                  .filter((conv) => !windows.some(w => w.bookingId === conv.bookingId))
                  .map((conv) => (
                    <button
                      key={conv.bookingId}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all",
                        "bg-blue-600 hover:bg-blue-500 text-white",
                        "ring-2 ring-blue-400 animate-pulse"
                      )}
                      onClick={() => openChat({
                        bookingId: conv.bookingId,
                        guestName: conv.guestName,
                        propertyTitle: conv.propertyTitle,
                        unreadCount: conv.unreadCount,
                      })}
                    >
                      <div className="relative">
                        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">
                          {conv.guestName.charAt(0).toUpperCase()}
                        </div>
                        <span className="absolute -top-1 -right-1 flex h-5 w-5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-5 w-5 bg-white text-blue-600 text-[10px] items-center justify-center font-bold">
                            {conv.unreadCount}
                          </span>
                        </span>
                      </div>
                      <div className="text-left max-w-[150px]">
                        <div className="font-medium truncate">{conv.guestName}</div>
                        <div className="text-[10px] text-blue-200 truncate">
                          {conv.lastMessage?.message?.substring(0, 30)}...
                        </div>
                      </div>
                    </button>
                  ))}

                {/* Open windows indicator */}
                {openBookingIds.length > 0 && (
                  <>
                    <div className="w-px h-10 bg-slate-600 mx-1" />
                    <div className="text-xs text-slate-400 px-2 flex items-center gap-1">
                      <Icon icon="ph:chat-circle-text" className="w-4 h-4" />
                      {openBookingIds.length} open
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </ChatContext.Provider>
  );
}

