import "server-only";

import { prisma } from "../prisma";

import { auditLog, requireAuth, type AuthenticatedUser } from "./auth";

/**
 * Safe conversion data for client exposure
 */
export interface SafeConversionData {
  id: string;
  date: Date;
  foreignBrandId: string;
  foreignPartnerId: string;
  foreignCampaignId: string;
  foreignLandingId: string | null;
  trafficSource: string;
  deviceType: string;
  userAgentFamily: string | null;
  osFamily: string | null;
  country: string;
  allClicks: number;
  uniqueClicks: number;
  registrationsCount: number;
  ftdCount: number;
  depositsCount: number;
  // Conversion rate fields REMOVED from database:
  // cr, cftd, cd, rftd - calculated when needed, not stored
  createdAt: Date;
}

export interface ConversionFilters {
  search?: string;
  foreignPartnerId?: string;
  foreignCampaignId?: string;
  foreignBrandId?: string;
  trafficSource?: string;
  deviceType?: string;
  country?: string;
  startDate?: Date;
  endDate?: Date;
}

/**
 * Get conversion reports with filtering and pagination
 */
export async function getConversions(
  page = 1,
  limit = 50,
  filters: ConversionFilters = {},
): Promise<{
  conversions: SafeConversionData[];
  totalCount: number;
  currentUser: AuthenticatedUser;
}> {
  const currentUser = await requireAuth();

  const where: {
    OR?: {
      foreignPartnerId?: { contains: string; mode: "insensitive" };
      foreignCampaignId?: { contains: string; mode: "insensitive" };
      foreignBrandId?: { contains: string; mode: "insensitive" };
      trafficSource?: { contains: string; mode: "insensitive" };
    }[];
    foreignPartnerId?: string;
    foreignCampaignId?: string;
    foreignBrandId?: string;
    trafficSource?: string;
    deviceType?: string;
    country?: string;
    date?: {
      gte?: Date;
      lte?: Date;
    };
  } = {};

  // Apply filters
  if (filters.search) {
    where.OR = [
      { foreignPartnerId: { contains: filters.search, mode: "insensitive" } },
      { foreignCampaignId: { contains: filters.search, mode: "insensitive" } },
      { foreignBrandId: { contains: filters.search, mode: "insensitive" } },
      { trafficSource: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  if (filters.foreignPartnerId) {
    where.foreignPartnerId = filters.foreignPartnerId;
  }

  if (filters.foreignCampaignId) {
    where.foreignCampaignId = filters.foreignCampaignId;
  }

  if (filters.foreignBrandId) {
    where.foreignBrandId = filters.foreignBrandId;
  }

  if (filters.trafficSource) {
    where.trafficSource = filters.trafficSource;
  }

  if (filters.deviceType) {
    where.deviceType = filters.deviceType;
  }

  if (filters.country) {
    where.country = filters.country;
  }

  if (filters.startDate || filters.endDate) {
    where.date = {};
    if (filters.startDate) {
      where.date.gte = filters.startDate;
    }
    if (filters.endDate) {
      where.date.lte = filters.endDate;
    }
  }

  const [conversions, totalCount] = await Promise.all([
    prisma.conversion.findMany({
      where,
      select: {
        id: true,
        date: true,
        foreignBrandId: true,
        foreignPartnerId: true,
        foreignCampaignId: true,
        foreignLandingId: true,
        trafficSource: true,
        deviceType: true,
        userAgentFamily: true,
        osFamily: true,
        country: true,
        allClicks: true,
        uniqueClicks: true,
        registrationsCount: true,
        ftdCount: true,
        depositsCount: true,
        // Conversion rate fields removed from database:
        // cr: true, cftd: true, cd: true, rftd: true,
        createdAt: true,
      },
      orderBy: { date: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.conversion.count({ where }),
  ]);

  // Remove Decimal conversion since fields no longer exist
  const conversionsFormatted = conversions;

  void auditLog("conversions.list", currentUser.id, { page, limit, filters });

  return { conversions: conversionsFormatted, totalCount, currentUser };
}

/**
 * Get conversion report by ID
 */
export async function getConversionById(conversionId: string): Promise<SafeConversionData | null> {
  const currentUser = await requireAuth();

  const conversion = await prisma.conversion.findUnique({
    where: { id: conversionId },
    select: {
      id: true,
      date: true,
      foreignBrandId: true,
      foreignPartnerId: true,
      foreignCampaignId: true,
      foreignLandingId: true,
      trafficSource: true,
      deviceType: true,
      userAgentFamily: true,
      osFamily: true,
      country: true,
      allClicks: true,
      uniqueClicks: true,
      registrationsCount: true,
      ftdCount: true,
      depositsCount: true,
      // Conversion rate fields removed from database
      createdAt: true,
    },
  });

  if (!conversion) {
    return null;
  }

  // Remove Decimal conversion since fields no longer exist
  const conversionFormatted = conversion;

  void auditLog("conversions.view", currentUser.id, { conversionId });

  return conversionFormatted;
}

/**
 * Get conversion analytics summary
 */
export async function getConversionStats(): Promise<{
  totalAllClicks: number;
  totalUniqueClicks: number;
  totalRegistrations: number;
  totalFtds: number;
  totalDeposits: number;
  // Conversion rates removed - calculated dynamically when needed
  topPartners: { foreignPartnerId: string; allClicks: number; registrations: number }[];
  topCampaigns: { foreignCampaignId: string; allClicks: number; ftdCount: number }[];
  topCountries: { country: string; allClicks: number }[];
  topTrafficSources: { trafficSource: string; allClicks: number }[];
  topDeviceTypes: { deviceType: string; allClicks: number }[];
  currentUser: AuthenticatedUser;
}> {
  const currentUser = await requireAuth();

  const [aggregateStats, topPartners, topCampaigns, topCountries, topTrafficSources, topDeviceTypes] =
    await Promise.all([
      prisma.conversion.aggregate({
        _sum: {
          allClicks: true,
          uniqueClicks: true,
          registrationsCount: true,
          ftdCount: true,
          depositsCount: true,
        },
      }),
      // Removed conversionStats aggregate since cr, cftd, cd, rftd fields no longer exist
      prisma.conversion.groupBy({
        by: ["foreignPartnerId"],
        _sum: {
          allClicks: true,
          registrationsCount: true,
        },
        orderBy: { _sum: { allClicks: "desc" } },
        take: 10,
      }),
      prisma.conversion.groupBy({
        by: ["foreignCampaignId"],
        _sum: {
          allClicks: true,
          ftdCount: true,
        },
        orderBy: { _sum: { allClicks: "desc" } },
        take: 10,
      }),
      prisma.conversion.groupBy({
        by: ["country"],
        _sum: { allClicks: true },
        orderBy: { _sum: { allClicks: "desc" } },
        take: 10,
      }),
      prisma.conversion.groupBy({
        by: ["trafficSource"],
        _sum: { allClicks: true },
        orderBy: { _sum: { allClicks: "desc" } },
        take: 10,
      }),
      prisma.conversion.groupBy({
        by: ["deviceType"],
        _sum: { allClicks: true },
        orderBy: { _sum: { allClicks: "desc" } },
        take: 10,
      }),
    ]);

  void auditLog("conversions.stats", currentUser.id);

  return {
    totalAllClicks: aggregateStats._sum.allClicks ?? 0,
    totalUniqueClicks: aggregateStats._sum.uniqueClicks ?? 0,
    totalRegistrations: aggregateStats._sum.registrationsCount ?? 0,
    totalFtds: aggregateStats._sum.ftdCount ?? 0,
    totalDeposits: aggregateStats._sum.depositsCount ?? 0,
    // Conversion rate averages removed - fields no longer exist in database
    topPartners: topPartners.map((item) => ({
      foreignPartnerId: item.foreignPartnerId,
      allClicks: item._sum.allClicks ?? 0,
      registrations: item._sum.registrationsCount ?? 0,
    })),
    topCampaigns: topCampaigns.map((item) => ({
      foreignCampaignId: item.foreignCampaignId,
      allClicks: item._sum.allClicks ?? 0,
      ftdCount: item._sum.ftdCount ?? 0,
    })),
    topCountries: topCountries.map((item) => ({
      country: item.country,
      allClicks: item._sum.allClicks ?? 0,
    })),
    topTrafficSources: topTrafficSources.map((item) => ({
      trafficSource: item.trafficSource,
      allClicks: item._sum.allClicks ?? 0,
    })),
    topDeviceTypes: topDeviceTypes.map((item) => ({
      deviceType: item.deviceType,
      allClicks: item._sum.allClicks ?? 0,
    })),
    currentUser,
  };
}

/**
 * Bulk create conversion data (for CSV imports) with replace strategy for deduplication
 * Note: Conversion rate fields (cr, cftd, cd, rftd) are excluded during CSV processing
 * and will use schema default values (0.00)
 */
export async function createConversionsFromImport(
  conversionData: {
    date: Date;
    foreignBrandId: string;
    foreignPartnerId: string;
    foreignCampaignId: string;
    foreignLandingId?: string;
    trafficSource: string;
    deviceType: string;
    userAgentFamily?: string;
    osFamily?: string;
    country: string;
    allClicks?: number;
    uniqueClicks?: number;
    registrationsCount?: number;
    ftdCount?: number;
    depositsCount?: number;
    // Conversion rate fields EXCLUDED during CSV import:
    // cr, cftd, cd, rftd - will use schema defaults (0.00)
  }[],
): Promise<{ count: number }> {
  const currentUser = await requireAuth();

  // Use upsert to replace existing records (deduplication strategy)
  let processedCount = 0;
  const batchSize = 500;

  for (let i = 0; i < conversionData.length; i += batchSize) {
    const batch = conversionData.slice(i, i + batchSize);

    for (const conversionRecord of batch) {
      await prisma.conversion.upsert({
        where: {
          conversion_unique: {
            date: conversionRecord.date,
            foreignBrandId: conversionRecord.foreignBrandId,
            foreignPartnerId: conversionRecord.foreignPartnerId,
            foreignCampaignId: conversionRecord.foreignCampaignId,
            trafficSource: conversionRecord.trafficSource,
            deviceType: conversionRecord.deviceType,
            country: conversionRecord.country,
          },
        },
        update: conversionRecord,
        create: conversionRecord,
      });
      processedCount++;
    }
  }

  void auditLog("conversions.bulk_import", currentUser.id, {
    importedCount: processedCount,
    totalRecords: conversionData.length,
    strategy: "replace",
    note: "conversion rate fields not stored in database",
  });

  return { count: processedCount };
}
