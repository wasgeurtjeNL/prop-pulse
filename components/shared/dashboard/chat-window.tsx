"use client";

import { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { Icon } from "@iconify/react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  senderId: string;
  senderRole: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

interface ChatWindowProps {
  bookingId: string;
  guestName: string;
  propertyTitle: string;
  onClose: () => void;
  onMinimize: () => void;
  isMinimized: boolean;
  position: { x: number; y: number };
  onPositionChange: (pos: { x: number; y: number }) => void;
  zIndex: number;
  onFocus: () => void;
}

export default function ChatWindow({
  bookingId,
  guestName,
  propertyTitle,
  onClose,
  onMinimize,
  isMinimized,
  position,
  onPositionChange,
  zIndex,
  onFocus,
}: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const windowRef = useRef<HTMLDivElement>(null);

  // Mark messages as read
  const markMessagesAsRead = async () => {
    try {
      await fetch(`/api/rental-bookings/${bookingId}/messages/mark-read`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  };

  // Fetch messages
  const fetchMessages = async () => {
    try {
      const response = await fetch(`/api/rental-bookings/${bookingId}/messages`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  useEffect(() => {
    // Mark messages as read when chat is opened
    markMessagesAsRead();
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, [bookingId]);

  // Scroll to bottom when messages change or on initial load
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  
  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  // Scroll to bottom whenever messages change
  useEffect(() => {
    // Small delay to ensure DOM is updated
    setTimeout(scrollToBottom, 50);
  }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    
    try {
      setIsSending(true);
      const response = await fetch(`/api/rental-bookings/${bookingId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: newMessage, senderRole: "agent" }),
      });
      
      if (response.ok) {
        setNewMessage("");
        fetchMessages();
      }
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsSending(false);
    }
  };

  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button, textarea, input")) return;
    
    onFocus();
    setIsDragging(true);
    const rect = windowRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      
      const newX = Math.max(0, Math.min(window.innerWidth - 350, e.clientX - dragOffset.x));
      const newY = Math.max(0, Math.min(window.innerHeight - 100, e.clientY - dragOffset.y));
      
      onPositionChange({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, dragOffset, onPositionChange]);

  if (isMinimized) {
    return null; // Minimized windows are rendered in the taskbar
  }

  return (
    <div
      ref={windowRef}
      className={cn(
        "fixed bg-white dark:bg-slate-900 rounded-lg shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden",
        isDragging && "cursor-grabbing select-none"
      )}
      style={{
        left: position.x,
        top: position.y,
        width: 340,
        height: 450,
        zIndex: zIndex + 1000,
      }}
      onMouseDown={onFocus}
    >
      {/* Header - Draggable */}
      <div
        className="bg-gradient-to-r from-blue-700 to-blue-600 text-white px-3 py-2 flex items-center justify-between cursor-grab active:cursor-grabbing flex-shrink-0"
        onMouseDown={handleMouseDown}
      >
        <div className="flex-1 min-w-0 mr-2">
          <p className="font-medium text-sm truncate">{guestName}</p>
          <p className="text-xs text-white/80 truncate">{propertyTitle}</p>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-white hover:bg-white/20"
            onClick={(e) => {
              e.stopPropagation();
              onMinimize();
            }}
          >
            <Icon icon="ph:minus-bold" className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-white hover:bg-red-500"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
          >
            <Icon icon="ph:x-bold" className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-3 min-h-0 bg-slate-50 dark:bg-slate-800/50"
      >
        <div className="flex flex-col justify-end min-h-full">
          <div className="space-y-2">
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground py-6">
                <Icon icon="ph:chat-circle-dots" className="w-10 h-10 mx-auto mb-2 opacity-40" />
                <p className="text-xs">No messages yet</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.senderRole === "agent" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={cn(
                      "max-w-[85%] rounded-xl px-3 py-1.5 text-sm",
                      msg.senderRole === "agent"
                        ? "bg-blue-700 text-white rounded-br-sm"
                        : "bg-white dark:bg-slate-700 shadow-sm rounded-bl-sm"
                    )}
                  >
                    {/* Show customer name for customer messages */}
                    {msg.senderRole === "customer" && (
                      <p className="text-[10px] font-medium text-blue-700 dark:text-blue-400 mb-0.5">
                        {guestName}
                      </p>
                    )}
                    <p className="break-words">{msg.message}</p>
                    <p className={cn(
                      "text-[10px] mt-0.5",
                      msg.senderRole === "agent" ? "text-white/70" : "text-muted-foreground"
                    )}>
                      {format(new Date(msg.createdAt), "HH:mm")}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Input */}
      <div className="p-2 border-t bg-white dark:bg-slate-900 flex-shrink-0">
        <div className="flex gap-2">
          <Textarea
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            className="min-h-[40px] max-h-[80px] resize-none text-sm py-2"
          />
          <Button
            onClick={sendMessage}
            disabled={isSending || !newMessage.trim()}
            size="icon"
            className="h-10 w-10 flex-shrink-0 bg-blue-700 hover:bg-blue-800"
          >
            {isSending ? (
              <Icon icon="ph:spinner" className="w-4 h-4 animate-spin" />
            ) : (
              <Icon icon="ph:paper-plane-right-fill" className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

