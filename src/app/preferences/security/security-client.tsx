'use client';

import { useState, useEffect } from 'react';
import { authClient } from '~/lib/auth-client';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Separator } from '~/components/ui/separator';
import { Alert, AlertDescription } from '~/components/ui/alert';
import { Badge } from '~/components/ui/badge';
import { Shield, ShieldCheck, Key, Eye, EyeOff, Monitor, Smartphone, Tablet, Globe, Trash2, Link, Unlink } from 'lucide-react';
import QRCode from 'react-qr-code';

export function SecurityClient() {
  const { data: session, isPending } = authClient.useSession();
  
  // 2FA state
  const [password, setPassword] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [totpUri, setTotpUri] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showEnableForm, setShowEnableForm] = useState(false);
  const [showQR, setShowQR] = useState(false);
  
  // Change password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showChangePasswordForm, setShowChangePasswordForm] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // Session management state
  const [sessions, setSessions] = useState<Array<{
    id: string;
    userAgent?: string | null;
    ipAddress?: string | null;
    updatedAt: Date;
    userId: string;
    expiresAt: Date;
    createdAt: Date;
    token: string;
  }>>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [sessionError, setSessionError] = useState('');
  const [revokeLoading, setRevokeLoading] = useState('');

  // Google account linking state
  const [googleLinkLoading, setGoogleLinkLoading] = useState(false);
  const [googleError, setGoogleError] = useState('');
  const [googleSuccess, setGoogleSuccess] = useState(false);

  // Check if Google account is linked and get account details
  const [isGoogleLinked, setIsGoogleLinked] = useState(false);
  const [googleAccountInfo, setGoogleAccountInfo] = useState<{
    accountId: string;
    provider: string;
    createdAt: Date;
    scopes: string[];
    userEmail?: string;
    userName?: string;
  } | null>(null);

  // Load linked accounts on component mount
  const checkGoogleAccount = async () => {
    try {
      const result = await authClient.listAccounts();
      console.log('listAccounts result:', result);
      console.log('current session:', session);
      
      if (result.data && Array.isArray(result.data)) {
        const googleAccount = result.data.find((account: { 
          provider: string; 
          accountId: string;
          createdAt: Date;
          scopes: string[];
        }) => account.provider === 'google');
        
        if (googleAccount) {
          setIsGoogleLinked(true);
          
          console.log('Google account object:', googleAccount);
          
          // Better Auth account linking doesn't store OAuth profile data
          // For linked accounts, we should show that it's connected but we can't get the Google email
          // The email shown should be the current user's email who linked the account
          let userEmail = session?.user?.email;
          let userName = session?.user?.name;
          
          console.log('Using session email for linked account:', { userEmail, userName });
          
          setGoogleAccountInfo({
            accountId: googleAccount.accountId,
            provider: googleAccount.provider,
            createdAt: googleAccount.createdAt,
            scopes: googleAccount.scopes || [],
            userEmail,
            userName
          });
        } else {
          setIsGoogleLinked(false);
          setGoogleAccountInfo(null);
        }
      } else {
        setIsGoogleLinked(false);
        setGoogleAccountInfo(null);
      }
    } catch (err) {
      // Silently fail - account check is not critical
      console.log('Could not check linked accounts:', err);
      setIsGoogleLinked(false);
      setGoogleAccountInfo(null);
    }
  };

  useEffect(() => {
    void checkGoogleAccount();
  }, [session]); // Re-run when session changes

  // Handle OAuth callback validation and errors
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    const success = urlParams.get('linked');
    const errorDescription = urlParams.get('error_description');
    
    if (error) {
      let errorMessage = decodeURIComponent(error);
      
      // Handle specific Better Auth linking errors
      if (error === 'linking_failed') {
        errorMessage = 'Account linking failed. Please ensure you use the same email address for OAuth authentication.';
      } else if (error === 'email_mismatch') {
        errorMessage = 'Email mismatch: The Google account email does not match your current account email. Please use the same email address.';
      } else if (errorDescription) {
        errorMessage = decodeURIComponent(errorDescription);
      }
      
      setGoogleError(errorMessage);
      setGoogleLinkLoading(false);
      // Clean up URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (success === 'google') {
      setGoogleSuccess(true);
      setTimeout(() => setGoogleSuccess(false), 3000);
      setGoogleLinkLoading(false);
      // Refresh account info
      void checkGoogleAccount();
      // Clean up URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []); // Empty dependency array - runs only on mount

  const loadSessions = async () => {
    setSessionsLoading(true);
    setSessionError('');
    
    try {
      const response = await authClient.listSessions();
      
      // Better Auth returns {data: Array, error: null} format
      if (response?.data && Array.isArray(response.data)) {
        setSessions(response.data);
      } else if (response?.error) {
        setSessionError(response.error.message ?? 'Failed to load sessions');
      } else {
        setSessions([]);
      }
    } catch (err: unknown) {
      setSessionError(err instanceof Error ? err.message : 'Failed to load sessions');
    } finally {
      setSessionsLoading(false);
    }
  };

  const revokeSession = async (sessionToken: string) => {
    setRevokeLoading(sessionToken);
    
    try {
      await authClient.revokeSession({ token: sessionToken });
      // Reload sessions after successful revocation
      await loadSessions();
    } catch (err: unknown) {
      setSessionError(err instanceof Error ? err.message : 'Failed to revoke session');
    } finally {
      setRevokeLoading('');
    }
  };

  const revokeAllOtherSessions = async () => {
    setSessionsLoading(true);
    setSessionError('');
    
    try {
      await authClient.revokeOtherSessions();
      // Reload sessions after successful revocation
      await loadSessions();
    } catch (err: unknown) {
      setSessionError(err instanceof Error ? err.message : 'Failed to revoke other sessions');
    } finally {
      setSessionsLoading(false);
    }
  };

  const handleLinkGoogle = async () => {
    setGoogleLinkLoading(true);
    setGoogleError('');
    
    try {
      await authClient.linkSocial({
        provider: 'google',
        callbackURL: `${window.location.origin}/preferences/security`
      });
      // Note: This will redirect to Google OAuth, so loading state won't reset here
    } catch (err: unknown) {
      setGoogleError(err instanceof Error ? err.message : 'Failed to link Google account');
      setGoogleLinkLoading(false);
    }
  };

  const handleUnlinkGoogle = async () => {
    setGoogleLinkLoading(true);
    setGoogleError('');
    
    try {
      await authClient.unlinkAccount({
        providerId: 'google'
      });
      
      setIsGoogleLinked(false);
      setGoogleAccountInfo(null);
      setGoogleSuccess(true);
      setTimeout(() => setGoogleSuccess(false), 3000);
    } catch (err: unknown) {
      setGoogleError(err instanceof Error ? err.message : 'Failed to unlink Google account');
    } finally {
      setGoogleLinkLoading(false);
    }
  };

  const getDeviceIcon = (userAgent?: string) => {
    if (!userAgent) return <Monitor className="h-4 w-4" />;
    
    const ua = userAgent.toLowerCase();
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
      return <Smartphone className="h-4 w-4" />;
    }
    if (ua.includes('tablet') || ua.includes('ipad')) {
      return <Tablet className="h-4 w-4" />;
    }
    return <Monitor className="h-4 w-4" />;
  };

  const getBrowserName = (userAgent?: string | null): string => {
    if (!userAgent) return 'Unknown Browser';
    
    const ua = userAgent.toLowerCase();
    
    // Check for specific browsers in order of specificity
    if (ua.includes('edg/')) return 'Edge';
    if (ua.includes('chrome/') && ua.includes('safari/')) return 'Chrome';
    if (ua.includes('firefox/')) return 'Firefox';
    if (ua.includes('safari/') && !ua.includes('chrome/')) return 'Safari';
    if (ua.includes('opera/') || ua.includes('opr/')) return 'Opera';
    if (ua.includes('brave/')) return 'Brave';
    
    // Fallback to parsing the first meaningful part
    const parts = userAgent.split(' ');
    for (const part of parts) {
      if (part.includes('/') && !part.startsWith('Mozilla/')) {
        return part.split('/')[0] ?? 'Unknown Browser';
      }
    }
    
    return 'Unknown Browser';
  };

  const formatLastActive = (date: Date | string) => {
    const now = new Date();
    const sessionDate = typeof date === 'string' ? new Date(date) : date;
    const diffMs = now.getTime() - sessionDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffMinutes > 0) return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  // Load sessions on component mount
  useEffect(() => {
    void loadSessions();
  }, []);

  if (isPending) {
    return <div>Loading...</div>;
  }

  const is2FAEnabled = session?.user?.twoFactorEnabled ?? false;

  const handleEnable2FA = async () => {
    if (!password.trim()) {
      setError('Password is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await authClient.twoFactor.enable({
        password,
        issuer: "Traffboard Analytics"
      });

      if (result?.data?.totpURI) {
        setTotpUri(result.data.totpURI);
        setShowQR(true);
        setPassword('');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to enable 2FA');
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
      await authClient.twoFactor.verifyTotp({
        code: totpCode,
        trustDevice: true
      });

      // Success - reset form
      setTotpCode('');
      setTotpUri('');
      setShowQR(false);
      setShowEnableForm(false);
      // Session will update automatically
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to verify code');
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
      await authClient.twoFactor.disable({
        password
      });

      setPassword('');
      setShowEnableForm(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to disable 2FA');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword.trim()) {
      setPasswordError('Current password is required');
      return;
    }

    if (!newPassword.trim()) {
      setPasswordError('New password is required');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    setPasswordLoading(true);
    setPasswordError('');

    try {
      await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: true // Automatically revoke other sessions for security
      });

      // Success
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowChangePasswordForm(false);
      setPasswordSuccess(true);
      setTimeout(() => setPasswordSuccess(false), 3000);
      
      // Reload sessions since other sessions were revoked
      await loadSessions();
    } catch (err: unknown) {
      setPasswordError(err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Security Settings</h1>
      </div>

      <Separator />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Change Password - Top Left */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Change Password</CardTitle>
            <p className="text-sm text-muted-foreground">
              Update your account password for better security.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Key className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="font-medium">Password</div>
                  <div className="text-sm text-muted-foreground">
                    Keep your password secure and up to date
                  </div>
                </div>
              </div>
            </div>

            {passwordSuccess && (
              <Alert>
                <AlertDescription>Password changed successfully!</AlertDescription>
              </Alert>
            )}

            {passwordError && (
              <Alert variant="destructive">
                <AlertDescription>{passwordError}</AlertDescription>
              </Alert>
            )}

            {!showChangePasswordForm && (
              <Button onClick={() => setShowChangePasswordForm(true)}>
                Change Password
              </Button>
            )}

            {showChangePasswordForm && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                      disabled={passwordLoading}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      disabled={passwordLoading}
                    >
                      {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password (min 6 characters)"
                      disabled={passwordLoading}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      disabled={passwordLoading}
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      disabled={passwordLoading}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      disabled={passwordLoading}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={handleChangePassword} 
                    disabled={passwordLoading || !currentPassword.trim() || !newPassword.trim() || !confirmPassword.trim()}
                  >
                    {passwordLoading ? 'Changing...' : 'Change Password'}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setShowChangePasswordForm(false);
                      setCurrentPassword('');
                      setNewPassword('');
                      setConfirmPassword('');
                      setPasswordError('');
                    }}
                    disabled={passwordLoading}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Two-Factor Authentication - Top Right */}
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

        {/* Connected Accounts (Google) - Bottom Left */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Connected Accounts</CardTitle>
            <p className="text-sm text-muted-foreground">
              Link your Google account for OAuth sign-in. Must use the same email as your current account ({session?.user?.email}).
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isGoogleLinked ? (
                  <Link className="h-5 w-5 text-green-500" />
                ) : (
                  <Unlink className="h-5 w-5 text-muted-foreground" />
                )}
                <div>
                  <div className="font-medium">Google Account</div>
                  <div className="text-sm text-muted-foreground">
                    {isGoogleLinked && googleAccountInfo?.userEmail
                      ? `${googleAccountInfo.userEmail} • Connected ${new Date(googleAccountInfo.createdAt).toLocaleDateString()}`
                      : isGoogleLinked
                      ? `Connected ${googleAccountInfo ? new Date(googleAccountInfo.createdAt).toLocaleDateString() : ''}`
                      : 'Connect your Google account for OAuth sign-in'
                    }
                  </div>
                </div>
              </div>
              <Badge variant={isGoogleLinked ? 'default' : 'outline'}>
                {isGoogleLinked ? 'Connected' : 'Not Connected'}
              </Badge>
            </div>


            {googleSuccess && (
              <Alert>
                <AlertDescription>Google account successfully updated!</AlertDescription>
              </Alert>
            )}

            {googleError && (
              <Alert variant="destructive">
                <AlertDescription>{googleError}</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2 pt-2">
              {isGoogleLinked ? (
                <Button
                  variant="outline"
                  onClick={handleUnlinkGoogle}
                  disabled={googleLinkLoading}
                  className="flex items-center gap-2"
                >
                  <Unlink className="h-4 w-4" />
                  {googleLinkLoading ? 'Unlinking...' : 'Unlink Google'}
                </Button>
              ) : (
                <Button
                  onClick={handleLinkGoogle}
                  disabled={googleLinkLoading}
                  className="flex items-center gap-2"
                >
                  <Link className="h-4 w-4" />
                  {googleLinkLoading ? 'Linking...' : 'Link Google Account'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Active Sessions - Bottom Right */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Active Sessions</CardTitle>
            <p className="text-sm text-muted-foreground">
              Manage your active sessions and sign out from other devices.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {sessionError && (
              <Alert variant="destructive">
                <AlertDescription>{sessionError}</AlertDescription>
              </Alert>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Globe className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="font-medium">Sessions</div>
                  <div className="text-sm text-muted-foreground">
                    {sessions.length} active session{sessions.length !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>
              <Button 
                variant="outline" 
                onClick={revokeAllOtherSessions}
                disabled={sessionsLoading || sessions.length <= 1}
                size="sm"
              >
                {sessionsLoading ? 'Revoking...' : 'Sign Out Others'}
              </Button>
            </div>

            <Separator />

            {sessionsLoading ? (
              <div className="text-center py-4">
                <div className="text-sm text-muted-foreground">Loading sessions...</div>
              </div>
            ) : (
              <div className="space-y-3">
                {sessions.map((sessionItem) => (
                  <div key={sessionItem.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getDeviceIcon(sessionItem.userAgent ?? undefined)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">
                            {getBrowserName(sessionItem.userAgent ?? undefined)}
                          </span>
                          {sessionItem.id === (session?.session as { id: string } | undefined)?.id && (
                            <Badge variant="secondary" className="text-xs">Current</Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {sessionItem.ipAddress && (
                            <span>{sessionItem.ipAddress} • </span>
                          )}
                          Last active {formatLastActive(sessionItem.updatedAt)}
                        </div>
                      </div>
                    </div>
                    
                    {sessionItem.id !== (session?.session as { id: string } | undefined)?.id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => revokeSession(sessionItem.id)}
                        disabled={revokeLoading === sessionItem.id}
                        className="text-destructive hover:text-destructive"
                      >
                        {revokeLoading === sessionItem.id ? (
                          'Revoking...'
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </div>
                ))}
                
                {sessions.length === 0 && (
                  <div className="text-center py-4">
                    <div className="text-sm text-muted-foreground">No active sessions found</div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}