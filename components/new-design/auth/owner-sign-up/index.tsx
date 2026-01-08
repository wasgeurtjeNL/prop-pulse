"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { validateEmail, validateName, validatePassword } from "@/lib/validation";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import Image from "next/image";
import {
  SupportedLanguage,
  detectBrowserLanguage,
  getTranslations,
  availableLanguages,
} from "@/lib/i18n/owner-signup-translations";

interface InviteProperty {
  id: string;
  title: string;
  listingNumber: string | null;
  location: string;
  price: string;
  image: string;
}

interface InviteValidation {
  valid: boolean;
  error?: string;
  invite?: {
    id: string;
    email: string | null;
    phone: string | null;
    propertyCount: number;
    listingNumbers: string[];
  };
  properties?: InviteProperty[];
}

const OwnerSignUp = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const codeFromUrl = searchParams.get("code") || "";
  const langFromUrl = searchParams.get("lang") as SupportedLanguage | null;

  // Language state - default to URL param, then browser detection, then English
  const [lang, setLang] = useState<SupportedLanguage>("en");
  const t = getTranslations(lang);

  // Initialize language on mount
  useEffect(() => {
    if (langFromUrl && (langFromUrl === "en" || langFromUrl === "nl")) {
      setLang(langFromUrl);
    } else {
      // Detect browser language
      const browserLang = detectBrowserLanguage();
      setLang(browserLang);
    }
  }, [langFromUrl]);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    inviteCode: codeFromUrl,
  });
  const [errors, setErrors] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    inviteCode: "",
  });

  // Invite code validation state
  const [isValidatingCode, setIsValidatingCode] = useState(false);
  const [inviteValidation, setInviteValidation] = useState<InviteValidation | null>(
    null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validate invite code on load
  useEffect(() => {
    if (codeFromUrl) {
      validateInviteCode(codeFromUrl);
    }
  }, [codeFromUrl]);

  const validateInviteCode = async (code: string) => {
    if (!code.trim()) {
      setInviteValidation(null);
      return;
    }

    setIsValidatingCode(true);
    try {
      const response = await fetch("/api/owner-portal/invites/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const result = await response.json();
      setInviteValidation(result);

      if (!result.valid && result.error) {
        setErrors((prev) => ({ ...prev, inviteCode: result.error }));
      } else {
        setErrors((prev) => ({ ...prev, inviteCode: "" }));
        // Pre-fill email if available
        if (result.invite?.email && !formData.email) {
          setFormData((prev) => ({ ...prev, email: result.invite.email }));
        }
      }
    } catch (error) {
      setInviteValidation({ valid: false, error: t.failedToValidate });
    } finally {
      setIsValidatingCode(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Validate on change
    if (name === "inviteCode") {
      // Debounced validation for invite code
      const timeoutId = setTimeout(() => validateInviteCode(value), 500);
      return () => clearTimeout(timeoutId);
    }

    setErrors((prev) => ({
      ...prev,
      [name]:
        name === "name"
          ? validateName(value)
          : name === "email"
          ? validateEmail(value)
          : name === "password"
          ? validatePassword(value)
          : name === "confirmPassword"
          ? value !== formData.password
            ? t.passwordMismatch
            : ""
          : "",
    }));
  };

  const handleLanguageChange = (newLang: SupportedLanguage) => {
    setLang(newLang);
    // Update URL with language parameter without page reload
    const url = new URL(window.location.href);
    url.searchParams.set("lang", newLang);
    window.history.replaceState({}, "", url.toString());
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validate all fields
    const nameError = validateName(formData.name);
    const emailError = validateEmail(formData.email);
    const passwordError = validatePassword(formData.password);
    const confirmPasswordError =
      formData.password !== formData.confirmPassword
        ? t.passwordMismatch
        : "";
    const inviteCodeError =
      !inviteValidation?.valid ? t.validCodeRequired : "";

    setErrors({
      name: nameError,
      email: emailError,
      password: passwordError,
      confirmPassword: confirmPasswordError,
      inviteCode: inviteCodeError,
    });

    if (
      nameError ||
      emailError ||
      passwordError ||
      confirmPasswordError ||
      inviteCodeError
    ) {
      return;
    }

    setIsSubmitting(true);
    const loadingToast = toast.loading(t.creatingAccount);

    try {
      // Sign up the user
      const { data, error } = await authClient.signUp.email({
        email: formData.email,
        password: formData.password,
        name: formData.name,
      });

      if (error) {
        toast.error(error.message || t.accountCreationFailed, {
          id: loadingToast,
        });
        setIsSubmitting(false);
        return;
      }

      if (data) {
        // Use the owner invite to link properties and set role
        try {
          const response = await fetch("/api/owner-portal/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              code: formData.inviteCode,
              userId: data.user?.id,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Failed to complete registration");
          }
        } catch (err) {
          console.error("Error completing owner registration:", err);
          // Still proceed but show warning
          toast.error(t.linkingFailed);
        }

        toast.success(t.accountCreated, { id: loadingToast });

        // Redirect to owner portal
        window.location.href = "/owner-portal";
      }
    } catch (error) {
      toast.error(t.errorOccurred, {
        id: loadingToast,
      });
      console.error("Sign up error:", error);
      setIsSubmitting(false);
    }
  };

  return (
    <>

      {/* Language Selector */}
      <div className="flex justify-end mb-4">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">{t.language}:</span>
          <div className="flex gap-1">
            {availableLanguages.map((language) => (
              <button
                key={language.code}
                onClick={() => handleLanguageChange(language.code)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5
                  ${
                    lang === language.code
                      ? "bg-primary text-white"
                      : "bg-muted hover:bg-muted/80 text-foreground"
                  }`}
              >
                <span>{language.flag}</span>
                <span>{language.code.toUpperCase()}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold mb-2">{t.title}</h1>
        <p className="text-muted-foreground">{t.subtitle}</p>
      </div>

      {/* Invite Code Input (if not from URL) */}
      {!codeFromUrl && (
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">
            {t.inviteCode} {t.required}
          </label>
          <input
            type="text"
            placeholder={t.inviteCodePlaceholder}
            name="inviteCode"
            value={formData.inviteCode}
            onChange={handleChange}
            className={`w-full rounded-2xl border placeholder:text-gray-400 border-black/10 dark:border-white/20 border-solid bg-transparent px-5 py-3 text-base text-dark outline-none transition focus:border-primary focus-visible:shadow-none dark:border-border_color dark:text-white dark:focus:border-primary uppercase
              ${
                errors.inviteCode
                  ? "border-red-500 dark:border-red-500"
                  : inviteValidation?.valid
                  ? "border-green-500 dark:border-green-500"
                  : "border-stroke"
              }`}
          />
          {errors.inviteCode && (
            <p className="text-red-500 text-sm mt-1">{errors.inviteCode}</p>
          )}
        </div>
      )}

      {/* Loading state */}
      {isValidatingCode && (
        <div className="flex items-center justify-center py-8">
          <svg
            className="animate-spin h-8 w-8 text-primary"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        </div>
      )}

      {/* Invalid Code Message */}
      {!isValidatingCode && inviteValidation && !inviteValidation.valid && (
        <div className="mb-6 p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <div className="flex items-center gap-3">
            <svg
              className="w-6 h-6 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <p className="font-semibold text-red-800 dark:text-red-200">
                {t.invalidCode}
              </p>
              <p className="text-sm text-red-600 dark:text-red-300">
                {inviteValidation.error || t.invalidCodeDesc}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Valid Code - Show Properties */}
      {!isValidatingCode && inviteValidation?.valid && (
        <>
          {/* Success Banner */}
          <div className="mb-6 p-4 rounded-2xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-3">
              <svg
                className="w-6 h-6 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <div>
                <p className="font-semibold text-green-800 dark:text-green-200">
                  {t.validCode}
                </p>
                <p className="text-sm text-green-600 dark:text-green-300">
                  {inviteValidation.invite?.propertyCount} {t.validCodeProperties}
                </p>
              </div>
            </div>
          </div>

          {/* Properties Preview */}
          {inviteValidation.properties && inviteValidation.properties.length > 0 && (
            <div className="mb-6">
              <label className="block text-sm font-medium mb-3">
                {t.yourProperties}
              </label>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {inviteValidation.properties.map((property) => (
                  <div
                    key={property.id}
                    className="flex items-center gap-3 p-3 bg-muted rounded-xl"
                  >
                    <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                      <Image
                        src={property.image || "/placeholder-property.jpg"}
                        alt={property.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{property.title}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {property.location}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                          {property.listingNumber || "N/A"}
                        </span>
                        <span className="text-sm font-medium">{property.price}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Registration Form */}
          <form onSubmit={handleSubmit}>
            <div className="mb-[22px]">
              <label className="block text-sm font-medium mb-2">
                {t.name} {t.required}
              </label>
              <input
                type="text"
                placeholder={t.namePlaceholder}
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`w-full rounded-2xl border placeholder:text-gray-400 border-black/10 dark:border-white/20 border-solid bg-transparent px-5 py-3 text-base text-dark outline-none transition focus:border-primary focus-visible:shadow-none dark:border-border_color dark:text-white dark:focus:border-primary
                  ${errors.name ? "border-red-500 dark:border-red-500" : "border-stroke"}`}
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name}</p>
              )}
            </div>

            <div className="mb-[22px]">
              <label className="block text-sm font-medium mb-2">
                {t.email} {t.required}
              </label>
              <input
                type="email"
                placeholder={t.emailPlaceholder}
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full rounded-2xl border placeholder:text-gray-400 border-black/10 dark:border-white/20 border-solid bg-transparent px-5 py-3 text-base text-dark outline-none transition focus:border-primary focus-visible:shadow-none dark:border-border_color dark:text-white dark:focus:border-primary
                  ${errors.email ? "border-red-500 dark:border-red-500" : "border-stroke"}`}
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email}</p>
              )}
            </div>

            <div className="mb-[22px]">
              <label className="block text-sm font-medium mb-2">
                {t.password} {t.required}
              </label>
              <input
                type="password"
                placeholder={t.passwordPlaceholder}
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`w-full rounded-2xl border placeholder:text-gray-400 border-black/10 dark:border-white/20 border-solid bg-transparent px-5 py-3 text-base text-dark outline-none transition focus:border-primary focus-visible:shadow-none dark:border-border_color dark:text-white dark:focus:border-primary
                  ${errors.password ? "border-red-500 dark:border-red-500" : "border-stroke"}`}
              />
              {errors.password && (
                <p className="text-red-500 text-sm mt-1">{errors.password}</p>
              )}
            </div>

            <div className="mb-[22px]">
              <label className="block text-sm font-medium mb-2">
                {t.confirmPassword} {t.required}
              </label>
              <input
                type="password"
                placeholder={t.confirmPasswordPlaceholder}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`w-full rounded-2xl border placeholder:text-gray-400 border-black/10 dark:border-white/20 border-solid bg-transparent px-5 py-3 text-base text-dark outline-none transition focus:border-primary focus-visible:shadow-none dark:border-border_color dark:text-white dark:focus:border-primary
                  ${
                    errors.confirmPassword
                      ? "border-red-500 dark:border-red-500"
                      : "border-stroke"
                  }`}
              />
              {errors.confirmPassword && (
                <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>
              )}
            </div>

            <div className="mb-6">
              <button
                type="submit"
                disabled={isSubmitting || !inviteValidation?.valid}
                className="flex w-full cursor-pointer items-center justify-center rounded-2xl border border-primary bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed px-5 py-3 text-base text-white transition duration-300 ease-in-out"
              >
                {isSubmitting ? (
                  <>
                    <svg
                      className="animate-spin h-5 w-5 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    {t.creatingAccount}
                  </>
                ) : (
                  t.createAccount
                )}
              </button>
            </div>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            {t.privacyNote}{" "}
            <Link href="/privacy-policy" className="text-primary hover:underline">
              {t.privacyPolicy}
            </Link>
          </p>
        </>
      )}

      {/* Already have account */}
      <p className="text-center text-base mt-6">
        {t.alreadyHaveAccount}{" "}
        <Link
          href="/sign-in?callbackUrl=/owner-portal"
          className="text-primary hover:underline"
        >
          {t.signIn}
        </Link>
      </p>
    </>
  );
};

export default OwnerSignUp;
