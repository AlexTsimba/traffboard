/**
 * Filter Input Components
 *
 * Individual input components for different filter types.
 * Extracted from filter-system.tsx for better maintainability.
 */

"use client";

import React from "react";

import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  const dateRange =
    value != null && typeof value === "object" && "start" in value && "end" in value
      ? (value as { start: Date; end: Date })
      : null;

  const handleStartChange = (date: Date | undefined) => {
    if (date && dateRange?.end) {
      onChange({ start: date, end: dateRange.end });
    } else if (date) {
      onChange({ start: date, end: date });
    }
  };

  const handleEndChange = (date: Date | undefined) => {
    if (date && dateRange?.start) {
      onChange({ start: dateRange.start, end: date });
    }
  };

  return (
    <div className="grid grid-cols-2 gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Input
            readOnly
            placeholder="Start date"
            value={dateRange?.start ? new Date(dateRange.start).toLocaleDateString() : ""}
          />
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            selected={dateRange?.start ? new Date(dateRange.start) : undefined}
            onSelect={handleStartChange}
          />
        </PopoverContent>
      </Popover>

      <Popover>
        <PopoverTrigger asChild>
          <Input
            readOnly
            placeholder="End date"
            value={dateRange?.end ? new Date(dateRange.end).toLocaleDateString() : ""}
          />
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            selected={dateRange?.end ? new Date(dateRange.end) : undefined}
            onSelect={handleEndChange}
          />
        </PopoverContent>
      </Popover>
    </div>
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
