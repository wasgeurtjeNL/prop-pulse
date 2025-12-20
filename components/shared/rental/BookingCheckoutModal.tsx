"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Icon } from "@iconify/react";
import { format } from "date-fns";
import { enUS } from "date-fns/locale";
import { formatRentalPrice } from "@/lib/services/rental-pricing";
import { useCurrencyExchange } from "@/hooks/use-currency-exchange";
import { cn } from "@/lib/utils";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const countryCodes = [
  { code: "+66", country: "Thailand", flag: "🇹🇭" },
  { code: "+1", country: "USA/Canada", flag: "🇺🇸" },
  { code: "+44", country: "UK", flag: "🇬🇧" },
  { code: "+61", country: "Australia", flag: "🇦🇺" },
  { code: "+49", country: "Germany", flag: "🇩🇪" },
  { code: "+33", country: "France", flag: "🇫🇷" },
  { code: "+31", country: "Netherlands", flag: "🇳🇱" },
  { code: "+7", country: "Russia", flag: "🇷🇺" },
  { code: "+86", country: "China", flag: "🇨🇳" },
  { code: "+81", country: "Japan", flag: "🇯🇵" },
  { code: "+82", country: "South Korea", flag: "🇰🇷" },
  { code: "+65", country: "Singapore", flag: "🇸🇬" },
  { code: "+60", country: "Malaysia", flag: "🇲🇾" },
  { code: "+91", country: "India", flag: "🇮🇳" },
  { code: "+971", country: "UAE", flag: "🇦🇪" },
];

interface BookingCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingData: {
    checkIn: Date;
    checkOut: Date;
    adults: number;
    children: number;
    babies: number;
    pets: number;
    nights: number;
    pricePerNight: number;
    subtotal: number;
    serviceFee: number;
    total: number;
    discountPercent: number;
  };
  property: {
    id: string;
    title: string;
    image: string;
    location: string;
  };
  onConfirmBooking: (guestInfo: GuestInfo) => Promise<void>;
}

interface GuestInfo {
  name: string;
  email: string;
  phone: string;
  countryCode: string;
  message?: string;
}

type CheckoutStep = "auth" | "guest-info" | "payment" | "confirmation";

