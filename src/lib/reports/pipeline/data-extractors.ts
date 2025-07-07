/**
 * Data Extractors
 *
 * Handles data extraction from various sources including Prisma/PostgreSQL,
 * API endpoints, and file-based sources.
 */

import "server-only";

import { requireAuth } from "@/lib/data/auth";
import { prisma } from "@/lib/prisma";
import type { DataSourceConfig, AppliedFilter } from "@/types/reports";

import { buildPrismaWhereClause, formatFilterValue } from "./filter-utils";

// =============================================================================
// DATA EXTRACTORS
// =============================================================================

/**
 * Extract data from a data source
 */
export async function extractData(source: DataSourceConfig, filters: AppliedFilter[]): Promise<unknown[]> {
  switch (source.type) {
    case "postgresql":
    case "prisma": {
      return extractFromPrisma(filters);
    }

    case "api": {
      return extractFromAPI(source, filters);
    }

    case "csv":
    case "json": {
      return extractFromFile(source);
    }

    default: {
      throw new Error(`Unsupported data source type: ${String(source.type)}`);
    }
  }
}

/**
 * Extract data from Prisma/PostgreSQL
 */
async function extractFromPrisma(filters: AppliedFilter[]): Promise<unknown[]> {
  await requireAuth(); // Ensure authentication

  const where: Record<string, unknown> = {};

  // Convert filters to Prisma where clause
  for (const filter of filters) {
    const filterWhere = buildPrismaWhereClause(filter);
    Object.assign(where, filterWhere);
  }

  // Default to conversion data for now - this should be configurable
  return prisma.conversion.findMany({
    where,
    orderBy: { date: "desc" },
    take: 10_000, // Configurable limit
  });
}

/**
 * Extract data from API endpoint
 */
async function extractFromAPI(source: DataSourceConfig, filters: AppliedFilter[]): Promise<unknown[]> {
  if (!source.connectionString) {
    throw new Error("Connection string is required for API data source");
  }
  const url = new URL(source.connectionString);

  // Add filters as query parameters
  for (const filter of filters) {
    const formattedValue = formatFilterValue(filter);
    if (formattedValue) {
      url.searchParams.set(filter.id, formattedValue);
    }
  }

  const response = await fetch(url.toString(), {
    headers: {
      "Content-Type": "application/json",
      ...source.credentials,
    },
    signal: AbortSignal.timeout(source.timeout ?? 30_000),
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return Array.isArray(data) ? data : [data];
}

/**
 * Extract data from file
 */
function extractFromFile(source: DataSourceConfig): Promise<unknown[]> {
  // This would typically read from file system or storage
  // For now, return empty array
  console.warn(`File data source not implemented: ${source.type}`);
  return Promise.resolve([]);
}
