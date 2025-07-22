'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export type ColorTheme = 'tangerine' | 'vercel' | 'claude';

// Utility function to apply color theme classes
function applyColorTheme(colorTheme: ColorTheme) {
  if (typeof window === 'undefined') return;
  
  document.documentElement.classList.remove('tangerine', 'vercel', 'claude');
  document.documentElement.classList.add(colorTheme);
}

// Utility function to apply scaling
function applyScaling(isScaled: boolean) {
  if (typeof window === 'undefined') return;
  
  document.documentElement.classList.toggle('theme-scaled', isScaled);
}

// Utility function to apply content centering
function applyContentCentering(isContentCentered: boolean) {
  if (typeof window === 'undefined') return;
  
  document.documentElement.classList.toggle('content-centered', isContentCentered);
}

export function useUnifiedTheme() {
  const [mounted, setMounted] = useState(false);
  const [colorTheme, setColorTheme] = useState<ColorTheme>('tangerine');
  const [isScaled, setIsScaled] = useState(false);
  const [isContentCentered, setIsContentCentered] = useState(true); // Centered by default
  const { theme, setTheme } = useTheme();

  // Initialize and apply stored preferences on every render
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    setMounted(true);
    
    // Load and apply color theme from localStorage
    const savedColorTheme = localStorage.getItem('color-theme') as ColorTheme;
    const validColorTheme = savedColorTheme && ['tangerine', 'vercel', 'claude'].includes(savedColorTheme) 
      ? savedColorTheme 
      : 'tangerine';
    
    setColorTheme(validColorTheme);
    applyColorTheme(validColorTheme);

    // Load and apply scaling preference from localStorage
    const savedIsScaled = localStorage.getItem('theme-scaled') === 'true';
    setIsScaled(savedIsScaled);
    applyScaling(savedIsScaled);

    // Load and apply content centering preference from localStorage
    const savedIsContentCentered = localStorage.getItem('content-layout-centered');
    const validIsContentCentered = savedIsContentCentered !== null 
      ? savedIsContentCentered === 'true' 
      : true; // Default to centered
    
    setIsContentCentered(validIsContentCentered);
    applyContentCentering(validIsContentCentered);
  }, []);

  // Also apply on every theme change to ensure consistency
  useEffect(() => {
    if (mounted && colorTheme) {
      applyColorTheme(colorTheme);
    }
  }, [mounted, colorTheme]);

  useEffect(() => {
    if (mounted) {
      applyScaling(isScaled);
    }
  }, [mounted, isScaled]);

  useEffect(() => {
    if (mounted) {
      applyContentCentering(isContentCentered);
    }
  }, [mounted, isContentCentered]);

  const setColorThemeWithPersistence = (newColorTheme: ColorTheme) => {
    if (!mounted) return;
    
    setColorTheme(newColorTheme);
    localStorage.setItem('color-theme', newColorTheme);
    applyColorTheme(newColorTheme);
  };

  const setScaledWithPersistence = (newIsScaled: boolean) => {
    if (!mounted) return;
    
    setIsScaled(newIsScaled);
    localStorage.setItem('theme-scaled', newIsScaled.toString());
    applyScaling(newIsScaled);
  };

  const setContentCenteredWithPersistence = (newIsContentCentered: boolean) => {
    if (!mounted) return;
    
    setIsContentCentered(newIsContentCentered);
    localStorage.setItem('content-layout-centered', newIsContentCentered.toString());
    applyContentCentering(newIsContentCentered);
  };

  return {
    mounted,
    // Mode (light/dark/system) from next-themes
    mode: theme,
    setMode: setTheme,
    // Color theme (tangerine/vercel/claude)
    colorTheme,
    setColorTheme: setColorThemeWithPersistence,
    // Scaling
    isScaled,
    setIsScaled: setScaledWithPersistence,
    // Content centering
    isContentCentered,
    setIsContentCentered: setContentCenteredWithPersistence,
  };
}