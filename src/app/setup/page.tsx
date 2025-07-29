'use client';

import { useState, useEffect } from 'react';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';
import { Alert, AlertDescription } from '~/components/ui/alert';
import { CheckCircle, AlertCircle, Loader2, Shield } from 'lucide-react';
import { authClient } from '~/lib/auth-client';
import { useRouter } from 'next/navigation';

interface SetupStatus {
  hasAdminUsers: boolean;
  loading: boolean;
  error: string | null;
}

export default function SetupPage() {
  const router = useRouter();
  const [setupStatus, setSetupStatus] = useState<SetupStatus>({
    hasAdminUsers: false,
    loading: true,
    error: null
  });
  
  const [formData, setFormData] = useState({
    name: '',
    email: 'simba292@gmail.com', // Pre-filled as requested
    password: '',
    confirmPassword: ''
  });
  
  const [createStatus, setCreateStatus] = useState({
    loading: false,
    success: false,
    error: null as string | null
  });

  // Check if admin users already exist
  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        // Try to list users - this will fail if no admin exists or user isn't authenticated
        const response = await authClient.admin.listUsers({ query: {} });
        
        if (response.data?.users) {
          // Check if any admin users exist
          const adminUsers = response.data.users.filter(user => user.role === 'admin');
          setSetupStatus({
            hasAdminUsers: adminUsers.length > 0,
            loading: false,
            error: null
          });
        } else {
          // No admin users or can't access - setup needed
          setSetupStatus({
            hasAdminUsers: false,
            loading: false,
            error: null
          });
        }
      } catch {
        // Error likely means no admin access - setup needed
        setSetupStatus({
          hasAdminUsers: false,
          loading: false,
          error: null
        });
      }
    };

    void checkAdminStatus();
  }, []);

  const validateForm = () => {
    if (!formData.name.trim()) {
      return 'Name is required';
    }
    if (!formData.email.trim()) {
      return 'Email is required';
    }
    if (!formData.email.includes('@')) {
      return 'Please enter a valid email';
    }
    if (formData.password.length < 8) {
      return 'Password must be at least 8 characters';
    }
    if (formData.password !== formData.confirmPassword) {
      return 'Passwords do not match';
    }
    return null;
  };

  const handleCreateAdmin = async () => {
    const validationError = validateForm();
    if (validationError) {
      setCreateStatus({ loading: false, success: false, error: validationError });
      return;
    }

    setCreateStatus({ loading: true, success: false, error: null });

    try {
      // Use the same method as your existing user management
      const response = await authClient.admin.createUser({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: 'admin'
      });

      if (response.data) {
        setCreateStatus({ loading: false, success: true, error: null });
        
        // Redirect to login after 2 seconds
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      } else if (response.error) {
        setCreateStatus({ 
          loading: false, 
          success: false, 
          error: response.error.message ?? 'Failed to create admin user' 
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create admin user';
      setCreateStatus({ loading: false, success: false, error: errorMessage });
    }
  };

  // Loading state
  if (setupStatus.loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
            <CardTitle className="text-2xl">Checking Setup Status</CardTitle>
            <CardDescription>
              Verifying if admin setup is required...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Admin already exists - redirect or show message
  if (setupStatus.hasAdminUsers) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <CardTitle className="text-2xl">Setup Already Complete</CardTitle>
            <CardDescription>
              Admin users already exist. This setup page is no longer needed.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              className="w-full" 
              onClick={() => router.push('/login')}
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success state
  if (createStatus.success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <CardTitle className="text-2xl">Admin Created Successfully!</CardTitle>
            <CardDescription>
              Your admin account has been created. Redirecting to login...
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                You can now log in with your admin credentials and access all administrative features.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Setup form
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Initial Setup</CardTitle>
          <CardDescription className="text-center">
            Create the first admin account for Traffboard
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {createStatus.error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {createStatus.error}
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter your full name"
              disabled={createStatus.loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="admin@example.com"
              disabled={createStatus.loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Enter a secure password"
              disabled={createStatus.loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              placeholder="Confirm your password"
              disabled={createStatus.loading}
            />
          </div>

          <Button 
            className="w-full" 
            onClick={handleCreateAdmin}
            disabled={createStatus.loading}
          >
            {createStatus.loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Admin...
              </>
            ) : (
              <>
                <Shield className="mr-2 h-4 w-4" />
                Create Admin Account
              </>
            )}
          </Button>

          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              This page will only work once - when no admin users exist. After creating the first admin, this setup will be disabled.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}