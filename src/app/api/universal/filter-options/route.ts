import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAuth } from "@/lib/data/auth";
import { prisma } from "@/lib/prisma";
import { getAttributionWhereClause } from "@/lib/reports/cohort/cohort-sql";

// Request validation schema
const FilterOptionsSchema = z.object({
  type: z.enum(["partners", "campaigns", "countries", "os", "params"]),
  search: z.string().optional(),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? Number.parseInt(val, 10) : 50))
    .pipe(z.number().min(1).max(100)),
  attribution: z.enum(["ftd", "registration"]).default("ftd"),
});

type FilterOptionsRequest = z.infer<typeof FilterOptionsSchema>;

// Response interfaces
interface FilterOption {
  id: string;
  label: string;
  count: number;
  ftdSum?: number;
}

interface FilterOptionsResponse {
  success: boolean;
  data: FilterOption[];
  meta: {
    total: number;
    limit: number;
    hasMore: boolean;
  };
}

interface ErrorResponse {
  success: false;
  error: {
    message: string;
    code: string;
    details?: unknown;
  };
}

/**
 * GET /api/universal/filter-options?type=partners|campaigns|countries|os|params&search=...&limit=50
 * Universal filter options endpoint with comprehensive error handling and FTD statistics
 */
export async function GET(request: NextRequest): Promise<NextResponse<FilterOptionsResponse | ErrorResponse>> {
  try {
    await requireAuth();

    const { searchParams } = new URL(request.url);
    const query = FilterOptionsSchema.parse(Object.fromEntries(searchParams));

    const options = await getFilterOptions(query);
    const total = options.length;
    const hasMore = total === query.limit;

    return NextResponse.json({
      success: true,
      data: options,
      meta: {
        total,
        limit: query.limit,
        hasMore,
      },
    });
  } catch (error) {
    console.error("Failed to fetch universal filter options:", error);

    if (error instanceof Error && error.message === "Authentication required") {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "Authentication required",
            code: "UNAUTHORIZED",
          },
        },
        { status: 401 },
      );
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "Invalid query parameters",
            code: "VALIDATION_ERROR",
            details: error.errors,
          },
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          message: "Internal server error",
          code: "INTERNAL_ERROR",
        },
      },
      { status: 500 },
    );
  }
}

async function getFilterOptions(query: FilterOptionsRequest): Promise<FilterOption[]> {
  switch (query.type) {
    case "partners": {
      const whereClause = getAttributionWhereClause(
        query.attribution,
        query.search
          ? {
              OR: [
                { partnerId: { contains: query.search, mode: "insensitive" } },
                { companyName: { contains: query.search, mode: "insensitive" } },
              ],
            }
          : {},
      );

      const partnersData = await prisma.playerData.groupBy({
        by: ["partnerId", "companyName"],
        where: whereClause,
        _sum: { ftdCount: true, ftdSum: true },
        orderBy: { _sum: { ftdCount: "desc" } },
        take: query.limit,
      });

      return partnersData.map((partner) => ({
        id: partner.partnerId,
        label: `${partner.partnerId} - ${partner.companyName ?? partner.partnerId}`,
        count: partner._sum.ftdCount ?? 0,
        ftdSum: Number(partner._sum.ftdSum ?? 0),
      }));
    }

    case "campaigns": {
      const whereClause = getAttributionWhereClause(
        query.attribution,
        query.search
          ? {
              OR: [
                { campaignId: { contains: query.search, mode: "insensitive" } },
                { campaignName: { contains: query.search, mode: "insensitive" } },
              ],
            }
          : {},
      );

      const campaignsData = await prisma.playerData.groupBy({
        by: ["campaignId", "campaignName"],
        where: whereClause,
        _sum: { ftdCount: true, ftdSum: true },
        orderBy: { _sum: { ftdCount: "desc" } },
        take: query.limit,
      });

      return campaignsData.map((campaign) => ({
        id: campaign.campaignId,
        label: `${campaign.campaignId} - ${campaign.campaignName ?? campaign.campaignId}`,
        count: campaign._sum.ftdCount ?? 0,
        ftdSum: Number(campaign._sum.ftdSum ?? 0),
      }));
    }

    case "countries": {
      const whereClause = getAttributionWhereClause(query.attribution, {
        playerCountry: {
          not: null,
          ...(query.search && { contains: query.search, mode: "insensitive" }),
        },
      });

      const countriesData = await prisma.playerData.groupBy({
        by: ["playerCountry"],
        where: whereClause,
        _sum: { ftdCount: true, ftdSum: true },
        orderBy: { _sum: { ftdCount: "desc" } },
        take: query.limit,
      });

      return countriesData.map((country) => ({
        id: country.playerCountry ?? "",
        label: country.playerCountry ?? "",
        count: country._sum.ftdCount ?? 0,
        ftdSum: Number(country._sum.ftdSum ?? 0),
      }));
    }

    case "os": {
      const whereClause = getAttributionWhereClause(query.attribution, {
        tagOs: {
          not: null,
          ...(query.search && { contains: query.search, mode: "insensitive" }),
        },
      });

      const osData = await prisma.playerData.groupBy({
        by: ["tagOs"],
        where: whereClause,
        _sum: { ftdCount: true, ftdSum: true },
        orderBy: { _sum: { ftdCount: "desc" } },
        take: query.limit,
      });

      return osData.map((os) => ({
        id: os.tagOs ?? "",
        label: os.tagOs ?? "",
        count: os._sum.ftdCount ?? 0,
        ftdSum: Number(os._sum.ftdSum ?? 0),
      }));
    }

    case "params": {
      // Aggregate across tagSource, tagSub2, tagWebId fields
      const whereClause = getAttributionWhereClause(query.attribution, {
        tagSource: {
          not: null,
          ...(query.search && { contains: query.search, mode: "insensitive" }),
        },
      });

      const paramsData = await prisma.playerData.groupBy({
        by: ["tagSource"],
        where: whereClause,
        _sum: { ftdCount: true, ftdSum: true },
        orderBy: { _sum: { ftdCount: "desc" } },
        take: query.limit,
      });

      return paramsData.map((param) => ({
        id: param.tagSource ?? "",
        label: `Source: ${param.tagSource ?? ""}`,
        count: param._sum.ftdCount ?? 0,
        ftdSum: Number(param._sum.ftdSum ?? 0),
      }));
    }

    default: {
      console.warn(`Unknown filter type: ${String(query.type)}`);
      return [];
    }
  }
}
