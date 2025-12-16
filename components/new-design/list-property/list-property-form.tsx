"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";
import { toast } from "sonner";
import Link from "next/link";

const propertyCategories = [
  { value: "LUXURY_VILLA", label: "Luxury Villa", icon: "ph:house" },
  { value: "APARTMENT", label: "Apartment / Condo", icon: "ph:buildings" },
  { value: "RESIDENTIAL_HOME", label: "Residential Home", icon: "ph:house-line" },
  { value: "OFFICE_SPACES", label: "Commercial / Office", icon: "ph:office-chair" },
];

const propertyTypes = [
  { value: "FOR_SALE", label: "For Sale" },
  { value: "FOR_RENT", label: "For Rent" },
];

const steps = [
  { id: 1, title: "Property Details", icon: "ph:house" },
  { id: 2, title: "Owner Information", icon: "ph:user" },
  { id: 3, title: "Choose Package", icon: "ph:package" },
];

interface FormData {
  // Property Details
  propertyTitle: string;
  propertyCategory: string;
  propertyType: string;
  location: string;
  askingPrice: string;
  beds: string;
  baths: string;
  sqft: string;
  description: string;
  // Owner Information
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  // Package Selection
  exclusiveRights: boolean;
  agreementAccepted: boolean;
}

interface SubmissionResult {
  submissionId: string;
  accessToken: string;
}

