// Modular data transformation logic with type safety
// This eliminates duplication and provides clean transformation functions

import type { Prisma } from '@prisma/client';
import { getMappedField, getKnownFields, type DataType } from './field-mappings';

type TrafficReportCreateInput = Prisma.TrafficReportCreateManyInput;
type PlayersDataCreateInput = Prisma.PlayersDataCreateManyInput;

// Field transformation configuration
interface FieldTransformer {
  transform: (value: string) => unknown;
  allowNull?: boolean;
}

const FIELD_TRANSFORMERS: Record<DataType, Record<string, FieldTransformer>> = {
  traffic_report: {
    date: { transform: (val: string) => new Date(val) },
    foreignBrandId: { transform: (val: string) => parseInt(val) },
    foreignPartnerId: { transform: (val: string) => parseInt(val) },
    foreignCampaignId: { transform: (val: string) => parseInt(val) },
    foreignLandingId: { transform: (val: string) => parseInt(val) },
    allClicks: { transform: (val: string) => parseInt(val) },
    uniqueClicks: { transform: (val: string) => parseInt(val) },
    registrationsCount: { transform: (val: string) => parseInt(val) },
    ftdCount: { transform: (val: string) => parseInt(val) },
    depositsCount: { transform: (val: string) => parseInt(val) },
    trafficSource: { transform: (val: string) => val || '', allowNull: false },
    deviceType: { transform: (val: string) => val || '' },
    userAgentFamily: { transform: (val: string) => val || '' },
    osFamily: { transform: (val: string) => val || '' },
    country: { transform: (val: string) => val || '' }
  },

  players_data: {
    playerId: { transform: (val: string) => val ? parseInt(val) : null, allowNull: true },
    originalPlayerId: { transform: (val: string) => val ? parseInt(val) : null, allowNull: true },
    partnerId: { transform: (val: string) => val ? parseInt(val) : null, allowNull: true },
    campaignId: { transform: (val: string) => val ? parseInt(val) : null, allowNull: true },
    promoId: { transform: (val: string) => val ? parseInt(val) : null, allowNull: true },
    prequalified: { transform: (val: string) => val ? parseInt(val) : null, allowNull: true },
    duplicate: { transform: (val: string) => val ? parseInt(val) : null, allowNull: true },
    selfExcluded: { transform: (val: string) => val ? parseInt(val) : null, allowNull: true },
    disabled: { transform: (val: string) => val ? parseInt(val) : null, allowNull: true },
    ftdCount: { transform: (val: string) => val ? parseInt(val) : null, allowNull: true },
    depositsCount: { transform: (val: string) => val ? parseInt(val) : null, allowNull: true },
    cashoutsCount: { transform: (val: string) => val ? parseInt(val) : null, allowNull: true },
    casinoBetsCount: { transform: (val: string) => val ? parseInt(val) : null, allowNull: true },
    signUpDate: { transform: (val: string) => val ? new Date(val) : null, allowNull: true },
    firstDepositDate: { transform: (val: string) => val ? new Date(val) : null, allowNull: true },
    date: { transform: (val: string) => val ? new Date(val) : null, allowNull: true },
    ftdSum: { transform: (val: string) => val ? parseFloat(val) : null, allowNull: true },
    depositsSum: { transform: (val: string) => val ? parseFloat(val) : null, allowNull: true },
    cashoutsSum: { transform: (val: string) => val ? parseFloat(val) : null, allowNull: true },
    casinoRealNgr: { transform: (val: string) => val ? parseFloat(val) : null, allowNull: true },
    fixedPerPlayer: { transform: (val: string) => val ? parseFloat(val) : null, allowNull: true },
    casinoBetsSum: { transform: (val: string) => val ? parseFloat(val) : null, allowNull: true },
    casinoWinsSum: { transform: (val: string) => val ? parseFloat(val) : null, allowNull: true },
    tagClickid: { transform: (val: string) => val || null, allowNull: true },
    tagOs: { transform: (val: string) => val || null, allowNull: true },
    tagSource: { transform: (val: string) => val || null, allowNull: true },
    tagSub2: { transform: (val: string) => val || null, allowNull: true },
    tagWebId: { transform: (val: string) => val || null, allowNull: true },
    companyName: { transform: (val: string) => val || '' },
    partnerTags: { transform: (val: string) => val || '' },
    campaignName: { transform: (val: string) => val || '' },
    promoCode: { transform: (val: string) => val || '' },
    playerCountry: { transform: (val: string) => val || '' },
    currency: { transform: (val: string) => val || '' }
  }
};

function transformRecord(
  record: string[], 
  headers: string[], 
  dataType: DataType
): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  const transformers = FIELD_TRANSFORMERS[dataType];
  const knownFields = getKnownFields(dataType);
  
  // Debug logging for first few transformations
  const isDebugRow = Math.random() < 0.01; // Log ~1% of records for debugging
  
  if (isDebugRow) {
    console.log(`🔄 Transforming record for ${dataType}:`, record.slice(0, 5), '...');
    console.log(`🔄 Headers:`, headers.slice(0, 5), '...');
  }
  
  headers.forEach((header, index) => {
    const value = record[index] ?? '';
    const dbField = getMappedField(header, dataType);
    
    if (isDebugRow) {
      console.log(`🔄 Header "${header}" -> DB field "${dbField}" -> Value: "${value}"`);
    }
    
    // Only process known database fields
    if (!knownFields.includes(dbField)) {
      if (isDebugRow) {
        console.log(`⚠️ Unknown field "${dbField}" skipped (header: "${header}")`);
      }
      return;
    }
    
    const transformer = transformers[dbField];
    if (transformer) {
      try {
        data[dbField] = transformer.transform(value);
        if (isDebugRow) {
          console.log(`✅ Transformed "${header}": "${value}" -> ${String(data[dbField])}`);
        }
      } catch (error) {
        if (isDebugRow) {
          console.log(`❌ Transform error for "${header}": ${String(error)}`);
        }
      }
    } else {
      // Fallback for fields without specific transformers
      if (value) {
        data[dbField] = value;
        if (isDebugRow) {
          console.log(`✅ Direct assignment "${header}": "${value}"`);
        }
      }
    }
  });
  
  if (isDebugRow) {
    console.log(`🔄 Final transformed data:`, data);
  }
  
  return data;
}

export function prepareTrafficReportData(
  record: string[], 
  headers: string[]
): TrafficReportCreateInput {
  return transformRecord(record, headers, 'traffic_report') as TrafficReportCreateInput;
}

export function preparePlayersData(
  record: string[], 
  headers: string[]
): PlayersDataCreateInput {
  return transformRecord(record, headers, 'players_data') as PlayersDataCreateInput;
}