'use client';

import { useState } from 'react';
import { authClient } from '~/lib/auth-client';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Badge } from '~/components/ui/badge';
import { Alert, AlertDescription } from '~/components/ui/alert';
import { Separator } from '~/components/ui/separator';
import { Copy, Eye, EyeOff, Shield, ShieldCheck, Key } from 'lucide-react';
import QRCode from 'react-qr-code';

type TwoFactorState = 
  | 'loading'
  | 'disabled' 
  | 'enabled'
  | 'enter_password'
  | 'show_qr'
  | 'verify_code'
  | 'show_backup'
  | 'confirm_disable'
  | 'generate_backup';

export function TwoFactorManager() {
  const { data: session, isPending } = authClient.useSession();
  const [state, setState] = useState<TwoFactorState>('loading');
  const [password, setPassword] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [totpUri, setTotpUri] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [copiedCodes, setCopiedCodes] = useState(false);

  // Set initial state based on session data
  if (isPending && state === 'loading') {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-sm text-muted-foreground">Loading 2FA status...</div>
      </div>
    );
  }

  if (state === 'loading') {
    setState(session?.user?.twoFactorEnabled ? 'enabled' : 'disabled');
    return null;
  }

  const clearError = () => setError('');
  const clearPassword = () => setPassword('');
  const clearTotpCode = () => setTotpCode('');

  const handleEnable2FA = async () => {
    if (!password.trim()) {
      setError('Password is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('Calling getTotpUri with password:', password);
      console.log('authClient.twoFactor methods:', Object.keys(authClient.twoFactor || {}));
      console.log('authClient methods:', Object.keys(authClient));
      console.log('Full authClient.twoFactor object:', authClient.twoFactor);
      
      // First enable 2FA, then get the TOTP URI
      console.log('Step 1: Enabling 2FA...');
      const enableResult = await fetch('/api/auth/two-factor/enable', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
        credentials: 'include'
      });
      
      console.log('Enable API response status:', enableResult.status);
      
      if (!enableResult.ok) {
        const errorText = await enableResult.text();
        console.error('Enable API error response:', errorText);
        setError(`Failed to enable 2FA: ${errorText || 'Unknown error'}`);
        return;
      }
      
      const enableData = await enableResult.json();
      console.log('Enable API response data:', enableData);
      
      // Check if TOTP URI is already in the enable response
      let totpURI = null;
      if (enableData.totpURI || enableData.totp_uri || enableData.totpUri || enableData.uri) {
        totpURI = enableData.totpURI || enableData.totp_uri || enableData.totpUri || enableData.uri;
        console.log('Found TOTP URI in enable response:', totpURI);
      } else {
        // If not in enable response, try to get it separately
        console.log('Step 2: Getting TOTP URI...');
        const uriResult = await fetch('/api/auth/two-factor/get-totp-uri', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ password }),
          credentials: 'include'
        });
        
        if (uriResult.ok) {
          const uriData = await uriResult.json();
          console.log('URI API response data:', uriData);
          totpURI = uriData.totpURI || uriData.totp_uri || uriData.totpUri || uriData.uri;
        }
      }

      if (totpURI) {
        console.log('Final TOTP URI:', totpURI);
        setTotpUri(totpURI);
        setState('show_qr');
        clearPassword();
      } else {
        console.error('No totpURI found after enable/get attempts');
        setError('Failed to get TOTP URI. Check server configuration.');
      }
    } catch (err: any) {
      console.error('2FA enable error:', err);
      setError(err.message || 'Failed to enable 2FA');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!totpCode.trim() || totpCode.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('Calling verifyTotp with code:', totpCode);
      
      const response = await fetch('/api/auth/two-factor/verify-totp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: totpCode }),
        credentials: 'include'
      });

      console.log('Verify API response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Verify API error response:', errorText);
        setError(`Verification failed: ${errorText || 'Invalid code'}`);
        return;
      }

      const verifyResult = await response.json();
      console.log('verifyTotp result:', verifyResult);

      // 2FA is now enabled, show success and finish
      setState('enabled');
      clearTotpCode();
      
      // Note: Backup codes are typically generated during the initial setup
      // If needed, user can generate them separately from profile settings
    } catch (err: any) {
      console.error('2FA verify error:', err);
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
      const response = await fetch('/api/auth/two-factor/disable', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
        credentials: 'include'
      });

      console.log('Disable API response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Disable API error response:', errorText);
        setError(`Failed to disable 2FA: ${errorText}`);
        return;
      }

      const result = await response.json();
      console.log('Disable result:', result);

      setState('disabled');
      clearPassword();
      setBackupCodes([]);
      setTotpUri('');
    } catch (err: any) {
      console.error('2FA disable error:', err);
      setError(err.message || 'Failed to disable 2FA');
    } finally {
      setLoading(false);
    }
  };

  const copyBackupCodes = async () => {
    try {
      await navigator.clipboard.writeText(backupCodes.join('\n'));
      setCopiedCodes(true);
      setTimeout(() => setCopiedCodes(false), 2000);
    } catch (err) {
      console.error('Failed to copy backup codes:', err);
    }
  };

  const finishSetup = () => {
    setState('enabled');
    setBackupCodes([]);
  };

  const generateBackupCodes = async () => {
    if (!password.trim()) {
      setError('Password is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await authClient.twoFactor.generateBackupCodes({ password });

      if (result.error) {
        setError(result.error.message || 'Failed to generate backup codes');
        return;
      }

      if (result.data?.backupCodes) {
        setBackupCodes(result.data.backupCodes);
        setState('show_backup');
        clearPassword();
      }
    } catch (err: any) {
      console.error('Backup codes generation error:', err);
      setError(err.message || 'Failed to generate backup codes');
    } finally {
      setLoading(false);
    }
  };

  // Render current status
  if (state === 'disabled' || state === 'enabled') {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {state === 'enabled' ? (
              <ShieldCheck className="h-5 w-5 text-green-500" />
            ) : (
              <Shield className="h-5 w-5 text-muted-foreground" />
            )}
            <div>
              <div className="font-medium">Two-Factor Authentication</div>
              <div className="text-sm text-muted-foreground">
                {state === 'enabled' 
                  ? 'Your account is protected with 2FA' 
                  : 'Add extra security to your account'
                }
              </div>
            </div>
          </div>
          <Badge variant={state === 'enabled' ? 'default' : 'outline'}>
            {state === 'enabled' ? 'Enabled' : 'Disabled'}
          </Badge>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex gap-2 pt-2">
          <Button
            onClick={() => {
              clearError();
              setState(state === 'enabled' ? 'confirm_disable' : 'enter_password');
            }}
            variant={state === 'enabled' ? 'outline' : 'default'}
            disabled={loading}
          >
            {state === 'enabled' ? 'Disable 2FA' : 'Enable 2FA'}
          </Button>
          
          {state === 'enabled' && (
            <Button
              variant="outline"
              onClick={() => {
                clearError();
                setState('generate_backup');
              }}
              disabled={loading}
            >
              <Key className="h-4 w-4 mr-2" />
              Backup Codes
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Render enable flow - password input
  if (state === 'enter_password') {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Shield className="h-4 w-4" />
          Enable Two-Factor Authentication
        </div>
        
        <div className="text-sm text-muted-foreground">
          Enter your password to set up 2FA with your authenticator app.
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="password">Current Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleEnable2FA()}
              placeholder="Enter your password"
              disabled={loading}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              onClick={() => setShowPassword(!showPassword)}
              disabled={loading}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button onClick={handleEnable2FA} disabled={loading || !password.trim()}>
            {loading ? 'Generating...' : 'Continue'}
          </Button>
          <Button 
            variant="outline" 
            onClick={() => {
              setState('disabled');
              clearError();
              clearPassword();
            }}
            disabled={loading}
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  // Render QR code display
  if (state === 'show_qr') {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Shield className="h-4 w-4" />
          Scan QR Code
        </div>

        <div className="text-sm text-muted-foreground">
          Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.), then enter the 6-digit code below.
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex justify-center p-6 bg-white rounded-lg border">
          <QRCode value={totpUri} size={200} />
        </div>

        <Separator />

        <div className="space-y-2">
          <Label htmlFor="totp">Verification Code</Label>
          <Input
            id="totp"
            type="text"
            value={totpCode}
            onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            onKeyDown={(e) => e.key === 'Enter' && handleVerifyCode()}
            placeholder="Enter 6-digit code"
            maxLength={6}
            disabled={loading}
          />
        </div>

        <div className="flex gap-2 pt-2">
          <Button onClick={handleVerifyCode} disabled={loading || totpCode.length !== 6}>
            {loading ? 'Verifying...' : 'Verify & Enable'}
          </Button>
          <Button 
            variant="outline" 
            onClick={() => {
              setState('disabled');
              clearError();
              clearTotpCode();
              setTotpUri('');
            }}
            disabled={loading}
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  // Render backup codes
  if (state === 'show_backup') {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium text-green-600">
          <ShieldCheck className="h-4 w-4" />
          Two-Factor Authentication Enabled!
        </div>

        <Alert>
          <AlertDescription>
            Save these backup codes in a safe place. You can use them to access your account if you lose your authenticator device.
          </AlertDescription>
        </Alert>

        <div className="bg-muted p-4 rounded-lg space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Backup Codes</span>
            <Button
              variant="outline"
              size="sm"
              onClick={copyBackupCodes}
              className="h-8"
            >
              <Copy className="h-3 w-3 mr-1" />
              {copiedCodes ? 'Copied!' : 'Copy'}
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm font-mono">
            {backupCodes.map((code, index) => (
              <div key={index} className="bg-background p-2 rounded border">
                {code}
              </div>
            ))}
          </div>
        </div>

        <div className="pt-2">
          <Button onClick={finishSetup} className="w-full">
            I've Saved My Backup Codes
          </Button>
        </div>
      </div>
    );
  }

  // Render disable confirmation
  if (state === 'confirm_disable') {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium text-destructive">
          <Shield className="h-4 w-4" />
          Disable Two-Factor Authentication
        </div>

        <Alert variant="destructive">
          <AlertDescription>
            This will remove the extra security layer from your account. You'll only need your password to sign in.
          </AlertDescription>
        </Alert>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="disable-password">Current Password</Label>
          <div className="relative">
            <Input
              id="disable-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleDisable2FA()}
              placeholder="Enter your password"
              disabled={loading}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              onClick={() => setShowPassword(!showPassword)}
              disabled={loading}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button 
            variant="destructive" 
            onClick={handleDisable2FA} 
            disabled={loading || !password.trim()}
          >
            {loading ? 'Disabling...' : 'Disable 2FA'}
          </Button>
          <Button 
            variant="outline" 
            onClick={() => {
              setState('enabled');
              clearError();
              clearPassword();
            }}
            disabled={loading}
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  // Render backup codes generation
  if (state === 'generate_backup') {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Key className="h-4 w-4" />
          Generate New Backup Codes
        </div>

        <Alert>
          <AlertDescription>
            This will generate new backup codes and invalidate any existing ones. Save the new codes in a secure location.
          </AlertDescription>
        </Alert>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="backup-password">Current Password</Label>
          <div className="relative">
            <Input
              id="backup-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && generateBackupCodes()}
              placeholder="Enter your password"
              disabled={loading}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              onClick={() => setShowPassword(!showPassword)}
              disabled={loading}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button onClick={generateBackupCodes} disabled={loading || !password.trim()}>
            {loading ? 'Generating...' : 'Generate Backup Codes'}
          </Button>
          <Button 
            variant="outline" 
            onClick={() => {
              setState('enabled');
              clearError();
              clearPassword();
            }}
            disabled={loading}
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return null;
}