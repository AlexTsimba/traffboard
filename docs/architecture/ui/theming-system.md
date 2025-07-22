# Theming System Architecture

This document explains how the theming and mode toggle system works in Traffboard for future development and maintenance.

## Overview

The theming system is built using a hybrid architecture that separates concerns between:
- **Color Schema**: Light/Dark/System mode (managed by `next-themes`)
- **Color Themes & Interface Scaling**: Visual themes like Tangerine, Vercel, Claude, and the optional scaling for better readability (managed by a custom, cookie-based provider)

This approach provides a robust, server-aware, and flash-free theming experience.

## Architecture Components

### 1. Hybrid Provider Setup (`src/app/layout.tsx`)

The root layout wraps the application in two providers:

```typescript
// src/app/layout.tsx
export default async function RootLayout({ children }) {
  // ... cookie reading logic ...

  return (
    <html ... >
      <body>
        <ThemeProvider initialTheme={theme}>
          <ModeThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
          >
            {children}
          </ModeThemeProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
```

- **`ThemeProvider` (Custom):** This is our custom provider that manages the color palette and scaling. It reads the initial theme from a cookie on the server, making it server-aware and preventing flashes.
- **`ModeThemeProvider` (`next-themes`):** This provider is responsible *only* for managing the light/dark/system mode. It uses `localStorage` and a special script to prevent flashing when the system theme is active.

### 2. Custom Theme Provider (`src/components/theme-provider.tsx`)

This provider manages the color palette and scaling.

- **State:** It manages a state object with `color` and `isScaled` properties.
- **Persistence:** It uses a cookie named `theme` to persist the user's choices.
- **Hook:** It exposes a `useTheme` hook for components to read and update the theme state.

### 3. CSS Theme Structure (`src/app/theme.css`)

Themes are implemented using a combination of a `data-color-theme` attribute and a `dark` class:

```css
/* Color Themes */
[data-color-theme='tangerine'] { /* theme variables */ }
[data-color-theme='vercel'] { /* theme variables */ }

/* Dark Mode Variants */
.dark[data-color-theme='tangerine'] { /* dark theme variables */ }
.dark[data-color-theme='vercel'] { /* dark theme variables */ }

/* Scaling */
.theme-scaled { /* scaled spacing and typography */ }
```

- **`data-color-theme`:** Set by our custom provider to apply the color palette.
- **`.dark`:** Set by `next-themes` to apply the dark mode.
- **`.theme-scaled`:** Set by our custom provider to apply the scaled styles.

## User Interface Components

### 1. Preferences Form (`src/components/preferences-form.tsx`)

The main configuration interface with two controls:

- **Theme Dropdown:** Selects the color theme and scaling.
- **Mode Dropdown:** Selects the light/dark/system mode.

### 2. Mode Toggle (`src/components/layout/ThemeToggle/theme-toggle.tsx`)

A standalone dropdown component for switching between light, dark, and system modes. It uses the `useTheme` hook from `next-themes`.

## Storage Strategy

- **`theme` (Cookie):** A single cookie that stores a JSON object with the `color` and `isScaled` properties. This is read by the server to prevent flashing.
- **`theme` (`localStorage`):** Managed by `next-themes` to persist the light/dark/system mode.

## Adding New Color Themes

1.  **Add CSS Variables:** In `src/app/theme.css`, add the new theme's CSS variables, following the existing structure.
2.  **Update TypeScript Types:** In `src/components/theme-provider.tsx`, add the new theme name to the `Theme` type.
3.  **Update Theme Lists:** In `src/components/theme-selector.tsx`, add the new theme to the `THEMES` array.

## Best Practices

- **Use the Correct Hook:** Use the `useTheme` hook from `~/components/theme-provider.tsx` for color and scaling, and the `useTheme` hook from `next-themes` for mode.
- **Server-Aware:** Always read the theme cookie on the server to prevent flashing.
- **Separation of Concerns:** Keep the mode and color/scaling logic separate.
