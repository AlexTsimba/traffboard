'use client';

import { Label } from '~/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import { useUnifiedTheme, type ColorTheme } from '~/hooks/use-unified-theme';

const COLOR_THEMES = [
  { name: 'Tangerine', value: 'tangerine' as ColorTheme },
  { name: 'Vercel', value: 'vercel' as ColorTheme },
  { name: 'Claude', value: 'claude' as ColorTheme },
];

export function ThemeSelector() {
  const { mounted, colorTheme, setColorTheme } = useUnifiedTheme();

  const handleValueChange = (value: string) => {
    setColorTheme(value as ColorTheme);
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <Label htmlFor="theme-selector" className="sr-only">
        Theme
      </Label>
      <Select value={colorTheme} onValueChange={handleValueChange}>
        <SelectTrigger
          id="theme-selector"
          className="justify-start *:data-[slot=select-value]:w-20"
        >
          <span className="text-muted-foreground hidden sm:block">
            Select a theme:
          </span>
          <span className="text-muted-foreground block sm:hidden">Theme</span>
          <SelectValue placeholder="Select a theme" />
        </SelectTrigger>
        <SelectContent align="end">
          {COLOR_THEMES.map((t) => (
            <SelectItem key={t.value} value={t.value}>
              {t.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
