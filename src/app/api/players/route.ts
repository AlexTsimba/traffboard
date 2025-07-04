import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";

import { auth } from "../../../../auth";

const playerFiltersSchema = z.object({
  partnerId: z.union([z.string(), z.array(z.string())]).optional(),
  campaignId: z.union([z.string(), z.array(z.string())]).optional(),
  playerCountry: z.union([z.string(), z.array(z.string())]).optional(),
  currency: z.union([z.string(), z.array(z.string())]).optional(),
  date: z
    .object({
      from: z.string().optional(),
      to: z.string().optional(),
    })
    .optional(),
});

type PlayerFilters = z.infer<typeof playerFiltersSchema>;

function buildWhereClause(filters: PlayerFilters) {
  const whereClause: Record<string, unknown> = {};

  if (filters.partnerId) {
    whereClause.partnerId = {
      in: Array.isArray(filters.partnerId) ? filters.partnerId : [filters.partnerId],
    };
  }
  if (filters.campaignId) {
    whereClause.campaignId = {
      in: Array.isArray(filters.campaignId) ? filters.campaignId : [filters.campaignId],
    };
  }
  if (filters.playerCountry) {
    whereClause.playerCountry = {
      in: Array.isArray(filters.playerCountry) ? filters.playerCountry : [filters.playerCountry],
    };
  }
  if (filters.currency) {
    whereClause.currency = {
      in: Array.isArray(filters.currency) ? filters.currency : [filters.currency],
    };
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

// GET /api/players
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
    const filters = playerFiltersSchema.parse(body);
    const whereClause = buildWhereClause(filters);

    const players = await prisma.playerData.findMany({
      where: whereClause,
      skip: offset,
      take: limitNumber,
      orderBy: {
        date: "desc",
      },
    });

    const totalRecords = await prisma.playerData.count({ where: whereClause });

    return NextResponse.json({
      data: players,
      total: totalRecords,
      page: pageNumber,
      limit: limitNumber,
      totalPages: Math.ceil(totalRecords / limitNumber),
    });
  } catch (error) {
    console.error("Failed to fetch players:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to fetch players" }, { status: 500 });
  }
}