export default function BookingCheckoutModal({
  isOpen,
  onClose,
  bookingData,
  property,
  onConfirmBooking,
}: BookingCheckoutModalProps) {
  const router = useRouter();
  const { data: session, isPending: isSessionLoading } = authClient.useSession();
  
  // Determine initial step based on auth status
  const [step, setStep] = useState<CheckoutStep>("auth");
  const [isLoading, setIsLoading] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  // Auth form state
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authName, setAuthName] = useState("");
  const [authError, setAuthError] = useState("");
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  
  // Currency exchange
  const { formatMultiPrice, isLoading: currencyLoading } = useCurrencyExchange();
  const [guestInfo, setGuestInfo] = useState<GuestInfo>({
    name: "",
    email: "",
    phone: "",
    countryCode: "+66",
    message: "",
  });
  const [errors, setErrors] = useState<Partial<GuestInfo>>({});

  // Check auth status and update step accordingly
  useEffect(() => {
    if (!isSessionLoading) {
      if (session?.user) {
        // User is logged in, skip to guest-info and prefill data
        setStep("guest-info");
        setGuestInfo(prev => ({
          ...prev,
          name: session.user.name || prev.name,
          email: session.user.email || prev.email,
        }));
      } else {
        // User is not logged in, show auth step
        setStep("auth");
      }
    }
  }, [session, isSessionLoading]);

  // Handle email login
  const handleEmailLogin = async () => {
    setIsAuthLoading(true);
    setAuthError("");
    
    try {
      const { data, error } = await authClient.signIn.email({
        email: authEmail,
        password: authPassword,
      });
      
      if (error) {
        setAuthError(error.message || "Invalid email or password");
      } else if (data) {
        // Login successful - session will update and useEffect will handle the step change
      }
    } catch (err) {
      setAuthError("An error occurred. Please try again.");
    } finally {
      setIsAuthLoading(false);
    }
  };

  // Handle email signup
  const handleEmailSignup = async () => {
    setIsAuthLoading(true);
    setAuthError("");
    
    if (!authName.trim()) {
      setAuthError("Please enter your name");
      setIsAuthLoading(false);
      return;
    }
    
    try {
      const { data, error } = await authClient.signUp.email({
        email: authEmail,
        password: authPassword,
        name: authName,
      });
      
      if (error) {
        setAuthError(error.message || "Could not create account");
      } else if (data) {
        // Signup successful - session will update and useEffect will handle the step change
      }
    } catch (err) {
      setAuthError("An error occurred. Please try again.");
    } finally {
      setIsAuthLoading(false);
    }
  };

  // Handle social login
  const handleSocialLogin = async (provider: "google" | "facebook" | "apple") => {
    setIsAuthLoading(true);
    setAuthError("");
    
    try {
      await authClient.signIn.social({
        provider,
        callbackURL: window.location.href,
      });
    } catch (err) {
      setAuthError("An error occurred. Please try again.");
      setIsAuthLoading(false);
    }
  };

  const validateGuestInfo = () => {
    const newErrors: Partial<GuestInfo> = {};
    
    if (!guestInfo.name.trim()) {
      newErrors.name = "Name is required";
    }
    
    if (!guestInfo.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestInfo.email)) {
      newErrors.email = "Please enter a valid email";
    }
    
    if (!guestInfo.phone.trim()) {
      newErrors.phone = "Phone number is required";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinueToPayment = () => {
    if (validateGuestInfo()) {
      setStep("payment");
    }
  };

  const handleConfirmBooking = async () => {
    setIsLoading(true);
    try {
      await onConfirmBooking(guestInfo);
      setStep("confirmation");
    } catch (error) {
      console.error("Booking error:", error);
      const errorMessage = error instanceof Error ? error.message : "Something went wrong";
      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const cancellationDate = new Date(bookingData.checkIn.getTime() - 24 * 60 * 60 * 1000);

  const formatGuests = () => {
    const parts = [];
    if (bookingData.adults > 0) {
      parts.push(`${bookingData.adults} ${bookingData.adults === 1 ? "adult" : "adults"}`);
    }
    if (bookingData.children > 0) {
      parts.push(`${bookingData.children} ${bookingData.children === 1 ? "child" : "children"}`);
    }
    if (bookingData.babies > 0) {
      parts.push(`${bookingData.babies} ${bookingData.babies === 1 ? "infant" : "infants"}`);
    }
    if (bookingData.pets > 0) {
      parts.push(`${bookingData.pets} ${bookingData.pets === 1 ? "pet" : "pets"}`);
    }
    return parts.join(", ");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl lg:max-w-5xl max-h-[90vh] overflow-y-auto p-0 rounded-xl">
        {/* Loading state */}
        {isSessionLoading ? (
          <div className="p-8 flex items-center justify-center">
            <Icon icon="ph:spinner" className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : step === "auth" ? (
          // Authentication Step - Airbnb Style
          <div className="p-6 lg:p-8">
            <DialogHeader className="mb-6 text-center">
              <button 
                onClick={onClose}
                className="absolute left-4 top-4 text-muted-foreground hover:text-foreground"
              >
                <Icon icon="ph:x" className="w-5 h-5" />
              </button>
              <DialogTitle className="text-xl font-semibold">
                Log in or sign up to book
              </DialogTitle>
            </DialogHeader>

            {/* Property Summary */}
            <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg mb-6">
              <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-gray-200 dark:bg-gray-700">
                {property.image && !imageError ? (
                  <img 
                    src={property.image} 
                    alt={property.title}
                    className="w-full h-full object-cover"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Icon icon="ph:house" className="w-6 h-6 text-gray-400" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium truncate">{property.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {format(bookingData.checkIn, "MMM d", { locale: enUS })} – {format(bookingData.checkOut, "MMM d", { locale: enUS })} · {formatGuests()}
                </p>
                <p className="text-sm font-semibold">{formatRentalPrice(bookingData.total)}</p>
              </div>
            </div>

            {/* Auth Error */}
            {authError && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
                {authError}
              </div>
            )}

            {/* Email/Password Form */}
            <div className="space-y-4 mb-6">
              {authMode === "signup" && (
                <div>
                  <Label htmlFor="auth-name">Full name</Label>
                  <Input
                    id="auth-name"
                    type="text"
                    placeholder="John Doe"
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                    className="mt-1"
                  />
                </div>
              )}
              <div>
                <Label htmlFor="auth-email">Email</Label>
                <Input
                  id="auth-email"
                  type="email"
                  placeholder="email@example.com"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="auth-password">Password</Label>
                <Input
                  id="auth-password"
                  type="password"
                  placeholder="••••••••"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  className="mt-1"
                />
              </div>
              <Button 
                onClick={authMode === "login" ? handleEmailLogin : handleEmailSignup}
                disabled={isAuthLoading || !authEmail || !authPassword}
                className="w-full bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600"
              >
                {isAuthLoading ? (
                  <Icon icon="ph:spinner" className="w-5 h-5 animate-spin" />
                ) : authMode === "login" ? (
                  "Continue"
                ) : (
                  "Sign up"
                )}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                {authMode === "login" ? (
                  <>
                    Don&apos;t have an account?{" "}
                    <button 
                      onClick={() => setAuthMode("signup")}
                      className="text-primary hover:underline font-medium"
                    >
                      Sign up
                    </button>
                  </>
                ) : (
                  <>
                    Already have an account?{" "}
                    <button 
                      onClick={() => setAuthMode("login")}
                      className="text-primary hover:underline font-medium"
                    >
                      Log in
                    </button>
                  </>
                )}
              </p>
            </div>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-background px-4 text-muted-foreground">or</span>
              </div>
            </div>

            {/* Social Login Buttons */}
            <div className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full h-12 justify-start gap-4"
                onClick={() => handleSocialLogin("google")}
                disabled={isAuthLoading}
              >
                <Icon icon="flat-color-icons:google" className="w-5 h-5" />
                <span className="flex-1 text-center">Continue with Google</span>
              </Button>
              <Button 
                variant="outline" 
                className="w-full h-12 justify-start gap-4"
                onClick={() => handleSocialLogin("facebook")}
                disabled={isAuthLoading}
              >
                <Icon icon="logos:facebook" className="w-5 h-5" />
                <span className="flex-1 text-center">Continue with Facebook</span>
              </Button>
              <Button 
                variant="outline" 
                className="w-full h-12 justify-start gap-4"
                onClick={() => handleSocialLogin("apple")}
                disabled={isAuthLoading}
              >
                <Icon icon="ic:baseline-apple" className="w-5 h-5" />
                <span className="flex-1 text-center">Continue with Apple</span>
              </Button>
            </div>

            {/* Privacy Note */}
            <p className="mt-6 text-xs text-center text-muted-foreground">
              By continuing, you agree to our{" "}
              <a href="/terms" className="underline hover:text-foreground">Terms of Service</a>
              {" "}and{" "}
              <a href="/privacy" className="underline hover:text-foreground">Privacy Policy</a>.
            </p>
          </div>
        ) : step === "confirmation" ? (
          // Confirmation Step
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Icon icon="ph:check-circle-fill" className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Booking Confirmed!</h2>
            <p className="text-muted-foreground mb-6">
              Your reservation has been submitted. We&apos;ll send a confirmation email to {guestInfo.email}
            </p>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mb-6 text-left">
              <h3 className="font-semibold mb-2">{property.title}</h3>
              <p className="text-sm text-muted-foreground">
                {format(bookingData.checkIn, "EEE, MMM d", { locale: enUS })} – {format(bookingData.checkOut, "EEE, MMM d, yyyy", { locale: enUS })}
              </p>
              <p className="text-sm text-muted-foreground">{formatGuests()}</p>
              <p className="font-semibold mt-2">Total: {formatRentalPrice(bookingData.total)}</p>
              {!currencyLoading && (
                <p className="text-sm text-muted-foreground">
                  ≈ {formatMultiPrice(bookingData.total).eur} / {formatMultiPrice(bookingData.total).usd}
                </p>
              )}
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => router.push("/my-bookings")} className="flex-1">
                View My Bookings
              </Button>
              <Button onClick={onClose} className="flex-1">
                Done
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row">
            {/* Form Section - Left Side on Desktop */}
            <div className="flex-1 p-6 lg:p-8 lg:border-r lg:overflow-y-auto lg:max-h-[85vh]">
              <DialogHeader className="mb-6">
                <button 
                  onClick={step === "payment" ? () => setStep("guest-info") : onClose}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
                >
                  <Icon icon="ph:arrow-left" className="w-4 h-4" />
                  Back
                </button>
                <DialogTitle className="text-2xl font-bold">
                  {step === "guest-info" ? "Confirm and pay" : "Complete payment"}
                </DialogTitle>
              </DialogHeader>

              {step === "guest-info" && (
                <div className="space-y-6">
                  {/* Guest Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Your information</h3>
                    
                    <div className="space-y-2">
                      <Label htmlFor="name">Full name</Label>
                      <Input
                        id="name"
                        placeholder="Enter your full name"
                        value={guestInfo.name}
                        onChange={(e) => setGuestInfo({ ...guestInfo, name: e.target.value })}
                        className={errors.name ? "border-red-500" : ""}
                      />
                      {errors.name && (
                        <p className="text-sm text-red-500">{errors.name}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email address</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="your@email.com"
                        value={guestInfo.email}
                        onChange={(e) => setGuestInfo({ ...guestInfo, email: e.target.value })}
                        className={errors.email ? "border-red-500" : ""}
                      />
                      {errors.email && (
                        <p className="text-sm text-red-500">{errors.email}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone number</Label>
                      <div className="flex gap-2">
                        <Select
                          value={guestInfo.countryCode}
                          onValueChange={(value) => setGuestInfo({ ...guestInfo, countryCode: value })}
                        >
                          <SelectTrigger className="w-[140px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {countryCodes.map((country) => (
                              <SelectItem key={country.code} value={country.code}>
                                <span className="flex items-center gap-2">
                                  <span>{country.flag}</span>
                                  <span>{country.code}</span>
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="Phone number"
                          value={guestInfo.phone}
                          onChange={(e) => setGuestInfo({ ...guestInfo, phone: e.target.value })}
                          className={cn("flex-1", errors.phone ? "border-red-500" : "")}
                        />
                      </div>
                      {errors.phone && (
                        <p className="text-sm text-red-500">{errors.phone}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        We&apos;ll call or text you to confirm your booking.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">Message to host (optional)</Label>
                      <Textarea
                        id="message"
                        placeholder="Share any special requests or questions..."
                        value={guestInfo.message}
                        onChange={(e) => setGuestInfo({ ...guestInfo, message: e.target.value })}
                        rows={3}
                      />
                    </div>
                  </div>

                  <Button 
                    onClick={handleContinueToPayment}
                    className="w-full bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white py-6 text-lg font-semibold"
                  >
                    Continue to payment
                  </Button>
                </div>
              )}

              {step === "payment" && (
                <div className="space-y-6">
                  {/* Payment Section */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-black text-white text-sm">1</span>
                      Payment method
                    </h3>
                    
                    {/* Stripe Payment */}
                    <div className="border rounded-lg p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Icon icon="logos:stripe" className="w-12 h-6" />
                          <span className="font-medium">Pay with Stripe</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Icon icon="logos:visa" className="w-8 h-5" />
                          <Icon icon="logos:mastercard" className="w-8 h-5" />
                          <Icon icon="logos:amex" className="w-8 h-5" />
                        </div>
                      </div>
                      
                      <p className="text-sm text-muted-foreground">
                        Secure payment powered by Stripe. Your payment information is encrypted and secure.
                      </p>

                      {/* Simulated card input - In production, use Stripe Elements */}
                      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border-2 border-dashed border-gray-300 dark:border-gray-700">
                        <div className="flex items-center justify-center gap-2 text-muted-foreground">
                          <Icon icon="ph:lock" className="w-5 h-5" />
                          <span className="text-sm">Stripe checkout will open in a new window</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Cancellation Policy */}
                  <div className="space-y-2 pt-4 border-t">
                    <h4 className="font-semibold">Cancellation policy</h4>
                    <p className="text-sm text-muted-foreground">
                      <strong className="text-foreground">Free cancellation</strong> before{" "}
                      {format(cancellationDate, "MMMM d", { locale: enUS })}. Cancel before check-in on{" "}
                      {format(bookingData.checkIn, "MMMM d", { locale: enUS })} for a full refund.
                    </p>
                  </div>

                  {/* Ground Rules */}
                  <div className="space-y-2 pt-4 border-t">
                    <h4 className="font-semibold">Ground rules</h4>
                    <p className="text-sm text-muted-foreground">
                      We ask every guest to remember a few simple things about what makes a great guest.
                    </p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Follow the house rules</li>
                      <li>• Treat your Host&apos;s home like your own</li>
                    </ul>
                  </div>

                  {/* Terms */}
                  <p className="text-xs text-muted-foreground pt-4 border-t">
                    By selecting the button below, I agree to the Host&apos;s House Rules, Ground rules for guests, 
                    and that PSM Phuket can charge my payment method if I&apos;m responsible for damage.
                  </p>

                  <Button 
                    onClick={handleConfirmBooking}
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white py-6 text-lg font-semibold"
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <Icon icon="ph:spinner" className="w-5 h-5 animate-spin" />
                        Processing...
                      </span>
                    ) : (
                      `Confirm and pay ${formatRentalPrice(bookingData.total)}`
                    )}
                  </Button>
                </div>
              )}
            </div>

            {/* Booking Summary - Right Side on Desktop */}
            <div className="lg:w-[420px] lg:flex-shrink-0 p-6 lg:p-8 bg-gray-50 dark:bg-gray-900/50 border-t lg:border-t-0 lg:overflow-y-auto lg:max-h-[85vh]">
              {/* Property Card */}
              <div className="flex gap-4 pb-6 border-b">
                <div className="w-24 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-gray-200 dark:bg-gray-700 relative">
                  {property.image && !imageError ? (
                    <img 
                      src={property.image} 
                      alt={property.title}
                      className="w-full h-full object-cover"
                      onError={() => setImageError(true)}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <Icon icon="ph:house" className="w-8 h-8" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm line-clamp-2">{property.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{property.location}</p>
                </div>
              </div>

              {/* Free Cancellation */}
              <div className="py-4 border-b">
                <div className="flex items-start gap-3">
                  <Icon icon="ph:calendar-check" className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Free cancellation</p>
                    <p className="text-xs text-muted-foreground">
                      Cancel before {format(cancellationDate, "MMMM d", { locale: enUS })} for a full refund.
                    </p>
                  </div>
                </div>
              </div>

              {/* Trip Details */}
              <div className="py-4 border-b space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">Dates</p>
                    <p className="text-sm text-muted-foreground">
                      {format(bookingData.checkIn, "d MMM", { locale: enUS })} – {format(bookingData.checkOut, "d MMM yyyy", { locale: enUS })}
                    </p>
                  </div>
                  <button 
                    onClick={onClose}
                    className="text-sm font-semibold underline"
                  >
                    Edit
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">Guests</p>
                    <p className="text-sm text-muted-foreground">{formatGuests()}</p>
                  </div>
                  <button 
                    onClick={onClose}
                    className="text-sm font-semibold underline"
                  >
                    Edit
                  </button>
                </div>
              </div>

              {/* Price Details */}
              <div className="py-4 space-y-3">
                <h4 className="font-semibold">Price details</h4>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="underline decoration-dotted cursor-help">
                    {formatRentalPrice(bookingData.pricePerNight)} x {bookingData.nights} {bookingData.nights === 1 ? "night" : "nights"}
                  </span>
                  <span>{formatRentalPrice(bookingData.subtotal)}</span>
                </div>


                <div className="flex items-center justify-between text-sm">
                  <span className="underline decoration-dotted cursor-help">Service fee</span>
                  <span>{formatRentalPrice(bookingData.serviceFee)}</span>
                </div>

                <div className="flex items-center justify-between pt-3 border-t font-semibold">
                  <span>Total (THB)</span>
                  <span>{formatRentalPrice(bookingData.total)}</span>
                </div>
                
                {/* Multi-currency display */}
                {!currencyLoading && (
                  <div className="flex items-center justify-between text-sm text-muted-foreground mt-2">
                    <span>Approximate</span>
                    <span>{formatMultiPrice(bookingData.total).eur} / {formatMultiPrice(bookingData.total).usd}</span>
                  </div>
                )}
              </div>

              {/* Rare Find Badge */}
              <div className="mt-4 bg-pink-50 dark:bg-pink-950/30 border border-pink-200 dark:border-pink-900 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">💎</span>
                  <div>
                    <p className="font-medium text-sm">Rare find</p>
                    <p className="text-xs text-muted-foreground">
                      This property is usually booked quickly.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

