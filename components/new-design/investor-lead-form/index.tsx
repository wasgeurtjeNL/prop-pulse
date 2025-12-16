"use client";

import { useState } from "react";
import { Icon } from "@iconify/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

interface InvestorFormData {
  // Step 1: Contact Info
  name: string;
  email: string;
  phone: string;
  countryCode: string;
  currency: string; // EUR, USD, THB, GBP
  
  // Step 2: Investment Profile  
  investmentBudget: string;
  investmentGoal: string;
  timeline: string;
  
  // Step 3: Preferences
  preferredAreas: string[];
  propertyType: string;
  experience: string;
  financing: string;
  message: string;
  newsletter: boolean;
}

export default function InvestorLeadForm() {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<InvestorFormData>({
    name: "",
    email: "",
    phone: "",
    countryCode: "+66",
    currency: "EUR",
    investmentBudget: "",
    investmentGoal: "",
    timeline: "",
    preferredAreas: [],
    propertyType: "",
    experience: "",
    financing: "",
    message: "",
    newsletter: true,
  });

  // Currency conversion rates (base: EUR)
  const currencyRates: Record<string, { symbol: string; rate: number }> = {
    EUR: { symbol: "€", rate: 1 },
    USD: { symbol: "$", rate: 1.08 },
    GBP: { symbol: "£", rate: 0.86 },
    THB: { symbol: "฿", rate: 36 },
    AUD: { symbol: "A$", rate: 1.65 },
  };

  const formatCurrency = (amount: number, currency: string) => {
    const { symbol, rate } = currencyRates[currency];
    const converted = Math.round(amount * rate);
    return `${symbol}${converted.toLocaleString()}`;
  };

  const getBudgetOptions = (currency: string) => {
    return [
      { 
        value: "50k-200k", 
        label: `${formatCurrency(50000, currency)} - ${formatCurrency(200000, currency)}`, 
        subtitle: "Starter Portfolio" 
      },
      { 
        value: "200k-500k", 
        label: `${formatCurrency(200000, currency)} - ${formatCurrency(500000, currency)}`, 
        subtitle: "Medium Investment" 
      },
      { 
        value: "500k-1m", 
        label: `${formatCurrency(500000, currency)} - ${formatCurrency(1000000, currency)}`, 
        subtitle: "Advanced Portfolio" 
      },
      { 
        value: "1m+", 
        label: `${formatCurrency(1000000, currency)}+`, 
        subtitle: "Premium Investor" 
      },
    ];
  };

  const budgetOptions = getBudgetOptions(formData.currency);

  const goalOptions = [
    { value: "buy-hold", label: "Buy & Hold", icon: "ph:house-bold", subtitle: "Long-term appreciation" },
    { value: "fix-flip", label: "Fix & Flip", icon: "ph:hammer-bold", subtitle: "Quick returns" },
    { value: "rental-income", label: "Rental Income", icon: "ph:currency-dollar-bold", subtitle: "Passive income" },
    { value: "vacation-home", label: "Vacation Home", icon: "ph:sun-horizon-bold", subtitle: "Personal use + ROI" },
    { value: "diversification", label: "Portfolio Diversification", icon: "ph:chart-line-up-bold", subtitle: "Spread risk" },
  ];

  const timelineOptions = [
    { value: "immediate", label: "Ready Now", subtitle: "Looking to invest immediately" },
    { value: "3-6months", label: "3-6 Months", subtitle: "Researching & planning" },
    { value: "6-12months", label: "6-12 Months", subtitle: "Long-term planning" },
    { value: "12+months", label: "12+ Months", subtitle: "Future consideration" },
  ];

  const areaOptions = [
    { value: "phuket", label: "Phuket" },
    { value: "pattaya", label: "Pattaya" },
    { value: "bangkok", label: "Bangkok" },
    { value: "samui", label: "Koh Samui" },
    { value: "hua-hin", label: "Hua Hin" },
  ];

  const propertyTypeOptions = [
    { value: "villa", label: "Villa", icon: "ph:house-line-bold" },
    { value: "apartment", label: "Apartment", icon: "ph:buildings-bold" },
    { value: "commercial", label: "Commercial", icon: "ph:storefront-bold" },
    { value: "land", label: "Land", icon: "ph:tree-bold" },
  ];

  const handleNext = () => {
    if (step === 1 && (!formData.name || !formData.email || !formData.phone)) {
      toast.error("Please fill in all contact information");
      return;
    }
    if (step === 2 && (!formData.investmentBudget || !formData.investmentGoal || !formData.timeline)) {
      toast.error("Please complete your investment profile");
      return;
    }
    setStep(step + 1);
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      // Prepare data and remove empty optional fields
      const submitData: any = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        countryCode: formData.countryCode,
        currency: formData.currency,
        investmentBudget: formData.investmentBudget,
        investmentGoal: formData.investmentGoal,
        timeline: formData.timeline,
        newsletter: formData.newsletter,
      };

      // Only add optional fields if they have values
      if (formData.preferredAreas.length > 0) {
        submitData.preferredAreas = formData.preferredAreas.join(', ');
      }
      if (formData.propertyType) {
        submitData.propertyType = formData.propertyType;
      }
      if (formData.experience) {
        submitData.experience = formData.experience;
      }
      if (formData.financing) {
        submitData.financing = formData.financing;
      }
      if (formData.message && formData.message.trim()) {
        submitData.message = formData.message;
      }

      const response = await fetch('/api/investor-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Thank you! We\'ll send you exclusive investment opportunities within 24 hours.', {
          description: `Confirmation sent to ${formData.email}`,
          duration: 5000,
        });
        
        // Reset form
        setFormData({
          name: "",
          email: "",
          phone: "",
          countryCode: "+66",
          currency: "EUR",
          investmentBudget: "",
          investmentGoal: "",
          timeline: "",
          preferredAreas: [],
          propertyType: "",
          experience: "",
          financing: "",
          message: "",
          newsletter: true,
        });
        setStep(1);
      } else {
        toast.error('Failed to submit your inquiry', {
          description: data.error || 'Please try again',
        });
      }
    } catch (error) {
      console.error('[InvestorLeadForm] Submit error:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleArea = (area: string) => {
    setFormData(prev => ({
      ...prev,
      preferredAreas: prev.preferredAreas.includes(area)
        ? prev.preferredAreas.filter(a => a !== area)
        : [...prev.preferredAreas, area]
    }));
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 sm:p-8 lg:p-10 border border-gray-100 dark:border-gray-700">
      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center flex-1">
              <div
                className={`h-10 w-10 rounded-full flex items-center justify-center font-bold transition-all duration-300 ${
                  step >= s
                    ? 'bg-primary text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                }`}
              >
                {step > s ? <Icon icon="ph:check-bold" width={20} height={20} /> : s}
              </div>
              {s < 3 && (
                <div
                  className={`h-1 flex-1 mx-2 transition-all duration-300 ${
                    step > s ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between text-xs sm:text-sm">
          <span className={step >= 1 ? 'text-primary font-semibold' : 'text-gray-500'}>Contact Info</span>
          <span className={step >= 2 ? 'text-primary font-semibold' : 'text-gray-500'}>Investment Profile</span>
          <span className={step >= 3 ? 'text-primary font-semibold' : 'text-gray-500'}>Preferences</span>
        </div>
      </div>

      {/* Step 1: Contact Information */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="text-center mb-6">
            <h3 className="text-2xl font-bold text-dark dark:text-white mb-2">
              Let's Get Started
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Tell us how to reach you with exclusive investment opportunities
            </p>
          </div>

          <div>
            <Label htmlFor="name">Full Name *</Label>
            <Input
              id="name"
              placeholder="John Smith"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              placeholder="john@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="phone">Phone Number *</Label>
            <div className="flex gap-2 mt-1">
              <Input
                className="w-24"
                value={formData.countryCode}
                onChange={(e) => setFormData({ ...formData, countryCode: e.target.value })}
              />
              <Input
                id="phone"
                placeholder="81 234 5678"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="flex-1"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="currency">Preferred Currency *</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-1">
              {Object.entries(currencyRates).map(([code, { symbol }]) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => setFormData({ ...formData, currency: code })}
                  className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all ${
                    formData.currency === code
                      ? 'border-primary bg-primary/5 text-primary font-semibold'
                      : 'border-gray-200 dark:border-gray-700 hover:border-primary/50'
                  }`}
                >
                  <span className="text-lg">{symbol}</span>
                  <span>{code}</span>
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              <Icon icon="ph:info-bold" className="inline mr-1" width={14} height={14} />
              This helps us show property prices in your preferred currency
            </p>
          </div>

          <div className="flex items-start gap-2 p-4 bg-primary/5 dark:bg-primary/10 rounded-lg">
            <Icon icon="ph:lock-bold" className="text-primary mt-0.5 flex-shrink-0" width={20} height={20} />
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Your information is confidential and will only be used to send you curated investment opportunities.
            </p>
          </div>

          <Button onClick={handleNext} className="w-full" size="lg">
            Continue <Icon icon="ph:arrow-right-bold" className="ml-2" width={20} height={20} />
          </Button>
        </div>
      )}

      {/* Step 2: Investment Profile */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="text-center mb-6">
            <h3 className="text-2xl font-bold text-dark dark:text-white mb-2">
              Your Investment Profile
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Help us match you with the perfect opportunities
            </p>
          </div>

          <div>
            <Label className="text-base font-semibold mb-3 block">Investment Budget *</Label>
            <RadioGroup value={formData.investmentBudget} onValueChange={(value) => setFormData({ ...formData, investmentBudget: value })}>
              {budgetOptions.map((option) => (
                <div
                  key={option.value}
                  className={`flex items-center space-x-3 p-4 rounded-lg border-2 transition-all cursor-pointer ${
                    formData.investmentBudget === option.value
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 dark:border-gray-700 hover:border-primary/50'
                  }`}
                  onClick={() => setFormData({ ...formData, investmentBudget: option.value })}
                >
                  <RadioGroupItem value={option.value} id={option.value} />
                  <div className="flex-1">
                    <Label htmlFor={option.value} className="font-semibold text-base cursor-pointer">{option.label}</Label>
                    <p className="text-sm text-gray-500">{option.subtitle}</p>
                  </div>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div>
            <Label className="text-base font-semibold mb-3 block">Investment Goal *</Label>
            <RadioGroup value={formData.investmentGoal} onValueChange={(value) => setFormData({ ...formData, investmentGoal: value })}>
              {goalOptions.map((option) => (
                <div
                  key={option.value}
                  className={`flex items-center space-x-3 p-4 rounded-lg border-2 transition-all cursor-pointer ${
                    formData.investmentGoal === option.value
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 dark:border-gray-700 hover:border-primary/50'
                  }`}
                  onClick={() => setFormData({ ...formData, investmentGoal: option.value })}
                >
                  <RadioGroupItem value={option.value} id={option.value} />
                  <Icon icon={option.icon} className="text-primary" width={24} height={24} />
                  <div className="flex-1">
                    <Label htmlFor={option.value} className="font-semibold text-base cursor-pointer">{option.label}</Label>
                    <p className="text-sm text-gray-500">{option.subtitle}</p>
                  </div>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div>
            <Label className="text-base font-semibold mb-3 block">Investment Timeline *</Label>
            <RadioGroup value={formData.timeline} onValueChange={(value) => setFormData({ ...formData, timeline: value })}>
              {timelineOptions.map((option) => (
                <div
                  key={option.value}
                  className={`flex items-center space-x-3 p-4 rounded-lg border-2 transition-all cursor-pointer ${
                    formData.timeline === option.value
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 dark:border-gray-700 hover:border-primary/50'
                  }`}
                  onClick={() => setFormData({ ...formData, timeline: option.value })}
                >
                  <RadioGroupItem value={option.value} id={option.value} />
                  <div className="flex-1">
                    <Label htmlFor={option.value} className="font-semibold text-base cursor-pointer">{option.label}</Label>
                    <p className="text-sm text-gray-500">{option.subtitle}</p>
                  </div>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="flex gap-3">
            <Button onClick={handleBack} variant="outline" className="flex-1" size="lg">
              <Icon icon="ph:arrow-left-bold" className="mr-2" width={20} height={20} /> Back
            </Button>
            <Button onClick={handleNext} className="flex-1" size="lg">
              Continue <Icon icon="ph:arrow-right-bold" className="ml-2" width={20} height={20} />
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Preferences & Submit */}
      {step === 3 && (
        <div className="space-y-6">
          <div className="text-center mb-6">
            <h3 className="text-2xl font-bold text-dark dark:text-white mb-2">
              Almost Done!
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Final details to personalize your investment opportunities
            </p>
          </div>

          <div>
            <Label className="text-base font-semibold mb-3 block">Preferred Areas (Select all that apply)</Label>
            <div className="grid grid-cols-2 gap-3">
              {areaOptions.map((option) => (
                <div
                  key={option.value}
                  className={`flex items-center space-x-2 p-3 rounded-lg border-2 transition-all cursor-pointer ${
                    formData.preferredAreas.includes(option.value)
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 dark:border-gray-700 hover:border-primary/50'
                  }`}
                  onClick={() => toggleArea(option.value)}
                >
                  <Checkbox
                    id={option.value}
                    checked={formData.preferredAreas.includes(option.value)}
                    onCheckedChange={() => toggleArea(option.value)}
                  />
                  <Label htmlFor={option.value} className="cursor-pointer flex-1">{option.label}</Label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-base font-semibold mb-3 block">Property Type Preference</Label>
            <div className="grid grid-cols-2 gap-3">
              {propertyTypeOptions.map((option) => (
                <div
                  key={option.value}
                  className={`flex items-center space-x-2 p-3 rounded-lg border-2 transition-all cursor-pointer ${
                    formData.propertyType === option.value
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 dark:border-gray-700 hover:border-primary/50'
                  }`}
                  onClick={() => setFormData({ ...formData, propertyType: option.value })}
                >
                  <Icon icon={option.icon} className="text-primary" width={24} height={24} />
                  <Label htmlFor={option.value} className="cursor-pointer">{option.label}</Label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="message">Additional Information (Optional)</Label>
            <Textarea
              id="message"
              placeholder="Tell us more about your investment goals, specific requirements, or questions..."
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              className="mt-1"
              rows={4}
            />
          </div>

          <div className="flex items-start gap-2 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <Checkbox
              id="newsletter"
              checked={formData.newsletter}
              onCheckedChange={(checked) => setFormData({ ...formData, newsletter: checked as boolean })}
            />
            <div className="flex-1">
              <Label htmlFor="newsletter" className="cursor-pointer font-medium">
                Send me exclusive investment opportunities & market insights
              </Label>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Get first access to below-market properties and ROI calculations
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button onClick={handleBack} variant="outline" className="flex-1" size="lg">
              <Icon icon="ph:arrow-left-bold" className="mr-2" width={20} height={20} /> Back
            </Button>
            <Button 
              onClick={handleSubmit} 
              className="flex-1" 
              size="lg"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Icon icon="ph:circle-notch" className="mr-2 animate-spin" width={20} height={20} />
                  Submitting...
                </>
              ) : (
                <>
                  Submit <Icon icon="ph:check-bold" className="ml-2" width={20} height={20} />
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

