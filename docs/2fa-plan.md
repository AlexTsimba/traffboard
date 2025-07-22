# TRAFFBOARD 2FA IMPLEMENTATION PLAN

## 🎯 Overview

Replace the broken `@daveyplate/better-auth-ui` TwoFactorCard with a custom 2FA component that properly integrates with Traffboard's Better Auth setup and UI patterns.

## 📋 Current State Analysis

### ✅ What's Working
- Better Auth server configured with twoFactor plugin (`~/lib/auth.ts`)
- Better Auth client with twoFactorClient plugin (`~/lib/auth-client.ts`)
- Database schema has TwoFactor table and User.twoFactorEnabled field
- `authClient.useSession()` hook available for getting user data
- `react-qr-code@2.0.18` already installed
- Shadcn/ui components properly set up

### ❌ What's Broken  
- `TwoFactorCard` from `@daveyplate/better-auth-ui` only shows darkening overlay
- No actual 2FA functionality visible to user
- Missing proper QR code display and verification flow

## 🏗️ Implementation Steps

### Step 1: Create Custom TwoFactorManager Component

**File**: `~/src/components/auth/two-factor-manager.tsx`

**Purpose**: Replace the broken `TwoFactorCard` with a custom component that handles all 2FA states.

**Key Features**:
- Get current 2FA status from `authClient.useSession()`
- Show enable/disable button based on current state
- Handle complete setup flow (password → QR → verify → backup codes)
- Handle disable flow (password confirmation)

**Better Auth API Methods**:
- `authClient.twoFactor.getTotpUri({password})` - Get QR code URI
- `authClient.twoFactor.verifyTotp({code})` - Verify setup code
- `authClient.twoFactor.disable({password})` - Disable 2FA
- `authClient.twoFactor.generateBackupCodes()` - Get recovery codes

**Reference**: [Better Auth 2FA Plugin Docs](https://www.better-auth.com/docs/plugins/2fa)

### Step 2: Update Security Page

**File**: `~/src/app/preferences/security/security-client.tsx`

**Changes**:
```typescript
// Replace this:
import { TwoFactorCard } from '@daveyplate/better-auth-ui';

// With this:  
import { TwoFactorManager } from '~/components/auth/two-factor-manager';

// Replace this:
<TwoFactorCard classNames={{...}} />

// With this:
<TwoFactorManager />
```

### Step 3: Component States & Flow

**State Machine**:
```
LOADING → Check session.user.twoFactorEnabled
    ↓
DISABLED → [Enable Button] → ENTER_PASSWORD → SHOW_QR → VERIFY_CODE → SHOW_BACKUP → ENABLED
    ↓                                                                                    ↓
ENABLED → [Disable Button] → CONFIRM_PASSWORD → DISABLED ←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←
```

**UI Components Needed**:
- Status badge (enabled/disabled)
- Password input with validation
- QR code display using `react-qr-code`
- TOTP verification input (6-digit)
- Backup codes display with copy functionality
- Loading states and error handling

### Step 4: Error Handling & UX

**Error Scenarios**:
- Invalid password during enable/disable
- Invalid TOTP code during verification
- Network errors during API calls
- Already enabled/disabled states

**Loading States**:
- Password verification spinner
- QR code generation loading
- TOTP verification processing
- Backup code generation

**Success States**:
- Show success message after enabling
- Display backup codes with copy button
- Show confirmation after disabling

## 🎨 UI Design Patterns

### Follow Existing Traffboard Patterns
- Use `'use client'` directive for client components
- Import pattern: `~/components/ui/` for shadcn components
- Use existing Card layout structure from security-client.tsx
- Follow error handling pattern from auth-nav-user.tsx (try/catch + console.error)
- Use session hook pattern: `const { data: session } = authClient.useSession()`

### Shadcn/UI Components to Use
- `Card`, `CardContent`, `CardHeader`, `CardTitle`
- `Button` with variants (default, outline, destructive)
- `Input` for password and TOTP code
- `Badge` for status display
- `Alert` for error/success messages
- `Separator` for visual organization
- `Label` for form fields

## 🔧 Technical Requirements

### Dependencies
- ✅ `better-auth@1.3.1` (already installed)
- ✅ `react-qr-code@2.0.18` (already installed) 
- ✅ Shadcn/ui components (already set up)

### Better Auth Configuration
- ✅ Server: twoFactor plugin with issuer "Traffboard Analytics"
- ✅ Client: twoFactorClient plugin configured
- ✅ Database: TwoFactor table and User.twoFactorEnabled field

### File Structure
```
src/
├── components/
│   └── auth/
│       └── two-factor-manager.tsx (NEW)
├── app/preferences/security/
│   └── security-client.tsx (MODIFY)
└── lib/
    ├── auth.ts (✅ configured)
    └── auth-client.ts (✅ configured)
```

## ✅ Success Criteria

### Functional Requirements
- [ ] User can see current 2FA status (enabled/disabled)
- [ ] User can enable 2FA with password confirmation
- [ ] QR code displays correctly for authenticator app setup
- [ ] User can verify TOTP code to complete setup
- [ ] Backup codes are generated and displayed after enabling
- [ ] User can disable 2FA with password confirmation
- [ ] All error states are handled gracefully
- [ ] Loading states provide clear feedback

### Technical Requirements  
- [ ] Component follows Traffboard patterns and imports
- [ ] Properly integrates with existing Better Auth setup
- [ ] No breaking changes to other auth functionality
- [ ] Clean, maintainable code with proper TypeScript types
- [ ] Responsive design matching existing security page layout

## 🚀 Implementation Order

1. **Create TwoFactorManager component** - Basic structure with status display
2. **Add enable flow** - Password input → QR display → verification
3. **Add disable flow** - Password confirmation
4. **Add error handling** - All error states and user feedback
5. **Add loading states** - Spinners and disabled states during API calls
6. **Replace in security page** - Update security-client.tsx import
7. **Test all flows** - Enable, disable, error cases, edge cases

## 📚 References

- [Better Auth 2FA Plugin](https://www.better-auth.com/docs/plugins/2fa)
- [React QR Code Library](https://www.npmjs.com/package/react-qr-code)
- [Shadcn/ui Components](https://ui.shadcn.com/)
- [Current Auth Implementation](./architecture/auth.md)

---

**Estimated Implementation Time**: 2-3 hours
**Priority**: High (blocking user security functionality)
**Dependencies**: None (all requirements already in place)