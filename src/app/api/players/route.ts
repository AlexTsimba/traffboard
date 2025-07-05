import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";

import { getPlayers, getPlayerStats } from "@/lib/data/players";

const querySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? Number.parseInt(val, 10) : 1)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? Number.parseInt(val, 10) : 50)),
  search: z.string().optional(),
  country: z.string().optional(),
  status: z.string().optional(),
  startDate: z
    .string()
    .optional()
    .transform((val) => (val ? new Date(val) : undefined)),
  endDate: z
    .string()
    .optional()
    .transform((val) => (val ? new Date(val) : undefined)),
  stats: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = querySchema.parse(Object.fromEntries(searchParams));

    // If stats requested, return statistics
    if (query.stats === "true") {
      const stats = await getPlayerStats();
      return NextResponse.json(stats);
    }

    // Otherwise return player list
    const filters = {
      search: query.search,
      country: query.country,
      status: query.status,
      startDate: query.startDate,
      endDate: query.endDate,
    };

    const { players, totalCount } = await getPlayers(query.page, query.limit, filters);

    return NextResponse.json({
      players,
      pagination: {
        page: query.page,
        limit: query.limit,
        total: totalCount,
        pages: Math.ceil(totalCount / query.limit),
      },
    });
  } catch (error) {
    console.error("Failed to fetch players:", error);

    if (error instanceof Error && error.message === "Authentication required") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid query parameters", details: error.errors }, { status: 400 });
    }

    return NextResponse.json({ error: "Failed to fetch players" }, { status: 500 });
  }
}
