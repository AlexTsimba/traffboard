import { toast } from 'sonner'

export const notifications = {
  // Security notifications
  security: {
    password: {
      success: () => toast.success("Password changed successfully", {
        description: "Other sessions have been revoked for security"
      }),
      error: (message: string) => toast.error("Password change failed", {
        description: message
      }),
      loading: (promise: Promise<unknown>) => toast.promise(promise, {
        loading: 'Changing password...',
        success: 'Password changed successfully',
        error: (error: Error) => error.message || 'Failed to change password'
      })
    },
    
    twoFactor: {
      enabled: () => toast.success("2FA enabled successfully", {
        description: "Your account is now more secure",
        action: {
          label: 'View Backup Codes',
          onClick: () => window.open('/settings/security#backup-codes')
        }
      }),
      verified: () => toast.success("2FA setup complete", {
        description: "Two-factor authentication is now active"
      }),
      disabled: () => toast.success("2FA disabled", {
        description: "Two-factor authentication has been turned off"
      }),
      error: (message: string) => toast.error("2FA operation failed", {
        description: message
      }),
      loading: {
        enable: (promise: Promise<unknown>) => toast.promise(promise, {
          loading: 'Enabling 2FA...',
          success: 'Ready to scan QR code',
          error: (error: Error) => error.message || 'Failed to enable 2FA'
        }),
        verify: (promise: Promise<unknown>) => toast.promise(promise, {
          loading: 'Verifying code...',
          success: '2FA enabled successfully',
          error: (error: Error) => error.message || 'Failed to verify code'
        }),
        disable: (promise: Promise<unknown>) => toast.promise(promise, {
          loading: 'Disabling 2FA...',
          success: '2FA disabled successfully',
          error: (error: Error) => error.message || 'Failed to disable 2FA'
        })
      }
    },
    
    oauth: {
      linked: (provider: string, email: string) => toast.success(`${provider} account linked`, {
        description: `Successfully linked to ${email}`
      }),
      unlinked: (provider: string) => toast.success(`${provider} account unlinked`, {
        description: "Account connection has been removed"
      }),
      error: (message: string) => toast.error("Account linking failed", {
        description: message
      })
    },
    
    sessions: {
      revoked: (count = 1) => toast.success(
        count === 1 ? "Session revoked" : "Sessions revoked", {
          description: count === 1 
            ? "Device has been signed out"
            : `Signed out from ${count} devices`
        }
      ),
      error: (message: string) => toast.error("Session management failed", {
        description: message
      })
    }
  },

  // Analytics notifications
  analytics: {
    dataRefresh: {
      success: () => toast.success("Data refreshed", {
        description: "Analytics data has been updated"
      }),
      error: (message: string) => toast.error("Data refresh failed", {
        description: message
      }),
      loading: (promise: Promise<unknown>) => toast.promise(promise, {
        loading: 'Refreshing analytics data...',
        success: 'Data refreshed successfully',
        error: 'Failed to refresh data'
      })
    },
    
    export: {
      success: (format: string) => toast.success(`Report exported`, {
        description: `${format.toUpperCase()} file is ready for download`,
        action: {
          label: 'Download',
          onClick: () => { /* Will be provided by component */ }
        }
      }),
      error: (message: string) => toast.error("Export failed", {
        description: message
      }),
      loading: (promise: Promise<unknown>, format: string) => toast.promise(promise, {
        loading: `Exporting ${format.toUpperCase()} report...`,
        success: `${format.toUpperCase()} report exported successfully`,
        error: 'Export failed'
      })
    }
  },

  // Reports notifications
  reports: {
    generated: (reportType: string) => toast.success("Report generated", {
      description: `${reportType} report is now available`,
      action: {
        label: 'View Report',
        onClick: () => { /* Will be provided by component */ }
      }
    }),
    
    scheduled: (reportType: string, schedule: string) => toast.success("Report scheduled", {
      description: `${reportType} will be generated ${schedule}`
    }),
    
    error: (message: string) => toast.error("Report generation failed", {
      description: message
    })
  },

  // Admin notifications
  admin: {
    users: {
      created: (email: string) => toast.success("User created successfully", {
        description: `New user account created for ${email}`,
        action: {
          label: 'Copy Credentials',
          onClick: () => { /* Will be provided by component */ }
        }
      }),
      roleChanged: (email: string, newRole: string) => toast.success("User role updated", {
        description: `${email} is now ${newRole === 'admin' ? 'an admin' : 'a user'}`
      }),
      banned: (email: string) => toast.success("User banned", {
        description: `${email} has been banned from the system`
      }),
      unbanned: (email: string) => toast.success("User unbanned", {
        description: `${email} can now access the system again`
      }),
      deleted: (email: string) => toast.success("User deleted", {
        description: `${email} has been permanently removed`
      }),
      error: (message: string) => toast.error("User management failed", {
        description: message
      }),
      loading: {
        create: (promise: Promise<unknown>) => toast.promise(promise, {
          loading: 'Creating user account...',
          success: 'User created successfully',
          error: (error: Error) => error.message || 'Failed to create user'
        }),
        roleChange: (promise: Promise<unknown>) => toast.promise(promise, {
          loading: 'Updating user role...',
          success: 'Role updated successfully',
          error: (error: Error) => error.message || 'Failed to update role'
        }),
        ban: (promise: Promise<unknown>) => toast.promise(promise, {
          loading: 'Updating ban status...',
          success: 'Ban status updated',
          error: (error: Error) => error.message || 'Failed to update ban status'
        }),
        delete: (promise: Promise<unknown>) => toast.promise(promise, {
          loading: 'Deleting user...',
          success: 'User deleted successfully',
          error: (error: Error) => error.message || 'Failed to delete user'
        })
      }
    },
    
    data: {
      exported: (type: string) => toast.success("Data exported", {
        description: `${type} data has been exported successfully`
      }),
      imported: (type: string, count: number) => toast.success("Data imported", {
        description: `Successfully imported ${count} ${type} records`
      }),
      error: (message: string) => toast.error("Data operation failed", {
        description: message
      }),
      loading: (promise: Promise<unknown>, operation: string) => toast.promise(promise, {
        loading: `${operation} data...`,
        success: `${operation} completed successfully`,
        error: (error: Error) => error.message || `${operation} failed`
      })
    }
  },

  // System notifications
  system: {
    maintenance: {
      scheduled: (time: string) => toast.warning("Maintenance scheduled", {
        description: `System will be unavailable on ${time}`,
        duration: 10000 // Longer duration for important info
      }),
      
      starting: () => toast.warning("Maintenance starting soon", {
        description: "Please save your work and sign out",
        duration: Infinity, // Persistent until dismissed
        action: {
          label: 'Sign Out',
          onClick: () => window.location.href = '/auth/logout'
        }
      })
    },
    
    connection: {
      lost: () => toast.error("Connection lost", {
        description: "Attempting to reconnect...",
        duration: Infinity
      }),
      
      restored: () => toast.success("Connection restored", {
        description: "You're back online"
      })
    },
    
    error: {
      general: (message: string) => toast.error("Something went wrong", {
        description: message
      }),
      
      critical: (message: string) => toast.error("Critical error", {
        description: message,
        duration: Infinity,
        action: {
          label: 'Report Issue',
          onClick: () => window.open('/support/report-issue')
        }
      })
    }
  }
}

