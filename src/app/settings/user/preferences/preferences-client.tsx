'use client';

import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Label } from '~/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select';
import { Checkbox } from '~/components/ui/checkbox';
import { ModeToggle } from '~/components/layout/ThemeToggle/theme-toggle';
import { useUnifiedTheme, type ColorTheme } from '~/hooks/use-unified-theme';
import { Palette, Monitor } from 'lucide-react';

const COLOR_THEMES = [
  { name: 'Tangerine', value: 'tangerine' as ColorTheme },
  { name: 'Vercel', value: 'vercel' as ColorTheme },
  { name: 'Claude', value: 'claude' as ColorTheme },
];

export function PreferencesClient() {
  const { mounted, colorTheme, setColorTheme, isScaled, setIsScaled, isContentCentered, setIsContentCentered } = useUnifiedTheme();

  const handleColorThemeChange = (value: string) => {
    setColorTheme(value as ColorTheme);
  };

  const handleScaleChange = (checked: boolean) => {
    setIsScaled(checked);
  };

  const handleContentCenteringChange = (checked: boolean | 'indeterminate') => {
    if (typeof checked === 'boolean') {
      setIsContentCentered(checked);
    }
  };

  if (!mounted) {
    return <div>Loading...</div>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Theme
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Color Theme</Label>
            <Select value={colorTheme} onValueChange={handleColorThemeChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select a theme" />
              </SelectTrigger>
              <SelectContent>
                {COLOR_THEMES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Mode</Label>
            <ModeToggle />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            Display
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="scale-interface"
              checked={isScaled}
              onCheckedChange={handleScaleChange}
            />
            <Label htmlFor="scale-interface">Scale interface</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="center-content"
              checked={isContentCentered}
              onCheckedChange={handleContentCenteringChange}
            />
            <Label htmlFor="center-content">Center content on large screens</Label>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}