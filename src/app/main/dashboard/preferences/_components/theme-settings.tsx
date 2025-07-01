"use client";

import { Monitor, Moon, Sun, Palette, Sparkles, Contrast, Eye } from "lucide-react";
import { useTheme } from "next-themes";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export function ThemeSettings() {
  const { theme, setTheme } = useTheme();
  const [accentColor, setAccentColor] = useState("blue");
  const [borderRadius, setBorderRadius] = useState([8]);
  const [animationsEnabled, setAnimationsEnabled] = useState(true);
  const [compactMode, setCompactMode] = useState(false);

  const getThemeBackgroundClass = () => {
    switch (theme) {
      case "light": {
        return "bg-white";
      }
      case "dark": {
        return "bg-slate-900";
      }
      default: {
        return "bg-gradient-to-r from-white to-slate-900";
      }
    }
  };

  const getThemeElementClass = (lightClass: string, darkClass: string, gradientClass: string) => {
    switch (theme) {
      case "light": {
        return lightClass;
      }
      case "dark": {
        return darkClass;
      }
      default: {
        return gradientClass;
      }
    }
  };

  const accentColors = [
    { name: "Blue", value: "blue", class: "bg-blue-500" },
    { name: "Green", value: "green", class: "bg-green-500" },
    { name: "Purple", value: "purple", class: "bg-purple-500" },
    { name: "Orange", value: "orange", class: "bg-orange-500" },
    { name: "Red", value: "red", class: "bg-red-500" },
    { name: "Teal", value: "teal", class: "bg-teal-500" },
  ];

  return (
    <div className="grid gap-3 lg:grid-cols-2">
      {/* Left Column */}
      <div className="space-y-3">
        {/* Current Theme Display */}
        <Card className="gap-2 py-3">
          <CardHeader className="pb-1">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Palette className="h-4 w-4" />
              Current Theme
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {/* Theme Preview */}
            <div className="flex h-10 overflow-hidden rounded-md border">
              <div className={`flex-1 ${getThemeBackgroundClass()}`}>
                <div className="h-full space-y-0.5 p-1">
                  <div
                    className={`h-1.5 w-8 rounded ${getThemeElementClass("bg-slate-200", "bg-slate-700", "bg-gradient-to-r from-slate-200 to-slate-700")}`}
                  />
                  <div
                    className={`h-1 w-10 rounded ${getThemeElementClass("bg-slate-300", "bg-slate-600", "bg-gradient-to-r from-slate-300 to-slate-600")}`}
                  />
                  <div
                    className={`h-1 w-6 rounded ${getThemeElementClass("bg-slate-300", "bg-slate-600", "bg-gradient-to-r from-slate-300 to-slate-600")}`}
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-1">
              <Badge className="text-xs" variant="secondary">
                {theme ? theme.charAt(0).toUpperCase() + theme.slice(1) : "—"}
              </Badge>
              <Badge className="text-xs" variant="secondary">
                {accentColor}
              </Badge>
              <Badge className="text-xs" variant="secondary">
                {borderRadius[0]}px
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Color Scheme Selection */}
        <Card className="gap-2 py-3">
          <CardHeader className="pb-1">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Contrast className="h-4 w-4" />
              Color Scheme
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ToggleGroup
              className="grid w-full grid-cols-3 gap-1"
              size="sm"
              type="single"
              value={theme}
              variant="outline"
              onValueChange={(value) => {
                setTheme(value);
              }}
            >
              <ToggleGroupItem aria-label="Light theme" className="h-10" value="light">
                <div className="text-center">
                  <Sun className="mx-auto mb-0.5 h-3 w-3" />
                  <div className="text-xs font-medium">Light</div>
                </div>
              </ToggleGroupItem>
              <ToggleGroupItem aria-label="Dark theme" className="h-10" value="dark">
                <div className="text-center">
                  <Moon className="mx-auto mb-0.5 h-3 w-3" />
                  <div className="text-xs font-medium">Dark</div>
                </div>
              </ToggleGroupItem>
              <ToggleGroupItem aria-label="System theme" className="h-10" value="system">
                <div className="text-center">
                  <Monitor className="mx-auto mb-0.5 h-3 w-3" />
                  <div className="text-xs font-medium">System</div>
                </div>
              </ToggleGroupItem>
            </ToggleGroup>
          </CardContent>
        </Card>

        {/* Advanced Options */}
        <Card className="gap-2 py-3">
          <CardHeader className="pb-1">
            <CardTitle className="text-sm">Advanced Options</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm">Smooth animations</Label>
                <p className="text-muted-foreground text-xs">Enable transitions</p>
              </div>
              <Switch checked={animationsEnabled} onCheckedChange={setAnimationsEnabled} />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm">Compact mode</Label>
                <p className="text-muted-foreground text-xs">Reduce spacing</p>
              </div>
              <Switch checked={compactMode} onCheckedChange={setCompactMode} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Column */}
      <div className="space-y-3">
        {/* Accent Color */}
        <Card className="gap-2 py-3">
          <CardHeader className="pb-1">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Sparkles className="h-4 w-4" />
              Accent Color
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-2">
              {accentColors.map((color) => (
                <button
                  key={color.value}
                  className={`relative h-8 w-full rounded-md border-2 transition-all ${
                    accentColor === color.value
                      ? "border-primary ring-primary/20 ring-2"
                      : "border-muted hover:border-muted-foreground/30"
                  }`}
                  onClick={() => {
                    setAccentColor(color.value);
                  }}
                >
                  <div className={`h-full w-full rounded-sm ${color.class}`} />
                  {accentColor === color.value && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="h-2 w-2 rounded-full bg-white shadow-md" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Border Radius */}
        <Card className="gap-2 py-3">
          <CardHeader className="pb-1">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Eye className="h-4 w-4" />
              Interface Style
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Border Radius</Label>
                <span className="text-muted-foreground text-xs">{borderRadius[0]}px</span>
              </div>
              <Slider
                className="w-full"
                max={16}
                min={0}
                step={1}
                value={borderRadius}
                onValueChange={setBorderRadius}
              />
              <div className="text-muted-foreground flex justify-between text-xs">
                <span>Sharp</span>
                <span>Rounded</span>
              </div>
            </div>

            {/* Preview */}
            <div className="flex gap-1">
              <div className="bg-primary h-5 w-8" style={{ borderRadius: `${borderRadius[0]}px` }} />
              <div
                className="border-muted-foreground h-5 w-8 border-2"
                style={{ borderRadius: `${borderRadius[0]}px` }}
              />
              <div className="bg-muted h-5 w-8" style={{ borderRadius: `${borderRadius[0]}px` }} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
