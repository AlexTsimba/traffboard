"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

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

export function LoginFormV1() {
  const router = useRouter();
  const [step, setStep] = useState<"login" | "2fa">("login");
  const [pendingAuth, setPendingAuth] = useState<{ email: string; password: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        toast.error("Authentication Failed", {
          description: "Invalid credentials. Please check your email and password.",
        });
        return;
      }

      const { requires2FA } = await checkResponse.json();

      if (requires2FA) {
        // User has 2FA enabled, show 2FA input
        setPendingAuth({ email: data.email, password: data.password });
        setStep("2fa");
        twoFactorForm.reset();
        toast.info("Two-Factor Authentication Required", {
          description: "Enter the code from your authenticator app.",
        });
      } else {
        // No 2FA required, complete login
        await completeLogin(data.email, data.password);
      }
    } catch {
      toast.error("Authentication Failed", {
        description: "An error occurred during authentication.",
      });
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

    if (result?.error) {
      toast.error("Authentication Failed", {
        description: twoFactorCode
          ? "Invalid authentication code. Please try again."
          : "Invalid credentials. Please check your email and password.",
      });

      if (twoFactorCode) {
        // Reset 2FA form but stay on 2FA step
        twoFactorForm.reset();
      }
    } else {
      toast.success("Authentication Successful", {
        description: "Welcome to TraffBoard Analytics Dashboard",
      });
      router.push("/main/dashboard");
    }
  };

  // Go back to login step from 2FA
  const goBackToLogin = () => {
    setStep("login");
    setPendingAuth(null);
    twoFactorForm.reset();
  };

  if (step === "2fa") {
    return (
      <Form {...twoFactorForm}>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            void twoFactorForm.handleSubmit(onTwoFactorSubmit)(e);
          }}
        >
          <div className="space-y-2 text-center">
            <p className="text-muted-foreground text-sm">
              Authenticating as: <span className="font-medium">{pendingAuth?.email}</span>
            </p>
          </div>

          <FormField
            control={twoFactorForm.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Authentication Code</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="000000"
                    maxLength={6}
                    className="text-center text-lg tracking-widest"
                    autoComplete="one-time-code"
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-2">
            <Button className="w-full" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Verifying..." : "Verify & Sign In"}
            </Button>

            <Button type="button" variant="ghost" className="w-full" onClick={goBackToLogin} disabled={isSubmitting}>
              ← Back to login
            </Button>
          </div>
        </form>
      </Form>
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
