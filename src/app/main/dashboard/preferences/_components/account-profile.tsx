"use client";

import { User, Mail, Calendar, Camera } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AccountProfile() {
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      {/* Profile Picture & Basic Info */}
      <Card className="gap-2 py-3">
        <CardHeader className="pb-1">
          <CardTitle className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4" />
            Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-14 w-14">
              <AvatarImage alt="Profile picture" src="/placeholder-avatar.png" />
              <AvatarFallback>
                <User className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <Button className="h-7 text-xs" size="sm" variant="outline">
                <Camera className="mr-1 h-3 w-3" />
                Change
              </Button>
              <p className="text-muted-foreground text-xs">JPG, PNG. Max 5MB</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs" htmlFor="firstName">
                First Name
              </Label>
              <Input className="h-7 text-sm" defaultValue="John" id="firstName" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs" htmlFor="lastName">
                Last Name
              </Label>
              <Input className="h-7 text-sm" defaultValue="Doe" id="lastName" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact & Account Info */}
      <Card className="gap-2 py-3">
        <CardHeader className="pb-1">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Mail className="h-4 w-4" />
            Contact & Account
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs">Email Address</Label>
            <div className="flex items-center gap-2">
              <Input className="h-7 flex-1 text-sm" defaultValue="john.doe@example.com" type="email" />
              <Badge className="text-xs" variant="secondary">
                Verified
              </Badge>
            </div>
          </div>

          <div className="space-y-1">
            <Label className="flex items-center gap-1 text-xs">
              <Calendar className="h-3 w-3" />
              Member Since
            </Label>
            <p className="text-muted-foreground bg-muted rounded px-2 py-1 text-sm text-xs">January 15, 2024</p>
          </div>

          <div className="flex gap-2 pt-1">
            <Button className="h-7 flex-1 text-xs" size="sm" variant="outline">
              Cancel
            </Button>
            <Button className="h-7 flex-1 text-xs" size="sm">
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
