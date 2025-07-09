/**
 * CohortTable Component
 *
 * Advanced table implementation for cohort analysis with triangular layout,
 * heatmap visualization, and performance optimizations using TanStack Table.
 */

import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type Row,
  type SortingState,
} from "@tanstack/react-table";
import { useMemo, useState, type JSX } from "react";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { CohortData, CohortMetric } from "@/types/reports";

import {
  calculateMetricRange,
  createCohortCellMemoized,
  getVisibleBreakpoints,
  sortCohortsByDate,
} from "./cohort-table-utils";
import { CohortTableCell } from "./CohortTableCell";

export interface CohortTableProps {
  readonly data: CohortData[];
  readonly metric: CohortMetric;
  readonly breakpoints: readonly number[];
  readonly onCellClick?: (cohortDate: string, breakpoint: number, value: number | null) => void;
  readonly onRowSelectionChange?: (selectedRows: string[]) => void;
  readonly selectedRows?: string[];
  readonly maxBreakpoints?: number;
  readonly enableSorting?: boolean;
  readonly enablePagination?: boolean;
  readonly pageSize?: number;
  readonly className?: string;
  readonly isLoading?: boolean;
}

interface CohortTableRow {
  id: string;
  cohortDate: string;
  ftdCount: number;
  visibleBreakpoints: readonly number[];
  originalData: CohortData;
}

// Helper function to safely get array element
function getArrayElementSafe<T>(array: readonly T[], index: number): T | undefined {
  if (index >= 0 && index < array.length) {
    // eslint-disable-next-line security/detect-object-injection
    return array[index];
  }
  return undefined;
}

// Helper function to get the most common breakpoint at a given position
function getMostCommonBreakpoint(data: CohortTableRow[], position: number): number | null {
  const breakpoints: number[] = [];

  for (const row of data) {
    const bp = getArrayElementSafe(row.visibleBreakpoints, position);
    if (typeof bp === "number") {
      breakpoints.push(bp);
    }
  }

  if (breakpoints.length === 0) {
    return null;
  }

  const frequency = new Map<number, number>();
  for (const bp of breakpoints) {
    frequency.set(bp, (frequency.get(bp) ?? 0) + 1);
  }

  let mostCommon = breakpoints[0];
  let maxCount = 0;

  for (const [bp, count] of frequency.entries()) {
    if (count > maxCount) {
      maxCount = count;
      mostCommon = bp;
    }
  }

  return mostCommon;
}

// Validate cohort data structure
function isValidCohortData(data: unknown): data is CohortData {
  if (typeof data !== "object" || data === null) {
    return false;
  }

  const cohort = data as Record<string, unknown>;

  return (
    typeof cohort.cohortDate === "string" &&
    typeof cohort.ftdCount === "number" &&
    typeof cohort.breakpointValues === "object" &&
    cohort.breakpointValues !== null
  );
}

