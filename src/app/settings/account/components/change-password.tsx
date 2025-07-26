'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Key, Eye, EyeOff } from 'lucide-react';

interface ChangePasswordProps {
  onChangePassword: (currentPassword: string, newPassword: string, confirmPassword: string) => Promise<void>;
  userEmail?: string;
}

export function ChangePassword({ onChangePassword, userEmail }: ChangePasswordProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const resetForm = useCallback(() => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setIsExpanded(false);
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      return;
    }

    setIsLoading(true);
    try {
      await onChangePassword(currentPassword, newPassword, confirmPassword);
      resetForm();
    } finally {
      setIsLoading(false);
    }
  }, [currentPassword, newPassword, confirmPassword, onChangePassword, resetForm]);

  const isFormValid = currentPassword.trim() && newPassword.trim() && confirmPassword.trim();
  const hasContent = currentPassword || newPassword || confirmPassword;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          Change Password
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!isExpanded ? (
          <div className="flex justify-end">
            <Button onClick={() => setIsExpanded(true)}>
              Change Password
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
          {/* Hidden username field for password manager context */}
          <input 
            type="hidden" 
            name="username" 
            value={userEmail ?? ''} 
            autoComplete="username"
          />
          
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Current Password</Label>
            <div className="relative">
              <Input
                id="currentPassword"
                name="currentPassword"
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
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
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                disabled={isLoading}
                tabIndex={-1}
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
                name="newPassword"
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Password"
                disabled={isLoading}
                autoComplete="new-password"
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowNewPassword(!showNewPassword)}
                disabled={isLoading}
                tabIndex={-1}
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
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Password"
                disabled={isLoading}
                autoComplete="new-password"
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={isLoading}
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
              disabled={!isFormValid || isLoading}
            >
              {isLoading ? 'Changing...' : 'Change Password'}
            </Button>
          </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}