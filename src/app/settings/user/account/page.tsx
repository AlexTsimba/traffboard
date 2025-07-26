'use client';

import { useState, useEffect, useCallback } from 'react';
import { authClient } from '~/lib/auth-client';
import { securityNotifications } from '~/lib/toast-utils';
import { AccountInformation } from '../../account/components/account-information';
import { LoginMethods } from '../../account/components/login-methods';
import { ActiveSessions } from '../../account/components/active-sessions';
import { PageContainer } from '~/components/page-container';

export default function UserOverviewPage() {
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

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <PageContainer>
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
    </PageContainer>
  );
}