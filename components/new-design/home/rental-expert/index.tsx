"use client";

import { useState } from "react";
import Image from "next/image";
import { Icon } from "@iconify/react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

export default function RentalExpert() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    propertyType: "",
    bedrooms: "",
    budget: "",
    rentalDuration: "",
    preferredAreas: "",
    moveInDate: "",
    furnished: "",
    pets: "",
    message: "",
    newsletter: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Filter out empty string values and convert to undefined for optional fields
      const submitData = Object.entries({
        ...formData,
        countryCode: "+66",
        source: "rental-expert-section",
      }).reduce((acc, [key, value]) => {
        // Convert empty strings to undefined for optional fields
        if (value === "") {
          // Don't include empty optional fields
          if (key === 'preferredAreas' || key === 'moveInDate' || key === 'furnished' || key === 'pets' || key === 'message') {
            return acc;
          }
        }
        acc[key] = value;
        return acc;
      }, {} as Record<string, any>);

      const response = await fetch('/api/rental-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Rental inquiry submitted successfully!', {
          description: `Lionel will contact you shortly at ${formData.email}`,
          duration: 5000,
        });
        
        // Reset form
        setFormData({
          name: "",
          email: "",
          phone: "",
          propertyType: "",
          bedrooms: "",
          budget: "",
          rentalDuration: "",
          preferredAreas: "",
          moveInDate: "",
          furnished: "",
          pets: "",
          message: "",
          newsletter: true,
        });
      } else {
        throw new Error(data.error || 'Submission failed');
      }
    } catch (error: any) {
      console.error('Rental lead submission error:', error);
      toast.error('Something went wrong', {
        description: 'Please try again or call Lionel directly at +66 61 714 2353',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <section className="bg-dark relative overflow-hidden pt-20 lg:pt-24 pb-8 sm:pb-10 lg:pb-12" id="rental-expert">
      {/* Background Pattern */}
      <div className="absolute right-0 top-0 opacity-20">
        <Image
          src="/images/testimonial/Vector.png"
          alt="background pattern"
          width={700}
          height={1039}
          loading="lazy"
        />
      </div>

      <div className="container max-w-7xl mx-auto px-4 sm:px-5 2xl:px-0 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          
          {/* Left Side - Expert Info */}
          <div>
            <div className="mb-6">
              <p className="text-white text-base font-semibold flex gap-2 items-center mb-4">
                <Icon icon="ph:key-fill" className="text-2xl text-primary" />
                Rental Services Expert
              </p>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
                Find Your Perfect Rental in Phuket
              </h2>
               <p className="text-white/80 text-lg leading-relaxed mb-8">
                 Looking for a long-term rental or vacation home in Phuket? Lionel Lopez, our dedicated rental specialist, brings over 30 years of experience helping expatriates and families find their ideal property. From budget-friendly apartments to luxury beachfront villas, we have exclusive access to the best rental properties in Phuket.
               </p>
            </div>

            {/* Expert Profile */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <div className="flex items-start gap-6">
                <div className="flex-shrink-0">
                  <div className="relative">
                    <Image
                      src="https://ik.imagekit.io/slydc8kod/Team/Lionel%20lopez.webp"
                      alt="Lionel Lopez - Rental Expert"
                      width={120}
                      height={120}
                      className="rounded-full border-4 border-primary shadow-lg"
                      loading="lazy"
                    />
                    <div className="absolute -bottom-2 -right-2 bg-primary text-white rounded-full p-2">
                      <Icon icon="ph:key-bold" width={20} height={20} />
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white mb-1">Lionel Lopez</h3>
                  <p className="text-primary font-semibold mb-4">Rental Property Specialist</p>
                  <div className="space-y-3">
                    <a
                      href="tel:+66617142353"
                      className="flex items-center gap-3 text-white hover:text-primary transition-colors group"
                    >
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-colors">
                        <Icon icon="ph:phone-bold" width={20} height={20} />
                      </div>
                      <div>
                        <div className="text-xs text-white/60">Direct Line</div>
                        <div className="font-semibold">+66 61 714 2353</div>
                      </div>
                    </a>
                    <a
                      href="mailto:lionel@psmphuket.com"
                      className="flex items-center gap-3 text-white hover:text-primary transition-colors group"
                    >
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-colors">
                        <Icon icon="ph:envelope-bold" width={20} height={20} />
                      </div>
                      <div>
                        <div className="text-xs text-white/60">Email</div>
                        <div className="font-semibold">lionel@psmphuket.com</div>
                      </div>
                    </a>
                  </div>
                </div>
              </div>

              {/* Trust Badges */}
              <div className="mt-6 pt-6 border-t border-white/20">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-primary">500+</div>
                    <div className="text-xs text-white/70">Happy Tenants</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-primary">30 Yrs</div>
                    <div className="text-xs text-white/70">Experience</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-primary">24/7</div>
                    <div className="text-xs text-white/70">Support</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Why Choose Us */}
            <div className="mt-8 grid grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <Icon icon="ph:check-circle-fill" className="text-primary text-xl flex-shrink-0 mt-1" />
                <div>
                  <h4 className="text-white font-semibold">Verified Properties</h4>
                  <p className="text-white/60 text-sm">All rentals personally inspected</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Icon icon="ph:check-circle-fill" className="text-primary text-xl flex-shrink-0 mt-1" />
                <div>
                  <h4 className="text-white font-semibold">Best Price Guarantee</h4>
                  <p className="text-white/60 text-sm">No hidden fees or charges</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Icon icon="ph:check-circle-fill" className="text-primary text-xl flex-shrink-0 mt-1" />
                <div>
                  <h4 className="text-white font-semibold">Instant Assistance</h4>
                  <p className="text-white/60 text-sm">Quick response guaranteed</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Icon icon="ph:check-circle-fill" className="text-primary text-xl flex-shrink-0 mt-1" />
                <div>
                  <h4 className="text-white font-semibold">Legal Support</h4>
                  <p className="text-white/60 text-sm">Contract review included</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Contact Form */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-2xl">
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-dark mb-2">Tell Us What You're Looking For</h3>
              <p className="text-gray-600">Fill out the form and Lionel will personally reach out with matching properties within 24 hours.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name" className="text-dark">Full Name *</Label>
                  <Input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="John Doe"
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="email" className="text-dark">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="john@example.com"
                    required
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <Label htmlFor="phone" className="text-dark">Phone Number *</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="+66 XX XXX XXXX"
                  required
                  className="mt-1"
                />
              </div>

              {/* Property Type & Bedrooms */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="propertyType" className="text-dark">Property Type *</Label>
                  <Select value={formData.propertyType} onValueChange={(value) => handleInputChange('propertyType', value)} required>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="villa">Villa</SelectItem>
                      <SelectItem value="apartment">Apartment</SelectItem>
                      <SelectItem value="condo">Condo</SelectItem>
                      <SelectItem value="house">House</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="bedrooms" className="text-dark">Bedrooms *</Label>
                  <Select value={formData.bedrooms} onValueChange={(value) => handleInputChange('bedrooms', value)} required>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 Bedroom</SelectItem>
                      <SelectItem value="2">2 Bedrooms</SelectItem>
                      <SelectItem value="3">3 Bedrooms</SelectItem>
                      <SelectItem value="4">4 Bedrooms</SelectItem>
                      <SelectItem value="5+">5+ Bedrooms</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Budget & Duration */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="budget" className="text-dark">Monthly Budget (THB) *</Label>
                  <Select value={formData.budget} onValueChange={(value) => handleInputChange('budget', value)} required>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select budget" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="under-20k">Under ฿20,000</SelectItem>
                      <SelectItem value="20k-40k">฿20,000 - ฿40,000</SelectItem>
                      <SelectItem value="40k-60k">฿40,000 - ฿60,000</SelectItem>
                      <SelectItem value="60k-100k">฿60,000 - ฿100,000</SelectItem>
                      <SelectItem value="100k+">฿100,000+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="rentalDuration" className="text-dark">Rental Duration *</Label>
                  <Select value={formData.rentalDuration} onValueChange={(value) => handleInputChange('rentalDuration', value)} required>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="short-term">Short-term (1-6 months)</SelectItem>
                      <SelectItem value="6-12months">6-12 Months</SelectItem>
                      <SelectItem value="1-2years">1-2 Years</SelectItem>
                      <SelectItem value="2+years">2+ Years</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Preferred Areas */}
              <div>
                <Label htmlFor="preferredAreas" className="text-dark">Preferred Areas</Label>
                <Input
                  id="preferredAreas"
                  type="text"
                  value={formData.preferredAreas}
                  onChange={(e) => handleInputChange('preferredAreas', e.target.value)}
                  placeholder="e.g., Rawai, Kata, Patong"
                  className="mt-1"
                />
              </div>

              {/* Move-in Date & Furnished */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="moveInDate" className="text-dark">Move-in Date</Label>
                  <Select value={formData.moveInDate} onValueChange={(value) => handleInputChange('moveInDate', value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="immediate">Immediate</SelectItem>
                      <SelectItem value="1month">Within 1 month</SelectItem>
                      <SelectItem value="2-3months">2-3 months</SelectItem>
                      <SelectItem value="flexible">Flexible</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="furnished" className="text-dark">Furnished?</Label>
                  <Select value={formData.furnished} onValueChange={(value) => handleInputChange('furnished', value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">Yes, Fully Furnished</SelectItem>
                      <SelectItem value="partial">Partially Furnished</SelectItem>
                      <SelectItem value="no">No, Unfurnished</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Additional Requirements */}
              <div>
                <Label htmlFor="message" className="text-dark">Additional Requirements</Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => handleInputChange('message', e.target.value)}
                  placeholder="Any specific requirements? Pool, gym, pet-friendly, parking, etc."
                  rows={3}
                  className="mt-1"
                />
              </div>

              {/* Newsletter Checkbox */}
              <div className="flex items-start gap-3">
                <Checkbox
                  id="newsletter"
                  checked={formData.newsletter}
                  onCheckedChange={(checked) => handleInputChange('newsletter', checked)}
                  className="mt-1"
                />
                <Label htmlFor="newsletter" className="text-sm text-gray-600 cursor-pointer">
                  Send me exclusive rental listings and market updates from PSM Phuket
                </Label>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-6 text-lg"
              >
                {isSubmitting ? (
                  <>
                    <Icon icon="ph:circle-notch" className="mr-2 animate-spin" width={24} height={24} />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Icon icon="ph:paper-plane-tilt-bold" className="mr-2" width={24} height={24} />
                    Get Matching Properties
                  </>
                )}
              </Button>

              <p className="text-center text-xs text-gray-500 mt-4">
                <Icon icon="ph:shield-check-fill" className="inline mr-1 text-primary" />
                Your information is secure and will only be used to match you with suitable rental properties.
              </p>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}

