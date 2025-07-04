"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

import { createUserAction } from "../_actions/user-actions";

interface CreateUserFormProps {
  readonly onUserCreated: () => void;
}

export function CreateUserForm({ onUserCreated }: CreateUserFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  const [, formAction, isPending] = useActionState(
    async (
      _prevState: { success: boolean; reset?: boolean; error?: string },
      formData: FormData,
    ): Promise<{ success: boolean; reset?: boolean; error?: string }> => {
      const result = await createUserAction(formData);

      if (result.success) {
        toast({
          title: "Success",
          description: result.message,
        });
        onUserCreated();
        return { success: true, reset: true };
      } else {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
        return { success: false, error: result.error };
      }
    },
    { success: false, error: undefined },
  );

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Full Name</Label>
        <Input id="name" name="name" placeholder="Enter full name" disabled={isPending} required maxLength={100} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" placeholder="Enter email address" disabled={isPending} required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Input
            id="password"
            name="password"
            placeholder="Enter password"
            type={showPassword ? "text" : "password"}
            disabled={isPending}
            required
            minLength={8}
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
      </div>

      <div className="space-y-2">
        <Label htmlFor="role">Role</Label>
        <Select name="role" defaultValue="user" disabled={isPending}>
          <SelectTrigger>
            <SelectValue placeholder="Select a role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="user">User</SelectItem>
            <SelectItem value="superuser">Superuser</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            // Reset form by clearing inputs
            const form = document.querySelector("form");
            form?.reset();
          }}
          disabled={isPending}
        >
          Reset
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Creating..." : "Create User"}
        </Button>
      </div>
    </form>
  );
}
