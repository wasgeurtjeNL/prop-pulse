'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  MessageCircle, 
  Mail, 
  User, 
  Phone, 
  Building,
  Globe,
  Calendar,
  CheckCircle,
  Loader2,
  Copy,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';
import { getPropertyUrl } from '@/lib/property-url';

interface LeadData {
  id: string;
  name: string;
  email: string;
  phone: string;
  countryCode: string;
  message?: string | null;
  requestType: string;
  viewingDate?: string | null;
  offerAmount?: string | null;
}

interface PropertyOwnerData {
  id: string;
  title: string;
  slug: string;
  provinceSlug?: string | null;
  areaSlug?: string | null;
  location?: string;
  ownerName?: string | null;
  ownerEmail?: string | null;
  ownerPhone?: string | null;
  ownerCountryCode?: string | null;
  ownerCompany?: string | null;
  commissionRate?: number | null;
  price: string;
}

interface SendLeadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: LeadData;
  property: PropertyOwnerData;
}

export function SendLeadModal({ open, onOpenChange, lead, property }: SendLeadModalProps) {
  const [nationality, setNationality] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sentVia, setSentVia] = useState<'WHATSAPP' | 'EMAIL' | null>(null);

  const currentDate = format(new Date(), "dd/MM/yyyy 'at' HH:mm");
  const leadType = lead.requestType === 'SCHEDULE_VIEWING' ? 'Viewing Request' : 'Offer';

  // Generate property URL
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_BASE_URL || 'https://psmphuket.com';
  const propertyUrl = `${baseUrl}${getPropertyUrl(property)}`;

  // Generate the message template
  // NOTE: Phone and email are intentionally NOT shared to protect the lead
  const generateMessage = () => {
    const lines = [
      `🏠 NEW LEAD - ${property.title}`,
      ``,
      `📍 Property: ${property.title}`,
      property.location ? `📌 Location: ${property.location}` : '',
      `💰 Price: ${property.price}`,
      `🔗 Link: ${propertyUrl}`,
      ``,
      `📋 Lead Details:`,
      `• Name: ${lead.name}`,
      nationality ? `• Nationality: ${nationality}` : '',
      `• Type: ${leadType}`,
      lead.viewingDate ? `• Preferred Date: ${format(new Date(lead.viewingDate), 'dd/MM/yyyy')}` : '',
      lead.offerAmount ? `• Offer Amount: ฿${lead.offerAmount}` : '',
      ``,
      `💼 Commission Agreement: ${property.commissionRate || 'Not specified'}%`,
      ``,
      `📅 Sent: ${currentDate}`,
      ``,
      `📞 Please contact us to arrange the viewing/meeting.`,
      `We will coordinate directly with the customer.`,
      ``,
      `This lead was forwarded by Real Estate Pulse.`,
    ].filter(line => line !== '');

    return lines.join('\n');
  };

  const message = generateMessage();

  // Generate WhatsApp URL
  const getWhatsAppUrl = () => {
    const phone = `${property.ownerCountryCode || '+66'}${property.ownerPhone}`.replace(/[^0-9+]/g, '');
    const encodedMessage = encodeURIComponent(message);
    return `https://wa.me/${phone.replace('+', '')}?text=${encodedMessage}`;
  };

  // Generate mailto URL
  const getMailtoUrl = () => {
    const subject = encodeURIComponent(`New Lead - ${property.title}`);
    const body = encodeURIComponent(message);
    return `mailto:${property.ownerEmail}?subject=${subject}&body=${body}`;
  };

  // Log the notification
  const logNotification = async (channel: 'WHATSAPP' | 'EMAIL') => {
    setIsSending(true);
    try {
      const response = await fetch('/api/lead-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId: property.id,
          viewingRequestId: lead.id,
          leadName: lead.name,
          leadPhone: lead.phone,
          leadCountryCode: lead.countryCode,
          leadEmail: lead.email,
          leadNationality: nationality || undefined,
          leadType: lead.requestType === 'SCHEDULE_VIEWING' ? 'RENTER' : 'BUYER',
          leadMessage: lead.message,
          ownerName: property.ownerName,
          ownerPhone: property.ownerPhone,
          ownerEmail: property.ownerEmail,
          ownerCompany: property.ownerCompany,
          commissionRate: property.commissionRate,
          message: message,
          sentVia: channel,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to log notification');
      }

      setSentVia(channel);
      toast.success(`Lead notification logged! Sent via ${channel}`);
    } catch (error) {
      console.error('Error logging notification:', error);
      toast.error('Failed to log notification');
    } finally {
      setIsSending(false);
    }
  };

  const handleSendWhatsApp = async () => {
    if (!property.ownerPhone) {
      toast.error('No phone number available for owner/agency');
      return;
    }
    
    await logNotification('WHATSAPP');
    window.open(getWhatsAppUrl(), '_blank');
  };

  const handleSendEmail = async () => {
    if (!property.ownerEmail) {
      toast.error('No email available for owner/agency');
      return;
    }
    
    await logNotification('EMAIL');
    window.open(getMailtoUrl(), '_blank');
  };

  const copyMessage = () => {
    navigator.clipboard.writeText(message);
    toast.success('Message copied to clipboard!');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-blue-500" />
            Send Lead to Owner/Agency
          </DialogTitle>
          <DialogDescription>
            Forward this lead to the property owner or agency. This action will be logged for your records.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Privacy Notice */}
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
            <p className="text-sm text-amber-800 dark:text-amber-200 flex items-center gap-2">
              <span className="text-lg">🛡️</span>
              <span><strong>Privacy Protected:</strong> Only name and nationality will be shared. Phone and email are NOT sent to the owner.</span>
            </p>
          </div>

          {/* Lead Information - For your reference only */}
          <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4 space-y-3">
            <h4 className="font-semibold flex items-center gap-2">
              <User className="h-4 w-4" />
              Lead Information
              <Badge variant="outline" className="text-xs">Your reference only</Badge>
            </h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">Name:</span>
                <p className="font-medium">{lead.name}</p>
                <span className="text-xs text-green-600">✓ Shared</span>
              </div>
              <div>
                <span className="text-muted-foreground">Phone:</span>
                <p className="font-medium">{lead.countryCode} {lead.phone}</p>
                <span className="text-xs text-red-500">✗ Not shared</span>
              </div>
              <div>
                <span className="text-muted-foreground">Email:</span>
                <p className="font-medium">{lead.email}</p>
                <span className="text-xs text-red-500">✗ Not shared</span>
              </div>
              <div>
                <span className="text-muted-foreground">Type:</span>
                <Badge variant="outline">{leadType}</Badge>
                <span className="text-xs text-green-600">✓ Shared</span>
              </div>
            </div>
            
            {/* Nationality input */}
            <div className="pt-2">
              <Label htmlFor="nationality" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Nationality (optional)
                <span className="text-xs text-green-600 font-normal">✓ Will be shared</span>
              </Label>
              <Input
                id="nationality"
                placeholder="e.g. Dutch, American, British"
                value={nationality}
                onChange={(e) => setNationality(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          <Separator />

          {/* Owner/Agency Information */}
          <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4 space-y-3">
            <h4 className="font-semibold flex items-center gap-2">
              <Building className="h-4 w-4" />
              Sending To
            </h4>
            {property.ownerName ? (
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Name:</span>
                  <p className="font-medium">{property.ownerName}</p>
                </div>
                {property.ownerCompany && (
                  <div>
                    <span className="text-muted-foreground">Company:</span>
                    <p className="font-medium">{property.ownerCompany}</p>
                  </div>
                )}
                <div>
                  <span className="text-muted-foreground">Phone:</span>
                  <p className="font-medium">
                    {property.ownerPhone ? `${property.ownerCountryCode || '+66'} ${property.ownerPhone}` : 'Not set'}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Email:</span>
                  <p className="font-medium">{property.ownerEmail || 'Not set'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Commission:</span>
                  <p className="font-medium">{property.commissionRate ? `${property.commissionRate}%` : 'Not set'}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                No owner/agency information set for this property. 
                Please add contact details in the property settings first.
              </p>
            )}
          </div>

          <Separator />

          {/* Message Preview */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Message Preview</Label>
              <Button variant="ghost" size="sm" onClick={copyMessage}>
                <Copy className="h-4 w-4 mr-1" />
                Copy
              </Button>
            </div>
            <Textarea
              value={message}
              readOnly
              className="min-h-[200px] font-mono text-sm bg-slate-50 dark:bg-slate-900"
            />
          </div>

          {/* Success indicator */}
          {sentVia && (
            <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/30 rounded-lg text-green-700 dark:text-green-300">
              <CheckCircle className="h-5 w-5" />
              <span>Lead sent via {sentVia} and logged at {currentDate}</span>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          
          <Button
            variant="outline"
            onClick={handleSendEmail}
            disabled={!property.ownerEmail || isSending}
            className="gap-2"
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Mail className="h-4 w-4" />
            )}
            Send via Email
            <ExternalLink className="h-3 w-3" />
          </Button>
          
          <Button
            onClick={handleSendWhatsApp}
            disabled={!property.ownerPhone || isSending}
            className="gap-2 bg-green-600 hover:bg-green-700"
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MessageCircle className="h-4 w-4" />
            )}
            Send via WhatsApp
            <ExternalLink className="h-3 w-3" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

