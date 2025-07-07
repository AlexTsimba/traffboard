import { describe, it, expect, beforeAll, afterAll } from "vitest";

import { processConversionDataCSV } from "../../data-transformers";
import { prisma } from "../../prisma";

const VALID_CSV = `date,foreign_brand_id,foreign_partner_id,foreign_campaign_id,foreign_landing_id,traffic_source,device_type,user_agent_family,os_family,country,all_clicks,unique_clicks,registrations_count,ftd_count,deposits_count
2024-07-01,brand1,partner1,campaign1,landing1,google,desktop,Chrome,Windows,US,100,80,10,2,1`;

const INVALID_CSV = `date,foreign_brand_id,foreign_partner_id,foreign_campaign_id,foreign_landing_id,traffic_source,device_type,user_agent_family,os_family,country,all_clicks,unique_clicks,registrations_count,ftd_count,deposits_count
,brand1,,campaign1,landing1,google,desktop,Chrome,Windows,US,notanumber,80,10,2,1`;

const MIXED_CSV = `date,foreign_brand_id,foreign_partner_id,foreign_campaign_id,foreign_landing_id,traffic_source,device_type,user_agent_family,os_family,country,all_clicks,unique_clicks,registrations_count,ftd_count,deposits_count
2024-07-01,brand1,partner1,campaign1,landing1,google,desktop,Chrome,Windows,US,100,80,10,2,1
,brand1,,campaign1,landing1,google,desktop,Chrome,Windows,US,notanumber,80,10,2,1`;

describe.skip("CSV Import & Validation (TraffBoard conversions)", () => {
  beforeAll(async () => {
    // Очистить тестовую БД перед тестом
    await prisma.conversion.deleteMany({});
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("should import only valid rows and report errors for invalid ones", () => {
    const result = processConversionDataCSV(MIXED_CSV);
    expect(result.success).toBe(false);
    expect(result.processedCount).toBe(1);
    expect(result.errorCount).toBeGreaterThan(0);
    expect(result.errors.some((e: string) => e.includes("Row 2"))).toBe(true);
    expect(result.data.length).toBe(1);
    // Можно добавить проверку на структуру данных
    expect(result.data[0]).toMatchObject({
      foreignBrandId: "brand1",
      foreignPartnerId: "partner1",
      foreignCampaignId: "campaign1",
      allClicks: 100,
    });
  });

  it("should reject all rows if all are invalid", () => {
    const result = processConversionDataCSV(INVALID_CSV);
    expect(result.success).toBe(false);
    expect(result.processedCount).toBe(0);
    expect(result.errorCount).toBeGreaterThan(0);
    expect(result.data.length).toBe(0);
  });

  it("should import all rows if all are valid", () => {
    const result = processConversionDataCSV(VALID_CSV);
    expect(result.success).toBe(true);
    expect(result.processedCount).toBe(1);
    expect(result.errorCount).toBe(0);
    expect(result.data.length).toBe(1);
  });
});
