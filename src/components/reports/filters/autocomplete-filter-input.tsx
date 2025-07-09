/**
 * Autocomplete Filter Input
 *
 * Provides search-based autocomplete for filters with FTD statistics display.
 * Used for partners, campaigns and other filters with hundreds of options.
 */

"use client";

import { Check, ChevronsUpDown, X } from "lucide-react";
import React, { useState, useEffect, useCallback, useMemo } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { FilterDefinition, FilterValue } from "@/types/reports";

// ==============================
// TYPES AND INTERFACES
// ==============================

interface FilterOption {
  label: string;
  value: string;
  ftdCount: number;
  ftdSum: number;
}

interface AutocompleteFilterInputProps {
  readonly filter: FilterDefinition;
  readonly value: FilterValue;
  readonly onChange: (value: FilterValue) => void;
}

// ==============================
// MAIN COMPONENT
// ==============================

export function AutocompleteFilterInput({ filter, value, onChange }: AutocompleteFilterInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [options, setOptions] = useState<FilterOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Parse current values
  const selectedValues = useMemo(() => {
    if (value == null) return [];
    if (Array.isArray(value)) return value.map(String);
    if (typeof value === "string" || typeof value === "number") return [String(value)];
    return [];
  }, [value]);

  // Determine filter type from ID
  const filterType = useMemo(() => {
    if (filter.id === "partners") return "partners";
    if (filter.id === "campaigns") return "campaigns";
    return "partners";
  }, [filter.id]);

  // Fetch options with debouncing
  const fetchOptions = useCallback(
    async (searchTerm: string) => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams({
          type: filterType,
          search: searchTerm,
          limit: "50",
        });

        const response = await fetch(`/api/cohort/filter-options?${params.toString()}`);
        if (response.ok) {
          const data = await response.json();
          setOptions(data.options ?? []);
        }
      } catch (error) {
        console.error("Failed to fetch filter options:", error);
        setOptions([]);
      } finally {
        setIsLoading(false);
      }
    },
    [filterType],
  );

  // Handle value selection (always multiselect for autocomplete)
  const handleSelect = useCallback(
    (optionValue: string) => {
      const newValues = selectedValues.includes(optionValue)
        ? selectedValues.filter((v) => v !== optionValue)
        : [...selectedValues, optionValue];
      onChange(newValues.length > 0 ? newValues : null);
    },
    [selectedValues, onChange],
  );

  // Handle value removal
  const handleRemove = useCallback(
    (optionValue: string) => {
      const newValues = selectedValues.filter((v) => v !== optionValue);
      onChange(newValues.length > 0 ? newValues : null);
    },
    [selectedValues, onChange],
  );

  // Effect for fetching options when search changes
  useEffect(() => {
    void fetchOptions(search);
  }, [search, fetchOptions]);

  // Display text logic
  const displayText = useMemo(() => {
    if (selectedValues.length === 0) return filter.placeholder ?? "Select...";
    if (selectedValues.length === 1) {
      const option = options.find((opt) => opt.value === selectedValues[0]);
      return option?.label ?? selectedValues[0];
    }
    return `${selectedValues.length} selected`;
  }, [selectedValues, options, filter.placeholder]);

  return (
    <div className="space-y-2">
      {/* Selected values as removable badges */}
      {selectedValues.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedValues.map((selectedValue) => {
            const option = options.find((opt) => opt.value === selectedValue);
            return (
              <Badge key={selectedValue} variant="secondary" className="gap-1">
                {option?.label ?? selectedValue}
                <X
                  className="hover:text-destructive ml-1 h-3 w-3 cursor-pointer"
                  onClick={() => {
                    handleRemove(selectedValue);
                  }}
                />
              </Badge>
            );
          })}
        </div>
      )}

      {/* Main combobox */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" role="combobox" aria-expanded={isOpen} className="w-full justify-between">
            {displayText}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput placeholder={`Search ${filterType}...`} value={search} onValueChange={setSearch} />
            <CommandList>
              <CommandEmpty>{isLoading ? "Searching..." : "No results found."}</CommandEmpty>
              <CommandGroup>
                {options.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={() => {
                      handleSelect(option.value);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedValues.includes(option.value) ? "opacity-100" : "opacity-0",
                      )}
                    />
                    <div className="flex w-full items-center justify-between">
                      <span>{option.label}</span>
                      <span className="text-muted-foreground ml-2 text-xs">{option.ftdCount} FTD</span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
