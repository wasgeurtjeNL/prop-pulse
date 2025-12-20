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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import {
  UserPlus,
  Loader2,
  Phone,
  Mail,
  Globe,
  Building,
  Calendar,
  DollarSign,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";
import { getPropertyUrl } from "@/lib/property-url";

interface PropertyData {
  id: string;
  title: string;
  slug: string;
  provinceSlug?: string | null;
  areaSlug?: string | null;
  location: string;
  price: string;
  type: string;
}

interface RegisterLeadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  property: PropertyData;
  onSuccess?: () => void;
}

const leadFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(6, "Please enter a valid phone number"),
  countryCode: z.string().default("+66"),
  nationality: z.string().optional(),
  requestType: z.enum(["SCHEDULE_VIEWING", "MAKE_OFFER"]),
  viewingDate: z.string().optional(),
  offerAmount: z.string().optional(),
  message: z.string().optional(),
  language: z.string().optional(),
});

type LeadFormValues = z.infer<typeof leadFormSchema>;

export function RegisterLeadModal({
  open,
  onOpenChange,
  property,
  onSuccess,
}: RegisterLeadModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<LeadFormValues>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      countryCode: "+66",
      nationality: "",
      requestType: property.type === "FOR_RENT" ? "SCHEDULE_VIEWING" : "MAKE_OFFER",
      viewingDate: "",
      offerAmount: "",
      message: "",
      language: "en",
    },
  });

  const requestType = form.watch("requestType");

  const onSubmit = async (values: LeadFormValues) => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/viewing-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: property.id,
          requestType: values.requestType,
          name: values.name,
          email: values.email,
          phone: values.phone,
          countryCode: values.countryCode,
          language: values.language,
          message: values.message || `Nationality: ${values.nationality || "Not specified"}`,
          viewingDate: values.viewingDate || undefined,
          offerAmount: values.offerAmount || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to register lead");
      }

      toast.success("Lead registered successfully! ✅");
      form.reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("Error registering lead:", error);
      toast.error(error instanceof Error ? error.message : "Failed to register lead");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Property URL for reference
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const propertyUrl = `${baseUrl}${getPropertyUrl(property)}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-emerald-600" />
            Register New Lead
          </DialogTitle>
          <DialogDescription>
            Add a new customer/lead for this property. The lead will appear in your Viewing Requests.
          </DialogDescription>
        </DialogHeader>

        {/* Property Info */}
        <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border">
          <div className="flex items-start gap-3">
            <Building className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{property.title}</p>
              <p className="text-xs text-muted-foreground truncate">{property.location}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs">
                  {property.price}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {property.type === "FOR_RENT" ? "For Rent" : "For Sale"}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Lead Type */}
            <FormField
              control={form.control}
              name="requestType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lead Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="SCHEDULE_VIEWING">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Viewing Request
                        </div>
                      </SelectItem>
                      <SelectItem value="MAKE_OFFER">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          Offer / Inquiry
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="John Smith" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Email */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email *
                  </FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="john@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Phone */}
            <div className="grid grid-cols-3 gap-2">
              <FormField
                control={form.control}
                name="countryCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Code</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="+66" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="+66">+66 🇹🇭</SelectItem>
                        <SelectItem value="+1">+1 🇺🇸</SelectItem>
                        <SelectItem value="+44">+44 🇬🇧</SelectItem>
                        <SelectItem value="+31">+31 🇳🇱</SelectItem>
                        <SelectItem value="+49">+49 🇩🇪</SelectItem>
                        <SelectItem value="+33">+33 🇫🇷</SelectItem>
                        <SelectItem value="+61">+61 🇦🇺</SelectItem>
                        <SelectItem value="+65">+65 🇸🇬</SelectItem>
                        <SelectItem value="+852">+852 🇭🇰</SelectItem>
                        <SelectItem value="+86">+86 🇨🇳</SelectItem>
                        <SelectItem value="+7">+7 🇷🇺</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Phone *
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="812345678" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Nationality */}
            <FormField
              control={form.control}
              name="nationality"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Nationality (Optional)
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Dutch, American, British" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Language */}
            <FormField
              control={form.control}
              name="language"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preferred Language</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="th">Thai</SelectItem>
                      <SelectItem value="zh">Chinese</SelectItem>
                      <SelectItem value="ru">Russian</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="nl">Dutch</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Viewing Date - only for SCHEDULE_VIEWING */}
            {requestType === "SCHEDULE_VIEWING" && (
              <FormField
                control={form.control}
                name="viewingDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Preferred Viewing Date
                    </FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormDescription>When does the customer want to view the property?</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Offer Amount - only for MAKE_OFFER */}
            {requestType === "MAKE_OFFER" && (
              <FormField
                control={form.control}
                name="offerAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Offer Amount (Optional)
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. 15,000,000" {...field} />
                    </FormControl>
                    <FormDescription>Customer&apos;s offer or budget (in THB)</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Message / Notes */}
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Notes (Optional)
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any additional notes about this lead..."
                      rows={3}
                      {...field}
                    />
                  </FormControl>
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
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Registering...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Register Lead
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



