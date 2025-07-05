import "server-only";

import { prisma } from "../prisma";

import { auditLog, requireAuth, type AuthenticatedUser } from "./auth";

/**
 * Safe player data for client exposure
 */
export interface SafePlayerData {
  id: string;
  playerId: string;
  originalPlayerId: string;
  signUpDate: Date | null;
  firstDepositDate: Date | null;
  partnerId: string;
  companyName: string;
  // partnersEmail: REMOVED from database schema
  partnerTags: string | null;
  campaignId: string;
  campaignName: string | null;
  promoId: string | null;
  promoCode: string | null;
  playerCountry: string | null;
  tagClickid: string | null;
  tagOs: string | null;
  tagSource: string | null;
  tagSub2: string | null;
  tagWebId: string | null;
  date: Date;
  prequalified: boolean;
  duplicate: boolean;
  selfExcluded: boolean;
  disabled: boolean;
  currency: string;
  ftdCount: number;
  ftdSum: number;
  depositsCount: number;
  depositsSum: number;
  cashoutsCount: number;
  cashoutsSum: number;
  casinoBetsCount: number;
  casinoRealNgr: number;
  fixedPerPlayer: number;
  casinoBetsSum: number;
  casinoWinsSum: number;
  createdAt: Date;
}

export interface PlayerFilters {
  search?: string;
  playerCountry?: string;
  partnerId?: string;
  campaignId?: string;
  currency?: string;
  startDate?: Date;
  endDate?: Date;
  prequalified?: boolean;
  duplicate?: boolean;
  selfExcluded?: boolean;
  disabled?: boolean;
}

/**
 * Get players with filtering and pagination
 */
