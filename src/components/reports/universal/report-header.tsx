/**
 * Universal Report Header Component
 *
 * Provides a standardized header for all reports with filter button,
 * export functionality, and action buttons. Follows the demo layout
 * with filter button in top-right corner.
 */

"use client";

import { Download } from "lucide-react";
import React from "react";

import { FilterButton } from "@/components/reports/filters/filter-system";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ReportHeaderProps } from "@/types/reports";

// eslint-disable-next-line sonarjs/prefer-read-only-props -- Props are readonly in interface
export function ReportHeader(props: ReportHeaderProps) {
  const { title, description, onFilterClick, onExportClick, actions, className } = props;
  const handleExport = (_format: string) => {
    // Export functionality will be implemented in export system
    onExportClick();
  };

  return (
    <div className={`flex items-center justify-between border-b bg-white p-4 ${className ?? ""}`}>
      <div className="flex-1">
        <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
        {description && <p className="mt-1 text-sm text-gray-600">{description}</p>}
      </div>

      <div className="flex items-center gap-2">
        {actions}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Download className="mr-1 h-4 w-4" />
              Export
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem
              onClick={() => {
                handleExport("csv");
              }}
            >
              Export as CSV
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                handleExport("excel");
              }}
            >
              Export as Excel
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                handleExport("pdf");
              }}
            >
              Export as PDF
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                handleExport("png");
              }}
            >
              Export as Image
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <FilterButton onClick={onFilterClick} />
      </div>
    </div>
  );
}

/**
 * Simplified report header for basic use cases
 */
interface SimpleReportHeaderProps {
  readonly title: string;
  readonly onFilterClick: () => void;
  readonly className?: string;
}

export function SimpleReportHeader({ title, onFilterClick, className }: SimpleReportHeaderProps) {
  return (
    <div className={`flex items-center justify-between border-b bg-white p-4 ${className ?? ""}`}>
      <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
      <FilterButton onClick={onFilterClick} />
    </div>
  );
}
