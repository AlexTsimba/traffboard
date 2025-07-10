/**
 * Attribution Logic Tests
 *
 * Tests the critical business logic for Registration vs FTD Attribution modes.
 * Ensures correct date field selection and WHERE clause generation.
 */

import { describe, it, expect } from "vitest";

import {
  getAttributionDateField,
  getAttributionWhereClause,
  buildAttributionGroupBy,
} from "../cohort-sql";

describe("Attribution Logic", () => {
  describe("getAttributionDateField", () => {
    it("should return signUpDate for registration attribution", () => {
      const result = getAttributionDateField("registration");
      expect(result).toBe("signUpDate");
    });

    it("should return firstDepositDate for ftd attribution", () => {
      const result = getAttributionDateField("ftd");
      expect(result).toBe("firstDepositDate");
    });

    it("should throw error for invalid attribution type", () => {
      expect(() => {
        // @ts-expect-error Testing invalid input
        getAttributionDateField("invalid");
      }).toThrow("Invalid attribution type: invalid");
    });
  });

  describe("getAttributionWhereClause", () => {
    it("should create WHERE clause for registration attribution", () => {
      const result = getAttributionWhereClause("registration");
      
      expect(result).toEqual({
        signUpDate: { not: null },
      });
    });

    it("should create WHERE clause for ftd attribution", () => {
      const result = getAttributionWhereClause("ftd");
      
      expect(result).toEqual({
        firstDepositDate: { not: null },
      });
    });

    it("should merge additional conditions for registration", () => {
      const additionalConditions = {
        partnerId: { in: ["123", "456"] },
        playerCountry: "AU",
      };
      
      const result = getAttributionWhereClause("registration", additionalConditions);
      
      expect(result).toEqual({
        signUpDate: { not: null },
        partnerId: { in: ["123", "456"] },
        playerCountry: "AU",
      });
    });

    it("should merge additional conditions for ftd", () => {
      const additionalConditions = {
        partnerId: { in: ["789"] },
        OR: [
          { partnerId: { contains: "test" } },
          { companyName: { contains: "test" } },
        ],
      };
      
      const result = getAttributionWhereClause("ftd", additionalConditions);
      
      expect(result).toEqual({
        firstDepositDate: { not: null },
        partnerId: { in: ["789"] },
        OR: [
          { partnerId: { contains: "test" } },
          { companyName: { contains: "test" } },
        ],
      });
    });
  });

  describe("buildAttributionGroupBy", () => {
    it("should build GROUP BY array for registration attribution", () => {
      const result = buildAttributionGroupBy("registration");
      expect(result).toEqual(["signUpDate"]);
    });

    it("should build GROUP BY array for ftd attribution", () => {
      const result = buildAttributionGroupBy("ftd");
      expect(result).toEqual(["firstDepositDate"]);
    });

    it("should include additional fields for registration", () => {
      const result = buildAttributionGroupBy("registration", ["partnerId", "companyName"]);
      expect(result).toEqual(["signUpDate", "partnerId", "companyName"]);
    });

    it("should include additional fields for ftd", () => {
      const result = buildAttributionGroupBy("ftd", ["campaignId", "playerCountry"]);
      expect(result).toEqual(["firstDepositDate", "campaignId", "playerCountry"]);
    });
  });

  describe("Business Logic Scenarios", () => {
    it("should demonstrate registration attribution logic", () => {
      // Business Rule: Registration Attribution includes ALL lifetime value
      // grouped by signUpDate regardless of FTD date
      
      const whereClause = getAttributionWhereClause("registration", {
        partnerId: { in: ["123"] },
      });
      
      const groupBy = buildAttributionGroupBy("registration", ["partnerId"]);
      
      // This would create a Prisma query like:
      // WHERE signUpDate IS NOT NULL AND partnerId IN ['123']
      // GROUP BY signUpDate, partnerId
      // SUM(ftdSum) -- ALL FTD from these players regardless of FTD date
      
      expect(whereClause).toEqual({
        signUpDate: { not: null },
        partnerId: { in: ["123"] },
      });
      
      expect(groupBy).toEqual(["signUpDate", "partnerId"]);
    });

    it("should demonstrate ftd attribution logic", () => {
      // Business Rule: FTD Attribution includes only players with FTD
      // grouped by firstDepositDate (actual deposit date)
      
      const whereClause = getAttributionWhereClause("ftd", {
        partnerId: { in: ["123"] },
      });
      
      const groupBy = buildAttributionGroupBy("ftd", ["partnerId"]);
      
      // This would create a Prisma query like:
      // WHERE firstDepositDate IS NOT NULL AND partnerId IN ['123']
      // GROUP BY firstDepositDate, partnerId
      // SUM(ftdSum) -- Only FTD that actually occurred on that date
      
      expect(whereClause).toEqual({
        firstDepositDate: { not: null },
        partnerId: { in: ["123"] },
      });
      
      expect(groupBy).toEqual(["firstDepositDate", "partnerId"]);
    });
  });
});
