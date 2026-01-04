"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Icon } from "@iconify/react";
import { toast } from "sonner";

interface FbMarketplaceLead {
  id: string;
  sellerName: string;
  sellerPhone: string | null;
  sellerEmail: string | null;
  propertyTitle: string;
}

interface FbLeadContactModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: FbMarketplaceLead;
  onSuccess?: () => void;
}

const contactFormSchema = z.object({
  method: z.string().min(1, "Selecteer een contact methode"),
  outcome: z.string().min(1, "Selecteer een uitkomst"),
  notes: z.string().optional(),
  followUpDate: z.string().optional(),
});

type ContactFormValues = z.infer<typeof contactFormSchema>;

export function FbLeadContactModal({
  open,
  onOpenChange,
  lead,
  onSuccess,
}: FbLeadContactModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      method: "",
      outcome: "",
      notes: "",
      followUpDate: "",
    },
  });

  const onSubmit = async (values: ContactFormValues) => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/fb-marketplace-leads/${lead.id}/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Contact geregistreerd! ✅");
        form.reset();
        onOpenChange(false);
        onSuccess?.();
      } else {
        toast.error(data.error || "Kon contact niet registreren");
      }
    } catch (error) {
      console.error("Error adding contact:", error);
      toast.error("Kon contact niet registreren");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon icon="ph:phone-call-bold" className="text-primary" width={20} height={20} />
            Contact Registreren
          </DialogTitle>
          <DialogDescription>
            Registreer een contactpoging met {lead.sellerName}
          </DialogDescription>
        </DialogHeader>

        {/* Lead Info Summary */}
        <div className="p-3 rounded-lg bg-muted/50 border">
          <div className="flex items-start gap-3">
            <Icon icon="ph:user-bold" className="text-muted-foreground mt-0.5" width={18} height={18} />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">{lead.sellerName}</p>
              <p className="text-xs text-muted-foreground truncate">{lead.propertyTitle}</p>
              {lead.sellerPhone && (
                <p className="text-xs text-muted-foreground mt-1">{lead.sellerPhone}</p>
              )}
            </div>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Contact Method */}
            <FormField
              control={form.control}
              name="method"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Methode *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecteer methode" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="phone">
                        <div className="flex items-center gap-2">
                          <Icon icon="ph:phone-bold" width={16} height={16} />
                          Telefonisch
                        </div>
                      </SelectItem>
                      <SelectItem value="whatsapp">
                        <div className="flex items-center gap-2">
                          <Icon icon="ph:whatsapp-logo-bold" width={16} height={16} />
                          WhatsApp
                        </div>
                      </SelectItem>
                      <SelectItem value="email">
                        <div className="flex items-center gap-2">
                          <Icon icon="ph:envelope-bold" width={16} height={16} />
                          Email
                        </div>
                      </SelectItem>
                      <SelectItem value="messenger">
                        <div className="flex items-center gap-2">
                          <Icon icon="ph:messenger-logo-bold" width={16} height={16} />
                          Messenger
                        </div>
                      </SelectItem>
                      <SelectItem value="sms">
                        <div className="flex items-center gap-2">
                          <Icon icon="ph:chat-text-bold" width={16} height={16} />
                          SMS
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Outcome */}
            <FormField
              control={form.control}
              name="outcome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Uitkomst *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecteer uitkomst" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="answered">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-green-500"></span>
                          Opgenomen / Gereageerd
                        </div>
                      </SelectItem>
                      <SelectItem value="no_answer">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                          Niet Opgenomen
                        </div>
                      </SelectItem>
                      <SelectItem value="voicemail">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                          Voicemail Achtergelaten
                        </div>
                      </SelectItem>
                      <SelectItem value="interested">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-pink-500"></span>
                          Geïnteresseerd
                        </div>
                      </SelectItem>
                      <SelectItem value="not_interested">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-gray-500"></span>
                          Niet Geïnteresseerd
                        </div>
                      </SelectItem>
                      <SelectItem value="callback">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                          Terugbellen Gewenst
                        </div>
                      </SelectItem>
                      <SelectItem value="wrong_number">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-red-500"></span>
                          Verkeerd Nummer
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notities</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Wat is er besproken? Eventuele details..."
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Follow-up Date */}
            <FormField
              control={form.control}
              name="followUpDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Follow-up Datum</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormDescription>
                    Wanneer moet je opnieuw contact opnemen?
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Annuleren
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Icon icon="ph:circle-notch" className="mr-2 animate-spin" width={16} height={16} />
                    Opslaan...
                  </>
                ) : (
                  <>
                    <Icon icon="ph:check-bold" className="mr-2" width={16} height={16} />
                    Opslaan
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
