// Centralized validation rules and logic for CSV processing
// This provides type-safe validation with clear error handling

import { getMappedField, type DataType } from './field-mappings';

export interface ValidationError {
  row: number;
  column: string;
  value: string;
  error: string;
  severity: 'warning' | 'error';
}

type ValidationRule = (value: string) => boolean;

// Define which fields are nullable (allow empty values)
const NULLABLE_FIELDS: Record<DataType, string[]> = {
  traffic_report: ['trafficSource'], // Traffic source can be empty
  players_data: [
    'playerId', 'originalPlayerId', 'partnerId', 'campaignId', 'promoId',
    'prequalified', 'duplicate', 'selfExcluded', 'disabled',
    'ftdCount', 'depositsCount', 'cashoutsCount', 'casinoBetsCount',
    'signUpDate', 'firstDepositDate', 'date',
    'ftdSum', 'depositsSum', 'cashoutsSum', 'casinoRealNgr', 'fixedPerPlayer',
    'casinoBetsSum', 'casinoWinsSum',
    'tagClickid', 'tagOs', 'tagSource', 'tagSub2', 'tagWebId'
  ]
};

// Validation rules for each field type
const VALIDATION_RULES: Record<DataType, Record<string, ValidationRule>> = {
  traffic_report: {
    date: (val: string) => !isNaN(Date.parse(val)),
    foreignBrandId: (val: string) => /^\d+$/.test(val),
    foreignPartnerId: (val: string) => /^\d+$/.test(val),
    foreignCampaignId: (val: string) => /^\d+$/.test(val),
    foreignLandingId: (val: string) => /^\d+$/.test(val),
    deviceType: (val: string) => val.length > 0,
    userAgentFamily: (val: string) => val.length > 0,
    osFamily: (val: string) => val.length > 0,
    country: (val: string) => val.length > 0,
    allClicks: (val: string) => !isNaN(parseInt(val)) && parseInt(val) >= 0,
    uniqueClicks: (val: string) => !isNaN(parseInt(val)) && parseInt(val) >= 0,
    registrationsCount: (val: string) => !isNaN(parseInt(val)) && parseInt(val) >= 0,
    ftdCount: (val: string) => !isNaN(parseInt(val)) && parseInt(val) >= 0,
    depositsCount: (val: string) => !isNaN(parseInt(val)) && parseInt(val) >= 0
  },
  
  players_data: {
    playerId: (val: string) => /^\d+$/.test(val),
    originalPlayerId: (val: string) => /^\d+$/.test(val),
    signUpDate: (val: string) => !isNaN(Date.parse(val)),
    partnerId: (val: string) => /^\d+$/.test(val),
    companyName: (val: string) => val.length > 0,
    partnerTags: (val: string) => val.length > 0,
    campaignId: (val: string) => /^\d+$/.test(val),
    campaignName: (val: string) => val.length > 0,
    promoId: (val: string) => /^\d+$/.test(val),
    promoCode: (val: string) => val.length > 0,
    playerCountry: (val: string) => val.length > 0,
    date: (val: string) => !isNaN(Date.parse(val)),
    currency: (val: string) => val.length > 0,
    ftdSum: (val: string) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0,
    depositsSum: (val: string) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0,
    cashoutsSum: (val: string) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0,
    casinoRealNgr: (val: string) => !isNaN(parseFloat(val)),
    fixedPerPlayer: (val: string) => !isNaN(parseFloat(val)),
    casinoBetsSum: (val: string) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0,
    casinoWinsSum: (val: string) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0
  }
} as const;

export function validateRecord(
  record: string[], 
  headers: string[], 
  dataType: DataType, 
  rowNumber: number
): ValidationError[] {
  const errors: ValidationError[] = [];
  const rules = VALIDATION_RULES[dataType];
  
  // Debug logging for first few rows
  if (rowNumber <= 5 || (rowNumber % 1000 === 0)) {
    console.log(`🔍 Validating row ${rowNumber} of type ${dataType}`);
  }

  headers.forEach((header, index) => {
    const value = record[index] ?? '';
    const dbField = getMappedField(header, dataType);
    const validator = rules[dbField];
    const isNullable = NULLABLE_FIELDS[dataType].includes(dbField);
    
    // Skip validation for nullable fields when they are empty
    if (isNullable && (value === '' || value === null || value === undefined)) {
      return;
    }
    
    if (validator && !validator(value)) {
      let errorMessage = `Invalid value for ${header}`;
      
      // Provide specific error messages for common cases
      if (value === '' || value === null || value === undefined) {
        errorMessage = `${header} is required`;
      } else if (dbField === 'date' || header.toLowerCase().includes('date')) {
        errorMessage = `Invalid date format for ${header}`;
      } else if (dbField.includes('Count') || dbField.includes('Clicks') || dbField.includes('Id')) {
        errorMessage = `Invalid numeric value for ${header}`;
      }
      
      errors.push({
        row: rowNumber,
        column: header,
        value: value,
        error: errorMessage,
        severity: 'error'
      });
    }
  });

  return errors;
}