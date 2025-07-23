# Traffboard User Notifications System

## Overview

This document outlines the centralized notification system for Traffboard using Sonner, a modern toast notification library. The system provides consistent, accessible, and user-friendly feedback across all application features.

## Architecture

### Core Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Root Layout (app/layout.tsx)            │
│  ┌─────────────────────────────────────────────────────────┤
│  │                   <Toaster />                           │
│  │  • Position: bottom-left                               │
│  │  • Rich colors enabled                                 │
│  │  • Close button enabled                                │
│  │  • Max visible: 5 toasts                               │
│  └─────────────────────────────────────────────────────────┤
└─────────────────────────────────────────────────────────────┘
            ▲
            │ Global toast calls
            │
┌─────────────────────────────────────────────────────────────┐
│               Toast Utilities (/lib/toast-utils.ts)        │
│  ┌─────────────┬─────────────┬─────────────┬─────────────┐  │
│  │  Security   │ Analytics   │  Reports    │   System    │  │
│  │   Toasts    │   Toasts    │   Toasts    │   Toasts    │  │
│  └─────────────┴─────────────┴─────────────┴─────────────┘  │
└─────────────────────────────────────────────────────────────┘
            ▲
            │ Organized toast functions
            │
┌─────────────────────────────────────────────────────────────┐
│                Component Layer                              │
│  • security-client.tsx                                     │
│  • dashboard.tsx                                           │
│  • reports/*.tsx                                           │
│  • admin/*.tsx                                             │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

- **Sonner**: Modern React toast library with TypeScript support
- **Next.js 15+**: App Router architecture
- **Tailwind CSS**: Styling integration
- **shadcn/ui**: Component system compatibility

## Installation & Setup

### 1. Install Dependencies

```bash
npm install sonner
```

### 2. Root Configuration

Add the Toaster component to your root layout:

```tsx
// app/layout.tsx
import { Toaster } from 'sonner'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster 
          position="bottom-left"
          richColors 
          closeButton
          expand={true}
          visibleToasts={5}
          toastOptions={{
            duration: 4000,
            style: {
              fontSize: '14px',
            },
          }}
        />
      </body>
    </html>
  )
}
```

### 3. Toast Utilities Setup

Create centralized toast functions:

```tsx
// lib/toast-utils.ts
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
      loading: (promise: Promise<any>) => toast.promise(promise, {
        loading: 'Changing password...',
        success: 'Password changed successfully',
        error: 'Failed to change password'
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
      })
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
      revoked: (count: number = 1) => toast.success(
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
      loading: (promise: Promise<any>) => toast.promise(promise, {
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
          onClick: () => {} // Will be provided by component
        }
      }),
      error: (message: string) => toast.error("Export failed", {
        description: message
      }),
      loading: (promise: Promise<any>, format: string) => toast.promise(promise, {
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
        onClick: () => {} // Will be provided by component
      }
    }),
    
    scheduled: (reportType: string, schedule: string) => toast.success("Report scheduled", {
      description: `${reportType} will be generated ${schedule}`
    }),
    
    error: (message: string) => toast.error("Report generation failed", {
      description: message
    })
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

// Export individual categories for cleaner imports
export const securityNotifications = notifications.security
export const analyticsNotifications = notifications.analytics  
export const reportsNotifications = notifications.reports
export const systemNotifications = notifications.system
```

## Design Patterns

### 1. Promise-Based Loading States

For async operations, use promise-based toasts that automatically handle loading, success, and error states:

```tsx
// Component usage
import { securityNotifications } from '~/lib/toast-utils'

const handlePasswordChange = async () => {
  const changePasswordPromise = authClient.changePassword({
    currentPassword,
    newPassword,
    revokeOtherSessions: true
  })

  // This will show loading, then success/error automatically
  securityNotifications.password.loading(changePasswordPromise)

  try {
    await changePasswordPromise
    // Reset form state
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
  } catch (error) {
    // Error toast is already shown by promise handler
    console.error('Password change failed:', error)
  }
}
```

### 2. Action-Enhanced Notifications

Add actionable buttons to toasts for improved UX:

```tsx
const handle2FAEnabled = () => {
  toast.success("2FA enabled successfully", {
    description: "Save your backup codes in a secure location",
    action: {
      label: 'Download Codes',
      onClick: () => downloadBackupCodes()
    }
  })
}
```

### 3. Contextual Error Handling

Different error types should have appropriate styling and persistence:

```tsx
// Temporary errors (auto-dismiss)
toast.error("Invalid input", {
  description: "Please check your entries and try again"
})

// Critical errors (persistent)
toast.error("System error", {
  description: "Please contact support if this continues",
  duration: Infinity,
  action: {
    label: 'Contact Support',
    onClick: () => window.open('/support')
  }
})
```

### 4. Batch Operations

For operations affecting multiple items:

```tsx
const handleBulkAction = async (items: string[]) => {
  const batchPromise = Promise.all(
    items.map(item => processItem(item))
  )

  toast.promise(batchPromise, {
    loading: `Processing ${items.length} items...`,
    success: (results) => `Successfully processed ${results.length} items`,
    error: 'Some items could not be processed'
  })
}
```

## Component Integration

### Replacing Existing Alert Components

**Before (with shadcn/ui Alert):**
```tsx
const [error, setError] = useState('')
const [success, setSuccess] = useState(false)

// In render
{error && (
  <Alert variant="destructive">
    <AlertDescription>{error}</AlertDescription>
  </Alert>
)}

{success && (
  <Alert>
    <AlertDescription>Operation completed successfully!</AlertDescription>
  </Alert>
)}

// In handlers
try {
  await operation()
  setSuccess(true)
  setTimeout(() => setSuccess(false), 3000)
} catch (err) {
  setError(err.message)
}
```

**After (with Sonner):**
```tsx
import { securityNotifications } from '~/lib/toast-utils'

// No state variables needed!

// In handlers
try {
  await operation()
  securityNotifications.password.success()
} catch (err) {
  securityNotifications.password.error(err.message)
}

// Or even simpler with promise-based
const handleOperation = () => {
  const promise = operation()
  securityNotifications.password.loading(promise)
}
```

### Loading States Integration

**Before:**
```tsx
const [loading, setLoading] = useState(false)

const handleSubmit = async () => {
  setLoading(true)
  try {
    await operation()
    setSuccess(true)
  } catch (err) {
    setError(err.message)
  } finally {
    setLoading(false)
  }
}
```

**After:**
```tsx
const handleSubmit = () => {
  const promise = operation()
  securityNotifications.password.loading(promise)
}
```

## Toast Configuration

### Global Settings

Configure default behavior in the Toaster component:

```tsx
<Toaster 
  position="bottom-left"
  richColors={true}
  closeButton={true}
  expand={true}
  visibleToasts={5}
  toastOptions={{
    duration: 4000,
    style: {
      fontSize: '14px',
    },
  }}
  theme="system" // Respects user's theme preference
/>
```

### Custom Durations

Different message types should have appropriate durations:

```tsx
// Quick feedback (2 seconds)
toast.success("Saved", { duration: 2000 })

// Standard feedback (4 seconds) - default
toast.success("Operation completed")

// Important information (8 seconds)
toast.warning("Important update", { duration: 8000 })

// Critical alerts (until dismissed)
toast.error("Critical error", { duration: Infinity })
```

## Accessibility

### Screen Reader Support

Sonner automatically includes proper ARIA attributes:
- `role="status"` for success messages
- `role="alert"` for error messages
- Proper focus management

### Keyboard Navigation

- `Escape` key dismisses toasts
- `Tab` navigation through action buttons
- Screen reader announcements

### Visual Accessibility

- High contrast mode support
- Respects `prefers-reduced-motion`
- Customizable via CSS variables

## Testing

### Unit Testing

```tsx
import { render, screen } from '@testing-library/react'
import { toast } from 'sonner'
import { securityNotifications } from '~/lib/toast-utils'

describe('Security Notifications', () => {
  it('shows success message on password change', () => {
    securityNotifications.password.success()
    
    expect(screen.getByText('Password changed successfully')).toBeInTheDocument()
    expect(screen.getByText('Other sessions have been revoked for security')).toBeInTheDocument()
  })
})
```

### Integration Testing

```tsx
import { fireEvent, waitFor } from '@testing-library/react'

it('shows loading and success states for async operations', async () => {
  const mockPromise = new Promise(resolve => 
    setTimeout(() => resolve('success'), 1000)
  )
  
  securityNotifications.password.loading(mockPromise)
  
  expect(screen.getByText('Changing password...')).toBeInTheDocument()
  
  await waitFor(() => {
    expect(screen.getByText('Password changed successfully')).toBeInTheDocument()
  })
})
```

## Performance Considerations

### Memory Management

- Toasts are automatically cleaned up after dismissal
- No persistent state management required
- Minimal DOM impact (only active toasts rendered)

### Bundle Size

- Sonner: ~3.5kb gzipped
- No additional dependencies
- Tree-shakeable imports

### Optimization Tips

```tsx
// Debounce rapid notifications
import { debounce } from 'lodash'

const debouncedError = debounce((message: string) => {
  toast.error(message)
}, 300)

// Avoid notification spam
let lastNotificationTime = 0
const showNotification = (message: string) => {
  const now = Date.now()
  if (now - lastNotificationTime > 1000) { // 1 second cooldown
    toast.success(message)
    lastNotificationTime = now
  }
}
```

## Migration Guide

### Phase 1: Setup Foundation
1. Install Sonner: `npm install sonner`
2. Add Toaster to root layout
3. Create toast utilities file

### Phase 2: Replace Security Notifications
1. Update `security-client.tsx`
2. Remove Alert components and state
3. Replace with toast calls

### Phase 3: Extend to Other Features
1. Analytics dashboard notifications
2. Reports generation feedback
3. Admin panel notifications
4. System-wide error handling

### Phase 4: Advanced Features
1. Add action buttons where beneficial
2. Implement persistent notifications for critical alerts
3. Add offline/online status notifications
4. Create notification preferences

## Best Practices

### Do's ✅

- Use promise-based toasts for async operations
- Provide actionable next steps when appropriate
- Use consistent messaging patterns
- Include helpful descriptions
- Respect user's theme and accessibility preferences
- Test notifications with screen readers

### Don'ts ❌

- Don't spam users with too many notifications
- Don't use notifications for non-important feedback
- Don't create persistent notifications unless critical
- Don't ignore loading states
- Don't use generic error messages
- Don't block user interaction with notifications

### Message Guidelines

**Success Messages:**
- Be specific about what succeeded
- Include next steps if relevant
- Keep descriptions concise

**Error Messages:**
- Explain what went wrong
- Provide actionable solutions
- Avoid technical jargon

**Loading Messages:**
- Use action-oriented language ("Saving...", "Processing...")
- Be specific about the operation
- Keep them brief

## Examples

### Complete Component Migration

```tsx
// Before: security-client.tsx (simplified)
const [passwordError, setPasswordError] = useState('')
const [passwordSuccess, setPasswordSuccess] = useState(false)
const [passwordLoading, setPasswordLoading] = useState(false)

const handlePasswordChange = async () => {
  setPasswordLoading(true)
  setPasswordError('')
  
  try {
    await authClient.changePassword({ currentPassword, newPassword })
    setPasswordSuccess(true)
    setTimeout(() => setPasswordSuccess(false), 3000)
  } catch (err) {
    setPasswordError(err.message)
  } finally {
    setPasswordLoading(false)
  }
}

// Render
{passwordError && <Alert variant="destructive">{passwordError}</Alert>}
{passwordSuccess && <Alert>Password changed successfully!</Alert>}
<Button onClick={handlePasswordChange} disabled={passwordLoading}>
  {passwordLoading ? 'Changing...' : 'Change Password'}
</Button>
```

```tsx
// After: security-client.tsx (simplified)
import { securityNotifications } from '~/lib/toast-utils'

const handlePasswordChange = async () => {
  const changePasswordPromise = authClient.changePassword({ 
    currentPassword, 
    newPassword,
    revokeOtherSessions: true
  })

  securityNotifications.password.loading(changePasswordPromise)

  try {
    await changePasswordPromise
    // Reset form
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
  } catch (error) {
    // Error already handled by toast
    console.error('Password change failed:', error)
  }
}

// Render (much cleaner!)
<Button onClick={handlePasswordChange}>
  Change Password
</Button>
```

## Conclusion

This centralized notification system provides:

- **Consistency**: Uniform notification experience across Traffboard
- **Maintainability**: Single source of truth for all notifications
- **Accessibility**: Built-in screen reader and keyboard support
- **Performance**: Minimal overhead with automatic cleanup
- **Developer Experience**: Simple API with TypeScript support
- **User Experience**: Rich, interactive notifications with actions

The system is designed to scale with Traffboard's growth while maintaining consistency and providing excellent user feedback throughout the application.