import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";

import { auth } from "../../../../auth";

const trafficFiltersSchema = z.object({
  foreignPartnerId: z.union([z.string(), z.array(z.string())]).optional(),
  foreignCampaignId: z.union([z.string(), z.array(z.string())]).optional(),
  trafficSource: z.union([z.string(), z.array(z.string())]).optional(),
  deviceType: z.union([z.string(), z.array(z.string())]).optional(),
  country: z.union([z.string(), z.array(z.string())]).optional(),
  date: z
    .object({
      from: z.string().optional(),
      to: z.string().optional(),
    })
    .optional(),
});

type TrafficFilters = z.infer<typeof trafficFiltersSchema>;

function buildWhereClause(filters: TrafficFilters): Record<string, unknown> {
  const whereClause: Record<string, unknown> = {};
  const filterMappings: (keyof TrafficFilters)[] = [
    "foreignPartnerId",
    "foreignCampaignId",
    "trafficSource",
    "deviceType",
    "country",
  ];

  for (const key of filterMappings) {
    // eslint-disable-next-line security/detect-object-injection
    const value = filters[key];
    if (value) {
      // eslint-disable-next-line security/detect-object-injection
      whereClause[key] = { in: Array.isArray(value) ? value : [value] };
    }
  }

  if (filters.date) {
    const { from, to } = filters.date;
    whereClause.date = {
      ...(from && { gte: new Date(from) }),
      ...(to && { lte: new Date(to) }),
    };
  }
  return whereClause;
}

// POST /api/traffic
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const page = request.nextUrl.searchParams.get("page") ?? "1";
    const limit = request.nextUrl.searchParams.get("limit") ?? "10";
    const pageNumber = Number.parseInt(page, 10);
    const limitNumber = Number.parseInt(limit, 10);
    const offset = (pageNumber - 1) * limitNumber;

    const body: unknown = await request.json();
    const filters = trafficFiltersSchema.parse(body);
    const whereClause = buildWhereClause(filters);

    const traffic = await prisma.trafficReport.findMany({
      where: whereClause,
      skip: offset,
      take: limitNumber,
      orderBy: {
        date: "desc",
      },
    });

    const totalRecords = await prisma.trafficReport.count({ where: whereClause });

    return NextResponse.json({
      data: traffic,
      total: totalRecords,
      page: pageNumber,
      limit: limitNumber,
      totalPages: Math.ceil(totalRecords / limitNumber),
    });
  } catch (error) {
    console.error("Failed to fetch traffic data:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to fetch traffic data" }, { status: 500 });
  }
}
