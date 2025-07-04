"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Shield, ShieldCheck, Copy, Eye, EyeOff } from "lucide-react";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import type { TwoFactorSetupResponse, TwoFactorToggleResponse, ProfileResponse, ErrorResponse } from "@/types/api";

const setupSchema = z.object({
  code: z.string().min(6, "Code must be 6 digits").max(6, "Code must be 6 digits"),
});

const disableSchema = z.object({
  password: z.string().min(1, "Password is required"),
  code: z.string().min(6, "Code must be 6 digits").max(6, "Code must be 6 digits"),
});

type SetupData = z.infer<typeof setupSchema>;
type DisableData = z.infer<typeof disableSchema>;

export function TwoFactorSetup() {
  const [is2FAEnabled, setIs2FAEnabled] = useState<boolean | null>(null);
  const [setupData, setSetupData] = useState<TwoFactorSetupResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [setupDialogOpen, setSetupDialogOpen] = useState(false);
  const [disableDialogOpen, setDisableDialogOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  const setupForm = useForm<SetupData>({
    resolver: zodResolver(setupSchema),
    defaultValues: { code: "" },
  });

  const disableForm = useForm<DisableData>({
    resolver: zodResolver(disableSchema),
    defaultValues: { password: "", code: "" },
  });

  useEffect(() => {
    const check2FAStatus = async () => {
      try {
        const response = await fetch("/api/account/profile");
        if (response.ok) {
          const data = (await response.json()) as ProfileResponse;
          // Check if user has totpSecret (this would need to be added to the profile endpoint)
          setIs2FAEnabled(!!data.user.totpSecret);
        }
      } catch (error) {
        console.error("Error checking 2FA status:", error);
      } finally {
        setLoading(false);
      }
    };

    void check2FAStatus();
  }, []);

  const handleStartSetup = async () => {
    try {
      setIsSubmitting(true);
      const response = await fetch("/api/account/2fa/setup");

      if (!response.ok) {
        const error = (await response.json()) as ErrorResponse;
        throw new Error(error.error || "Failed to start 2FA setup");
      }

      const data = (await response.json()) as TwoFactorSetupResponse;
      setSetupData(data);
      setSetupDialogOpen(true);
      setupForm.reset();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to start 2FA setup",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCompleteSetup = async (data: SetupData) => {
    if (!setupData) return;

    try {
      setIsSubmitting(true);
      const response = await fetch("/api/account/2fa/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          secret: setupData.secret,
          code: data.code,
        }),
      });

      const result = (await response.json()) as TwoFactorToggleResponse | ErrorResponse;

      if (!response.ok) {
        const errorResult = result as ErrorResponse;
        throw new Error(errorResult.error || "Failed to enable 2FA");
      }

      toast({
        title: "Success",
        description: "2FA has been enabled successfully",
      });

      setIs2FAEnabled(true);
      setSetupDialogOpen(false);
      setSetupData(null);
      setupForm.reset();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to enable 2FA",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDisable2FA = async (data: DisableData) => {
    try {
      setIsSubmitting(true);
      const response = await fetch("/api/account/2fa/disable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = (await response.json()) as TwoFactorToggleResponse | ErrorResponse;

      if (!response.ok) {
        const errorResult = result as ErrorResponse;
        throw new Error(errorResult.error || "Failed to disable 2FA");
      }

      toast({
        title: "Success",
        description: "2FA has been disabled successfully",
      });

      setIs2FAEnabled(false);
      setDisableDialogOpen(false);
      disableForm.reset();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to disable 2FA",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    void navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Secret copied to clipboard",
    });
  };

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
          {is2FAEnabled ? <ShieldCheck className="h-5 w-5 text-green-600" /> : <Shield className="h-5 w-5" />}
          Two-Factor Authentication
        </CardTitle>
        <CardDescription>Add an extra layer of security to your account with TOTP-based authentication</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Status:</span>
            <Badge variant={is2FAEnabled ? "default" : "secondary"}>{is2FAEnabled ? "Enabled" : "Disabled"}</Badge>
          </div>

          {is2FAEnabled ? (
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
                                disabled={isSubmitting}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute top-0 right-0 h-full px-3 py-2 hover:bg-transparent"
                                onClick={() => {
                                  setShowPassword(!showPassword);
                                }}
                                disabled={isSubmitting}
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
                            <Input placeholder="Enter 6-digit code" {...field} disabled={isSubmitting} maxLength={6} />
                          </FormControl>
                          <FormMessage />
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
                        disabled={isSubmitting}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" variant="destructive" disabled={isSubmitting}>
                        {isSubmitting ? "Disabling..." : "Disable 2FA"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          ) : (
            <Button
              onClick={() => {
                void handleStartSetup();
              }}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Setting up..." : "Enable 2FA"}
            </Button>
          )}
        </div>

        {is2FAEnabled && (
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
                            <Input placeholder="Enter 6-digit code" {...field} disabled={isSubmitting} maxLength={6} />
                          </FormControl>
                          <FormMessage />
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
                        disabled={isSubmitting}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? "Verifying..." : "Enable 2FA"}
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