// Auth notifications for login flow
export const authNotifications = {
  login: {
    success: () => toast.success("Welcome back!", {
      description: "You have been successfully logged in"
    }),
    error: (message: string) => toast.error("Login failed", {
      description: message
    }),
    loading: (promise: Promise<unknown>) => toast.promise(promise, {
      loading: 'Signing in...',
      success: 'Welcome back!',
      error: 'Login failed'
    })
  },
  
  oauth: {
    redirecting: (provider: string) => toast.loading(`Redirecting to ${provider}...`, {
      description: "You'll be redirected to complete authentication"
    }),
    success: (provider: string) => toast.success(`${provider} login successful`, {
      description: "Welcome back to your account"
    }),
    noAccount: () => toast.error("Account not found", {
      description: "No account exists with this Google email. Contact your administrator for access.",
      duration: 8000 // Longer duration for important message
    }),
    error: (message: string) => toast.error("OAuth login failed", {
      description: message
    })
  },
  
  twoFactor: {
    required: () => toast.info("Two-factor authentication required", {
      description: "Please complete 2FA verification to continue"
    }),
    verified: () => toast.success("2FA verification successful", {
      description: "Access granted - welcome back!"
    }),
    error: (message: string) => toast.error("2FA verification failed", {
      description: message
    }),
    loading: (promise: Promise<unknown>) => toast.promise(promise, {
      loading: 'Verifying code...',
      success: '2FA verification successful',
      error: 'Verification failed'
    })
  }
}

// Export individual categories for cleaner imports
export const securityNotifications = notifications.security
export const analyticsNotifications = notifications.analytics  
export const reportsNotifications = notifications.reports
export const adminNotifications = notifications.admin
export const systemNotifications = notifications.system