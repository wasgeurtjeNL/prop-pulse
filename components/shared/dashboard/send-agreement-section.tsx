"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  MessageCircle,
  Mail,
  Send,
  Loader2,
  Clock,
  CheckCircle2,
  ExternalLink,
  History,
  AlertCircle,
  Copy,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { getPropertyUrl } from "@/lib/property-url";

interface PropertyData {
  id: string;
  title: string;
  slug: string;
  location: string;
  price: string;
  provinceSlug?: string | null;
  areaSlug?: string | null;
  ownerName?: string | null;
  ownerEmail?: string | null;
  ownerPhone?: string | null;
  ownerCountryCode?: string | null;
  ownerCompany?: string | null;
  commissionRate?: number | null;
}

interface AgreementLog {
  id: string;
  commissionRate: number;
  message: string;
  sentVia: "WHATSAPP" | "EMAIL";
  recipientName?: string;
  recipientPhone?: string;
  recipientEmail?: string;
  sentByName: string;
  sentAt: string;
}

interface SendAgreementSectionProps {
  property: PropertyData;
  currentCommissionRate?: number;
}

export default function SendAgreementSection({
  property,
  currentCommissionRate,
}: SendAgreementSectionProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [agreementLogs, setAgreementLogs] = useState<AgreementLog[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(true);
  const [commissionRate, setCommissionRate] = useState<number>(
    currentCommissionRate || property.commissionRate || 3
  );

  // Property URL
  const baseUrl = typeof window !== "undefined" ? window.location.origin : process.env.NEXT_PUBLIC_BASE_URL || "https://psmphuket.com";
  const propertyUrl = `${baseUrl}${getPropertyUrl(property)}`;

  // Default message template
  const getDefaultMessage = () => {
    return `Dear ${property.ownerName || property.ownerCompany || "Owner"},

I hereby confirm our commission agreement for the following property:

📍 *${property.title}*
📌 Location: ${property.location}
💰 Price: ${property.price}
🔗 Link: ${propertyUrl}

✅ *Commission Agreement: ${commissionRate}%*

This agreement is valid from today. Please feel free to contact me if you have any questions.

Best regards,
[Your Name/Company]`;
  };

  const [message, setMessage] = useState(getDefaultMessage());

  // Update message when commission rate changes
  useEffect(() => {
    setMessage(getDefaultMessage());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [commissionRate, property.title, property.location, property.price]);

  // Fetch agreement logs
  useEffect(() => {
    const fetchLogs = async () => {
      if (!property.id) return;
      
      setIsLoadingLogs(true);
      try {
        const response = await fetch(`/api/owner-agreement?propertyId=${property.id}`);
        if (response.ok) {
          const data = await response.json();
          setAgreementLogs(data.agreements || []);
        }
      } catch (error) {
        console.error("Failed to fetch agreement logs:", error);
      } finally {
        setIsLoadingLogs(false);
      }
    };

    fetchLogs();
  }, [property.id]);

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setIsCopied(true);
      toast.success("Message copied to clipboard");
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      toast.error("Could not copy message");
    }
  };

  const handleSendAgreement = async (sentVia: "WHATSAPP" | "EMAIL") => {
    // Validate
    if (!commissionRate || commissionRate <= 0) {
      toast.error("Please enter a valid commission percentage");
      return;
    }

    if (sentVia === "WHATSAPP" && !property.ownerPhone) {
      toast.error("No phone number available for WhatsApp");
      return;
    }

    if (sentVia === "EMAIL" && !property.ownerEmail) {
      toast.error("No email address available");
      return;
    }

    setIsLoading(true);
    try {
      // Log the agreement
      const logResponse = await fetch("/api/owner-agreement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: property.id,
          commissionRate,
          message,
          sentVia,
          recipientName: property.ownerName || property.ownerCompany,
          recipientPhone: property.ownerPhone ? `${property.ownerCountryCode}${property.ownerPhone}` : undefined,
          recipientEmail: property.ownerEmail,
        }),
      });

      if (!logResponse.ok) {
        const errorData = await logResponse.json();
        throw new Error(errorData.error || "Failed to log agreement");
      }

      const logData = await logResponse.json();

      // Open WhatsApp or Email
      const encodedMessage = encodeURIComponent(message);

      if (sentVia === "WHATSAPP" && property.ownerPhone) {
        const phoneNumber = `${property.ownerCountryCode?.replace("+", "")}${property.ownerPhone}`;
        window.open(`https://wa.me/${phoneNumber}?text=${encodedMessage}`, "_blank");
      } else if (sentVia === "EMAIL" && property.ownerEmail) {
        const subject = encodeURIComponent(`Commission Agreement: ${property.title}`);
        window.open(`mailto:${property.ownerEmail}?subject=${subject}&body=${encodedMessage}`, "_blank");
      }

      // Add to logs
      setAgreementLogs((prev) => [logData.agreement, ...prev]);
      
      toast.success(
        `Agreement sent ${sentVia === "WHATSAPP" ? "via WhatsApp" : "via email"} and logged! ✅`
      );
    } catch (error) {
      console.error("Error sending agreement:", error);
      toast.error(error instanceof Error ? error.message : "Could not send agreement");
    } finally {
      setIsLoading(false);
    }
  };

  // Don't render if no owner contact info
  if (!property.ownerName && !property.ownerCompany) {
    return (
      <div className="p-4 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
              No owner/agency contact details
            </p>
            <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
              Please fill in the owner/agency contact details above to send agreements.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Separator className="bg-blue-200 dark:bg-blue-800" />
      
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="send-agreement" className="border-none">
          <AccordionTrigger className="hover:no-underline py-2">
            <div className="flex items-center gap-2 text-left">
              <Send className="h-4 w-4 text-blue-600" />
              <span className="font-medium">Send Commission Agreement</span>
              {agreementLogs.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {agreementLogs.length} sent
                </Badge>
              )}
            </div>
          </AccordionTrigger>
          
          <AccordionContent className="pt-4 space-y-6">
            {/* Recipient Info */}
            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
              <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                Recipient: {property.ownerName || property.ownerCompany}
                {property.ownerCompany && property.ownerName && ` (${property.ownerCompany})`}
              </p>
              <div className="flex gap-4 mt-1 text-xs text-blue-700 dark:text-blue-300">
                {property.ownerPhone && (
                  <span>{property.ownerCountryCode}{property.ownerPhone}</span>
                )}
                {property.ownerEmail && (
                  <span>{property.ownerEmail}</span>
                )}
              </div>
            </div>

            {/* Property Link Preview */}
            <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900 border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Property link in message:</p>
                  <a 
                    href={propertyUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-1"
                  >
                    {propertyUrl}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            </div>

            {/* Commission Rate Input */}
            <div className="grid gap-2">
              <Label htmlFor="agreement-commission">Commission Rate (%)</Label>
              <div className="relative max-w-[150px]">
                <Input
                  id="agreement-commission"
                  type="number"
                  step="0.5"
                  min="0"
                  max="100"
                  value={commissionRate}
                  onChange={(e) => setCommissionRate(parseFloat(e.target.value) || 0)}
                  className="pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  %
                </span>
              </div>
            </div>

            {/* Message */}
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="agreement-message">Message</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyMessage}
                  className="h-8 text-xs gap-1"
                >
                  {isCopied ? (
                    <>
                      <Check className="h-3 w-3" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
              <Textarea
                id="agreement-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={10}
                className="text-sm font-mono"
              />
            </div>

            {/* Send Buttons */}
            <div className="flex flex-wrap gap-3">
              {property.ownerPhone && (
                <Button
                  type="button"
                  onClick={() => handleSendAgreement("WHATSAPP")}
                  disabled={isLoading}
                  className="bg-green-600 hover:bg-green-700 text-white gap-2"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <MessageCircle className="h-4 w-4" />
                  )}
                  Send via WhatsApp
                </Button>
              )}
              {property.ownerEmail && (
                <Button
                  type="button"
                  onClick={() => handleSendAgreement("EMAIL")}
                  disabled={isLoading}
                  variant="outline"
                  className="gap-2"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Mail className="h-4 w-4" />
                  )}
                  Send via Email
                </Button>
              )}
            </div>

            {/* Agreement History */}
            {(agreementLogs.length > 0 || isLoadingLogs) && (
              <div className="space-y-3">
                <Separator />
                <div className="flex items-center gap-2">
                  <History className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Sent Agreements</span>
                </div>
                
                {isLoadingLogs ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading...
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {agreementLogs.map((log) => (
                      <div
                        key={log.id}
                        className="p-3 rounded-lg border bg-white dark:bg-gray-900 text-sm"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Badge
                                variant={log.sentVia === "WHATSAPP" ? "default" : "secondary"}
                                className={
                                  log.sentVia === "WHATSAPP"
                                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                    : ""
                                }
                              >
                                {log.sentVia === "WHATSAPP" ? (
                                  <MessageCircle className="h-3 w-3 mr-1" />
                                ) : (
                                  <Mail className="h-3 w-3 mr-1" />
                                )}
                                {log.sentVia === "WHATSAPP" ? "WhatsApp" : "E-mail"}
                              </Badge>
                              <span className="font-medium">{log.commissionRate}%</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {format(new Date(log.sentAt), "d MMM yyyy 'at' HH:mm")}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              By: {log.sentByName}
                            </p>
                          </div>
                          <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

