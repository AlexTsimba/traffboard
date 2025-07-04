import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../auth";
import { prisma } from "@/lib/prisma";

// GET /api/players - Get player data with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const partnerId = searchParams.get("partnerId");
    const campaignId = searchParams.get("campaignId");
    const country = searchParams.get("country");
    const currency = searchParams.get("currency");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    if (partnerId) where.partnerId = partnerId;
    if (campaignId) where.campaignId = campaignId;
    if (country) where.playerCountry = country;
    if (currency) where.currency = currency;
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    const [players, total] = await Promise.all([
      prisma.playerData.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date: "desc" },
      }),
      prisma.playerData.count({ where }),
    ]);

    return NextResponse.json({
      players,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Failed to fetch player data:", error);
    return NextResponse.json(
      { error: "Failed to fetch player data" },
      { status: 500 }
    );
  }
}

// POST /api/players - Bulk create player data (for CSV processing)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { players } = await request.json();

    if (!Array.isArray(players) || players.length === 0) {
      return NextResponse.json(
        { error: "Invalid data: players array required" },
        { status: 400 }
      );
    }

    // Limit batch size to prevent overwhelming the database
    if (players.length > 1000) {
      return NextResponse.json(
        { error: "Batch size too large. Maximum 1000 records per request" },
        { status: 400 }
      );
    }

    const result = await prisma.playerData.createMany({
      data: players,
      skipDuplicates: true,
    });

    return NextResponse.json({
      success: true,
      created: result.count,
      total: players.length,
    });
  } catch (error) {
    console.error("Failed to create player data:", error);
    return NextResponse.json(
      { error: "Failed to create player data" },
      { status: 500 }
    );
  }
}