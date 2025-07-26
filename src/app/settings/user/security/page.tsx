'use client';

import { useState, useEffect } from 'react';
import { authClient } from '~/lib/auth-client';
import { securityNotifications } from '~/lib/toast-utils';
import { ChangePassword } from '../../account/components/change-password';
import { TwoFactorAuth } from '../../account/components/two-factor-auth';
import { PageContainer } from '~/components/page-container';

export default function UserSecurityPage() {
  const { data: session, isPending } = authClient.useSession();

  // Session management for password change functionality
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

  const loadSessions = async () => {
    try {
      const response = await authClient.listSessions();
      
      if (response?.data && Array.isArray(response.data)) {
        setSessions(response.data);
      } else {
        setSessions([]);
      }
    } catch {
      setSessions([]);
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
    <PageContainer>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChangePassword 
          onChangePassword={handleChangePassword} 
          userEmail={user?.email}
        />
        <TwoFactorAuth
          is2FAEnabled={is2FAEnabled}
          onEnable2FA={handleEnable2FA}
          onVerifyTOTP={handleVerifyTOTP}
          onDisable2FA={handleDisable2FA}
        />
      </div>
    </PageContainer>
  );
}