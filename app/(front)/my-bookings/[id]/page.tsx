"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import { Icon } from "@iconify/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { toast } from "sonner";
import { formatRentalPrice } from "@/lib/services/rental-pricing";
import { useCurrencyExchange } from "@/hooks/use-currency-exchange";
import { authClient } from "@/lib/auth-client";

interface Booking {
  id: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  adults: number;
  children: number;
  babies: number;
  pets: number;
  basePrice: number;
  totalPrice: number;
  season: string;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  guestCountryCode: string;
  guestMessage: string | null;
  createdAt: string;
  confirmedAt: string | null;
  checkInTime: string | null;
  checkOutTime: string | null;
  propertyAddress: string | null;
  propertyInstructions: string | null;
  wifiName: string | null;
  wifiPassword: string | null;
  accessCode: string | null;
  emergencyContact: string | null;
  houseRules: string | null;
  property: {
    id: string;
    title: string;
    slug: string;
    provinceSlug: string | null;
    areaSlug: string | null;
    location: string;
    images: { url: string }[];
  } | null;
}

interface Message {
  id: string;
  senderId: string;
  senderRole: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

const statusConfig: Record<string, { color: string; bgColor: string; icon: string; label: string }> = {
  PENDING: { 
    color: "text-amber-700 dark:text-amber-300",
    bgColor: "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800",
    icon: "ph:clock",
    label: "Pending Confirmation"
  },
  CONFIRMED: { 
    color: "text-blue-700 dark:text-blue-300",
    bgColor: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800",
    icon: "ph:check-circle",
    label: "Confirmed"
  },
  CANCELLED: { 
    color: "text-red-700 dark:text-red-300",
    bgColor: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800",
    icon: "ph:x-circle",
    label: "Cancelled"
  },
  COMPLETED: { 
    color: "text-blue-700 dark:text-blue-300",
    bgColor: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800",
    icon: "ph:check-circle-fill",
    label: "Completed"
  },
};

export default function BookingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params.id as string;
  
  const [booking, setBooking] = useState<Booking | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  
  const { data: session } = authClient.useSession();
  const { formatMultiPrice, isLoading: currencyLoading } = useCurrencyExchange();

  useEffect(() => {
    if (session?.user) {
      fetchBooking();
      fetchMessages();
      
      // Poll for new messages every 10 seconds
      const interval = setInterval(fetchMessages, 10000);
      return () => clearInterval(interval);
    }
  }, [bookingId, session]);

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  
  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  // Scroll to bottom whenever messages change (including initial load)
  useEffect(() => {
    // Small delay to ensure DOM is updated
    setTimeout(scrollToBottom, 50);
  }, [messages]);

