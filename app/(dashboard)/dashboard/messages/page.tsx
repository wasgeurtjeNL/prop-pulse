"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { Icon } from "@iconify/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useChatWindows } from "@/components/shared/dashboard/chat-windows-manager";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Conversation {
  bookingId: string;
  guestName: string;
  guestEmail: string;
  propertyTitle: string;
  propertyId: string;
  status: string;
  checkIn: string;
  checkOut: string;
  lastMessage: {
    message: string;
    senderRole: string;
    createdAt: string;
  } | null;
  unreadCount: number;
  createdAt: string;
}

const statusColors: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200",
  CONFIRMED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200",
  CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200",
  COMPLETED: "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200",
};

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [newMessageIds, setNewMessageIds] = useState<Set<string>>(new Set());
  const { openChat, openWindows } = useChatWindows();
  const previousUnreadRef = useRef<Map<string, number>>(new Map());
  const isFirstLoad = useRef(true);

  // Play notification sound using Web Audio API (no file needed)
  const playNotificationSound = useCallback(() => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Create a simple "ding" sound
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(880, audioContext.currentTime); // A5 note
      oscillator.frequency.setValueAtTime(1108.73, audioContext.currentTime + 0.1); // C#6 note
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (e) {
      // Audio not supported, fail silently
    }
  }, []);

  const fetchConversations = async () => {
    try {
      const response = await fetch("/api/rental-bookings/conversations");
      if (response.ok) {
        const data = await response.json();
        const newConversations: Conversation[] = data.conversations || [];
        
        // Check for new messages (only after first load)
        if (!isFirstLoad.current) {
          const newlyReceivedIds = new Set<string>();
          
          newConversations.forEach((conv) => {
            const prevUnread = previousUnreadRef.current.get(conv.bookingId) || 0;
            
            // If unread count increased and last message is from customer
            if (conv.unreadCount > prevUnread && conv.lastMessage?.senderRole === "customer") {
              newlyReceivedIds.add(conv.bookingId);
              
              // Show toast notification
              toast.message(`New message from ${conv.guestName}`, {
                description: conv.lastMessage?.message?.substring(0, 50) + (conv.lastMessage?.message?.length > 50 ? "..." : ""),
                action: {
                  label: "Open Chat",
                  onClick: () => openChat({
                    bookingId: conv.bookingId,
                    guestName: conv.guestName,
                    propertyTitle: conv.propertyTitle,
                    unreadCount: conv.unreadCount,
                  }),
                },
                duration: 5000,
              });
            }
          });
          
          if (newlyReceivedIds.size > 0) {
            playNotificationSound();
            setNewMessageIds(prev => new Set([...prev, ...newlyReceivedIds]));
            
            // Remove the "new" highlight after 10 seconds
            setTimeout(() => {
              setNewMessageIds(prev => {
                const next = new Set(prev);
                newlyReceivedIds.forEach(id => next.delete(id));
                return next;
              });
            }, 10000);
          }
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
      console.error("Error fetching conversations:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 5000); // Refresh every 5 seconds for faster notifications
    return () => clearInterval(interval);
  }, []);

  const filteredConversations = conversations.filter((conv) => {
    const query = searchQuery.toLowerCase();
    return (
      conv.guestName.toLowerCase().includes(query) ||
      conv.guestEmail.toLowerCase().includes(query) ||
      conv.propertyTitle.toLowerCase().includes(query)
    );
  });

  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);
  const openBookingIds = openWindows.map((w) => w.bookingId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Icon icon="ph:spinner" className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <Icon icon="ph:chat-circle-text" className="w-7 h-7" />
            Messages
            {totalUnread > 0 && (
              <Badge className="bg-red-500 text-white text-sm px-2 py-0.5">
                {totalUnread} unread
              </Badge>
            )}
          </h1>
          <p className="text-muted-foreground">
            Manage all guest conversations in one place
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Icon icon="ph:magnifying-glass" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by guest name, email, or property..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Conversations Grid */}
      {filteredConversations.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Icon icon="ph:chat-circle" className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {searchQuery ? "No conversations found" : "No conversations yet"}
            </h3>
            <p className="text-muted-foreground">
              {searchQuery
                ? "Try adjusting your search query"
                : "Guest messages will appear here when they book a property"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filteredConversations.map((conv) => {
            const isOpen = openBookingIds.includes(conv.bookingId);
            const hasUnread = conv.unreadCount > 0;
            const isNewMessage = newMessageIds.has(conv.bookingId);
            
            return (
              <Card
                key={conv.bookingId}
                className={cn(
                  "cursor-pointer transition-all hover:shadow-md relative overflow-hidden",
                  hasUnread && "ring-2 ring-emerald-500/50 bg-emerald-50/30 dark:bg-emerald-900/10",
                  isNewMessage && "ring-2 ring-emerald-400 animate-pulse bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30",
                  isOpen && "ring-2 ring-blue-500"
                )}
                onClick={() =>
                  openChat({
                    bookingId: conv.bookingId,
                    guestName: conv.guestName,
                    propertyTitle: conv.propertyTitle,
                    unreadCount: conv.unreadCount,
                  })
                }
              >
                <CardContent className="p-4">
                  {/* NEW message indicator */}
                  {isNewMessage && (
                    <div className="absolute top-0 right-0 bg-emerald-500 text-white text-xs font-bold px-2 py-1 rounded-bl-lg animate-bounce">
                      NEW!
                    </div>
                  )}
                  
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 text-lg font-bold relative",
                      hasUnread 
                        ? "bg-emerald-600 text-white" 
                        : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300",
                      isNewMessage && "ring-4 ring-emerald-300 ring-offset-2"
                    )}>
                      {conv.guestName.charAt(0).toUpperCase()}
                      {/* Pulsing dot for new messages */}
                      {isNewMessage && (
                        <span className="absolute -top-1 -right-1 flex h-4 w-4">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500"></span>
                        </span>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2">
                          <h3 className={cn(
                            "font-semibold truncate",
                            hasUnread && "text-emerald-700 dark:text-emerald-300"
                          )}>
                            {conv.guestName}
                          </h3>
                          {hasUnread && (
                            <Badge className="bg-emerald-600 text-white text-xs px-1.5 py-0">
                              {conv.unreadCount}
                            </Badge>
                          )}
                          {isOpen && (
                            <Badge variant="outline" className="text-xs">
                              Open
                            </Badge>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground flex-shrink-0">
                          {conv.lastMessage
                            ? formatDistanceToNow(new Date(conv.lastMessage.createdAt), { addSuffix: true })
                            : format(new Date(conv.createdAt), "MMM d")}
                        </span>
                      </div>

                      <p className="text-sm text-muted-foreground truncate mb-2">
                        {conv.propertyTitle}
                      </p>

                      {/* Last message preview */}
                      {conv.lastMessage && (
                        <p className={cn(
                          "text-sm truncate",
                          hasUnread ? "font-medium text-slate-700 dark:text-slate-200" : "text-muted-foreground"
                        )}>
                          {conv.lastMessage.senderRole === "agent" ? (
                            <span className="text-emerald-600 mr-1">You:</span>
                          ) : (
                            <span className="text-primary font-medium mr-1">{conv.guestName}:</span>
                          )}
                          {conv.lastMessage.message}
                        </p>
                      )}

                      {/* Status & dates */}
                      <div className="flex items-center gap-3 mt-2">
                        <Badge variant="outline" className={statusColors[conv.status]}>
                          {conv.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(conv.checkIn), "MMM d")} - {format(new Date(conv.checkOut), "MMM d")}
                        </span>
                      </div>
                    </div>

                    {/* Open button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="flex-shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        openChat({
                          bookingId: conv.bookingId,
                          guestName: conv.guestName,
                          propertyTitle: conv.propertyTitle,
                          unreadCount: conv.unreadCount,
                        });
                      }}
                    >
                      <Icon icon="ph:chat-circle-text" className="w-5 h-5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

