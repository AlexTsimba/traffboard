import type { PlayerDataRow, TrafficReportRow } from "./csv-parser";
import {
  parseCSV,
  safeParseBoolean,
  safeParseDate,
  safeParseDecimal,
  safeParseNumber,
  validatePlayerDataRow,
  validateTrafficReportRow,
} from "./csv-parser";

export interface TransformedPlayerData {
  playerId: string;
  originalPlayerId: string;
  signUpDate: Date | undefined | null;
  firstDepositDate: Date | undefined | null;
  partnerId: string;
  companyName: string;
  partnersEmail: string | null;
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
}

export interface TransformedTrafficData {
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
  cr: number;
  cftd: number;
  cd: number;
  rftd: number;
}

export function transformPlayerData(row: PlayerDataRow): TransformedPlayerData {
  return {
    playerId: row["Player ID"],
    originalPlayerId: row["Original player ID"],
    signUpDate: safeParseDate(row["Sign up date"]),
    firstDepositDate: safeParseDate(row["First deposit date"]),
    partnerId: row["Partner ID"],
    companyName: row["Company name"],
    partnersEmail: row["Partners email"] || null,
    partnerTags: row["Partner tags"] || null,
    campaignId: row["Campaign ID"],
    campaignName: row["Campaign name"] || null,
    promoId: row["Promo ID"] || null,
    promoCode: row["Promo code"] || null,
    playerCountry: row["Player country"] || null,
    tagClickid: row["Tag: clickid"] || null,
    tagOs: row["Tag: os"] || null,
    tagSource: row["Tag: source"] || null,
    tagSub2: row["Tag: sub2"] || null,
    tagWebId: row["Tag: webID"] || null,
    date: safeParseDate(row.Date) ?? new Date(),
    prequalified: safeParseBoolean(row.Prequalified),
    duplicate: safeParseBoolean(row.Duplicate),
    selfExcluded: safeParseBoolean(row["Self-excluded"]),
    disabled: safeParseBoolean(row.Disabled),
    currency: row.Currency,
    ftdCount: safeParseNumber(row["FTD count"]),
    ftdSum: safeParseDecimal(row["FTD sum"]),
    depositsCount: safeParseNumber(row["Deposits count"]),
    depositsSum: safeParseDecimal(row["Deposits sum"]),
    cashoutsCount: safeParseNumber(row["Cashouts count"]),
    cashoutsSum: safeParseDecimal(row["Cashouts sum"]),
    casinoBetsCount: safeParseNumber(row["Casino bets count"]),
    casinoRealNgr: safeParseDecimal(row["Casino Real NGR"]),
    fixedPerPlayer: safeParseDecimal(row["Fixed per player"]),
    casinoBetsSum: safeParseDecimal(row["Casino bets sum"]),
    casinoWinsSum: safeParseDecimal(row["Casino wins sum"]),
  };
}

export function transformTrafficData(row: TrafficReportRow): TransformedTrafficData {
  return {
    date: safeParseDate(row.date) ?? new Date(),
    foreignBrandId: row.foreign_brand_id,
    foreignPartnerId: row.foreign_partner_id,
    foreignCampaignId: row.foreign_campaign_id,
    foreignLandingId: row.foreign_landing_id || null,
    trafficSource: row.traffic_source,
    deviceType: row.device_type,
    userAgentFamily: row.user_agent_family || null,
    osFamily: row.os_family || null,
    country: row.country,
    allClicks: safeParseNumber(row.all_clicks),
    uniqueClicks: safeParseNumber(row.unique_clicks),
    registrationsCount: safeParseNumber(row.registrations_count),
    ftdCount: safeParseNumber(row.ftd_count),
    depositsCount: safeParseNumber(row.deposits_count),
    cr: safeParseDecimal(row.cr),
    cftd: safeParseDecimal(row.cftd),
    cd: safeParseDecimal(row.cd),
    rftd: safeParseDecimal(row.rftd),
  };
}

export interface DataProcessingResult<T> {
  success: boolean;
  processedCount: number;
  errorCount: number;
  errors: string[];
  data: T[];
}

export function processPlayerDataCSV(csvContent: string): DataProcessingResult<TransformedPlayerData> {
  const parseResult = parseCSV<PlayerDataRow>(csvContent);
  const errors: string[] = [...parseResult.errors];
  const validData: TransformedPlayerData[] = [];

  for (const [index, row] of parseResult.data.entries()) {
    const validationErrors = validatePlayerDataRow(row, index + 1);
    if (validationErrors.length > 0) {
      errors.push(...validationErrors);
    } else {
      try {
        const transformed = transformPlayerData(row);
        validData.push(transformed);
      } catch (error) {
        errors.push(
          `Row ${index + 1}: Transformation error - ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }
  }

  return {
    success: errors.length === 0,
    processedCount: validData.length,
    errorCount: errors.length,
    errors,
    data: validData,
  };
}

export function processTrafficDataCSV(csvContent: string): DataProcessingResult<TransformedTrafficData> {
  const parseResult = parseCSV<TrafficReportRow>(csvContent);
  const errors: string[] = [...parseResult.errors];
  const validData: TransformedTrafficData[] = [];

  for (const [index, row] of parseResult.data.entries()) {
    const validationErrors = validateTrafficReportRow(row, index + 1);
    if (validationErrors.length > 0) {
      errors.push(...validationErrors);
    } else {
      try {
        const transformed = transformTrafficData(row);
        validData.push(transformed);
      } catch (error) {
        errors.push(
          `Row ${index + 1}: Transformation error - ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }
  }

  return {
    success: errors.length === 0,
    processedCount: validData.length,
    errorCount: errors.length,
    errors,
    data: validData,
  };
}
