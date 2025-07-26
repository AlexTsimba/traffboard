'use client';

import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Badge } from '~/components/ui/badge';
import { LogIn } from 'lucide-react';

interface LoginMethodsProps {
  user: {
    email?: string | null;
  };
  isGoogleLinked: boolean;
  googleAccountInfo?: {
    userEmail?: string;
    createdAt: Date;
  } | null;
}

export function LoginMethods({ user, isGoogleLinked, googleAccountInfo }: LoginMethodsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LogIn className="h-5 w-5" />
          Login Methods
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Email/Password Login */}
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium">Email & Password</div>
            <div className="text-sm text-muted-foreground">
              {user?.email} • Always available
            </div>
          </div>
          <Badge variant="default">Available</Badge>
        </div>

        {/* Google OAuth */}
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium">Google OAuth</div>
            <div className="text-sm text-muted-foreground">
              {isGoogleLinked && googleAccountInfo?.userEmail
                ? `${googleAccountInfo.userEmail} • Linked ${new Date(googleAccountInfo.createdAt).toLocaleDateString()}`
                : 'Sign in with Google using matching email to link'
              }
            </div>
          </div>
          <Badge variant={isGoogleLinked ? 'default' : 'outline'}>
            {isGoogleLinked ? 'Linked' : 'Sign in with Google  ot link'}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}