import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAuth } from "@/lib/data/auth";
import { prisma } from "@/lib/prisma";

const querySchema = z.object({
  type: z.enum(["partners", "campaigns"]),
  search: z.string().optional(),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? Number.parseInt(val, 10) : 50)),
});

interface FilterOption {
  label: string;
  value: string;
  ftdCount: number;
  ftdSum: number;
}

/**
 * GET /api/cohort/filter-options?type=partners|campaigns&search=...&limit=50
 * Returns filter options with FTD statistics for autocomplete
 */
export async function GET(request: NextRequest) {
  try {
    await requireAuth();

    const { searchParams } = new URL(request.url);
    const query = querySchema.parse(Object.fromEntries(searchParams));

    let options: FilterOption[] = [];

    if (query.type === "partners") {
      // Get partners with aggregated FTD data
      const partnersData = await prisma.playerData.groupBy({
        by: ["partnerId", "companyName"],
        where: {
          ...(query.search && {
            OR: [
              { partnerId: { contains: query.search, mode: "insensitive" } },
              { companyName: { contains: query.search, mode: "insensitive" } },
            ],
          }),
        },
        _sum: {
          ftdCount: true,
          ftdSum: true,
        },
        orderBy: {
          _sum: {
            ftdCount: "desc",
          },
        },
        take: query.limit,
      });

      options = partnersData.map((partner) => ({
        label: `${partner.companyName || partner.partnerId} (${partner.partnerId})`,
        value: partner.partnerId,
        ftdCount: partner._sum.ftdCount || 0,
        ftdSum: Number(partner._sum.ftdSum) || 0,
      }));
    } else if (query.type === "campaigns") {
      // Get campaigns with aggregated FTD data
      const campaignsData = await prisma.playerData.groupBy({
        by: ["campaignId", "campaignName"],
        where: {
          ...(query.search && {
            OR: [
              { campaignId: { contains: query.search, mode: "insensitive" } },
              { campaignName: { contains: query.search, mode: "insensitive" } },
            ],
          }),
        },
        _sum: {
          ftdCount: true,
          ftdSum: true,
        },
        orderBy: {
          _sum: {
            ftdCount: "desc",
          },
        },
        take: query.limit,
      });

      options = campaignsData.map((campaign) => ({
        label: `${campaign.campaignName || campaign.campaignId} (${campaign.campaignId})`,
        value: campaign.campaignId,
        ftdCount: campaign._sum.ftdCount || 0,
        ftdSum: Number(campaign._sum.ftdSum) || 0,
      }));
    }

    return NextResponse.json({ options });
  } catch (error) {
    console.error("Failed to fetch filter options:", error);

    if (error instanceof Error && error.message === "Authentication required") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid query parameters", details: error.errors }, { status: 400 });
    }

    return NextResponse.json({ error: "Failed to fetch filter options" }, { status: 500 });
  }
}
