import { describe, it, expect } from 'vitest';
import { getMappedField, getKnownFields, type DataType } from '~/lib/csv-processing/field-mappings';

describe('Field Mappings', () => {
  describe('getMappedField', () => {
    it('should map traffic report header variations correctly', () => {
      expect(getMappedField('Date', 'traffic_report')).toBe('date');
      expect(getMappedField('Foreign Brand ID', 'traffic_report')).toBe('foreignBrandId');
      expect(getMappedField('Foreign Partner ID', 'traffic_report')).toBe('foreignPartnerId');
      expect(getMappedField('All Clicks', 'traffic_report')).toBe('allClicks');
      expect(getMappedField('Traffic Source', 'traffic_report')).toBe('trafficSource');
    });

    it('should handle case insensitive mapping', () => {
      expect(getMappedField('date', 'traffic_report')).toBe('date');
      expect(getMappedField('DATE', 'traffic_report')).toBe('date');
      expect(getMappedField('foreign brand id', 'traffic_report')).toBe('foreignBrandId');
    });

    it('should map players data headers correctly', () => {
      expect(getMappedField('Player ID', 'players_data')).toBe('playerId');
      expect(getMappedField('Partner ID', 'players_data')).toBe('partnerId');
      expect(getMappedField('Company Name', 'players_data')).toBe('companyName');
      expect(getMappedField('FTD Sum', 'players_data')).toBe('ftdSum');
    });

    it('should return the field as-is if no mapping exists', () => {
      expect(getMappedField('Unknown Field', 'traffic_report')).toBe('unknownField');
      expect(getMappedField('Another Field', 'players_data')).toBe('anotherField');
    });

    it('should handle special characters and spaces in headers', () => {
      expect(getMappedField('Field With Spaces', 'traffic_report')).toBe('fieldWithSpaces');
      expect(getMappedField('Field-With-Dashes', 'traffic_report')).toBe('fieldWithDashes');
      expect(getMappedField('Field_With_Underscores', 'traffic_report')).toBe('fieldWithUnderscores');
    });
  });

  describe('getKnownFields', () => {
    it('should return all known traffic report fields', () => {
      const fields = getKnownFields('traffic_report');
      
      expect(fields).toContain('date');
      expect(fields).toContain('foreignBrandId');
      expect(fields).toContain('foreignPartnerId');
      expect(fields).toContain('foreignCampaignId');
      expect(fields).toContain('foreignLandingId');
      expect(fields).toContain('allClicks');
      expect(fields).toContain('uniqueClicks');
      expect(fields).toContain('registrationsCount');
      expect(fields).toContain('ftdCount');
      expect(fields).toContain('depositsCount');
      expect(fields).toContain('trafficSource');
      expect(fields).toContain('deviceType');
      expect(fields).toContain('userAgentFamily');
      expect(fields).toContain('osFamily');
      expect(fields).toContain('country');
    });

    it('should return all known players data fields', () => {
      const fields = getKnownFields('players_data');
      
      expect(fields).toContain('playerId');
      expect(fields).toContain('originalPlayerId');
      expect(fields).toContain('partnerId');
      expect(fields).toContain('companyName');
      expect(fields).toContain('ftdSum');
      expect(fields).toContain('playerCountry');
    });

    it('should return unique field names', () => {
      const trafficFields = getKnownFields('traffic_report');
      const playersFields = getKnownFields('players_data');
      
      expect(new Set(trafficFields).size).toBe(trafficFields.length);
      expect(new Set(playersFields).size).toBe(playersFields.length);
    });
  });

  describe('Data type consistency', () => {
    it('should handle both valid data types', () => {
      const dataTypes: DataType[] = ['traffic_report', 'players_data'];
      
      dataTypes.forEach(dataType => {
        expect(() => getKnownFields(dataType)).not.toThrow();
        expect(() => getMappedField('Date', dataType)).not.toThrow();
      });
    });
  });
});