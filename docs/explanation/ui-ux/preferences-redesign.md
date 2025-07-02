# Preferences Page Redesign

## Overview

Redesigned the preferences/appearance page with modern best practices for settings interfaces.

## Key Improvements

### 🎨 **Visual Design**

- **Constrained width**: Added `max-w-4xl` for better readability on wide screens
- **Card-based layout**: Separated theme and layout settings into distinct cards
- **Improved spacing**: Better visual hierarchy with consistent spacing
- **Responsive grid**: Toggle groups now use responsive CSS Grid instead of flex

### 🔧 **User Experience**

- **Descriptive cards**: Each setting section has clear titles and descriptions
- **Enhanced options**: Toggle items now show descriptions for each choice
- **Visual feedback**: Added LayoutPreview component to show current settings
- **Better accessibility**: Improved ARIA labels and keyboard navigation

### 📱 **Responsive Design**

- **Mobile-first**: Toggle groups stack on mobile, grid on larger screens
- **Flexible layout**: Settings adapt to screen size automatically
- **Touch-friendly**: Larger touch targets for mobile users

## Components Structure

```
preferences/
├── page.tsx              # Main page with constrained layout
├── _components/
    ├── theme-selector.tsx    # Enhanced theme selection with descriptions
    ├── layout-selector.tsx   # Improved layout options with better organization
    └── layout-preview.tsx    # NEW: Visual preview of current settings
```

## Design Patterns Used

### Card-based Settings

Each major setting group is in its own card with:

- Clear title and description in CardHeader
- Settings controls in CardContent
- Visual separation with Separator components

### Responsive Toggle Groups

- Grid layout: `grid-cols-1 sm:grid-cols-2/3`
- Vertical layout for toggle items
- Descriptive text under each option

### Visual Feedback

- Live preview of current settings
- Badge indicators for active settings
- Simplified visual representation of layout

## Best Practices Implemented

1. **Constrained Content Width** - Prevents text from becoming unreadable on ultrawide screens
2. **Progressive Disclosure** - Related settings grouped together
3. **Clear Labeling** - Each option has both title and description
4. **Visual Hierarchy** - Typography scale from page title → card titles → option labels
5. **Consistent Spacing** - Uses design system spacing tokens throughout

## Technical Notes

- All components remain fully functional with existing cookie-based persistence
- LayoutPreview updates in real-time by polling cookies
- Maintains backward compatibility with existing layout preferences system
- Uses shadcn/ui components consistently throughout
