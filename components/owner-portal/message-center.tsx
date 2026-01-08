"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Loader2,
  MessageCircle,
  Plus,
  Send,
  ArrowLeft,
  User,
  Building2,
  Clock,
  Mail,
} from "lucide-react";
import { getOwnerPortalTranslations, OwnerPortalLanguage } from "@/lib/i18n/owner-portal-translations";

interface MessageCenterProps {
  lang: OwnerPortalLanguage;
  properties: { id: string; title: string; listingNumber: string | null }[];
}

interface Message {
  id: string;
  subject: string | null;
  message: string;
  senderType: "OWNER" | "AGENT" | "SYSTEM";
  isFromMe: boolean;
  isRead: boolean;
  property: {
    id: string;
    title: string;
    listingNumber: string | null;
  } | null;
  replyCount: number;
  createdAt: string;
  lastReply: {
    message: string;
    createdAt: string;
    senderType: string;
  } | null;
}

interface MessageThread {
  id: string;
  subject: string | null;
  message: string;
  senderType: string;
  isFromMe: boolean;
  isRead: boolean;
  property: {
    id: string;
    title: string;
    listingNumber: string | null;
    image: string | null;
  } | null;
  createdAt: string;
  replies: {
    id: string;
    message: string;
    senderType: string;
    isFromMe: boolean;
    isRead: boolean;
    createdAt: string;
  }[];
}

