import { describe, it, expect } from 'vitest';
import { prepareTrafficReportData, preparePlayersData } from '~/lib/csv-processing/data-transformation';

describe('CSV Data Transformation', () => {
  describe('prepareTrafficReportData', () => {
    it('should transform valid traffic report CSV data correctly', () => {
      const headers = [
        'Date', 'Foreign Brand ID', 'Foreign Partner ID', 'Foreign Campaign ID',
        'Foreign Landing ID', 'All Clicks', 'Unique Clicks', 'Registrations Count',
        'FTD Count', 'Deposits Count', 'Traffic Source', 'Device Type',
        'User Agent Family', 'OS Family', 'Country'
      ];
      
      const record = [
        '2023-01-01', '1', '123', '456', '789', '100', '80', '10',
        '5', '15', 'google', 'desktop', 'Chrome', 'Windows', 'US'
      ];

      const result = prepareTrafficReportData(record, headers);

      expect(result).toEqual({
        date: new Date('2023-01-01'),
        foreignBrandId: 1,
        foreignPartnerId: 123,
        foreignCampaignId: 456,
        foreignLandingId: 789,
        allClicks: 100,
        uniqueClicks: 80,
        registrationsCount: 10,
        ftdCount: 5,
        depositsCount: 15,
        trafficSource: 'google',
        deviceType: 'desktop',
        userAgentFamily: 'Chrome',
        osFamily: 'Windows',
        country: 'US'
      });
    });

    it('should handle empty traffic source correctly', () => {
      const headers = ['Date', 'Traffic Source', 'Country'];
      const record = ['2023-01-01', '', 'US'];

      const result = prepareTrafficReportData(record, headers);

      expect(result.trafficSource).toBe('');
      expect(result.country).toBe('US');
    });

    it('should handle missing values by converting to empty strings or defaults', () => {
      const headers = ['Date', 'Foreign Brand ID', 'Traffic Source', 'Device Type'];
      const record = ['2023-01-01', '1', '', ''];

      const result = prepareTrafficReportData(record, headers);

      expect(result.trafficSource).toBe('');
      expect(result.deviceType).toBe('');
    });

    it('should parse numeric fields correctly', () => {
      const headers = ['Date', 'All Clicks', 'Unique Clicks', 'Foreign Brand ID'];
      const record = ['2023-01-01', '1000', '800', '42'];

      const result = prepareTrafficReportData(record, headers);

      expect(result.allClicks).toBe(1000);
      expect(result.uniqueClicks).toBe(800);
      expect(result.foreignBrandId).toBe(42);
    });

    it('should handle date parsing', () => {
      const headers = ['Date'];
      const record = ['2023-12-25'];

      const result = prepareTrafficReportData(record, headers);

      expect(result.date).toEqual(new Date('2023-12-25'));
    });
  });

  describe('preparePlayersData', () => {
    it('should transform valid players data CSV correctly', () => {
      const headers = [
        'Player ID', 'Original Player ID', 'Partner ID', 'Campaign ID',
        'Sign Up Date', 'FTD Sum', 'Company Name', 'Player Country'
      ];
      
      const record = [
        '12345', '67890', '123', '456',
        '2023-01-01', '100.50', 'Test Company', 'US'
      ];

      const result = preparePlayersData(record, headers);

      expect(result).toEqual({
        playerId: 12345,
        originalPlayerId: 67890,
        partnerId: 123,
        campaignId: 456,
        signUpDate: new Date('2023-01-01'),
        ftdSum: 100.50,
        companyName: 'Test Company',
        playerCountry: 'US'
      });
    });

    it('should handle nullable fields correctly', () => {
      const headers = ['Player ID', 'FTD Sum', 'Sign Up Date'];
      const record = ['', '', ''];

      const result = preparePlayersData(record, headers);

      expect(result.playerId).toBeNull();
      expect(result.ftdSum).toBeNull();
      expect(result.signUpDate).toBeNull();
    });

    it('should handle mixed null and valid values', () => {
      const headers = ['Player ID', 'FTD Sum', 'Company Name'];
      const record = ['12345', '', 'Test Company'];

      const result = preparePlayersData(record, headers);

      expect(result.playerId).toBe(12345);
      expect(result.ftdSum).toBeNull();
      expect(result.companyName).toBe('Test Company');
    });
  });

  describe('Error handling', () => {
    it('should handle invalid numeric values gracefully', () => {
      const headers = ['Date', 'All Clicks'];
      const record = ['2023-01-01', 'invalid-number'];

      // Should not throw, but may produce NaN
      expect(() => prepareTrafficReportData(record, headers)).not.toThrow();
    });

    it('should handle missing headers gracefully', () => {
      const headers = ['Date'];
      const record = ['2023-01-01', 'extra-value'];

      expect(() => prepareTrafficReportData(record, headers)).not.toThrow();
    });

    it('should handle missing values in record', () => {
      const headers = ['Date', 'All Clicks', 'Country'];
      const record = ['2023-01-01']; // Missing values

      expect(() => prepareTrafficReportData(record, headers)).not.toThrow();
    });
  });
});