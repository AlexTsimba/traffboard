'use client';

import { useState, useEffect } from 'react';
import { authClient } from '~/lib/auth-client';
import { Card, CardHeader, CardTitle, CardContent } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { useRouter } from 'next/navigation';
import { authNotifications } from '~/lib/toast-utils';

export default function TwoFactorPage() {
  const [code, setCode] = useState('');
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Auto-focus input on mount
  useEffect(() => {
    const input = document.getElementById('code');
    if (input) {
      input.focus();
    }
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      void handleVerify();
    }
  };

  const handleVerify = async () => {
    if (!code.trim()) {
      authNotifications.twoFactor.error('Please enter the verification code');
      return;
    }

    setIsLoading(true);

    try {
      const result = useBackupCode 
        ? await authClient.twoFactor.verifyBackupCode({ code })
        : await authClient.twoFactor.verifyTotp({ code, trustDevice: true });
      
      if (result.error) {
        const errorMessage = result.error.message ?? (useBackupCode ? 'Invalid backup code' : 'Invalid verification code');
        authNotifications.twoFactor.error(errorMessage);
        setCode(''); // Clear the code for retry
      } else {
        router.push('/dashboard?login=success');
      }
    } catch (err: unknown) {
      const errorMessage = (err as Error).message ?? (useBackupCode ? 'Invalid backup code' : 'Invalid verification code');
      authNotifications.twoFactor.error(errorMessage);
      setCode(''); // Clear the code for retry
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Two-Factor Authentication</CardTitle>
          <p className="text-muted-foreground">
            {useBackupCode 
              ? 'Enter one of your backup codes' 
              : 'Enter the verification code from your authenticator app'
            }
          </p>
        </CardHeader>
        <CardContent className="space-y-4">          
          <div className="space-y-2">
            <Label htmlFor="code">
              {useBackupCode ? 'Backup Code' : 'Verification Code'}
            </Label>
            <Input
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={useBackupCode ? "Enter backup code" : "Enter 6-digit code"}
              maxLength={useBackupCode ? 20 : 6}
              autoFocus
              className="text-center text-lg tracking-widest"
            />
          </div>
          
          <Button 
            onClick={handleVerify} 
            disabled={isLoading} 
            className="w-full"
          >
            {isLoading ? 'Verifying...' : 'Verify & Continue'}
          </Button>
          
          <div className="text-center">
            <button 
              type="button"
              onClick={() => {
                setUseBackupCode(!useBackupCode);
                setCode('');
              }}
              className="text-sm text-muted-foreground hover:text-foreground underline"
            >
              {useBackupCode 
                ? 'Use authenticator app instead' 
                : 'Use backup code instead'
              }
            </button>
          </div>
          
          <p className="text-xs text-muted-foreground text-center">
            Can&apos;t access your authenticator? Contact support.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}