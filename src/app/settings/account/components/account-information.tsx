'use client';

import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Badge } from '~/components/ui/badge';
import { User } from 'lucide-react';

interface AccountInformationProps {
  user: {
    name?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    role?: string | null;
    createdAt?: Date | string | null;
  };
}

export function AccountInformation({ user }: AccountInformationProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Account Information
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">{user.name}</div>
              <div className="text-sm text-muted-foreground">{user.email}</div>
            </div>
            <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
              {user.role}
            </Badge>
          </div>
          
          {user.createdAt && (
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">Date Created</div>
              <span className="font-medium">
                {new Date(user.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}