import { Mail, MapPin, Phone, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Image from "next/image";
import ContactForm from "@/components/shared/forms/contact-form";
import { Metadata } from "next";
import Breadcrumb from "@/components/new-design/breadcrumb";

export const metadata: Metadata = {
  title: "Contact Us - Get In Touch with Our Team",
  description: "Questions about buying, selling, or managing property in Thailand? Our expert team in Phuket and Pattaya is ready to assist you. Contact us today for personalized property solutions.",
  keywords: "contact, real estate Phuket, property management Pattaya, contact form, customer service",
  openGraph: {
    title: "Contact Us | Real Estate Pulse",
    description: "Get in touch with our expert team in Phuket and Pattaya. We're here to help with all your property needs.",
  },
};

export default function ContactPage() {
  const breadcrumbs = [
    { name: 'Contact', href: '/contact' }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12 md:py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumbs */}
        <div className="mb-8">
          <Breadcrumb items={breadcrumbs} />
        </div>
        
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
            Contact PSM Phuket
          </h1>
          <p className="text-muted-foreground text-lg">
            Questions about buying, selling, or managing property in Thailand? 
            Our expert team in Phuket and Pattaya is ready to assist you.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-1">
            <Card>
              <CardContent className="p-6 flex items-start gap-4">
                <div className="bg-primary/10 p-3 rounded-lg text-primary">
                  <MapPin className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Office Locations</h3>
                  <p className="text-muted-foreground mt-1">
                    Phuket Office: Patong Beach
                    <br />
                    Pattaya Office: Central Pattaya
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 flex items-start gap-4">
                <div className="bg-primary/10 p-3 rounded-lg text-primary">
                  <Phone className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Phone</h3>
                  <p className="text-muted-foreground mt-1">
                    +66 (0)81 234 5678
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Available 7 days a week, 9am - 7pm Thailand time
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 flex items-start gap-4">
                <div className="bg-primary/10 p-3 rounded-lg text-primary">
                  <Mail className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Email</h3>
                  <p className="text-muted-foreground mt-1">
                    info@psmphuket.com
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    sales@psmphuket.com
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <ContactForm />
        </div>
      </div>
    </div>
  );
}
