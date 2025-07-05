"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Shield, ShieldCheck, Copy, Eye, EyeOff } from "lucide-react";
import Image from "next/image";
import { useState, useTransition, useCallback, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useToast } from "@/hooks/use-toast";
import type { Safe2FASetup, Safe2FAStatus } from "@/lib/data/two-factor";

import {
  get2FAStatusAction,
  generate2FASetupAction,
  enable2FAAction,
  disable2FAAction,
} from "../_actions/two-factor-actions";

const setupSchema = z.object({
  code: z.string().min(6, "Code must be 6 digits").max(6, "Code must be 6 digits"),
});

const disableSchema = z.object({
  password: z.string().min(1, "Password is required"),
  code: z.string().min(6, "Code must be 6 digits").max(6, "Code must be 6 digits"),
});

type SetupData = z.infer<typeof setupSchema>;
type DisableData = z.infer<typeof disableSchema>;

interface TwoFactorSetupProps {
  readonly initialStatus?: Safe2FAStatus | null;
}

export function TwoFactorSetup({ initialStatus = null }: TwoFactorSetupProps) {
  const [status, setStatus] = useState<Safe2FAStatus | null>(initialStatus);
  const [setupData, setSetupData] = useState<Safe2FASetup | null>(null);
  const [loading, setLoading] = useState(!initialStatus);
  const [isPending, startTransition] = useTransition();
  const [setupDialogOpen, setSetupDialogOpen] = useState(false);
  const [disableDialogOpen, setDisableDialogOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const setupOtpRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const setupForm = useForm<SetupData>({
    resolver: zodResolver(setupSchema),
    defaultValues: { code: "" },
  });

  // Focus OTP input when setup dialog opens
  useEffect(() => {
    if (setupDialogOpen && setupOtpRef.current) {
      const timeout = setTimeout(() => {
        setupOtpRef.current?.focus();
      }, 100);
      return () => {
        clearTimeout(timeout);
      };
    }
  }, [setupDialogOpen]);

  const disableForm = useForm<DisableData>({
    resolver: zodResolver(disableSchema),
    defaultValues: { password: "", code: "" },
  });

  // Load 2FA status only if not provided as prop
  const loadStatus = useCallback(async () => {
    if (status || !loading) return; // Prevent multiple calls

    try {
      setLoading(true);
      const result = await get2FAStatusAction();
      if (result.success && result.status) {
        setStatus(result.status);
      } else {
        toast({
          title: "Error",
          description: result.error ?? "Failed to load 2FA status",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to load 2FA status",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [status, loading, toast]);

  const handleStartSetup = useCallback(() => {
    startTransition(async () => {
      try {
        const result = await generate2FASetupAction();

        if (result.success && result.setupData) {
          setSetupData(result.setupData);
          setSetupDialogOpen(true);
          setupForm.reset();
        } else {
          toast({
            title: "Error",
            description: result.error ?? "Failed to start 2FA setup",
            variant: "destructive",
          });
        }
      } catch {
        toast({
          title: "Error",
          description: "Failed to start 2FA setup",
          variant: "destructive",
        });
      }
    });
  }, [setupForm, toast]);

  const handleCompleteSetup = useCallback(
    (data: SetupData) => {
      if (!setupData) {
        toast({
          title: "Error",
          description: "Setup data not available. Please restart the setup process.",
          variant: "destructive",
        });
        return;
      }

      startTransition(async () => {
        try {
          const formData = new FormData();
          // Use the secret from setupData, not from form data
          formData.append("secret", setupData.secret);
          formData.append("code", data.code);

          const result = await enable2FAAction(formData);

          if (result.success) {
            toast({
              title: "Success",
              description: "2FA has been enabled successfully",
            });

            setStatus((prev) => (prev ? { ...prev, isEnabled: true } : null));
            setSetupDialogOpen(false);
            setSetupData(null);
            setupForm.reset();
          } else {
            toast({
              title: "Error",
              description: result.error ?? "Failed to enable 2FA",
              variant: "destructive",
            });
          }
        } catch {
          toast({
            title: "Error",
            description: "Failed to enable 2FA",
            variant: "destructive",
          });
        }
      });
    },
    [setupData, setupForm, toast],
  );

  const handleDisable2FA = useCallback(
    (data: DisableData) => {
      startTransition(async () => {
        try {
          const formData = new FormData();
          formData.append("password", data.password);
          formData.append("code", data.code);

          const result = await disable2FAAction(formData);

          if (result.success) {
            toast({
              title: "Success",
              description: "2FA has been disabled successfully",
            });

            setStatus((prev) => (prev ? { ...prev, isEnabled: false } : null));
            setDisableDialogOpen(false);
            disableForm.reset();
          } else {
            toast({
              title: "Error",
              description: result.error ?? "Failed to disable 2FA",
              variant: "destructive",
            });
          }
        } catch {
          toast({
            title: "Error",
            description: "Failed to disable 2FA",
            variant: "destructive",
          });
        }
      });
    },
    [disableForm, toast],
  );

  const copyToClipboard = useCallback(
    (text: string) => {
      void navigator.clipboard.writeText(text);
      toast({
        title: "Copied",
        description: "Secret copied to clipboard",
      });
    },
    [toast],
  );

  // Load status on mount only if needed
  if (!status && !loading) {
    void loadStatus();
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Two-Factor Authentication
          </CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {status?.isEnabled ? <ShieldCheck className="h-5 w-5 text-green-600" /> : <Shield className="h-5 w-5" />}
          Two-Factor Authentication
        </CardTitle>
        <CardDescription>Add an extra layer of security to your account with TOTP-based authentication</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Status:</span>
            <Badge variant={status?.isEnabled ? "default" : "secondary"}>
              {status?.isEnabled ? "Enabled" : "Disabled"}
            </Badge>
          </div>

          {status?.isEnabled ? (
            <Dialog open={disableDialogOpen} onOpenChange={setDisableDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  Disable 2FA
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Disable Two-Factor Authentication</DialogTitle>
                </DialogHeader>
                <Form {...disableForm}>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      void disableForm.handleSubmit(handleDisable2FA)(e);
                    }}
                    className="space-y-4"
                  >
                    <FormField
                      control={disableForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter your password"
                                {...field}
                                disabled={isPending}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute top-0 right-0 h-full px-3 py-2 hover:bg-transparent"
                                onClick={() => {
                                  setShowPassword(!showPassword);
                                }}
                                disabled={isPending}
                              >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </Button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={disableForm.control}
                      name="code"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Verification Code</FormLabel>
                          <FormControl>
                            <div className="flex justify-center">
                              <InputOTP
                                maxLength={6}
                                value={field.value}
                                onChange={field.onChange}
                                disabled={isPending}
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

                    <div className="flex justify-end space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setDisableDialogOpen(false);
                        }}
                        disabled={isPending}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" variant="destructive" disabled={isPending}>
                        {isPending ? "Disabling..." : "Disable 2FA"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          ) : (
            <Button onClick={handleStartSetup} disabled={isPending}>
              {isPending ? "Setting up..." : "Enable 2FA"}
            </Button>
          )}
        </div>

        {status?.isEnabled && (
          <div className="text-muted-foreground text-sm">
            Two-factor authentication is enabled. Use your authenticator app to generate codes when signing in.
          </div>
        )}

        {/* Setup Dialog */}
        <Dialog open={setupDialogOpen} onOpenChange={setSetupDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Set up Two-Factor Authentication</DialogTitle>
            </DialogHeader>
            {setupData && (
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-muted-foreground mb-4 text-sm">Scan this QR code with your authenticator app</p>
                  <div className="flex justify-center">
                    <Image
                      src={setupData.qrCode}
                      alt="2FA QR Code"
                      width={200}
                      height={200}
                      className="rounded-lg border"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-medium">Manual Entry Key:</div>
                  <div className="flex items-center gap-2">
                    <Input value={setupData.secret} readOnly className="font-mono text-xs" />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        copyToClipboard(setupData.secret);
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <Form {...setupForm}>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      void setupForm.handleSubmit(handleCompleteSetup)(e);
                    }}
                    className="space-y-4"
                  >
                    <FormField
                      control={setupForm.control}
                      name="code"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Verification Code</FormLabel>
                          <FormControl>
                            <div className="flex justify-center">
                              <InputOTP
                                maxLength={6}
                                value={field.value}
                                onChange={field.onChange}
                                disabled={isPending}
                                ref={setupOtpRef}
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

                    <div className="flex justify-end space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setSetupDialogOpen(false);
                        }}
                        disabled={isPending}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isPending}>
                        {isPending ? "Verifying..." : "Enable 2FA"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
