import type { ReactNode } from "react";

interface ReportHeaderProps {
  title: string;
  description?: string;
  filterButton: ReactNode;
  filterChips?: ReactNode;
}

/**
 * Universal Report Header Component
 *
 * Standardized header layout for all reports following Report-Factory-Architecture-Guide:
 * - Title and description on the left
 * - Filter button on the right
 * - Filter chips on separate full-width row below
 */
export function ReportHeader({ title, description, filterButton, filterChips }: ReportHeaderProps) {
  return (
    <div className="space-y-3">
      {/* Header Row: Title + Filter Button */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          {description && <p className="text-muted-foreground">{description}</p>}
        </div>

        {/* Filter Button (right-aligned) */}
        <div className="flex items-center">{filterButton}</div>
      </div>

      {/* Filter Chips Row: Full width, left-aligned */}
      {filterChips && <div className="w-full">{filterChips}</div>}
    </div>
  );
}
