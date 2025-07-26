'use client';

import { useState, useEffect, useCallback } from 'react';
import { authClient } from '~/lib/auth-client';
import { Separator } from '~/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs';
import { securityNotifications } from '~/lib/toast-utils';
import { Shield, User } from 'lucide-react';
import { AccountInformation } from './components/account-information';
import { LoginMethods } from './components/login-methods';
import { ActiveSessions } from './components/active-sessions';
import { ChangePassword } from './components/change-password';
import { TwoFactorAuth } from './components/two-factor-auth';

export function AccountSecurityClient() {
  const { data: session, isPending } = authClient.useSession();
  

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
  const checkGoogleAccount = useCallback(async () => {
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
    } catch {
      setIsGoogleLinked(false);
      setGoogleAccountInfo(null);
    }
  }, [session]);

  useEffect(() => {
    void checkGoogleAccount();
  }, [session, checkGoogleAccount]);

  const loadSessions = async () => {
    setSessionsLoading(true);
    
    try {
      const response = await authClient.listSessions();
      
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
      await loadSessions();
      securityNotifications.sessions.revoked(sessions.length - 1);
    } catch (err: unknown) {
      securityNotifications.sessions.error(err instanceof Error ? err.message : 'Failed to revoke other sessions');
    } finally {
      setSessionsLoading(false);
    }
  };


  useEffect(() => {
    void loadSessions();
  }, []);

  if (isPending) {
    return <div>Loading...</div>;
  }

  const user = session?.user;
  const is2FAEnabled = user?.twoFactorEnabled ?? false;

  const handleEnable2FA = async (password: string) => {
    if (!password.trim()) {
      securityNotifications.twoFactor.error('Password is required');
      return;
    }

    try {
      const result = await authClient.twoFactor.enable({
        password
      });

      // Check for errors first before looking for TOTP URI
      if (result?.error) {
        securityNotifications.twoFactor.error(result.error.message ?? 'Failed to enable 2FA');
        return;
      }

      if (result?.data?.totpURI) {
        return result;
      } else {
        securityNotifications.twoFactor.error('Failed to generate 2FA setup - no TOTP URI received');
      }
    } catch (err: unknown) {
      securityNotifications.twoFactor.error(err instanceof Error ? err.message : 'Failed to enable 2FA');
    }
  };

  const handleVerifyTOTP = async (totpCode: string) => {
    if (!totpCode.trim() || totpCode.length !== 6) {
      securityNotifications.twoFactor.error('Please enter a valid 6-digit code');
      return;
    }

    try {
      const result = await authClient.twoFactor.verifyTotp({
        code: totpCode,
        trustDevice: true
      });

      // Check if verification actually succeeded
      if (result?.error) {
        securityNotifications.twoFactor.error(result.error.message ?? 'Failed to verify code');
        throw new Error('Verification failed'); // Re-throw for component handling
      }
      
      securityNotifications.twoFactor.verified();
    } catch (err: unknown) {
      if (!(err instanceof Error && err.message === 'Verification failed')) {
        securityNotifications.twoFactor.error(err instanceof Error ? err.message : 'Failed to verify code');
      }
      throw new Error('Verification failed');
    }
  };

  const handleDisable2FA = async (password: string) => {
    if (!password.trim()) {
      securityNotifications.twoFactor.error('Password is required');
      return;
    }

    try {
      const result = await authClient.twoFactor.disable({
        password
      });

      // Check if disable actually succeeded before showing success
      if (result?.error) {
        securityNotifications.twoFactor.error(result.error.message ?? 'Failed to disable 2FA');
        throw new Error('Disable failed'); // Re-throw for component handling
      }

      securityNotifications.twoFactor.disabled();
    } catch (err: unknown) {
      if (!(err instanceof Error && err.message === 'Disable failed')) {
        securityNotifications.twoFactor.error(err instanceof Error ? err.message : 'Failed to disable 2FA');
      }
      throw new Error('Disable failed');
    }
  };

  const handleChangePassword = async (currentPassword: string, newPassword: string, confirmPassword: string) => {
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
      revokeOtherSessions: true
    }).then(async (result) => {
      // Check for errors in the response
      if (result?.error) {
        throw new Error(result.error.message ?? 'Password change failed');
      }
      
      // Success - reload sessions
      await loadSessions();
      return result;
    });

    // Use centralized promise-based notification
    securityNotifications.password.loading(changePasswordPromise);
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <Separator />

      <Tabs defaultValue="overview" className="items-center">
        <TabsList className="h-auto gap-6 rounded-none !border-none bg-transparent p-0">
          <TabsTrigger value="overview" className="border-b-2 border-transparent rounded-none px-1 pb-3 pt-2 font-medium text-muted-foreground hover:text-foreground data-[state=active]:border-b-foreground data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none outline-none ring-0 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 [&]:border-l-0 [&]:border-r-0 [&]:border-t-0 transition-all ease-[cubic-bezier(0.25,0.1,0.25,1)] duration-200">
            <User className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="security" className="border-b-2 border-transparent rounded-none px-1 pb-3 pt-2 font-medium text-muted-foreground hover:text-foreground data-[state=active]:border-b-foreground data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none outline-none ring-0 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 [&]:border-l-0 [&]:border-r-0 [&]:border-t-0 transition-all ease-[cubic-bezier(0.25,0.1,0.25,1)] duration-200">
            <Shield className="h-4 w-4 mr-2" />
            Security
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="mt-6 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <AccountInformation user={user} />
            <LoginMethods 
              user={user}
              isGoogleLinked={isGoogleLinked}
              googleAccountInfo={googleAccountInfo}
            />
          </div>
          <ActiveSessions
            sessions={sessions}
            sessionsLoading={sessionsLoading}
            revokeLoading={revokeLoading}
            currentSessionId={(session?.session as { id: string } | undefined)?.id}
            onRevokeSession={revokeSession}
            onRevokeAllOtherSessions={revokeAllOtherSessions}
          />
        </TabsContent>

        <TabsContent value="security" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ChangePassword onChangePassword={handleChangePassword} />
            <TwoFactorAuth
              is2FAEnabled={is2FAEnabled}
              onEnable2FA={handleEnable2FA}
              onVerifyTOTP={handleVerifyTOTP}
              onDisable2FA={handleDisable2FA}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}