'use client';

import { useState } from 'react';
import { authClient } from '~/lib/auth-client';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Separator } from '~/components/ui/separator';
import { Alert, AlertDescription } from '~/components/ui/alert';
import { Badge } from '~/components/ui/badge';
import { Shield, ShieldCheck } from 'lucide-react';
import QRCode from 'react-qr-code';

export function SecurityClient() {
  const { data: session, isPending } = authClient.useSession();
  const [password, setPassword] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [totpUri, setTotpUri] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showEnableForm, setShowEnableForm] = useState(false);
  const [showQR, setShowQR] = useState(false);

  if (isPending) {
    return <div>Loading...</div>;
  }

  const is2FAEnabled = session?.user?.twoFactorEnabled || false;

  const handleEnable2FA = async () => {
    if (!password.trim()) {
      setError('Password is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data, error } = await authClient.twoFactor.enable({
        password,
        issuer: "Traffboard Analytics"
      });

      if (error) {
        setError(error.message || 'Failed to enable 2FA');
        return;
      }

      if (data?.totpURI) {
        setTotpUri(data.totpURI);
        setShowQR(true);
        setPassword('');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to enable 2FA');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyTOTP = async () => {
    if (!totpCode.trim() || totpCode.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data, error } = await authClient.twoFactor.verifyTotp({
        code: totpCode,
        trustDevice: true
      });

      if (error) {
        setError(error.message || 'Invalid code');
        return;
      }

      // Success - reset form
      setTotpCode('');
      setTotpUri('');
      setShowQR(false);
      setShowEnableForm(false);
      // Session will update automatically
    } catch (err: any) {
      setError(err.message || 'Failed to verify code');
    } finally {
      setLoading(false);
    }
  };

  const handleDisable2FA = async () => {
    if (!password.trim()) {
      setError('Password is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data, error } = await authClient.twoFactor.disable({
        password
      });

      if (error) {
        setError(error.message || 'Failed to disable 2FA');
        return;
      }

      setPassword('');
      setShowEnableForm(false);
    } catch (err: any) {
      setError(err.message || 'Failed to disable 2FA');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Security Settings</h1>
        <p className="text-muted-foreground">
          Manage your account security and two-factor authentication
        </p>
      </div>

      <Separator />

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Two-Factor Authentication</CardTitle>
            <p className="text-sm text-muted-foreground">
              Add an extra layer of security to your account by requiring a code from your authenticator app.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {is2FAEnabled ? (
                  <ShieldCheck className="h-5 w-5 text-green-500" />
                ) : (
                  <Shield className="h-5 w-5 text-muted-foreground" />
                )}
                <div>
                  <div className="font-medium">Two-Factor Authentication</div>
                  <div className="text-sm text-muted-foreground">
                    {is2FAEnabled 
                      ? 'Your account is protected with 2FA' 
                      : 'Add extra security to your account'
                    }
                  </div>
                </div>
              </div>
              <Badge variant={is2FAEnabled ? 'default' : 'outline'}>
                {is2FAEnabled ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {!is2FAEnabled && !showEnableForm && !showQR && (
              <Button onClick={() => setShowEnableForm(true)}>
                Enable Two-Factor Authentication
              </Button>
            )}

            {!is2FAEnabled && showEnableForm && !showQR && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Current Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    disabled={loading}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleEnable2FA} disabled={loading || !password.trim()}>
                    {loading ? 'Generating...' : 'Continue'}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setShowEnableForm(false);
                      setPassword('');
                      setError('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {showQR && (
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  Scan this QR code with your authenticator app, then enter the 6-digit code below.
                </div>
                
                <div className="flex justify-center p-6 bg-white rounded-lg border">
                  <QRCode value={totpUri} size={200} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="totpCode">Verification Code</Label>
                  <Input
                    id="totpCode"
                    type="text"
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="Enter 6-digit code"
                    maxLength={6}
                    disabled={loading}
                  />
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleVerifyTOTP} disabled={loading || totpCode.length !== 6}>
                    {loading ? 'Verifying...' : 'Verify & Enable'}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setShowQR(false);
                      setShowEnableForm(false);
                      setTotpCode('');
                      setTotpUri('');
                      setError('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {is2FAEnabled && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="disablePassword">Current Password</Label>
                  <Input
                    id="disablePassword"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password to disable 2FA"
                    disabled={loading}
                  />
                </div>
                <Button 
                  variant="destructive" 
                  onClick={handleDisable2FA} 
                  disabled={loading || !password.trim()}
                >
                  {loading ? 'Disabling...' : 'Disable 2FA'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Account Security</CardTitle>
            <p className="text-sm text-muted-foreground">
              Additional security settings for your account.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Password</h3>
                <p className="text-sm text-muted-foreground">
                  Last changed: Never
                </p>
              </div>
              {/* Change password functionality can be added later */}
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Active Sessions</h3>
                <p className="text-sm text-muted-foreground">
                  Manage your active login sessions
                </p>
              </div>
              {/* Session management can be added later */}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}