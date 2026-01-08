/**
 * Owner Signup Page Translations
 * Supports English (default) and Dutch
 */

export const ownerSignUpTranslations = {
  en: {
    // Page metadata
    pageTitle: "Owner Registration | PSM Phuket",
    pageDescription: "Create an owner account to manage your properties",
    
    // Header
    title: "Owner Registration",
    subtitle: "Create an account to manage your properties",
    
    // Language selector
    language: "Language",
    
    // Invite code
    inviteCode: "Invitation Code",
    inviteCodePlaceholder: "OWNER-XXXXXXXX",
    invalidCode: "Invalid invitation code",
    invalidCodeDesc: "This code is invalid, expired, or already used.",
    validCode: "Valid invitation code",
    validCodeProperties: "property(ies) will be linked to your account",
    validCodeRequired: "Valid invitation code required",
    failedToValidate: "Failed to validate code",
    
    // Properties section
    yourProperties: "Your properties",
    
    // Form fields
    name: "Name",
    namePlaceholder: "Your full name",
    email: "Email",
    emailPlaceholder: "your@email.com",
    password: "Password",
    passwordPlaceholder: "Minimum 8 characters",
    confirmPassword: "Confirm Password",
    confirmPasswordPlaceholder: "Repeat password",
    required: "*",
    
    // Validation errors
    passwordMismatch: "Passwords do not match",
    
    // Buttons & actions
    creatingAccount: "Creating account...",
    createAccount: "Create Account",
    
    // Footer text
    privacyNote: "By creating an account you agree to our",
    privacyPolicy: "Privacy Policy",
    alreadyHaveAccount: "Already have an account?",
    signIn: "Sign In",
    
    // Toast messages
    accountCreated: "Account successfully created!",
    accountCreationFailed: "Account creation failed",
    errorOccurred: "An error occurred. Please try again.",
    linkingFailed: "Account created, but linking failed. Please contact support.",
  },
  nl: {
    // Page metadata
    pageTitle: "Eigenaar Registratie | PSM Phuket",
    pageDescription: "Maak een eigenaar account aan om uw woningen te beheren",
    
    // Header
    title: "Eigenaar Registratie",
    subtitle: "Maak een account aan om uw woningen te beheren",
    
    // Language selector
    language: "Taal",
    
    // Invite code
    inviteCode: "Uitnodigingscode",
    inviteCodePlaceholder: "OWNER-XXXXXXXX",
    invalidCode: "Ongeldige uitnodigingscode",
    invalidCodeDesc: "Deze code is ongeldig, verlopen, of al gebruikt.",
    validCode: "Geldige uitnodigingscode",
    validCodeProperties: "woning(en) worden aan uw account gekoppeld",
    validCodeRequired: "Geldige uitnodigingscode vereist",
    failedToValidate: "Code valideren mislukt",
    
    // Properties section
    yourProperties: "Uw woningen",
    
    // Form fields
    name: "Naam",
    namePlaceholder: "Uw volledige naam",
    email: "Email",
    emailPlaceholder: "uw@email.com",
    password: "Wachtwoord",
    passwordPlaceholder: "Minimaal 8 karakters",
    confirmPassword: "Bevestig Wachtwoord",
    confirmPasswordPlaceholder: "Herhaal wachtwoord",
    required: "*",
    
    // Validation errors
    passwordMismatch: "Wachtwoorden komen niet overeen",
    
    // Buttons & actions
    creatingAccount: "Account aanmaken...",
    createAccount: "Account Aanmaken",
    
    // Footer text
    privacyNote: "Door een account aan te maken gaat u akkoord met onze",
    privacyPolicy: "Privacy Policy",
    alreadyHaveAccount: "Heeft u al een account?",
    signIn: "Inloggen",
    
    // Toast messages
    accountCreated: "Account succesvol aangemaakt!",
    accountCreationFailed: "Account aanmaken mislukt",
    errorOccurred: "Er is een fout opgetreden. Probeer het opnieuw.",
    linkingFailed: "Account aangemaakt, maar koppeling mislukt. Neem contact op met support.",
  },
} as const;

export type SupportedLanguage = keyof typeof ownerSignUpTranslations;
export type TranslationKeys = keyof typeof ownerSignUpTranslations.en;

/**
 * Detect preferred language from browser
 * Returns 'nl' if Dutch is detected, otherwise 'en' (default)
 */
export function detectBrowserLanguage(): SupportedLanguage {
  if (typeof window === "undefined") return "en";
  
  const browserLang = navigator.language || (navigator as any).userLanguage || "";
  
  // Check if Dutch is the browser language
  if (browserLang.toLowerCase().startsWith("nl")) {
    return "nl";
  }
  
  return "en";
}

/**
 * Get translations for a specific language
 */
export function getTranslations(lang: SupportedLanguage) {
  return ownerSignUpTranslations[lang] || ownerSignUpTranslations.en;
}

/**
 * Available languages for the language selector
 */
export const availableLanguages: { code: SupportedLanguage; label: string; flag: string }[] = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "nl", label: "Nederlands", flag: "🇳🇱" },
];
