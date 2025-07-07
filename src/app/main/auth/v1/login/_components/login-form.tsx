"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { toastUtils } from "@/lib/toast-utils";

// Schema for initial login (email/password)
const LoginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
  remember: z.boolean().optional(),
});

// Schema for 2FA verification
const TwoFactorSchema = z.object({
  code: z.string().min(6, "Code must be 6 digits").max(6, "Code must be 6 digits"),
});

type LoginData = z.infer<typeof LoginSchema>;
type TwoFactorData = z.infer<typeof TwoFactorSchema>;

interface LoginFormV1Props {
  onStepChange?: (step: "login" | "2fa") => void;
}

export function LoginFormV1({ onStepChange }: Readonly<LoginFormV1Props>) {
  const router = useRouter();
  const [step, setStep] = useState<"login" | "2fa">("login");
  const [pendingAuth, setPendingAuth] = useState<{ email: string; password: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const otpRef = useRef<HTMLInputElement>(null);

  const loginForm = useForm<LoginData>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: "",
      password: "",
      remember: false,
    },
  });

  const twoFactorForm = useForm<TwoFactorData>({
    resolver: zodResolver(TwoFactorSchema),
    defaultValues: {
      code: "",
    },
  });

  // Focus OTP input when 2FA step loads
  useEffect(() => {
    if (step === "2fa" && otpRef.current) {
      const timeout = setTimeout(() => {
        otpRef.current?.focus();
      }, 100);
      return () => {
        clearTimeout(timeout);
      };
    }
  }, [step]);

  // First step: Verify email/password and check if 2FA is required
  const onLoginSubmit = async (data: LoginData) => {
    setIsSubmitting(true);
    try {
      // First, check if user exists and has 2FA enabled
      const checkResponse = await fetch("/api/auth/check-2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email, password: data.password }),
      });

      if (!checkResponse.ok) {
        toastUtils.auth.loginFailed();
        return;
      }

      const checkData = (await checkResponse.json()) as { requires2FA: boolean };
      const { requires2FA } = checkData;

      if (requires2FA) {
        // User has 2FA enabled, show 2FA input
        setPendingAuth({ email: data.email, password: data.password });
        setStep("2fa");
        onStepChange?.("2fa");
        twoFactorForm.reset();
        toastUtils.auth.twoFactorRequired();
      } else {
        // No 2FA required, complete login
        await completeLogin(data.email, data.password);
      }
    } catch {
      toastUtils.auth.loginFailed("An error occurred during authentication.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Second step: Verify 2FA code and complete login
  const onTwoFactorSubmit = async (data: TwoFactorData) => {
    if (!pendingAuth) return;

    setIsSubmitting(true);
    try {
      await completeLogin(pendingAuth.email, pendingAuth.password, data.code);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Complete the authentication process
  const completeLogin = async (email: string, password: string, twoFactorCode?: string) => {
    const result = await signIn("credentials", {
      redirect: false,
      email,
      password,
      ...(twoFactorCode && { code: twoFactorCode }),
    });

    if (result.error) {
      const errorDescription = twoFactorCode
        ? "Invalid authentication code. Please try again."
        : "Invalid credentials. Please check your email and password.";
      toastUtils.auth.loginFailed(errorDescription);

      if (twoFactorCode) {
        // Reset 2FA form but stay on 2FA step
        twoFactorForm.reset();
      }
    } else {
      toastUtils.auth.loginSuccess("Welcome to TraffBoard Analytics Dashboard");
      router.push("/main/dashboard");
    }
  };

  // Go back to login step from 2FA
  const goBackToLogin = () => {
    setStep("login");
    onStepChange?.("login");
    setPendingAuth(null);
    twoFactorForm.reset();
  };

  if (step === "2fa") {
    return (
      <div className="space-y-8">
        {/* Header with 2FA icon and title */}
        <div className="space-y-4 text-center">
          <div className="bg-primary/10 mx-auto flex h-16 w-16 items-center justify-center rounded-full">
            <svg className="text-primary h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight">Two-Factor Authentication</h1>
            <p className="text-muted-foreground text-sm">Enter the 6-digit code from your authenticator app</p>
          </div>
        </div>

        <Form {...twoFactorForm}>
          <form
            className="space-y-6"
            onSubmit={(e) => {
              e.preventDefault();
              void twoFactorForm.handleSubmit(onTwoFactorSubmit)(e);
            }}
          >
            <FormField
              control={twoFactorForm.control}
              name="code"
              render={({ field }) => (
                <FormItem className="space-y-4">
                  <FormControl>
                    <div className="flex justify-center">
                      <InputOTP
                        maxLength={6}
                        value={field.value}
                        onChange={field.onChange}
                        disabled={isSubmitting}
                        ref={otpRef}
                      >
                        <InputOTPGroup>
                          <InputOTPSlot index={0} />
                          <InputOTPSlot index={1} />
                          <InputOTPSlot index={2} />
                        </InputOTPGroup>
                        <InputOTPGroup>
                          <InputOTPSlot index={3} />
                          <InputOTPSlot index={4} />
                          <InputOTPSlot index={5} />
                        </InputOTPGroup>
                      </InputOTP>
                    </div>
                  </FormControl>
                  <FormMessage className="text-center" />
                </FormItem>
              )}
            />

            <div className="space-y-3">
              <Button className="w-full" type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Verifying..." : "Verify & Sign In"}
              </Button>

              <Button type="button" variant="ghost" className="w-full" onClick={goBackToLogin} disabled={isSubmitting}>
                ← Back to login
              </Button>
            </div>
          </form>
        </Form>
      </div>
    );
  }
  // Regular login form (step 1)
  return (
    <Form {...loginForm}>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          void loginForm.handleSubmit(onLoginSubmit)(e);
        }}
      >
        <FormField
          control={loginForm.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email Address</FormLabel>
              <FormControl>
                <Input
                  autoComplete="email"
                  id="email"
                  placeholder="admin@traffboard.com"
                  type="email"
                  {...field}
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={loginForm.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input
                  autoComplete="current-password"
                  id="password"
                  placeholder="••••••••"
                  type="password"
                  {...field}
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={loginForm.control}
          name="remember"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  className="size-4"
                  id="login-remember"
                  onCheckedChange={field.onChange}
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormLabel className="text-muted-foreground ml-1 text-sm font-medium" htmlFor="login-remember">
                Remember me for 30 days
              </FormLabel>
            </FormItem>
          )}
        />
        <Button className="w-full" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Signing in..." : "Sign In to TraffBoard"}
        </Button>
      </form>
    </Form>
  );
}