  const fetchBooking = async () => {
    try {
      const response = await fetch(`/api/rental-bookings/${bookingId}`);
      if (!response.ok) {
        if (response.status === 404) {
          router.push("/my-bookings");
          return;
        }
        throw new Error("Failed to fetch booking");
      }
      const data = await response.json();
      setBooking(data.booking);
    } catch (error) {
      console.error("Error fetching booking:", error);
      toast.error("Failed to load booking details");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const response = await fetch(`/api/rental-bookings/${bookingId}/messages`);
      if (!response.ok) return;
      const data = await response.json();
      setMessages(data.messages || []);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    
    try {
      setIsSending(true);
      const response = await fetch(`/api/rental-bookings/${bookingId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: newMessage }),
      });
      
      if (!response.ok) throw new Error("Failed to send message");
      
      setNewMessage("");
      fetchMessages();
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  const formatGuests = () => {
    if (!booking) return "";
    const parts = [];
    if (booking.adults > 0) parts.push(`${booking.adults} adult${booking.adults > 1 ? "s" : ""}`);
    if (booking.children > 0) parts.push(`${booking.children} child${booking.children > 1 ? "ren" : ""}`);
    if (booking.babies > 0) parts.push(`${booking.babies} infant${booking.babies > 1 ? "s" : ""}`);
    if (booking.pets > 0) parts.push(`${booking.pets} pet${booking.pets > 1 ? "s" : ""}`);
    return parts.join(", ");
  };

  const getPropertyUrl = () => {
    if (!booking?.property) return "#";
    const { provinceSlug, areaSlug, slug } = booking.property;
    if (provinceSlug && areaSlug) {
      return `/properties/${provinceSlug}/${areaSlug}/${slug}`;
    }
    return `/listings/${slug}`;
  };

  if (!session?.user) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <Icon icon="ph:sign-in" className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold mb-4">Please sign in</h2>
        <p className="text-muted-foreground mb-6">You need to be logged in to view your booking.</p>
        <Button asChild>
          <Link href="/sign-in?callbackUrl=/my-bookings">Sign In</Link>
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-16 flex items-center justify-center">
        <Icon icon="ph:spinner" className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <Icon icon="ph:warning-circle" className="w-16 h-16 mx-auto text-yellow-500 mb-4" />
        <h2 className="text-2xl font-bold mb-4">Booking not found</h2>
        <Button asChild>
          <Link href="/my-bookings">Back to My Trips</Link>
        </Button>
      </div>
    );
  }

  const status = statusConfig[booking.status];
  const checkIn = new Date(booking.checkIn);
  const checkOut = new Date(booking.checkOut);
  const propertyImage = booking.property?.images?.[0]?.url;

  return (
    <div className="bg-slate-50 dark:bg-slate-950 min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Back Button */}
        <Button variant="ghost" size="sm" asChild className="mb-6">
          <Link href="/my-bookings">
            <Icon icon="ph:arrow-left" className="w-4 h-4 mr-2" />
            Back to My Trips
          </Link>
        </Button>

        {/* Status Banner */}
        <div className={`rounded-xl p-6 mb-6 border ${status.bgColor}`}>
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-full ${status.color} bg-white dark:bg-slate-800`}>
              <Icon icon={status.icon} className="w-8 h-8" />
            </div>
            <div className="flex-1">
              <h2 className={`text-xl font-bold ${status.color}`}>{status.label}</h2>
              
              {/* Status-specific messages */}
              {booking.status === "PENDING" && (
                <div className="mt-3 space-y-2 text-slate-700 dark:text-slate-300">
                  <p className="font-medium">What happens next?</p>
                  <ul className="text-sm space-y-1.5">
                    <li className="flex items-start gap-2">
                      <Icon icon="ph:number-circle-one" className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <span>Our team is reviewing your booking request (usually within 24 hours)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Icon icon="ph:number-circle-two" className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <span>We'll verify property availability with the owner</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Icon icon="ph:number-circle-three" className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <span>You'll receive a confirmation email with all the details</span>
                    </li>
                  </ul>
                  <p className="text-sm mt-3 text-muted-foreground">
                    <Icon icon="ph:bell" className="w-4 h-4 inline mr-1" />
                    We'll notify you at <strong>{booking.guestEmail}</strong>
                  </p>
                </div>
              )}

              {booking.status === "CONFIRMED" && (
                <div className="mt-3 space-y-2 text-slate-700 dark:text-slate-300">
                  <p className="font-medium text-blue-700 dark:text-blue-300">
                    🎉 Great news! Your booking is confirmed.
                  </p>
                  <p className="text-sm">
                    Your stay at {booking.property?.title} is all set. Check the property details below for access information.
                  </p>
                </div>
              )}

              {booking.status === "CANCELLED" && (
                <div className="mt-3 text-slate-700 dark:text-slate-300">
                  <p className="text-sm">
                    This booking has been cancelled. If you have any questions, please contact us via the chat below.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Property Card */}
            <Card className="overflow-hidden">
              <div className="flex flex-col sm:flex-row">
                {/* Property Image */}
                <div className="w-full sm:w-48 h-48 sm:h-auto relative bg-slate-100 dark:bg-slate-800 flex-shrink-0">
                  {propertyImage ? (
                    <img
                      src={propertyImage}
                      alt={booking.property?.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Icon icon="ph:house" className="w-12 h-12 text-slate-400" />
                    </div>
                  )}
                </div>
                <CardContent className="flex-1 p-5">
                  <Link href={getPropertyUrl()} className="text-lg font-semibold hover:text-primary transition-colors">
                    {booking.property?.title}
                  </Link>
                  <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                    <Icon icon="ph:map-pin" className="w-4 h-4" />
                    {booking.property?.location}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Icon icon="ph:calendar" className="w-4 h-4 text-muted-foreground" />
                      <span>{format(checkIn, "MMM d")} - {format(checkOut, "MMM d, yyyy")}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Icon icon="ph:moon" className="w-4 h-4 text-muted-foreground" />
                      <span>{booking.nights} night{booking.nights > 1 ? "s" : ""}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Icon icon="ph:users" className="w-4 h-4 text-muted-foreground" />
                      <span>{formatGuests()}</span>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total</p>
                      <p className="text-xl font-bold">{formatRentalPrice(booking.totalPrice)}</p>
                      {!currencyLoading && (
                        <p className="text-xs text-muted-foreground">
                          ≈ {formatMultiPrice(booking.totalPrice).eur} / {formatMultiPrice(booking.totalPrice).usd}
                        </p>
                      )}
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={getPropertyUrl()} target="_blank">
                        <Icon icon="ph:eye" className="w-4 h-4 mr-2" />
                        View Property
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </div>
            </Card>

            {/* Property Access Details - Only show when confirmed */}
            {booking.status === "CONFIRMED" && (booking.propertyAddress || booking.checkInTime) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon icon="ph:key" className="w-5 h-5 text-blue-600" />
                    Property Access Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Check-in/out times */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <Icon icon="ph:sign-in" className="w-4 h-4" />
                        Check-in
                      </div>
                      <p className="font-semibold">{format(checkIn, "EEEE, MMMM d")}</p>
                      <p className="text-lg font-bold text-blue-600">{booking.checkInTime || "14:00"}</p>
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <Icon icon="ph:sign-out" className="w-4 h-4" />
                        Check-out
                      </div>
                      <p className="font-semibold">{format(checkOut, "EEEE, MMMM d")}</p>
                      <p className="text-lg font-bold text-red-600">{booking.checkOutTime || "11:00"}</p>
                    </div>
                  </div>

                  {/* Address */}
                  {booking.propertyAddress && (
                    <div>
                      <h4 className="font-medium flex items-center gap-2 mb-2">
                        <Icon icon="ph:map-pin" className="w-4 h-4" />
                        Address
                      </h4>
                      <p className="text-sm bg-slate-50 dark:bg-slate-800 p-3 rounded-lg">
                        {booking.propertyAddress}
                      </p>
                    </div>
                  )}

                  {/* WiFi */}
                  {(booking.wifiName || booking.wifiPassword) && (
                    <div>
                      <h4 className="font-medium flex items-center gap-2 mb-2">
                        <Icon icon="ph:wifi-high" className="w-4 h-4" />
                        WiFi
                      </h4>
                      <div className="grid sm:grid-cols-2 gap-3">
                        <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg">
                          <p className="text-xs text-muted-foreground">Network Name</p>
                          <p className="font-mono font-medium">{booking.wifiName}</p>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg">
                          <p className="text-xs text-muted-foreground">Password</p>
                          <p className="font-mono font-medium">{booking.wifiPassword}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Access Code */}
                  {booking.accessCode && (
                    <div>
                      <h4 className="font-medium flex items-center gap-2 mb-2">
                        <Icon icon="ph:lock-key" className="w-4 h-4" />
                        Access Code / Key
                      </h4>
                      <p className="text-sm bg-slate-50 dark:bg-slate-800 p-3 rounded-lg font-mono">
                        {booking.accessCode}
                      </p>
                    </div>
                  )}

                  {/* Instructions */}
                  {booking.propertyInstructions && (
                    <div>
                      <h4 className="font-medium flex items-center gap-2 mb-2">
                        <Icon icon="ph:info" className="w-4 h-4" />
                        Getting There
                      </h4>
                      <p className="text-sm bg-slate-50 dark:bg-slate-800 p-3 rounded-lg whitespace-pre-wrap">
                        {booking.propertyInstructions}
                      </p>
                    </div>
                  )}

                  {/* Emergency Contact */}
                  {booking.emergencyContact && (
                    <div>
                      <h4 className="font-medium flex items-center gap-2 mb-2">
                        <Icon icon="ph:phone" className="w-4 h-4" />
                        Emergency Contact
                      </h4>
                      <a 
                        href={`tel:${booking.emergencyContact}`}
                        className="inline-flex items-center gap-2 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 px-4 py-2 rounded-lg hover:bg-red-100 transition-colors"
                      >
                        <Icon icon="ph:phone-call" className="w-4 h-4" />
                        {booking.emergencyContact}
                      </a>
                    </div>
                  )}

                  {/* House Rules */}
                  {booking.houseRules && (
                    <div>
                      <h4 className="font-medium flex items-center gap-2 mb-2">
                        <Icon icon="ph:scroll" className="w-4 h-4" />
                        House Rules
                      </h4>
                      <div className="text-sm bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3 rounded-lg whitespace-pre-wrap">
                        {booking.houseRules}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Booking Reference */}
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Booking Reference</p>
                    <p className="font-mono text-lg">{booking.id.slice(0, 8).toUpperCase()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Booked on</p>
                    <p className="font-medium">{format(new Date(booking.createdAt), "MMM d, yyyy")}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Chat */}
          <div className="lg:col-span-1">
            <Card className="h-[500px] flex flex-col sticky top-4 overflow-hidden">
              <CardHeader className="pb-3 border-b flex-shrink-0">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Icon icon="ph:chat-circle-text" className="w-5 h-5 text-primary" />
                  Chat with PSM Phuket
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Have questions? We're here to help!
                </p>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col p-0 min-h-0 overflow-hidden">
                {/* Messages */}
                <div 
                  ref={messagesContainerRef}
                  className="flex-1 overflow-y-auto p-4 min-h-0"
                >
                  <div className="flex flex-col justify-end min-h-full">
                    <div className="space-y-3">
                      {messages.length === 0 ? (
                        <div className="text-center text-muted-foreground py-8">
                          <Icon icon="ph:chat-circle-dots" className="w-12 h-12 mx-auto mb-2 opacity-50" />
                          <p className="text-sm font-medium">No messages yet</p>
                          <p className="text-xs">Send us a message and we'll respond shortly!</p>
                        </div>
                      ) : (
                        messages.map((msg) => (
                          <div
                            key={msg.id}
                            className={`flex ${msg.senderRole === "customer" ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`max-w-[85%] rounded-2xl px-4 py-2 ${
                                msg.senderRole === "customer"
                                  ? "bg-primary text-primary-foreground rounded-br-md"
                                  : "bg-slate-100 dark:bg-slate-800 rounded-bl-md"
                              }`}
                            >
                              <p className={`text-xs font-medium mb-1 ${
                                msg.senderRole === "customer"
                                  ? "text-primary-foreground/80"
                                  : "text-primary"
                              }`}>
                                {msg.senderRole === "customer" ? "You" : "PSM Phuket"}
                              </p>
                              <p className="text-sm">{msg.message}</p>
                              <p className={`text-[10px] mt-1 ${
                                msg.senderRole === "customer" 
                                  ? "text-primary-foreground/70" 
                                  : "text-muted-foreground"
                              }`}>
                                {format(new Date(msg.createdAt), "HH:mm")}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Message Input */}
                <div className="border-t p-3 flex-shrink-0">
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Type your message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                      className="min-h-[50px] max-h-[100px] resize-none text-sm"
                    />
                    <Button 
                      onClick={sendMessage} 
                      disabled={isSending || !newMessage.trim()}
                      size="icon"
                      className="h-[50px] w-[50px] flex-shrink-0"
                    >
                      {isSending ? (
                        <Icon icon="ph:spinner" className="w-5 h-5 animate-spin" />
                      ) : (
                        <Icon icon="ph:paper-plane-right-fill" className="w-5 h-5" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

