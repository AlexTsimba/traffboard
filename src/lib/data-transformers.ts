import { PlayerDataRow, TrafficReportRow, safeParseDate, safeParseNumber, safeParseDecimal, safeParseBoolean } from "./csv-parser";

export interface TransformedPlayerData {
  playerId: string;
  originalPlayerId: string;
  signUpDate: Date | null;
  firstDepositDate: Date | null;
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
    playerId: row["Player ID"]?.trim() || "",
    originalPlayerId: row["Original player ID"]?.trim() || "",
    signUpDate: safeParseDate(row["Sign up date"]),
    firstDepositDate: safeParseDate(row["First deposit date"]),
    partnerId: row["Partner ID"]?.trim() || "",
    companyName: row["Company name"]?.trim() || "",
    partnersEmail: row["Partners email"]?.trim() || null,
    partnerTags: row["Partner tags"]?.trim() || null,
    campaignId: row["Campaign ID"]?.trim() || "",
    campaignName: row["Campaign name"]?.trim() || null,
    promoId: row["Promo ID"]?.trim() || null,
    promoCode: row["Promo code"]?.trim() || null,
    playerCountry: row["Player country"]?.trim() || null,
    tagClickid: row["Tag: clickid"]?.trim() || null,
    tagOs: row["Tag: os"]?.trim() || null,
    tagSource: row["Tag: source"]?.trim() || null,
    tagSub2: row["Tag: sub2"]?.trim() || null,
    tagWebId: row["Tag: webID"]?.trim() || null,
    date: safeParseDate(row["Date"]) || new Date(),
    prequalified: safeParseBoolean(row["Prequalified"]),
    duplicate: safeParseBoolean(row["Duplicate"]),
    selfExcluded: safeParseBoolean(row["Self-excluded"]),
    disabled: safeParseBoolean(row["Disabled"]),
    currency: row["Currency"]?.trim() || "",
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
    date: safeParseDate(row.date) || new Date(),
    foreignBrandId: row.foreign_brand_id?.trim() || "",
    foreignPartnerId: row.foreign_partner_id?.trim() || "",
    foreignCampaignId: row.foreign_campaign_id?.trim() || "",
    foreignLandingId: row.foreign_landing_id?.trim() || null,
    trafficSource: row.traffic_source?.trim() || "",
    deviceType: row.device_type?.trim() || "",
    userAgentFamily: row.user_agent_family?.trim() || null,
    osFamily: row.os_family?.trim() || null,
    country: row.country?.trim() || "",
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

  parseResult.data.forEach((row, index) => {
    const validationErrors = validatePlayerDataRow(row, index + 1);
    if (validationErrors.length > 0) {
      errors.push(...validationErrors);
    } else {
      try {
        const transformed = transformPlayerData(row);
        validData.push(transformed);
      } catch (error) {
        errors.push(`Row ${index + 1}: Transformation error - ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  });

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

  parseResult.data.forEach((row, index) => {
    const validationErrors = validateTrafficReportRow(row, index + 1);
    if (validationErrors.length > 0) {
      errors.push(...validationErrors);
    } else {
      try {
        const transformed = transformTrafficData(row);
        validData.push(transformed);
      } catch (error) {
        errors.push(`Row ${index + 1}: Transformation error - ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  });

  return {
    success: errors.length === 0,
    processedCount: validData.length,
    errorCount: errors.length,
    errors,
    data: validData,
  };
}

// Import missing functions
import { parseCSV, validatePlayerDataRow, validateTrafficReportRow } from "./csv-parser";