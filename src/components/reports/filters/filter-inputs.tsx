/**
 * Filter Input Components
 *
 * Individual input components for different filter types.
 * Extracted from filter-system.tsx for better maintainability.
 */

"use client";

import React from "react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import type { FilterDefinition, FilterValue } from "@/types/reports";

// =============================================================================
// SHARED INTERFACE
// =============================================================================

interface FilterInputProps {
  readonly filter: FilterDefinition;
  readonly value: FilterValue;
  readonly onChange: (value: FilterValue) => void;
}

// =============================================================================
// TEXT INPUT COMPONENT
// =============================================================================

export function TextFilterInput({ filter, value, onChange }: FilterInputProps) {
  return (
    <Input
      placeholder={filter.placeholder}
      value={value != null && typeof value === "string" ? value : ""}
      onChange={(e) => {
        onChange(e.target.value || null);
      }}
    />
  );
}

// =============================================================================
// SELECT INPUT COMPONENT
// =============================================================================

export function SelectFilterInput({ filter, value, onChange }: FilterInputProps) {
  return (
    <Select
      value={value != null && typeof value === "string" ? value : ""}
      onValueChange={(newValue) => {
        onChange(newValue || null);
      }}
    >
      <SelectTrigger>
        <SelectValue placeholder={filter.placeholder} />
      </SelectTrigger>
      <SelectContent>
        {filter.options?.map((option) => (
          <SelectItem key={String(option.value)} value={String(option.value)} disabled={option.disabled}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// =============================================================================
// MULTISELECT INPUT COMPONENT
// =============================================================================

export function MultiselectFilterInput({ filter, value, onChange }: FilterInputProps) {
  const currentValues = Array.isArray(value) ? value.map(String) : [];

  return (
    <div className="space-y-2">
      {filter.options?.map((option) => (
        <div key={String(option.value)} className="flex items-center space-x-2">
          <Checkbox
            id={`${filter.id}-${String(option.value)}`}
            checked={currentValues.includes(String(option.value))}
            onCheckedChange={(checked) => {
              const newValues = checked
                ? [...currentValues, String(option.value)]
                : currentValues.filter((v) => v !== String(option.value));
              onChange(newValues.length > 0 ? newValues : null);
            }}
            disabled={option.disabled}
          />
          <Label htmlFor={`${filter.id}-${String(option.value)}`}>{option.label}</Label>
        </div>
      ))}
    </div>
  );
}

// =============================================================================
// DATE INPUT COMPONENT
// =============================================================================

export function DateFilterInput({ filter, value, onChange }: FilterInputProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Input
          readOnly
          placeholder={filter.placeholder}
          value={value instanceof Date ? value.toLocaleDateString() : ""}
        />
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={value instanceof Date ? value : undefined}
          onSelect={(date) => {
            onChange(date ?? null);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

// =============================================================================
// DATE RANGE INPUT COMPONENT
// =============================================================================

export function DateRangeFilterInput({ value, onChange }: FilterInputProps) {
  // Default to today-today if no value
  const today = new Date();
  const defaultRange = { start: today, end: today };

  const dateRange =
    value != null && typeof value === "object" && "start" in value && "end" in value
      ? (value as { start: Date; end: Date })
      : defaultRange;

  // Convert project format {start, end} to calendar format {from, to}
  const calendarRange = {
    from: new Date(dateRange.start),
    to: new Date(dateRange.end),
  };

  // Format display text
  const formatDate = (date: Date) =>
    date.toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" });

  const displayText = dateRange
    ? `${formatDate(new Date(dateRange.start))} - ${formatDate(new Date(dateRange.end))}`
    : "Select date range";

  const handleRangeChange = (range: { from?: Date; to?: Date } | undefined) => {
    if (range?.from && range?.to) {
      // Convert calendar format {from, to} back to project format {start, end}
      onChange({ start: range.from, end: range.to });
    } else if (range?.from) {
      // Single date selected - use as both start and end
      onChange({ start: range.from, end: range.from });
    }
  };

  // Date presets
  const getThisWeek = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return { start: monday, end: sunday };
  };

  const getThisMonth = () => {
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    return { start, end };
  };

  const getLastMonth = () => {
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const end = new Date(today.getFullYear(), today.getMonth(), 0);
    return { start, end };
  };

  const handlePresetClick = (preset: { start: Date; end: Date }) => {
    onChange(preset);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Input readOnly placeholder="Select date range" value={displayText} className="cursor-pointer" />
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-3">
          <div className="mb-3 flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                handlePresetClick(getThisWeek());
              }}
            >
              This Week
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                handlePresetClick(getThisMonth());
              }}
            >
              This Month
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                handlePresetClick(getLastMonth());
              }}
            >
              Last Month
            </Button>
          </div>
          <Separator className="mb-3" />
        </div>
        <Calendar mode="range" selected={calendarRange} onSelect={handleRangeChange} numberOfMonths={2} />
      </PopoverContent>
    </Popover>
  );
}

// =============================================================================
// NUMBER INPUT COMPONENT
// =============================================================================

export function NumberFilterInput({ filter, value, onChange }: FilterInputProps) {
  return (
    <Input
      type="number"
      placeholder={filter.placeholder}
      value={typeof value === "number" ? value : ""}
      onChange={(e) => {
        onChange(e.target.value ? Number(e.target.value) : null);
      }}
    />
  );
}

// =============================================================================
// NUMBER RANGE INPUT COMPONENT
// =============================================================================

export function NumberRangeFilterInput({ value, onChange }: FilterInputProps) {
  const numberRange =
    value != null && typeof value === "object" && "min" in value && "max" in value
      ? (value as { min: number; max: number })
      : null;

  const handleMinChange = (minValue: string) => {
    const min = minValue ? Number(minValue) : null;
    if (min !== null && numberRange?.max !== undefined) {
      onChange({ min, max: numberRange.max });
    } else if (min !== null) {
      onChange({ min, max: min });
    }
  };

  const handleMaxChange = (maxValue: string) => {
    const max = maxValue ? Number(maxValue) : null;
    if (max !== null && numberRange?.min !== undefined) {
      onChange({ min: numberRange.min, max });
    }
  };

  return (
    <div className="grid grid-cols-2 gap-2">
      <Input
        type="number"
        placeholder="Min"
        value={numberRange?.min ?? ""}
        onChange={(e) => {
          handleMinChange(e.target.value);
        }}
      />
      <Input
        type="number"
        placeholder="Max"
        value={numberRange?.max ?? ""}
        onChange={(e) => {
          handleMaxChange(e.target.value);
        }}
      />
    </div>
  );
}

// =============================================================================
// BOOLEAN INPUT COMPONENT
// =============================================================================

export function BooleanFilterInput({ filter, value, onChange }: FilterInputProps) {
  return (
    <div className="flex items-center space-x-2">
      <Checkbox
        id={filter.id}
        checked={Boolean(value)}
        onCheckedChange={(checked) => {
          onChange(checked);
        }}
      />
      <Label htmlFor={filter.id}>{filter.label}</Label>
    </div>
  );
}

// =============================================================================
// MAIN FILTER INPUT ROUTER
// =============================================================================

export function FilterInput({ filter, value, onChange }: FilterInputProps) {
  const inputProps = { filter, value, onChange };

  switch (filter.type) {
    case "text": {
      return <TextFilterInput {...inputProps} />;
    }
    case "select": {
      return <SelectFilterInput {...inputProps} />;
    }
    case "multiselect": {
      return <MultiselectFilterInput {...inputProps} />;
    }
    case "date": {
      return <DateFilterInput {...inputProps} />;
    }
    case "daterange": {
      return <DateRangeFilterInput {...inputProps} />;
    }
    case "number": {
      return <NumberFilterInput {...inputProps} />;
    }
    case "numberrange": {
      return <NumberRangeFilterInput {...inputProps} />;
    }
    case "boolean": {
      return <BooleanFilterInput {...inputProps} />;
    }
    default: {
      return <TextFilterInput {...inputProps} />;
    }
  }
}
