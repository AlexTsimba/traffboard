import Papa from "papaparse";

export interface CSVParseResult<T> {
  success: boolean;
  data: T[];
  errors: string[];
  totalRows: number;
  validRows: number;
}

export interface PlayerDataRow {
  "Player ID": string;
  "Original player ID": string;
  "Sign up date": string;
  "First deposit date": string;
  "Partner ID": string;
  "Company name": string;
  "Partners email": string;
  "Partner tags": string;
  "Campaign ID": string;
  "Campaign name": string;
  "Promo ID": string;
  "Promo code": string;
  "Player country": string;
  "Tag: clickid": string;
  "Tag: os": string;
  "Tag: source": string;
  "Tag: sub2": string;
  "Tag: webID": string;
  Date: string;
  Prequalified: string;
  Duplicate: string;
  "Self-excluded": string;
  Disabled: string;
  Currency: string;
  "FTD count": string;
  "FTD sum": string;
  "Deposits count": string;
  "Deposits sum": string;
  "Cashouts count": string;
  "Cashouts sum": string;
  "Casino bets count": string;
  "Casino Real NGR": string;
  "Fixed per player": string;
  "Casino bets sum": string;
  "Casino wins sum": string;
}

export interface ConversionRow {
  date: string;
  foreign_brand_id: string;
  foreign_partner_id: string;
  foreign_campaign_id: string;
  foreign_landing_id: string;
  traffic_source: string;
  device_type: string;
  user_agent_family: string;
  os_family: string;
  country: string;
  all_clicks: string;
  unique_clicks: string;
  registrations_count: string;
  ftd_count: string;
  deposits_count: string;
  cr: string;
  cftd: string;
  cd: string;
  rftd: string;
}

export function parseCSV<T>(csvContent: string): CSVParseResult<T> {
  const errors: string[] = [];

  try {
    const result = Papa.parse<T>(csvContent, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header: string) => header.trim(),
      complete: (results) => {
        if (results.errors.length > 0) {
          errors.push(...results.errors.map((err) => `Row ${err.row}: ${err.message}`));
        }
      },
    });

    return {
      success: errors.length === 0,
      data: result.data,
      errors,
      totalRows: result.data.length,
      validRows: result.data.length - errors.length,
    };
  } catch (error) {
    return {
      success: false,
      data: [],
      errors: [error instanceof Error ? error.message : "Unknown parsing error"],
      totalRows: 0,
      validRows: 0,
    };
  }
}

export function validatePlayerDataRow(row: PlayerDataRow, rowIndex: number): string[] {
  const errors: string[] = [];

  // Required fields validation
  if (!row["Player ID"]) {
    errors.push(`Row ${rowIndex}: Player ID is required`);
  }

  if (!row["Partner ID"]) {
    errors.push(`Row ${rowIndex}: Partner ID is required`);
  }

  if (!row["Campaign ID"]) {
    errors.push(`Row ${rowIndex}: Campaign ID is required`);
  }

  if (!row.Date) {
    errors.push(`Row ${rowIndex}: Date is required`);
  }

  if (!row.Currency) {
    errors.push(`Row ${rowIndex}: Currency is required`);
  }

  // Date validation
  if (row.Date && !isValidDate(row.Date)) {
    errors.push(`Row ${rowIndex}: Invalid date format for Date field`);
  }

  if (row["Sign up date"] && !isValidDate(row["Sign up date"])) {
    errors.push(`Row ${rowIndex}: Invalid date format for Sign up date`);
  }

  if (row["First deposit date"] && !isValidDate(row["First deposit date"])) {
    errors.push(`Row ${rowIndex}: Invalid date format for First deposit date`);
  }

  // Numeric validation
  const numericFields = [
    "FTD count",
    "FTD sum",
    "Deposits count",
    "Deposits sum",
    "Cashouts count",
    "Cashouts sum",
    "Casino bets count",
    "Casino Real NGR",
    "Fixed per player",
    "Casino bets sum",
    "Casino wins sum",
  ];

  for (const field of numericFields) {
    if (row[field as keyof PlayerDataRow] && !isValidNumber(row[field as keyof PlayerDataRow])) {
      errors.push(`Row ${rowIndex}: Invalid number format for ${field}`);
    }
  }

  return errors;
}

export function validateConversionRow(row: ConversionRow, rowIndex: number): string[] {
  const errors: string[] = [];

  // Required fields validation
  if (!row.date) {
    errors.push(`Row ${rowIndex}: Date is required`);
  }

  if (!row.foreign_partner_id) {
    errors.push(`Row ${rowIndex}: Foreign partner ID is required`);
  }

  if (!row.foreign_campaign_id) {
    errors.push(`Row ${rowIndex}: Foreign campaign ID is required`);
  }

  // Traffic source can be empty in real data
  // if (!row.traffic_source) {
  //   errors.push(`Row ${rowIndex}: Traffic source is required`);
  // }

  if (!row.device_type) {
    errors.push(`Row ${rowIndex}: Device type is required`);
  }

  if (!row.country) {
    errors.push(`Row ${rowIndex}: Country is required`);
  }

  // Date validation
  if (row.date && !isValidDate(row.date)) {
    errors.push(`Row ${rowIndex}: Invalid date format`);
  }

  // Numeric validation
  const numericFields = [
    "all_clicks",
    "unique_clicks",
    "registrations_count",
    "ftd_count",
    "deposits_count",
    "cr",
    "cftd",
    "cd",
    "rftd",
  ];

  for (const field of numericFields) {
    if (row[field as keyof ConversionRow] && !isValidNumber(row[field as keyof ConversionRow])) {
      errors.push(`Row ${rowIndex}: Invalid number format for ${field}`);
    }
  }

  return errors;
}

function isValidDate(dateString: string): boolean {
  if (!dateString) return true; // Optional field
  const date = new Date(dateString);
  return !Number.isNaN(date.getTime());
}

function isValidNumber(value: string): boolean {
  if (!value) return true; // Optional field
  return !Number.isNaN(Number.parseFloat(value));
}

export function safeParseDate(dateString: string | undefined): Date | undefined {
  if (!dateString) return undefined;
  const date = new Date(dateString);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export function safeParseNumber(value: string | undefined): number {
  if (!value) return 0;
  const num = Number.parseInt(value, 10);
  return Number.isNaN(num) ? 0 : num;
}

export function safeParseDecimal(value: string | undefined): number {
  if (!value) return 0;
  const num = Number.parseFloat(value);
  return Number.isNaN(num) ? 0 : num;
}

export function safeParseBoolean(value: string | undefined): boolean {
  if (!value) return false;
  return value === "1" || value.toLowerCase() === "true";
}
