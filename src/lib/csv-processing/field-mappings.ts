// Centralized field mapping configuration for CSV processing
// This eliminates duplication and provides a single source of truth

export const FIELD_MAPPINGS = {
  traffic_report: {
    'date': 'date',
    'Foreign Brand ID': 'foreignBrandId',
    'foreign_brand_id': 'foreignBrandId',
    'foreignBrandId': 'foreignBrandId',
    'Foreign Partner ID': 'foreignPartnerId', 
    'foreign_partner_id': 'foreignPartnerId',
    'foreignPartnerId': 'foreignPartnerId',
    'Foreign Campaign ID': 'foreignCampaignId',
    'foreign_campaign_id': 'foreignCampaignId', 
    'foreignCampaignId': 'foreignCampaignId',
    'Foreign Landing ID': 'foreignLandingId',
    'foreign_landing_id': 'foreignLandingId',
    'foreignLandingId': 'foreignLandingId',
    'traffic_source': 'trafficSource',
    'Traffic Source': 'trafficSource',
    'trafficSource': 'trafficSource',
    'device_type': 'deviceType',
    'Device Type': 'deviceType',
    'deviceType': 'deviceType',
    'user_agent_family': 'userAgentFamily',
    'User Agent Family': 'userAgentFamily',
    'userAgentFamily': 'userAgentFamily',
    'os_family': 'osFamily',
    'OS Family': 'osFamily',
    'osFamily': 'osFamily',
    'country': 'country',
    'Country': 'country',
    'All Clicks': 'allClicks',
    'all_clicks': 'allClicks',
    'allClicks': 'allClicks',
    'Unique Clicks': 'uniqueClicks',
    'unique_clicks': 'uniqueClicks', 
    'uniqueClicks': 'uniqueClicks',
    'registrations_count': 'registrationsCount',
    'Registrations Count': 'registrationsCount',
    'registrationsCount': 'registrationsCount',
    'ftd_count': 'ftdCount',
    'FTD Count': 'ftdCount',
    'ftdCount': 'ftdCount',
    'deposits_count': 'depositsCount',
    'Deposits Count': 'depositsCount',
    'depositsCount': 'depositsCount'
  },

  players_data: {
    'Player ID': 'playerId',
    'player_id': 'playerId',
    'playerId': 'playerId',
    'Original player ID': 'originalPlayerId',
    'original_player_id': 'originalPlayerId',
    'originalPlayerId': 'originalPlayerId',
    'Sign up date': 'signUpDate',
    'sign_up_date': 'signUpDate',
    'signUpDate': 'signUpDate',
    'First deposit date': 'firstDepositDate',
    'first_deposit_date': 'firstDepositDate', 
    'firstDepositDate': 'firstDepositDate',
    'Partner ID': 'partnerId',
    'partner_id': 'partnerId',
    'partnerId': 'partnerId',
    'Company Name': 'companyName',
    'Company name': 'companyName',
    'company_name': 'companyName',
    'companyName': 'companyName',
    'Partner tags': 'partnerTags',
    'partner_tags': 'partnerTags',
    'partnerTags': 'partnerTags',
    'Campaign ID': 'campaignId',
    'campaign_id': 'campaignId',
    'campaignId': 'campaignId',
    'Campaign name': 'campaignName',
    'campaign_name': 'campaignName',
    'campaignName': 'campaignName',
    'Promo ID': 'promoId',
    'promo_id': 'promoId', 
    'promoId': 'promoId',
    'Promo code': 'promoCode',
    'promo_code': 'promoCode',
    'promoCode': 'promoCode',
    'Player country': 'playerCountry',
    'player_country': 'playerCountry',
    'playerCountry': 'playerCountry',
    'Tag: clickid': 'tagClickid',
    'tag_clickid': 'tagClickid',
    'tagClickid': 'tagClickid',
    'Tag: os': 'tagOs',
    'tag_os': 'tagOs',
    'tagOs': 'tagOs',
    'Tag: source': 'tagSource',
    'tag_source': 'tagSource', 
    'tagSource': 'tagSource',
    'Tag: sub2': 'tagSub2',
    'tag_sub2': 'tagSub2',
    'tagSub2': 'tagSub2',
    'Tag: webID': 'tagWebId',
    'tag_web_id': 'tagWebId',
    'tagWebId': 'tagWebId',
    'Date': 'date',
    'date': 'date',
    'Prequalified': 'prequalified',
    'prequalified': 'prequalified',
    'Duplicate': 'duplicate',
    'duplicate': 'duplicate',
    'Self-excluded': 'selfExcluded',
    'self_excluded': 'selfExcluded',
    'selfExcluded': 'selfExcluded',
    'Disabled': 'disabled',
    'disabled': 'disabled',
    'Currency': 'currency',
    'currency': 'currency',
    'FTD count': 'ftdCount',
    'ftd_count': 'ftdCount',
    'ftdCount': 'ftdCount',
    'FTD sum': 'ftdSum',
    'ftd_sum': 'ftdSum',
    'ftdSum': 'ftdSum',
    'Deposits count': 'depositsCount',
    'deposits_count': 'depositsCount',
    'depositsCount': 'depositsCount',
    'Deposits sum': 'depositsSum',
    'deposits_sum': 'depositsSum', 
    'depositsSum': 'depositsSum',
    'Cashouts count': 'cashoutsCount',
    'cashouts_count': 'cashoutsCount',
    'cashoutsCount': 'cashoutsCount',
    'Cashouts sum': 'cashoutsSum',
    'cashouts_sum': 'cashoutsSum',
    'cashoutsSum': 'cashoutsSum',
    'Casino bets count': 'casinoBetsCount',
    'casino_bets_count': 'casinoBetsCount',
    'casinoBetsCount': 'casinoBetsCount',
    'Casino Real NGR': 'casinoRealNgr',
    'casino_real_ngr': 'casinoRealNgr',
    'casinoRealNgr': 'casinoRealNgr',
    'Fixed per player': 'fixedPerPlayer',
    'fixed_per_player': 'fixedPerPlayer',
    'fixedPerPlayer': 'fixedPerPlayer',
    'Casino bets sum': 'casinoBetsSum',
    'casino_bets_sum': 'casinoBetsSum',
    'casinoBetsSum': 'casinoBetsSum',
    'Casino wins sum': 'casinoWinsSum',
    'casino_wins_sum': 'casinoWinsSum',
    'casinoWinsSum': 'casinoWinsSum'
  }
} as const;

export type DataType = keyof typeof FIELD_MAPPINGS;

// Get the mapped field name for a given CSV header
export function getMappedField(csvHeader: string, dataType: DataType): string {
  const mappings = FIELD_MAPPINGS[dataType] as Record<string, string>;
  
  // Try exact match first
  if (mappings[csvHeader]) {
    return mappings[csvHeader];
  }
  
  // Try case-insensitive match
  const lowerHeader = csvHeader.toLowerCase();
  for (const [key, value] of Object.entries(mappings)) {
    if (key.toLowerCase() === lowerHeader) {
      return value;
    }
  }
  
  // If no mapping found, convert to camelCase
  return csvHeader
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')
    .split(' ')
    .map((word, index) => index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
}

// Get all known database fields for a data type
export function getKnownFields(dataType: DataType): string[] {
  return Array.from(new Set(Object.values(FIELD_MAPPINGS[dataType])));
}