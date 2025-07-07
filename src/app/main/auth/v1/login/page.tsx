"use client";

import { BarChart3 } from "lucide-react";
import { useState } from "react";

import { LoginFormV1 } from "./_components/login-form";

export default function LoginV1() {
  const [currentStep, setCurrentStep] = useState<"login" | "2fa">("login");

  return (
    <div className="flex h-dvh">
      <div className="bg-primary hidden lg:block lg:w-1/3">
        <div className="flex h-full flex-col items-center justify-center p-12 text-center">
          <div className="space-y-6">
            <BarChart3 className="text-primary-foreground mx-auto size-12" />
            <div className="space-y-2">
              <h1 className="text-primary-foreground text-5xl font-light">TraffBoard</h1>
              <p className="text-primary-foreground/80 text-xl">Analytics Dashboard</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-background flex w-full items-center justify-center p-8 lg:w-2/3">
        <div className="w-full max-w-md space-y-10 py-24 lg:py-32">
          {currentStep === "login" && (
            <div className="space-y-4 text-center">
              <div className="text-foreground font-medium tracking-tight">Sign In</div>
              <div className="text-muted-foreground mx-auto max-w-xl">
                Welcome to TraffBoard. Enter your credentials to access the analytics dashboard.
              </div>
            </div>
          )}
          <div className="space-y-4">
            <LoginFormV1 onStepChange={setCurrentStep} />
            {currentStep === "login" && (
              <p className="text-muted-foreground text-center text-xs font-medium">
                Authorized users only. Contact your administrator for access.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