export default function MessageCenter({ lang, properties }: MessageCenterProps) {
  const t = getOwnerPortalTranslations(lang);
  const [messages, setMessages] = useState<Message[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // New message modal
  const [newMessageOpen, setNewMessageOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [messageText, setMessageText] = useState("");
  const [selectedPropertyId, setSelectedPropertyId] = useState("");

  // Thread view
  const [selectedThread, setSelectedThread] = useState<MessageThread | null>(null);
  const [threadLoading, setThreadLoading] = useState(false);
  const [replyText, setReplyText] = useState("");

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/owner-portal/messages");
      const data = await response.json();

      if (response.ok) {
        setMessages(data.messages || []);
        setUnreadCount(data.unreadCount || 0);
      } else {
        toast.error(data.error || t.failedToLoadMessages);
      }
    } catch (error) {
      toast.error(t.failedToLoadMessages);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim()) {
      toast.error(t.typeMessage);
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch("/api/owner-portal/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: subject || null,
          message: messageText,
          propertyId: selectedPropertyId || null,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(t.messageSent);
        setNewMessageOpen(false);
        setSubject("");
        setMessageText("");
        setSelectedPropertyId("");
        fetchMessages();
      } else {
        toast.error(data.error || t.failedToSendMessage);
      }
    } catch (error) {
      toast.error(t.failedToSendMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewThread = async (messageId: string) => {
    try {
      setThreadLoading(true);
      const response = await fetch(`/api/owner-portal/messages/${messageId}`);
      const data = await response.json();

      if (response.ok) {
        setSelectedThread(data.message);
        // Update local messages to mark as read
        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId ? { ...m, isRead: true } : m
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } else {
        toast.error(data.error || "Failed to load message");
      }
    } catch (error) {
      toast.error("Failed to load message");
    } finally {
      setThreadLoading(false);
    }
  };

  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedThread) return;

    try {
      setSubmitting(true);
      const response = await fetch(`/api/owner-portal/messages/${selectedThread.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: replyText }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(t.replySent);
        setReplyText("");
        // Refresh thread
        handleViewThread(selectedThread.id);
        fetchMessages();
      } else {
        toast.error(data.error || t.failedToSendMessage);
      }
    } catch (error) {
      toast.error(t.failedToSendMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString(lang === "nl" ? "nl-NL" : "en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (diffDays === 1) {
      return lang === "nl" ? "Gisteren" : "Yesterday";
    } else if (diffDays < 7) {
      return date.toLocaleDateString(lang === "nl" ? "nl-NL" : "en-US", {
        weekday: "short",
      });
    } else {
      return date.toLocaleDateString(lang === "nl" ? "nl-NL" : "en-US", {
        day: "numeric",
        month: "short",
      });
    }
  };

  const getSenderLabel = (senderType: string, isFromMe: boolean) => {
    if (isFromMe) return t.fromYou;
    if (senderType === "AGENT") return t.fromAgent;
    if (senderType === "SYSTEM") return t.systemMessage;
    return senderType;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Thread View
  if (selectedThread) {
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          onClick={() => setSelectedThread(null)}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to messages
        </Button>

        <Card>
          <CardHeader className="border-b">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-lg">
                  {selectedThread.subject || "No subject"}
                </CardTitle>
                {selectedThread.property && (
                  <CardDescription className="flex items-center gap-1 mt-1">
                    <Building2 className="h-3 w-3" />
                    {selectedThread.property.title} ({selectedThread.property.listingNumber})
                  </CardDescription>
                )}
              </div>
              <span className="text-xs text-muted-foreground">
                {formatDate(selectedThread.createdAt)}
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[400px]">
              <div className="p-4 space-y-4">
                {/* Original message */}
                <div
                  className={`flex ${
                    selectedThread.isFromMe ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-4 ${
                      selectedThread.isFromMe
                        ? "bg-primary text-white"
                        : "bg-muted"
                    }`}
                  >
                    <p className="text-sm">{selectedThread.message}</p>
                    <span className="text-xs opacity-70 mt-2 block">
                      {getSenderLabel(selectedThread.senderType, selectedThread.isFromMe)}
                    </span>
                  </div>
                </div>

                {/* Replies */}
                {selectedThread.replies.map((reply) => (
                  <div
                    key={reply.id}
                    className={`flex ${
                      reply.isFromMe ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-4 ${
                        reply.isFromMe ? "bg-primary text-white" : "bg-muted"
                      }`}
                    >
                      <p className="text-sm">{reply.message}</p>
                      <span className="text-xs opacity-70 mt-2 block">
                        {getSenderLabel(reply.senderType, reply.isFromMe)} •{" "}
                        {formatDate(reply.createdAt)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Reply Input */}
            <div className="border-t p-4">
              <div className="flex gap-2">
                <Textarea
                  placeholder={t.replyPlaceholder}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="flex-1 min-h-[60px]"
                />
                <Button
                  onClick={handleSendReply}
                  disabled={submitting || !replyText.trim()}
                  className="self-end"
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Messages List View
  return (
    <div className="space-y-6">
      {/* Header with New Message button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            {t.messagesTitle}
            {unreadCount > 0 && (
              <Badge className="bg-red-500">{unreadCount} {t.unreadMessages}</Badge>
            )}
          </h3>
          <p className="text-sm text-muted-foreground">{t.messagesSubtitle}</p>
        </div>
        <Button onClick={() => setNewMessageOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          {t.newMessage}
        </Button>
      </div>

      {/* Messages List */}
      {messages.length > 0 ? (
        <div className="space-y-3">
          {messages.map((message) => (
            <Card
              key={message.id}
              className={`cursor-pointer hover:bg-muted/50 transition-colors ${
                !message.isRead && !message.isFromMe ? "border-l-4 border-l-primary" : ""
              }`}
              onClick={() => handleViewThread(message.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-full ${message.isFromMe ? "bg-primary/10" : "bg-muted"}`}>
                      {message.isFromMe ? (
                        <User className="h-4 w-4 text-primary" />
                      ) : (
                        <Mail className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">
                        {message.subject || (message.isFromMe ? "Your message" : "Message from Agent")}
                      </p>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {message.lastReply?.message || message.message}
                      </p>
                      {message.property && (
                        <Badge variant="outline" className="mt-2 text-xs">
                          <Building2 className="h-3 w-3 mr-1" />
                          {message.property.listingNumber || message.property.title}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDate(message.lastReply?.createdAt || message.createdAt)}
                    </span>
                    {message.replyCount > 0 && (
                      <Badge variant="secondary" className="mt-1">
                        {message.replyCount} {message.replyCount === 1 ? "reply" : "replies"}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <MessageCircle className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <h3 className="text-lg font-medium mt-4">{t.noMessages}</h3>
            <p className="text-muted-foreground mt-2">
              Start a conversation with your property management team.
            </p>
            <Button onClick={() => setNewMessageOpen(true)} className="mt-4">
              <Plus className="h-4 w-4 mr-2" />
              {t.newMessage}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* New Message Modal */}
      <Dialog open={newMessageOpen} onOpenChange={setNewMessageOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{t.newMessage}</DialogTitle>
            <DialogDescription>{t.messagesSubtitle}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t.selectProperty}</Label>
              <Select value={selectedPropertyId || "general"} onValueChange={(val) => setSelectedPropertyId(val === "general" ? "" : val)}>
                <SelectTrigger>
                  <SelectValue placeholder={t.allProperties} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">{t.allProperties}</SelectItem>
                  {properties.map((prop) => (
                    <SelectItem key={prop.id} value={prop.id}>
                      {prop.listingNumber || prop.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">{t.messageSubject}</Label>
              <Input
                id="subject"
                placeholder={t.subjectPlaceholder}
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">{t.sendMessage} *</Label>
              <Textarea
                id="message"
                placeholder={t.typeMessage}
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                className="min-h-[120px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setNewMessageOpen(false)}
              disabled={submitting}
            >
              {t.cancel}
            </Button>
            <Button
              onClick={handleSendMessage}
              disabled={submitting || !messageText.trim()}
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              {t.sendMessage}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
