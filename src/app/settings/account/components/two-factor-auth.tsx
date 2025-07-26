'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Badge } from '~/components/ui/badge';
import { Shield, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import QRCode from 'react-qr-code';

interface TwoFactorAuthProps {
  is2FAEnabled: boolean;
  onEnable2FA: (password: string) => Promise<{ data?: { totpURI: string } } | undefined>;
  onVerifyTOTP: (code: string) => Promise<void>;
  onDisable2FA: (password: string) => Promise<void>;
}

export function TwoFactorAuth({ is2FAEnabled, onEnable2FA, onVerifyTOTP, onDisable2FA }: TwoFactorAuthProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [password, setPassword] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [totpUri, setTotpUri] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'initial' | 'qr' | 'complete'>('initial');

  const resetForm = useCallback(() => {
    setPassword('');
    setTotpCode('');
    setTotpUri('');
    setShowPassword(false);
    setStep('initial');
    setIsExpanded(false);
  }, []);

  const handleEnableSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;

    setIsLoading(true);
    try {
      const result = await onEnable2FA(password);
      if (result?.data?.totpURI) {
        setTotpUri(result.data.totpURI);
        setStep('qr');
        setPassword('');
      }
    } finally {
      setIsLoading(false);
    }
  }, [password, onEnable2FA]);

  const handleVerifySubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (totpCode.length !== 6) return;

    setIsLoading(true);
    try {
      await onVerifyTOTP(totpCode);
      resetForm();
    } catch {
      // Error already handled by parent handler, just prevent console errors
    } finally {
      setIsLoading(false);
    }
  }, [totpCode, onVerifyTOTP, resetForm]);

  const handleDisableSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;

    setIsLoading(true);
    try {
      await onDisable2FA(password);
      resetForm();
    } catch {
      // Error already handled by parent handler, just prevent console errors
    } finally {
      setIsLoading(false);
    }
  }, [password, onDisable2FA, resetForm]);

  const hasContent = password || totpCode;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {is2FAEnabled ? (
              <ShieldCheck className="h-5 w-5" />
            ) : (
              <Shield className="h-5 w-5" />
            )}
            Two-Factor Authentication
          </CardTitle>
          <Badge variant={is2FAEnabled ? 'default' : 'outline'}>
            {is2FAEnabled ? 'Enabled' : 'Disabled'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {!isExpanded ? (
          <div className="flex justify-end">
            <Button 
              onClick={() => setIsExpanded(true)}
              variant={is2FAEnabled ? 'destructive' : 'default'}
            >
              {is2FAEnabled ? 'Disable 2FA' : 'Enable 2FA'}
            </Button>
          </div>
        ) : (
          <>
            {/* Enable 2FA Form */}
            {!is2FAEnabled && step === 'initial' && (
          <form onSubmit={handleEnableSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="enablePassword">Current Password</Label>
              <div className="relative">
                <Input
                  id="enablePassword"
                  name="enablePassword"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  disabled={isLoading}
                  autoComplete="current-password"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              {hasContent && (
                <Button 
                  type="button"
                  variant="ghost" 
                  onClick={resetForm}
                  disabled={isLoading}
                >
                  Clear
                </Button>
              )}
              <Button 
                type="submit"
                disabled={!password.trim() || isLoading}
              >
                {isLoading ? 'Generating...' : 'Enable 2FA'}
              </Button>
            </div>
          </form>
        )}

        {/* QR Code Verification Form */}
        {!is2FAEnabled && step === 'qr' && (
          <form onSubmit={handleVerifySubmit} className="space-y-4">
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
                name="totpCode"
                type="text"
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                disabled={isLoading}
                autoComplete="one-time-code"
                required
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button 
                type="button"
                variant="ghost" 
                onClick={resetForm}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={totpCode.length !== 6 || isLoading}
              >
                {isLoading ? 'Verifying...' : 'Verify & Enable'}
              </Button>
            </div>
          </form>
        )}

        {/* Disable 2FA Form */}
        {is2FAEnabled && (
          <form onSubmit={handleDisableSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="disablePassword">Current Password</Label>
              <div className="relative">
                <Input
                  id="disablePassword"
                  name="disablePassword"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  disabled={isLoading}
                  autoComplete="current-password"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              {hasContent && (
                <Button 
                  type="button"
                  variant="ghost" 
                  onClick={resetForm}
                  disabled={isLoading}
                >
                  Clear
                </Button>
              )}
              <Button 
                type="submit"
                variant="destructive"
                disabled={!password.trim() || isLoading}
              >
                {isLoading ? 'Disabling...' : 'Disable 2FA'}
              </Button>
            </div>
          </form>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}