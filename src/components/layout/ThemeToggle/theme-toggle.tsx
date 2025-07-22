'use client';

import { useTheme } from 'next-themes';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select';
import { useEffect, useState, useCallback } from 'react';

const MODE_OPTIONS = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
];

export function ModeToggle() {
  const [mounted, setMounted] = useState(false);
  const { setTheme, theme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleThemeToggle = useCallback(
    (newTheme: string) => {
      if (!document.startViewTransition) {
        setTheme(newTheme);
        return;
      }

      document.startViewTransition(() => {
        setTheme(newTheme);
      });
    },
    [setTheme]
  );

  // Get current mode (filter out color themes)
  const currentMode = MODE_OPTIONS.find(mode => mode.value === theme)?.value ?? 'system';

  if (!mounted) {
    return null;
  }

  return (
    <Select value={currentMode} onValueChange={handleThemeToggle}>
      <SelectTrigger className="w-32">
        <SelectValue placeholder="Select mode" />
      </SelectTrigger>
      <SelectContent>
        {MODE_OPTIONS.map((mode) => (
          <SelectItem key={mode.value} value={mode.value}>
            {mode.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}