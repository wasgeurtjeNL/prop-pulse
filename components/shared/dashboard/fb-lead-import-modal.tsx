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

interface FbLeadImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const importFormSchema = z.object({
  listingUrl: z.string().url("Voer een geldige URL in").min(1, "URL is verplicht"),
  sellerName: z.string().min(1, "Verkoper naam is verplicht"),
  sellerPhone: z.string().optional(),
  sellerEmail: z.string().email("Ongeldig email adres").optional().or(z.literal("")),
  propertyTitle: z.string().min(1, "Woning titel is verplicht"),
  price: z.string().optional(),
  location: z.string().optional(),
  propertyType: z.string().optional(),
  bedrooms: z.string().optional(),
  bathrooms: z.string().optional(),
  sqm: z.string().optional(),
  description: z.string().optional(),
  contactNotes: z.string().optional(),
});

type ImportFormValues = z.infer<typeof importFormSchema>;

export function FbLeadImportModal({
  open,
  onOpenChange,
  onSuccess,
}: FbLeadImportModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ImportFormValues>({
    resolver: zodResolver(importFormSchema),
    defaultValues: {
      listingUrl: "",
      sellerName: "",
      sellerPhone: "",
      sellerEmail: "",
      propertyTitle: "",
      price: "",
      location: "",
      propertyType: "",
      bedrooms: "",
      bathrooms: "",
      sqm: "",
      description: "",
      contactNotes: "",
    },
  });

  const onSubmit = async (values: ImportFormValues) => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/fb-marketplace-leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          sellerEmail: values.sellerEmail || undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Lead succesvol toegevoegd! ✅");
        form.reset();
        onOpenChange(false);
        onSuccess?.();
      } else if (response.status === 409) {
        toast.error("Deze listing URL bestaat al in het systeem");
      } else {
        toast.error(data.error || "Kon lead niet toevoegen");
      }
    } catch (error) {
      console.error("Error creating lead:", error);
      toast.error("Kon lead niet toevoegen");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon icon="ph:facebook-logo-bold" className="text-blue-600" width={24} height={24} />
            Facebook Marketplace Lead Toevoegen
          </DialogTitle>
          <DialogDescription>
            Voeg een nieuwe lead toe van Facebook Marketplace. Plak de listing URL en vul de verkoper gegevens in.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Listing URL */}
            <FormField
              control={form.control}
              name="listingUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Icon icon="ph:link-bold" width={16} height={16} />
                    Facebook Marketplace URL *
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://www.facebook.com/marketplace/item/..."
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Kopieer de URL van de Facebook Marketplace listing
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="border-t pt-4">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Icon icon="ph:user-bold" className="text-primary" width={18} height={18} />
                Verkoper Gegevens
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Seller Name */}
                <FormField
                  control={form.control}
                  name="sellerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Naam Verkoper *</FormLabel>
                      <FormControl>
                        <Input placeholder="Jan Jansen" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Seller Phone */}
                <FormField
                  control={form.control}
                  name="sellerPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefoonnummer</FormLabel>
                      <FormControl>
                        <Input placeholder="+31 6 12345678" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Seller Email */}
                <FormField
                  control={form.control}
                  name="sellerEmail"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="verkoper@email.nl" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Icon icon="ph:house-bold" className="text-primary" width={18} height={18} />
                Woning Gegevens
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Property Title */}
                <FormField
                  control={form.control}
                  name="propertyTitle"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Woning Titel *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ruime villa met 3 slaapkamers" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Price */}
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vraagprijs</FormLabel>
                      <FormControl>
                        <Input placeholder="€450.000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Location */}
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Locatie</FormLabel>
                      <FormControl>
                        <Input placeholder="Amsterdam" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Property Type */}
                <FormField
                  control={form.control}
                  name="propertyType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type Woning</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecteer type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="house">Huis</SelectItem>
                          <SelectItem value="apartment">Appartement</SelectItem>
                          <SelectItem value="villa">Villa</SelectItem>
                          <SelectItem value="townhouse">Rijwoning</SelectItem>
                          <SelectItem value="bungalow">Bungalow</SelectItem>
                          <SelectItem value="land">Grond</SelectItem>
                          <SelectItem value="other">Anders</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Bedrooms */}
                <FormField
                  control={form.control}
                  name="bedrooms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Slaapkamers</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="3" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Bathrooms */}
                <FormField
                  control={form.control}
                  name="bathrooms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Badkamers</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="2" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Sqm */}
                <FormField
                  control={form.control}
                  name="sqm"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Oppervlakte (m²)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="120" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Description */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Beschrijving</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Korte beschrijving van de woning..."
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Contact Notes */}
                <FormField
                  control={form.control}
                  name="contactNotes"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Notities</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Eigen notities over deze lead..."
                          rows={2}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

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
                    <Icon icon="ph:floppy-disk-bold" className="mr-2" width={16} height={16} />
                    Lead Opslaan
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