export function CohortTable({
  data,
  metric,
  breakpoints,
  onCellClick,
  onRowSelectionChange,
  selectedRows = [],
  maxBreakpoints,
  enableSorting = true,
  enablePagination = true,
  pageSize = 20,
  className,
  isLoading = false,
}: CohortTableProps): JSX.Element {
  const [sorting, setSorting] = useState<SortingState>([]);

  // Validate and process cohort data
  const validatedData = useMemo(() => {
    return data.filter((item): item is CohortData => isValidCohortData(item));
  }, [data]);

  // Sort cohorts by date for proper triangular display
  const sortedCohorts = useMemo(() => {
    return sortCohortsByDate([...validatedData]);
  }, [validatedData]);

  // Calculate metric range for heatmap scaling
  const metricRange = useMemo(() => {
    return calculateMetricRange(sortedCohorts);
  }, [sortedCohorts]);

  // Transform cohort data into table rows with triangular layout
  const tableData = useMemo((): CohortTableRow[] => {
    return sortedCohorts.map((cohort, index) => ({
      id: cohort.cohortDate,
      cohortDate: cohort.cohortDate,
      ftdCount: cohort.ftdCount,
      visibleBreakpoints: getVisibleBreakpoints(breakpoints, index, maxBreakpoints),
      originalData: cohort,
    }));
  }, [sortedCohorts, breakpoints, maxBreakpoints]);

  // Generate dynamic column definitions for triangular layout
  const columns = useMemo((): ColumnDef<CohortTableRow>[] => {
    const baseColumns: ColumnDef<CohortTableRow>[] = [
      {
        id: "cohortDate",
        header: "Cohort Date",
        accessorKey: "cohortDate",
        cell: ({ getValue }) => {
          const date = getValue() as string;
          return new Date(date).toLocaleDateString();
        },
        enableSorting: enableSorting,
        sortingFn: "datetime",
      },
      {
        id: "ftdCount",
        header: "FTD Count",
        accessorKey: "ftdCount",
        cell: ({ getValue }) => {
          const count = getValue() as number;
          return count.toLocaleString();
        },
        enableSorting: enableSorting,
      },
    ];

    // Generate breakpoint columns dynamically
    const maxVisibleBreakpoints = Math.max(...tableData.map((row) => row.visibleBreakpoints.length), 0);

    for (let i = 0; i < maxVisibleBreakpoints; i++) {
      baseColumns.push({
        id: `breakpoint-${i}`,
        header: () => {
          // Dynamic header based on most common breakpoint at this position
          const commonBreakpoint = getMostCommonBreakpoint(tableData, i);
          return commonBreakpoint ? `Day ${commonBreakpoint}` : `Day ${i + 1}`;
        },
        cell: ({ row }) => {
          const cohortRow = row.original;
          const breakpoint = getArrayElementSafe(cohortRow.visibleBreakpoints, i);

          if (!breakpoint) {
            return null;
          }

          const cell = createCohortCellMemoized(
            cohortRow.originalData,
            breakpoint,
            metric,
            metricRange.min,
            metricRange.max,
          );

          return (
            <CohortTableCell
              cell={cell}
              metric={metric}
              cohortDate={cohortRow.cohortDate}
              breakpoint={breakpoint}
              onCellClick={onCellClick}
              isSelected={selectedRows.includes(cohortRow.id)}
            />
          );
        },
        enableSorting: false,
      });
    }

    return baseColumns;
  }, [tableData, metric, metricRange, enableSorting, onCellClick, selectedRows]);

  // Initialize TanStack Table
  const table = useReactTable({
    data: tableData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: enableSorting ? getSortedRowModel() : undefined,
    getPaginationRowModel: enablePagination ? getPaginationRowModel() : undefined,
    onSortingChange: setSorting,
    state: {
      sorting,
      pagination: enablePagination
        ? {
            pageIndex: 0,
            pageSize,
          }
        : undefined,
    },
    initialState: {
      pagination: enablePagination
        ? {
            pageIndex: 0,
            pageSize,
          }
        : undefined,
    },
  });

  // Handle row selection
  const handleRowClick = (row: Row<CohortTableRow>) => {
    if (onRowSelectionChange) {
      const rowId = row.original.id;
      const isSelected = selectedRows.includes(rowId);

      if (isSelected) {
        onRowSelectionChange(selectedRows.filter((id) => id !== rowId));
      } else {
        onRowSelectionChange([...selectedRows, rowId]);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-32 items-center justify-center">
        <div className="text-muted-foreground text-sm">Loading cohort data...</div>
      </div>
    );
  }

  if (tableData.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center">
        <div className="text-muted-foreground text-sm">No cohort data available.</div>
      </div>
    );
  }

  return (
    <div className={className}>
      <Table>
        <TableHeader className="bg-background sticky top-0 z-10">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id} colSpan={header.colSpan}>
                  {header.isPlaceholder ? undefined : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow
              key={row.id}
              data-state={selectedRows.includes(row.original.id) ? "selected" : undefined}
              className="hover:bg-muted/50 cursor-pointer"
              onClick={() => {
                handleRowClick(row);
              }}
            >
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {enablePagination && table.getPageCount() > 1 && (
        <div className="flex items-center justify-between px-4 py-2">
          <div className="text-muted-foreground text-sm">
            Showing {table.getState().pagination.pageIndex * pageSize + 1} to{" "}
            {Math.min((table.getState().pagination.pageIndex + 1) * pageSize, tableData.length)} of {tableData.length}{" "}
            cohorts
          </div>
          <div className="flex items-center space-x-2">
            <button
              className="rounded border px-3 py-1 text-sm disabled:opacity-50"
              onClick={() => {
                table.previousPage();
              }}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </button>
            <span className="text-sm">
              Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
            </span>
            <button
              className="rounded border px-3 py-1 text-sm disabled:opacity-50"
              onClick={() => {
                table.nextPage();
              }}
              disabled={!table.getCanNextPage()}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
