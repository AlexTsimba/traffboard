import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../auth";
import { prisma } from "@/lib/prisma";

// GET /api/traffic - Get traffic report data with filtering and pagination
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
    const trafficSource = searchParams.get("trafficSource");
    const deviceType = searchParams.get("deviceType");
    const country = searchParams.get("country");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    if (partnerId) where.foreignPartnerId = partnerId;
    if (campaignId) where.foreignCampaignId = campaignId;
    if (trafficSource) where.trafficSource = trafficSource;
    if (deviceType) where.deviceType = deviceType;
    if (country) where.country = country;
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    const [traffic, total] = await Promise.all([
      prisma.trafficReport.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date: "desc" },
      }),
      prisma.trafficReport.count({ where }),
    ]);

    return NextResponse.json({
      traffic,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Failed to fetch traffic data:", error);
    return NextResponse.json(
      { error: "Failed to fetch traffic data" },
      { status: 500 }
    );
  }
}

// POST /api/traffic - Bulk create traffic data (for CSV processing)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { traffic } = await request.json();

    if (!Array.isArray(traffic) || traffic.length === 0) {
      return NextResponse.json(
        { error: "Invalid data: traffic array required" },
        { status: 400 }
      );
    }

    // Limit batch size to prevent overwhelming the database
    if (traffic.length > 1000) {
      return NextResponse.json(
        { error: "Batch size too large. Maximum 1000 records per request" },
        { status: 400 }
      );
    }

    const result = await prisma.trafficReport.createMany({
      data: traffic,
      skipDuplicates: true,
    });

    return NextResponse.json({
      success: true,
      created: result.count,
      total: traffic.length,
    });
  } catch (error) {
    console.error("Failed to create traffic data:", error);
    return NextResponse.json(
      { error: "Failed to create traffic data" },
      { status: 500 }
    );
  }
}