"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import type { SafeUser } from "@/lib/data/users";

import { updateProfileAction } from "../_actions/profile-actions";

const profileSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email format"),
});

type ProfileData = z.infer<typeof profileSchema>;

const formatDate = (date: Date | string) => {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date instanceof Date ? date : new Date(date));
};

interface AccountSettingsProps {
  readonly initialUser: SafeUser;
}

export function AccountSettings({ initialUser }: AccountSettingsProps) {
  const [user, setUser] = useState<SafeUser>(initialUser);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const form = useForm<ProfileData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user.name ?? "",
      email: user.email,
    },
  });

  const onSubmit = (data: ProfileData) => {
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("name", data.name);
        formData.append("email", data.email);

        const result = await updateProfileAction(formData);

        if (!result.success) {
          throw new Error(result.error);
        }

        if (result.user) {
          setUser(result.user);
          form.reset({
            name: result.user.name ?? "",
            email: result.user.email,
          });
        }

        toast({
          title: "Success",
          description: result.message,
        });
      } catch (error) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to update profile",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>Update your personal information and email address</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void form.handleSubmit(onSubmit)(e);
              }}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your full name" {...field} disabled={isPending} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your email" type="email" {...field} disabled={isPending} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    form.reset({
                      name: user.name ?? "",
                      email: user.email,
                    });
                  }}
                  disabled={isPending}
                >
                  Reset
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Updating..." : "Update Profile"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>Read-only information about your account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-muted-foreground text-sm font-medium">Role</div>
              <p className="text-sm capitalize">{user.role}</p>
            </div>
            <div>
              <div className="text-muted-foreground text-sm font-medium">Account Created</div>
              <p className="text-sm">{formatDate(user.createdAt)}</p>
            </div>
            <div>
              <div className="text-muted-foreground text-sm font-medium">Last Updated</div>
              <p className="text-sm">{formatDate(user.updatedAt)}</p>
            </div>
            <div>
              <div className="text-muted-foreground text-sm font-medium">Last Login</div>
              <p className="text-sm">{user.lastLoginAt ? formatDate(user.lastLoginAt) : "Never"}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
