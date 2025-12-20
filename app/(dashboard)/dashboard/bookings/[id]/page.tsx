"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import { Icon } from "@iconify/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { toast } from "sonner";
import { formatRentalPrice } from "@/lib/services/rental-pricing";

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
  user: {
    id: string;
    name: string;
    email: string;
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

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
  COMPLETED: "bg-blue-100 text-blue-800",
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
  const [isUpdating, setIsUpdating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Property details form
  const [propertyDetails, setPropertyDetails] = useState({
    checkInTime: "14:00",
    checkOutTime: "11:00",
    propertyAddress: "",
    propertyInstructions: "",
    wifiName: "",
    wifiPassword: "",
    accessCode: "",
    emergencyContact: "",
    houseRules: "",
  });

  useEffect(() => {
    fetchBooking();
    fetchMessages();
    
    // Poll for new messages every 10 seconds
    const interval = setInterval(fetchMessages, 10000);
    return () => clearInterval(interval);
  }, [bookingId]);

  useEffect(() => {
    if (booking) {
      setPropertyDetails({
        checkInTime: booking.checkInTime || "14:00",
        checkOutTime: booking.checkOutTime || "11:00",
        propertyAddress: booking.propertyAddress || "",
        propertyInstructions: booking.propertyInstructions || "",
        wifiName: booking.wifiName || "",
        wifiPassword: booking.wifiPassword || "",
        accessCode: booking.accessCode || "",
        emergencyContact: booking.emergencyContact || "",
        houseRules: booking.houseRules || "",
      });
    }
  }, [booking]);

  const scrollToBottom = () => {
    // Only scroll within the chat container, not the whole page
    if (messagesEndRef.current) {
      const container = messagesEndRef.current.parentElement;
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }
  };

  // Scroll to bottom when new messages arrive (but not on initial load)
  const prevMessagesLength = useRef(0);
  useEffect(() => {
    if (messages.length > prevMessagesLength.current) {
      scrollToBottom();
    }
    prevMessagesLength.current = messages.length;
  }, [messages]);

  const fetchBooking = async () => {
    try {
      const response = await fetch(`/api/rental-bookings/${bookingId}`);
      if (!response.ok) throw new Error("Failed to fetch booking");
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
      if (!response.ok) throw new Error("Failed to fetch messages");
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
        body: JSON.stringify({ message: newMessage, senderRole: "agent" }),
      });
      
      if (!response.ok) throw new Error("Failed to send message");
      
      setNewMessage("");
      fetchMessages();
      toast.success("Message sent");
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  const updateBookingStatus = async (status: "CONFIRMED" | "CANCELLED" | "COMPLETED") => {
    try {
      setIsUpdating(true);
      const response = await fetch(`/api/rental-bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          status,
          ...propertyDetails,
        }),
      });
      
      if (!response.ok) throw new Error("Failed to update booking");
      
      toast.success(`Booking ${status.toLowerCase()}`);
      fetchBooking();
    } catch (error) {
      console.error("Error updating booking:", error);
      toast.error("Failed to update booking");
    } finally {
      setIsUpdating(false);
    }
  };

  const savePropertyDetails = async () => {
    try {
      setIsUpdating(true);
      const response = await fetch(`/api/rental-bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(propertyDetails),
      });
      
      if (!response.ok) throw new Error("Failed to save details");
      
      toast.success("Property details saved");
      fetchBooking();
    } catch (error) {
      console.error("Error saving details:", error);
      toast.error("Failed to save property details");
    } finally {
      setIsUpdating(false);
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Icon icon="ph:spinner" className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="text-center py-12">
        <Icon icon="ph:warning-circle" className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Booking not found</h2>
        <Button asChild>
          <Link href="/dashboard/bookings">Back to Bookings</Link>
        </Button>
      </div>
    );
  }

  const checkIn = new Date(booking.checkIn);
  const checkOut = new Date(booking.checkOut);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Button variant="ghost" size="sm" asChild className="mb-2">
            <Link href="/dashboard/bookings">
              <Icon icon="ph:arrow-left" className="w-4 h-4 mr-1" />
              Back to Bookings
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Booking Details</h1>
          <p className="text-muted-foreground">
            {booking.property?.title || "Property deleted"}
          </p>
        </div>
        <Badge className={statusColors[booking.status]}>
          {booking.status}
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Booking Info & Actions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Booking Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon icon="ph:calendar" className="w-5 h-5" />
                Reservation Details
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Check-in</p>
                <p className="font-medium">{format(checkIn, "EEEE, MMMM d, yyyy")}</p>
                <p className="text-sm text-muted-foreground">{propertyDetails.checkInTime}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Check-out</p>
                <p className="font-medium">{format(checkOut, "EEEE, MMMM d, yyyy")}</p>
                <p className="text-sm text-muted-foreground">{propertyDetails.checkOutTime}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Duration</p>
                <p className="font-medium">{booking.nights} nights</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Guests</p>
                <p className="font-medium">{formatGuests()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Season</p>
                <Badge variant="outline">{booking.season}</Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Price</p>
                <p className="font-bold text-lg">{formatRentalPrice(booking.totalPrice)}</p>
              </div>
            </CardContent>
          </Card>

          {/* Guest Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon icon="ph:user" className="w-5 h-5" />
                Guest Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <Icon icon="ph:user-circle" className="w-5 h-5 text-muted-foreground" />
                <span className="font-medium">{booking.guestName}</span>
              </div>
              <div className="flex items-center gap-3">
                <Icon icon="ph:envelope" className="w-5 h-5 text-muted-foreground" />
                <a href={`mailto:${booking.guestEmail}`} className="text-primary hover:underline">
                  {booking.guestEmail}
                </a>
              </div>
              <div className="flex items-center gap-3">
                <Icon icon="ph:phone" className="w-5 h-5 text-muted-foreground" />
                <a href={`tel:${booking.guestCountryCode}${booking.guestPhone}`} className="text-primary hover:underline">
                  {booking.guestCountryCode} {booking.guestPhone}
                </a>
              </div>
              {booking.guestMessage && (
                <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Guest Message:</p>
                  <p className="text-sm">{booking.guestMessage}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Property Details Form - Only show for confirmed bookings */}
          {(booking.status === "CONFIRMED" || booking.status === "PENDING") && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon icon="ph:house" className="w-5 h-5" />
                  Property Access Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Fill in these details to share with the guest after confirming the booking.
                </p>
                
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label>Check-in Time</Label>
                    <Input
                      type="time"
                      value={propertyDetails.checkInTime}
                      onChange={(e) => setPropertyDetails(prev => ({ ...prev, checkInTime: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>Check-out Time</Label>
                    <Input
                      type="time"
                      value={propertyDetails.checkOutTime}
                      onChange={(e) => setPropertyDetails(prev => ({ ...prev, checkOutTime: e.target.value }))}
                    />
                  </div>
                </div>

                <div>
                  <Label>Property Address</Label>
                  <Textarea
                    placeholder="Full address with directions..."
                    value={propertyDetails.propertyAddress}
                    onChange={(e) => setPropertyDetails(prev => ({ ...prev, propertyAddress: e.target.value }))}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label>WiFi Name</Label>
                    <Input
                      placeholder="Network name"
                      value={propertyDetails.wifiName}
                      onChange={(e) => setPropertyDetails(prev => ({ ...prev, wifiName: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>WiFi Password</Label>
                    <Input
                      placeholder="Password"
                      value={propertyDetails.wifiPassword}
                      onChange={(e) => setPropertyDetails(prev => ({ ...prev, wifiPassword: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label>Access Code / Key Box</Label>
                    <Input
                      placeholder="Door code or key location"
                      value={propertyDetails.accessCode}
                      onChange={(e) => setPropertyDetails(prev => ({ ...prev, accessCode: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>Emergency Contact</Label>
                    <Input
                      placeholder="Phone number for emergencies"
                      value={propertyDetails.emergencyContact}
                      onChange={(e) => setPropertyDetails(prev => ({ ...prev, emergencyContact: e.target.value }))}
                    />
                  </div>
                </div>

                <div>
                  <Label>Property Instructions</Label>
                  <Textarea
                    placeholder="How to access the property, parking info, etc..."
                    value={propertyDetails.propertyInstructions}
                    onChange={(e) => setPropertyDetails(prev => ({ ...prev, propertyInstructions: e.target.value }))}
                  />
                </div>

                <div>
                  <Label>House Rules</Label>
                  <Textarea
                    placeholder="Important rules for guests..."
                    value={propertyDetails.houseRules}
                    onChange={(e) => setPropertyDetails(prev => ({ ...prev, houseRules: e.target.value }))}
                  />
                </div>

                <Button onClick={savePropertyDetails} disabled={isUpdating}>
                  <Icon icon="ph:floppy-disk" className="w-4 h-4 mr-2" />
                  Save Details
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          {booking.status === "PENDING" && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-wrap gap-3">
                  <Button 
                    onClick={() => updateBookingStatus("CONFIRMED")}
                    disabled={isUpdating}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Icon icon="ph:check-circle" className="w-4 h-4 mr-2" />
                    Confirm Booking
                  </Button>
                  <Button 
                    variant="destructive"
                    onClick={() => updateBookingStatus("CANCELLED")}
                    disabled={isUpdating}
                  >
                    <Icon icon="ph:x-circle" className="w-4 h-4 mr-2" />
                    Reject Booking
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {booking.status === "CONFIRMED" && (
            <Card>
              <CardContent className="pt-6">
                <Button 
                  onClick={() => updateBookingStatus("COMPLETED")}
                  disabled={isUpdating}
                >
                  <Icon icon="ph:check-circle-fill" className="w-4 h-4 mr-2" />
                  Mark as Completed
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Chat */}
        <div className="lg:col-span-1">
          <Card className="h-[600px] flex flex-col overflow-hidden sticky top-4">
            <CardHeader className="pb-3 flex-shrink-0">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Icon icon="ph:chat-circle-text" className="w-5 h-5" />
                Chat with Guest
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col p-0 min-h-0 overflow-hidden">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 min-h-0 flex flex-col">
                <div className="flex-1" /> {/* Spacer to push messages to bottom */}
                <div className="space-y-3">
                {messages.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <Icon icon="ph:chat-circle" className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No messages yet</p>
                    <p className="text-xs">Start a conversation with the guest</p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.senderRole === "agent" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg px-3 py-2 ${
                          msg.senderRole === "agent"
                            ? "bg-primary text-primary-foreground"
                            : "bg-slate-100 dark:bg-slate-800"
                        }`}
                      >
                        <p className="text-sm">{msg.message}</p>
                        <p className={`text-xs mt-1 ${
                          msg.senderRole === "agent" 
                            ? "text-primary-foreground/70" 
                            : "text-muted-foreground"
                        }`}>
                          {format(new Date(msg.createdAt), "HH:mm")}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Message Input */}
              <div className="border-t p-4 flex-shrink-0">
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
                    className="min-h-[60px] max-h-[100px] resize-none"
                  />
                  <Button 
                    onClick={sendMessage} 
                    disabled={isSending || !newMessage.trim()}
                    size="icon"
                    className="h-[60px] w-[60px] flex-shrink-0"
                  >
                    {isSending ? (
                      <Icon icon="ph:spinner" className="w-5 h-5 animate-spin" />
                    ) : (
                      <Icon icon="ph:paper-plane-right" className="w-5 h-5" />
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

