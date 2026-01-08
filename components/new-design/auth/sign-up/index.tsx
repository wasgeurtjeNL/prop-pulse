"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import SocialSignUp from "../SocialSignUp";
import { useState, useEffect } from "react";
import { validateEmail, validateName, validatePassword } from "@/lib/validation";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";

const SignUp = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteCodeFromUrl = searchParams.get('invite') || '';
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    inviteCode: inviteCodeFromUrl,
  });
  const [errors, setErrors] = useState({
    name: "",
    email: "",
    password: "",
    inviteCode: "",
  });
  
  // Invite code validation state
  const [isValidatingCode, setIsValidatingCode] = useState(false);
  const [inviteValidation, setInviteValidation] = useState<{
    valid: boolean;
    role?: string;
    error?: string;
  } | null>(null);
  const [showInviteField, setShowInviteField] = useState(!!inviteCodeFromUrl);

  // Validate invite code when it changes
  useEffect(() => {
    const validateCode = async () => {
      if (!formData.inviteCode.trim()) {
        setInviteValidation(null);
        return;
      }

      setIsValidatingCode(true);
      try {
        const response = await fetch('/api/auth/validate-invite', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            code: formData.inviteCode,
            email: formData.email || undefined,
          }),
        });
        const result = await response.json();
        setInviteValidation(result);
        if (!result.valid && result.error) {
          setErrors(prev => ({ ...prev, inviteCode: result.error }));
        } else {
          setErrors(prev => ({ ...prev, inviteCode: "" }));
        }
      } catch (error) {
        setInviteValidation({ valid: false, error: "Failed to validate code" });
      } finally {
        setIsValidatingCode(false);
      }
    };

    const timeoutId = setTimeout(validateCode, 500); // Debounce
    return () => clearTimeout(timeoutId);
  }, [formData.inviteCode, formData.email]);

  // Validate invite code from URL on mount
  useEffect(() => {
    if (inviteCodeFromUrl) {
      setFormData(prev => ({ ...prev, inviteCode: inviteCodeFromUrl }));
    }
  }, [inviteCodeFromUrl]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Validate on change (except invite code which has its own validation)
    if (name !== 'inviteCode') {
      setErrors((prev) => ({
        ...prev,
        [name]:
          name === "name"
            ? validateName(value)
            : name === "email"
              ? validateEmail(value)
              : validatePassword(value),
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validate all fields before submitting
    const nameError = validateName(formData.name);
    const emailError = validateEmail(formData.email);
    const passwordError = validatePassword(formData.password);
    
    // If invite code is provided but invalid, show error
    let inviteCodeError = "";
    if (formData.inviteCode.trim() && (!inviteValidation || !inviteValidation.valid)) {
      inviteCodeError = inviteValidation?.error || "Invalid invite code";
    }

    setErrors({ name: nameError, email: emailError, password: passwordError, inviteCode: inviteCodeError });
    if (nameError || emailError || passwordError || inviteCodeError) {
      return;
    }
    
    const loadingToast = toast.loading(
      inviteValidation?.valid 
        ? `Creating ${inviteValidation.role?.toLowerCase()} account...` 
        : "Creating your account..."
    );
    
    try {
      // Sign up the user
      const { data, error } = await authClient.signUp.email({
        email: formData.email,
        password: formData.password,
        name: formData.name,
      });

      if (error) {
        toast.error(error.message || "Failed to create account", {
          id: loadingToast,
        });
        return;
      }

      if (data) {
        // If valid invite code, update role and mark code as used
        if (formData.inviteCode.trim() && inviteValidation?.valid) {
          try {
            await fetch('/api/auth/use-invite', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                code: formData.inviteCode,
                userId: data.user?.id,
                role: inviteValidation.role,
              }),
            });
          } catch (err) {
            console.error("Error using invite code:", err);
          }
        }

        toast.success(
          inviteValidation?.valid 
            ? `${inviteValidation.role} account created successfully!` 
            : "Account created successfully!", 
          { id: loadingToast }
        );
        
        // Redirect based on role
        window.location.href = "/api/auth/redirect";
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.", {
        id: loadingToast,
      });
      console.error("Sign up error:", error);
    }
  };

  const isAgentRegistration = inviteValidation?.valid && (inviteValidation.role === "AGENT" || inviteValidation.role === "ADMIN");

  return (
    <>
      {/* Agent/Admin Registration Banner */}
      {isAgentRegistration && (
        <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-primary">
                {inviteValidation.role} Registration
              </p>
              <p className="text-sm text-muted-foreground">
                You're registering with a valid invite code
              </p>
            </div>
          </div>
        </div>
      )}

      <SocialSignUp inviteCode={formData.inviteCode} />

      <span className="z-1 relative my-8 block text-center">
        <span className="-z-1 absolute left-0 top-1/2 block h-px w-full bg-black/10 dark:bg-white/20"></span>
        <span className="text-body-secondary relative z-10 inline-block bg-white px-3 text-base dark:bg-black">
          OR
        </span>
      </span>

      <form onSubmit={handleSubmit}>
        <div className="mb-[22px]">
          <input
            type="text"
            placeholder="Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className={`w-full rounded-2xl border placeholder:text-gray-400 border-black/10 dark:border-white/20 border-solid bg-transparent px-5 py-3 text-base text-dark outline-none transition  focus:border-primary focus-visible:shadow-none dark:border-border_color dark:text-white dark:focus:border-primary
              ${errors.name ? 'border-red-500 dark:border-red-500' : 'border-stroke'}`}
          />
          {errors.name && <p className="text-red-500 dark:text-red-500 text-sm mt-1">{errors.name}</p>}
        </div>
        <div className="mb-[22px]">
          <input
            type="email"
            placeholder="Email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className={`w-full rounded-2xl border placeholder:text-gray-400 border-black/10 dark:border-white/20 border-solid bg-transparent px-5 py-3 text-base text-dark outline-none transition  focus:border-primary focus-visible:shadow-none dark:border-border_color dark:text-white dark:focus:border-primary
              ${errors.email ? 'border-red-500 dark:border-red-500' : 'border-stroke'}`}
          />
          {errors.email && <p className="text-red-500 dark:text-red-500 text-sm mt-1">{errors.email}</p>}
        </div>
        <div className="mb-[22px]">
          <input
            type="password"
            placeholder="Password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className={`w-full rounded-2xl border placeholder:text-gray-400 border-black/10 dark:border-white/20 border-solid bg-transparent px-5 py-3 text-base text-dark outline-none transition  focus:border-primary focus-visible:shadow-none dark:border-border_color dark:text-white dark:focus:border-primary
              ${errors.password ? 'border-red-500 dark:border-red-500' : 'border-stroke'}`}
          />
          {errors.password && <p className="text-red-500 dark:text-red-500 text-sm mt-1">{errors.password}</p>}
        </div>

        {/* Invite Code Field */}
        {showInviteField ? (
          <div className="mb-[22px]">
            <div className="relative">
              <input
                type="text"
                placeholder="Invite Code (optional)"
                name="inviteCode"
                value={formData.inviteCode}
                onChange={handleChange}
                className={`w-full rounded-2xl border placeholder:text-gray-400 border-black/10 dark:border-white/20 border-solid bg-transparent px-5 py-3 text-base text-dark outline-none transition focus:border-primary focus-visible:shadow-none dark:border-border_color dark:text-white dark:focus:border-primary uppercase
                  ${errors.inviteCode ? 'border-red-500 dark:border-red-500' : inviteValidation?.valid ? 'border-green-500 dark:border-green-500' : 'border-stroke'}`}
              />
              {isValidatingCode && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <svg className="animate-spin h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              )}
              {!isValidatingCode && inviteValidation?.valid && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </div>
            {errors.inviteCode && <p className="text-red-500 dark:text-red-500 text-sm mt-1">{errors.inviteCode}</p>}
            {inviteValidation?.valid && (
              <p className="text-green-500 text-sm mt-1">
                ✓ Valid code - you will be registered as {inviteValidation.role}
              </p>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowInviteField(true)}
            className="mb-[22px] text-sm text-primary hover:underline"
          >
            Have an invite code?
          </button>
        )}

        <div className="mb-9">
          <button
            type="submit"
            className="flex w-full cursor-pointer items-center justify-center rounded-2xl border border-primary bg-primary hover:bg-transparent hover:text-primary px-5 py-3 text-base text-white transition duration-300 ease-in-out "
          >
            {isAgentRegistration ? `Sign Up as ${inviteValidation.role}` : 'Sign Up'}
          </button>
        </div>
      </form>

      <p className="text-center mb-4 text-base">
        By creating an account you are agree with our{" "}
        <Link href="/privacy-policy" className="text-primary hover:underline">
          Privacy
        </Link>{" "}
        and{" "}
        <Link href="/privacy-policy" className="text-primary hover:underline">
          Policy
        </Link>
      </p>

      <p className="text-center text-base">
        Already have an account?
        <Link
          href="/signin"
          className="pl-2 text-primary hover:bg-darkprimary hover:underline"
        >
          Sign In
        </Link>
      </p>
    </>
  );
};

export default SignUp;