export async function getPlayers(
  page = 1,
  limit = 50,
  filters: PlayerFilters = {},
): Promise<{
  players: SafePlayerData[];
  totalCount: number;
  currentUser: AuthenticatedUser;
}> {
  const currentUser = await requireAuth();

  const where: {
    OR?: {
      playerId?: { contains: string; mode: "insensitive" };
      originalPlayerId?: { contains: string; mode: "insensitive" };
      companyName?: { contains: string; mode: "insensitive" };
      // partnersEmail removed from database
    }[];
    playerCountry?: string;
    partnerId?: string;
    campaignId?: string;
    currency?: string;
    prequalified?: boolean;
    duplicate?: boolean;
    selfExcluded?: boolean;
    disabled?: boolean;
    date?: {
      gte?: Date;
      lte?: Date;
    };
  } = {};

  // Apply filters
  if (filters.search) {
    where.OR = [
      { playerId: { contains: filters.search, mode: "insensitive" } },
      { originalPlayerId: { contains: filters.search, mode: "insensitive" } },
      { companyName: { contains: filters.search, mode: "insensitive" } },
      // partnersEmail search removed - field no longer exists
    ];
  }

  if (filters.playerCountry) {
    where.playerCountry = filters.playerCountry;
  }

  if (filters.partnerId) {
    where.partnerId = filters.partnerId;
  }

  if (filters.campaignId) {
    where.campaignId = filters.campaignId;
  }

  if (filters.currency) {
    where.currency = filters.currency;
  }

  if (filters.prequalified !== undefined) {
    where.prequalified = filters.prequalified;
  }

  if (filters.duplicate !== undefined) {
    where.duplicate = filters.duplicate;
  }

  if (filters.selfExcluded !== undefined) {
    where.selfExcluded = filters.selfExcluded;
  }

  if (filters.disabled !== undefined) {
    where.disabled = filters.disabled;
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

  const [players, totalCount] = await Promise.all([
    prisma.playerData.findMany({
      where,
      select: {
        id: true,
        playerId: true,
        originalPlayerId: true,
        signUpDate: true,
        firstDepositDate: true,
        partnerId: true,
        companyName: true,
        // partnersEmail: removed from database
        partnerTags: true,
        campaignId: true,
        campaignName: true,
        promoId: true,
        promoCode: true,
        playerCountry: true,
        tagClickid: true,
        tagOs: true,
        tagSource: true,
        tagSub2: true,
        tagWebId: true,
        date: true,
        prequalified: true,
        duplicate: true,
        selfExcluded: true,
        disabled: true,
        currency: true,
        ftdCount: true,
        ftdSum: true,
        depositsCount: true,
        depositsSum: true,
        cashoutsCount: true,
        cashoutsSum: true,
        casinoBetsCount: true,
        casinoRealNgr: true,
        fixedPerPlayer: true,
        casinoBetsSum: true,
        casinoWinsSum: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.playerData.count({ where }),
  ]);

  // Convert Decimal to number for client
  const playersFormatted = players.map((player) => ({
    ...player,
    ftdSum: Number(player.ftdSum),
    depositsSum: Number(player.depositsSum),
    cashoutsSum: Number(player.cashoutsSum),
    casinoRealNgr: Number(player.casinoRealNgr),
    fixedPerPlayer: Number(player.fixedPerPlayer),
    casinoBetsSum: Number(player.casinoBetsSum),
    casinoWinsSum: Number(player.casinoWinsSum),
  }));

  auditLog("players.list", currentUser.id, { page, limit, filters });

  return { players: playersFormatted, totalCount, currentUser };
}

/**
 * Get player by ID
 */
export async function getPlayerById(playerId: string): Promise<SafePlayerData | null> {
  const currentUser = await requireAuth();

  const player = await prisma.playerData.findUnique({
    where: { id: playerId },
    select: {
      id: true,
      playerId: true,
      originalPlayerId: true,
      signUpDate: true,
      firstDepositDate: true,
      partnerId: true,
      companyName: true,
      // partnersEmail: removed from database
      partnerTags: true,
      campaignId: true,
      campaignName: true,
      promoId: true,
      promoCode: true,
      playerCountry: true,
      tagClickid: true,
      tagOs: true,
      tagSource: true,
      tagSub2: true,
      tagWebId: true,
      date: true,
      prequalified: true,
      duplicate: true,
      selfExcluded: true,
      disabled: true,
      currency: true,
      ftdCount: true,
      ftdSum: true,
      depositsCount: true,
      depositsSum: true,
      cashoutsCount: true,
      cashoutsSum: true,
      casinoBetsCount: true,
      casinoRealNgr: true,
      fixedPerPlayer: true,
      casinoBetsSum: true,
      casinoWinsSum: true,
      createdAt: true,
    },
  });

  if (!player) {
    return null;
  }

  // Convert Decimal to number for client
  const playerFormatted = {
    ...player,
    ftdSum: Number(player.ftdSum),
    depositsSum: Number(player.depositsSum),
    cashoutsSum: Number(player.cashoutsSum),
    casinoRealNgr: Number(player.casinoRealNgr),
    fixedPerPlayer: Number(player.fixedPerPlayer),
    casinoBetsSum: Number(player.casinoBetsSum),
    casinoWinsSum: Number(player.casinoWinsSum),
  };

  auditLog("players.view", currentUser.id, { playerId });

  return playerFormatted;
}

/**
 * Get player statistics summary
 */
export async function getPlayerStats(): Promise<{
  totalPlayers: number;
  activePlayersLastMonth: number;
  totalFtdSum: number;
  totalDepositsSum: number;
  totalCashoutsSum: number;
  averageFtdSum: number;
  topCountries: { country: string; count: number }[];
  topPartners: { partnerId: string; companyName: string; count: number }[];
  currentUser: AuthenticatedUser;
}> {
  const currentUser = await requireAuth();

  const lastMonth = new Date();
  lastMonth.setMonth(lastMonth.getMonth() - 1);

  const [totalPlayers, activePlayersLastMonth, financialStats, topCountries, topPartners] = await Promise.all([
    prisma.playerData.count(),
    prisma.playerData.count({
      where: {
        date: {
          gte: lastMonth,
        },
      },
    }),
    prisma.playerData.aggregate({
      _sum: {
        ftdSum: true,
        depositsSum: true,
        cashoutsSum: true,
      },
      _avg: { ftdSum: true },
    }),
    prisma.playerData.groupBy({
      by: ["playerCountry"],
      _count: { playerCountry: true },
      where: {
        playerCountry: { not: null },
      },
      orderBy: { _count: { playerCountry: "desc" } },
      take: 10,
    }),
    prisma.playerData.groupBy({
      by: ["partnerId", "companyName"],
      _count: { partnerId: true },
      orderBy: { _count: { partnerId: "desc" } },
      take: 10,
    }),
  ]);

  auditLog("players.stats", currentUser.id);

  return {
    totalPlayers,
    activePlayersLastMonth,
    totalFtdSum: Number(financialStats._sum.ftdSum ?? 0),
    totalDepositsSum: Number(financialStats._sum.depositsSum ?? 0),
    totalCashoutsSum: Number(financialStats._sum.cashoutsSum ?? 0),
    averageFtdSum: Number(financialStats._avg.ftdSum ?? 0),
    topCountries: topCountries.map((item) => ({
      country: item.playerCountry ?? "Unknown",
      count: item._count.playerCountry,
    })),
    topPartners: topPartners.map((item) => ({
      partnerId: item.partnerId,
      companyName: item.companyName,
      count: item._count.partnerId,
    })),
    currentUser,
  };
}

/**
 * Bulk create player data (for CSV imports)
 * Note: partnersEmail is excluded during CSV processing for data privacy
 */
export async function createPlayersFromImport(
  playersData: {
    playerId: string;
    originalPlayerId: string;
    signUpDate?: Date;
    firstDepositDate?: Date;
    partnerId: string;
    companyName: string;
    // partnersEmail: EXCLUDED during CSV import for privacy
    partnerTags?: string;
    campaignId: string;
    campaignName?: string;
    promoId?: string;
    promoCode?: string;
    playerCountry?: string;
    tagClickid?: string;
    tagOs?: string;
    tagSource?: string;
    tagSub2?: string;
    tagWebId?: string;
    date: Date;
    prequalified?: boolean;
    duplicate?: boolean;
    selfExcluded?: boolean;
    disabled?: boolean;
    currency: string;
    ftdCount?: number;
    ftdSum?: number;
    depositsCount?: number;
    depositsSum?: number;
    cashoutsCount?: number;
    cashoutsSum?: number;
    casinoBetsCount?: number;
    casinoRealNgr?: number;
    fixedPerPlayer?: number;
    casinoBetsSum?: number;
    casinoWinsSum?: number;
  }[],
): Promise<{ count: number }> {
  const currentUser = await requireAuth();

  // No need to transform data - partnersEmail field doesn't exist in schema
  const result = await prisma.playerData.createMany({
    data: playersData,
    skipDuplicates: true,
  });

  auditLog("players.bulk_import", currentUser.id, {
    importedCount: result.count,
    totalRecords: playersData.length,
    note: "partnersEmail field not stored in database",
  });

  return { count: result.count };
}
