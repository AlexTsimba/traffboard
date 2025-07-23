'use client';

import { useState, useEffect } from 'react';
import { authClient } from '~/lib/auth-client';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Separator } from '~/components/ui/separator';
import { securityNotifications } from '~/lib/toast-utils';
import { Badge } from '~/components/ui/badge';
import { Shield, ShieldCheck, Key, Eye, EyeOff, Monitor, Smartphone, Tablet, Globe, Trash2, Link } from 'lucide-react';
import QRCode from 'react-qr-code';

export function SecurityClient() {
  const { data: session, isPending } = authClient.useSession();
  
  // 2FA state
  const [password, setPassword] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [totpUri, setTotpUri] = useState('');
  const [loading, setLoading] = useState(false);
  const [showEnableForm, setShowEnableForm] = useState(false);
  const [showQR, setShowQR] = useState(false);
  
  // Change password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showChangePasswordForm, setShowChangePasswordForm] = useState(false);

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
  const [revokeLoading, setRevokeLoading] = useState('');


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
      
      if (result.data && Array.isArray(result.data)) {
        const googleAccount = result.data.find((account: { 
          provider: string; 
          accountId: string;
          createdAt: Date;
          scopes: string[];
        }) => account.provider === 'google');
        
        if (googleAccount) {
          setIsGoogleLinked(true);
          
          // Better Auth account linking doesn't store OAuth profile data
          // For linked accounts, we should show that it's connected but we can't get the Google email
          // The email shown should be the current user's email who linked the account
          const userEmail = session?.user?.email;
          const userName = session?.user?.name;
          
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
      // Account check failed - reset to safe state
      setIsGoogleLinked(false);
      setGoogleAccountInfo(null);
    }
  };

  useEffect(() => {
    checkGoogleAccount();
  }, [session]); // Re-run when session changes


  const loadSessions = async () => {
    setSessionsLoading(true);
    
    try {
      const response = await authClient.listSessions();
      
      // Better Auth returns {data: Array, error: null} format
      if (response?.data && Array.isArray(response.data)) {
        setSessions(response.data);
      } else if (response?.error) {
        securityNotifications.sessions.error(response.error.message ?? 'Failed to load sessions');
      } else {
        setSessions([]);
      }
    } catch (err: unknown) {
      securityNotifications.sessions.error(err instanceof Error ? err.message : 'Failed to load sessions');
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
      securityNotifications.sessions.revoked(1);
    } catch (err: unknown) {
      securityNotifications.sessions.error(err instanceof Error ? err.message : 'Failed to revoke session');
    } finally {
      setRevokeLoading('');
    }
  };

  const revokeAllOtherSessions = async () => {
    setSessionsLoading(true);
    
    try {
      await authClient.revokeOtherSessions();
      // Reload sessions after successful revocation
      await loadSessions();
      securityNotifications.sessions.revoked(sessions.length - 1);
    } catch (err: unknown) {
      securityNotifications.sessions.error(err instanceof Error ? err.message : 'Failed to revoke other sessions');
    } finally {
      setSessionsLoading(false);
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
      securityNotifications.twoFactor.error('Password is required');
      return;
    }

    setLoading(true);

    try {
      const result = await authClient.twoFactor.enable({
        password
      });

      // 2FA enable result handled via result.data.totpURI

      if (result?.data?.totpURI) {
        setTotpUri(result.data.totpURI);
        setShowQR(true);
        setPassword('');
      } else {
        securityNotifications.twoFactor.error('Failed to generate 2FA setup - no TOTP URI received');
      }
    } catch (err: unknown) {
      securityNotifications.twoFactor.error(err instanceof Error ? err.message : 'Failed to enable 2FA');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyTOTP = async () => {
    if (!totpCode.trim() || totpCode.length !== 6) {
      securityNotifications.twoFactor.error('Please enter a valid 6-digit code');
      return;
    }

    setLoading(true);

    try {
      await authClient.twoFactor.verifyTotp({
        code: totpCode,
        trustDevice: true
      });

      // Success - reset form and show notification
      setTotpCode('');
      setTotpUri('');
      setShowQR(false);
      setShowEnableForm(false);
      securityNotifications.twoFactor.verified();
      // Session will update automatically
    } catch (err: unknown) {
      securityNotifications.twoFactor.error(err instanceof Error ? err.message : 'Failed to verify code');
    } finally {
      setLoading(false);
    }
  };

  const handleDisable2FA = async () => {
    if (!password.trim()) {
      securityNotifications.twoFactor.error('Password is required');
      return;
    }

    setLoading(true);

    try {
      await authClient.twoFactor.disable({
        password
      });

      setPassword('');
      setShowEnableForm(false);
      securityNotifications.twoFactor.disabled();
    } catch (err: unknown) {
      securityNotifications.twoFactor.error(err instanceof Error ? err.message : 'Failed to disable 2FA');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword.trim()) {
      securityNotifications.password.error('Current password is required');
      return;
    }

    if (!newPassword.trim()) {
      securityNotifications.password.error('New password is required');
      return;
    }

    if (newPassword.length < 6) {
      securityNotifications.password.error('New password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      securityNotifications.password.error('New passwords do not match');
      return;
    }

    const changePasswordPromise = authClient.changePassword({
      currentPassword,
      newPassword,
      revokeOtherSessions: true // Automatically revoke other sessions for security
    });

    securityNotifications.password.loading(changePasswordPromise);

    try {
      await changePasswordPromise;
      
      // Success - reset form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowChangePasswordForm(false);
      
      // Reload sessions since other sessions were revoked
      await loadSessions();
    } catch (err: unknown) {
      // Error toast is already shown by the promise handler
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
                      disabled={false}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      disabled={false}
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
                      disabled={false}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      disabled={false}
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
                      disabled={false}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      disabled={false}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={handleChangePassword} 
                    disabled={!currentPassword.trim() || !newPassword.trim() || !confirmPassword.trim()}
                  >
                    Change Password
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setShowChangePasswordForm(false);
                      setCurrentPassword('');
                      setNewPassword('');
                      setConfirmPassword('');
                    }}
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

        {/* Available Login Methods - Bottom Left */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Available Login Methods</CardTitle>
            <p className="text-sm text-muted-foreground">
              Your account supports these authentication methods. Google OAuth is automatically linked when you sign in with matching email.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Email/Password Login */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Key className="h-5 w-5 text-green-500" />
                <div>
                  <div className="font-medium">Email & Password</div>
                  <div className="text-sm text-muted-foreground">
                    {session?.user?.email} • Always available
                  </div>
                </div>
              </div>
              <Badge variant="default">Available</Badge>
            </div>

            {/* Google OAuth */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isGoogleLinked ? (
                  <Link className="h-5 w-5 text-green-500" />
                ) : (
                  <Globe className="h-5 w-5 text-muted-foreground" />
                )}
                <div>
                  <div className="font-medium">Google OAuth</div>
                  <div className="text-sm text-muted-foreground">
                    {isGoogleLinked && googleAccountInfo?.userEmail
                      ? `${googleAccountInfo.userEmail} • Linked ${new Date(googleAccountInfo.createdAt).toLocaleDateString()}`
                      : 'Sign in with Google using matching email to auto-link'
                    }
                  </div>
                </div>
              </div>
              <Badge variant={isGoogleLinked ? 'default' : 'outline'}>
                {isGoogleLinked ? 'Linked' : 'Auto-Link Available'}
              </Badge>
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