export default function ListPropertyForm() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<SubmissionResult | null>(null);
  const [formData, setFormData] = useState<FormData>({
    propertyTitle: "",
    propertyCategory: "",
    propertyType: "FOR_SALE",
    location: "",
    askingPrice: "",
    beds: "",
    baths: "",
    sqft: "",
    description: "",
    ownerName: "",
    ownerEmail: "",
    ownerPhone: "",
    exclusiveRights: true,
    agreementAccepted: false,
  });

  const updateField = (field: keyof FormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const nextStep = () => {
    if (currentStep < 3) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    if (!formData.agreementAccepted) {
      toast.error("Please accept the terms and conditions");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/property-submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          commissionRate: formData.exclusiveRights ? 15 : 3,
        }),
      });

      if (!response.ok) throw new Error("Failed to submit");

      const data = await response.json();
      setSubmissionResult({
        submissionId: data.submissionId,
        accessToken: data.accessToken,
      });
      setSubmitted(true);
      toast.success("Your property has been submitted for review!");
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted && submissionResult) {
    return (
      <section id="list-form" className="py-20 lg:py-28">
        <div className="container max-w-3xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-800/50 rounded-3xl p-8 lg:p-12 text-center shadow-xl border border-slate-100 dark:border-slate-700/50"
          >
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <Icon icon="ph:check-circle-fill" className="w-10 h-10 text-green-500" />
            </div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
              Submission Received!
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 mb-6">
              Your property <strong>&quot;{formData.propertyTitle}&quot;</strong> has been submitted successfully. 
              Our team will review your submission and contact you within <strong>24 hours</strong>.
            </p>
            
            {formData.exclusiveRights && (
              <div className="bg-primary/10 rounded-xl p-4 mb-6">
                <p className="text-primary font-medium">
                  🎉 You selected our Exclusive Partnership! Once approved, we&apos;ll schedule a professional 
                  photography session and begin preparing your marketing campaign.
                </p>
              </div>
            )}

            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-6 mb-8">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-3">
                What happens next?
              </h3>
              <ol className="text-left text-slate-600 dark:text-slate-400 space-y-3">
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-medium flex-shrink-0">1</span>
                  <span>Our team reviews your submission (within 24 hours)</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-medium flex-shrink-0">2</span>
                  <span>Once approved, you can upload property photos</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-medium flex-shrink-0">3</span>
                  <span>After final review, your property goes live!</span>
                </li>
              </ol>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href={`/my-submission/${submissionResult.accessToken}`}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-primary hover:bg-primary/90 text-white font-semibold rounded-full transition-colors shadow-lg shadow-primary/30"
              >
                <Icon icon="ph:eye" className="w-5 h-5" />
                View My Submission
              </Link>
              <Link
                href="/"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 border border-slate-200 dark:border-slate-700 hover:border-primary text-slate-700 dark:text-slate-300 hover:text-primary font-medium rounded-full transition-colors"
              >
                <Icon icon="ph:house" className="w-5 h-5" />
                Back to Homepage
              </Link>
            </div>

            <p className="mt-8 text-sm text-slate-500 dark:text-slate-400">
              Bookmark this page to track your submission status. We&apos;ll also send updates to <strong>{formData.ownerEmail}</strong>.
            </p>
          </motion.div>
        </div>
      </section>
    );
  }

  return (
    <section id="list-form" className="py-20 lg:py-28">
      <div className="container max-w-4xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-4">
            <Icon icon="ph:pencil-simple" className="w-4 h-4" />
            <span className="text-sm font-medium">List Your Property</span>
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4">
            Submit Your Property Details
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Fill out the form below and we&apos;ll get your property listed within 24 hours.
          </p>
        </motion.div>

        {/* Progress Steps */}
        <div className="flex justify-between mb-12 relative">
          <div className="absolute top-6 left-0 right-0 h-0.5 bg-slate-200 dark:bg-slate-700 -z-10" />
          {steps.map((step) => (
            <div key={step.id} className="flex flex-col items-center">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                  currentStep >= step.id
                    ? "bg-primary text-white shadow-lg shadow-primary/30"
                    : "bg-white dark:bg-slate-800 text-slate-400 border-2 border-slate-200 dark:border-slate-700"
                }`}
              >
                <Icon icon={step.icon} className="w-5 h-5" />
              </div>
              <span className={`mt-2 text-sm font-medium ${
                currentStep >= step.id ? "text-primary" : "text-slate-400"
              }`}>
                {step.title}
              </span>
            </div>
          ))}
        </div>

        {/* Form Card */}
        <div className="bg-white dark:bg-slate-800/50 rounded-3xl p-6 lg:p-10 shadow-xl border border-slate-100 dark:border-slate-700/50">
          <AnimatePresence mode="wait">
            {/* Step 1: Property Details */}
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Property Title *
                  </label>
                  <input
                    type="text"
                    value={formData.propertyTitle}
                    onChange={(e) => updateField("propertyTitle", e.target.value)}
                    placeholder="e.g., Stunning Beachfront Villa in Kamala"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                    Property Category *
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {propertyCategories.map((cat) => (
                      <button
                        key={cat.value}
                        type="button"
                        onClick={() => updateField("propertyCategory", cat.value)}
                        className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                          formData.propertyCategory === cat.value
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-slate-200 dark:border-slate-700 hover:border-primary/50"
                        }`}
                      >
                        <Icon icon={cat.icon} className="w-6 h-6" />
                        <span className="font-medium">{cat.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Listing Type *
                    </label>
                    <div className="flex gap-3">
                      {propertyTypes.map((type) => (
                        <button
                          key={type.value}
                          type="button"
                          onClick={() => updateField("propertyType", type.value)}
                          className={`flex-1 py-3 px-4 rounded-xl border-2 font-medium transition-all ${
                            formData.propertyType === type.value
                              ? "border-primary bg-primary text-white"
                              : "border-slate-200 dark:border-slate-700 hover:border-primary/50"
                          }`}
                        >
                          {type.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Asking Price (THB) *
                    </label>
                    <input
                      type="text"
                      value={formData.askingPrice}
                      onChange={(e) => updateField("askingPrice", e.target.value)}
                      placeholder="e.g., 25,000,000"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Location / Address *
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => updateField("location", e.target.value)}
                    placeholder="e.g., Kamala, Phuket, Thailand"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Bedrooms *
                    </label>
                    <input
                      type="number"
                      value={formData.beds}
                      onChange={(e) => updateField("beds", e.target.value)}
                      placeholder="4"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Bathrooms *
                    </label>
                    <input
                      type="number"
                      value={formData.baths}
                      onChange={(e) => updateField("baths", e.target.value)}
                      placeholder="3"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Size (m²) *
                    </label>
                    <input
                      type="number"
                      value={formData.sqft}
                      onChange={(e) => updateField("sqft", e.target.value)}
                      placeholder="350"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Property Description *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => updateField("description", e.target.value)}
                    rows={4}
                    placeholder="Describe your property's key features, amenities, and what makes it special..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                  />
                </div>
              </motion.div>
            )}

            {/* Step 2: Owner Information */}
            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <Icon icon="ph:info" className="w-5 h-5 text-blue-500 mt-0.5" />
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Your contact information is kept confidential and only used for communication 
                      regarding your property listing.
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={formData.ownerName}
                    onChange={(e) => updateField("ownerName", e.target.value)}
                    placeholder="Your full name"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={formData.ownerEmail}
                    onChange={(e) => updateField("ownerEmail", e.target.value)}
                    placeholder="your@email.com"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={formData.ownerPhone}
                    onChange={(e) => updateField("ownerPhone", e.target.value)}
                    placeholder="+66 XX XXX XXXX"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>
              </motion.div>
            )}

            {/* Step 3: Choose Package */}
            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="text-center mb-8">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                    Select Your Listing Package
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    Choose how you want to market your property
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Standard Option */}
                  <button
                    type="button"
                    onClick={() => updateField("exclusiveRights", false)}
                    className={`text-left p-6 rounded-2xl border-2 transition-all ${
                      !formData.exclusiveRights
                        ? "border-slate-400 bg-slate-50 dark:bg-slate-800"
                        : "border-slate-200 dark:border-slate-700 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-lg font-semibold text-slate-900 dark:text-white">
                        Standard
                      </span>
                      <span className={`w-5 h-5 rounded-full border-2 ${
                        !formData.exclusiveRights 
                          ? "border-slate-600 bg-slate-600" 
                          : "border-slate-300"
                      }`}>
                        {!formData.exclusiveRights && (
                          <Icon icon="ph:check" className="w-full h-full text-white" />
                        )}
                      </span>
                    </div>
                    <div className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                      6% <span className="text-sm font-normal text-slate-500">commission</span>
                    </div>
                    <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                      <li className="flex items-center gap-2">
                        <Icon icon="ph:check" className="w-4 h-4 text-slate-400" />
                        Basic website listing
                      </li>
                      <li className="flex items-center gap-2">
                        <Icon icon="ph:x" className="w-4 h-4 text-red-400" />
                        No paid marketing
                      </li>
                    </ul>
                  </button>

                  {/* Exclusive Option */}
                  <button
                    type="button"
                    onClick={() => updateField("exclusiveRights", true)}
                    className={`text-left p-6 rounded-2xl border-2 transition-all relative ${
                      formData.exclusiveRights
                        ? "border-primary bg-primary/5"
                        : "border-slate-200 dark:border-slate-700 hover:border-primary/50"
                    }`}
                  >
                    <div className="absolute -top-3 right-4">
                      <span className="px-3 py-1 bg-primary text-white text-xs font-bold rounded-full">
                        BEST VALUE
                      </span>
                    </div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-lg font-semibold text-slate-900 dark:text-white">
                        Exclusive Partnership
                      </span>
                      <span className={`w-5 h-5 rounded-full border-2 ${
                        formData.exclusiveRights 
                          ? "border-primary bg-primary" 
                          : "border-slate-300"
                      }`}>
                        {formData.exclusiveRights && (
                          <Icon icon="ph:check" className="w-full h-full text-white" />
                        )}
                      </span>
                    </div>
                    <div className="text-2xl font-bold text-primary mb-4">
                      15% <span className="text-sm font-normal text-slate-500">minimum</span>
                    </div>
                    <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                      <li className="flex items-center gap-2">
                        <Icon icon="ph:check-circle-fill" className="w-4 h-4 text-green-500" />
                        Google Ads campaign
                      </li>
                      <li className="flex items-center gap-2">
                        <Icon icon="ph:check-circle-fill" className="w-4 h-4 text-green-500" />
                        TikTok & Instagram marketing
                      </li>
                      <li className="flex items-center gap-2">
                        <Icon icon="ph:check-circle-fill" className="w-4 h-4 text-green-500" />
                        Professional photography
                      </li>
                      <li className="flex items-center gap-2">
                        <Icon icon="ph:check-circle-fill" className="w-4 h-4 text-green-500" />
                        Priority placement
                      </li>
                    </ul>
                  </button>
                </div>

                {formData.exclusiveRights && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4"
                  >
                    <div className="flex items-start gap-3">
                      <Icon icon="ph:rocket-launch" className="w-5 h-5 text-green-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-green-700 dark:text-green-300">
                          Excellent choice! With our Exclusive Partnership:
                        </p>
                        <ul className="mt-2 text-sm text-green-600 dark:text-green-400 space-y-1">
                          <li>• Your property will be featured in targeted Google Ads campaigns</li>
                          <li>• We&apos;ll create viral TikTok content reaching millions of potential buyers</li>
                          <li>• Professional photos and video tours included at no extra cost</li>
                          <li>• Average selling time: 60-180 days (vs 180-360 days standard)</li>
                        </ul>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Terms acceptance */}
                <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.agreementAccepted}
                      onChange={(e) => updateField("agreementAccepted", e.target.checked)}
                      className="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary mt-0.5"
                    />
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      I agree to the{" "}
                      <a href="/terms-and-conditions" className="text-primary hover:underline">
                        Terms and Conditions
                      </a>{" "}
                      and understand the commission structure for{" "}
                      {formData.exclusiveRights ? "Exclusive Partnership (15% minimum)" : "Standard Listing (3%)"}.
                    </span>
                  </label>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={prevStep}
              disabled={currentStep === 1}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
                currentStep === 1
                  ? "opacity-0 pointer-events-none"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              <Icon icon="ph:arrow-left" className="w-5 h-5" />
              Previous
            </button>

            {currentStep < 3 ? (
              <button
                type="button"
                onClick={nextStep}
                className="flex items-center gap-2 px-8 py-3 bg-primary hover:bg-primary/90 text-white font-medium rounded-xl transition-colors shadow-lg shadow-primary/30"
              >
                Continue
                <Icon icon="ph:arrow-right" className="w-5 h-5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting || !formData.agreementAccepted}
                className="flex items-center gap-2 px-8 py-3 bg-primary hover:bg-primary/90 text-white font-medium rounded-xl transition-colors shadow-lg shadow-primary/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Icon icon="ph:spinner" className="w-5 h-5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Icon icon="ph:paper-plane-tilt" className="w-5 h-5" />
                    Submit Property
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

