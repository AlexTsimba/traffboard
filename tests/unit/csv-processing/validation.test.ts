import { describe, it, expect } from 'vitest';
import { validateRecord } from '~/lib/csv-processing/validation';
import type { DataType } from '~/lib/csv-processing';

describe('CSV Validation', () => {
  describe('validateRecord for traffic_report', () => {
    const dataType: DataType = 'traffic_report';
    
    it('should validate a correct traffic report record', () => {
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

      const errors = validateRecord(record, headers, dataType, 1);
      
      expect(errors).toHaveLength(0);
    });

    it('should detect missing required fields', () => {
      const headers = ['Date', 'Foreign Brand ID'];
      const record = ['', '1'];

      const errors = validateRecord(record, headers, dataType, 1);
      
      const errorMessages = errors.map(e => e.error);
      expect(errorMessages.some(msg => msg.includes('Date') && msg.includes('required'))).toBe(true);
    });

    it('should detect invalid date formats', () => {
      const headers = ['Date'];
      const record = ['invalid-date'];

      const errors = validateRecord(record, headers, dataType, 1);
      
      const hasDateError = errors.some(e => 
        e.column === 'Date' && e.error.includes('Invalid date format')
      );
      expect(hasDateError).toBe(true);
    });

    it('should detect invalid numeric values', () => {
      const headers = ['All Clicks', 'Unique Clicks'];
      const record = ['not-a-number', '-5'];

      const errors = validateRecord(record, headers, dataType, 1);
      
      expect(errors.some(e => e.column === 'All Clicks')).toBe(true);
      expect(errors.some(e => e.column === 'Unique Clicks')).toBe(true);
    });

    it('should allow empty traffic source (nullable field)', () => {
      const headers = ['Date', 'Traffic Source', 'Foreign Brand ID'];
      const record = ['2023-01-01', '', '1'];

      const errors = validateRecord(record, headers, dataType, 1);
      
      const trafficSourceErrors = errors.filter(e => e.column === 'Traffic Source');
      expect(trafficSourceErrors).toHaveLength(0);
    });

    it('should validate record with correct row number', () => {
      const headers = ['Date'];
      const record = ['invalid-date'];
      const rowNumber = 42;

      const errors = validateRecord(record, headers, dataType, rowNumber);
      
      expect(errors[0]?.row).toBe(rowNumber);
    });
  });

  describe('validateRecord for players_data', () => {
    const dataType: DataType = 'players_data';
    
    it('should validate a correct players data record', () => {
      const headers = [
        'Player ID', 'Partner ID', 'Sign Up Date', 'FTD Sum', 'Company Name'
      ];
      
      const record = ['12345', '123', '2023-01-01', '100.50', 'Test Company'];

      const errors = validateRecord(record, headers, dataType, 1);
      
      expect(errors).toHaveLength(0);
    });

    it('should allow null values in nullable fields', () => {
      const headers = ['Player ID', 'FTD Sum', 'Sign Up Date'];
      const record = ['', '', ''];

      const errors = validateRecord(record, headers, dataType, 1);
      
      // These fields should be nullable, so empty values should be allowed
      expect(errors).toHaveLength(0);
    });

    it('should detect invalid decimal values', () => {
      const headers = ['FTD Sum'];
      const record = ['not-a-decimal'];

      const errors = validateRecord(record, headers, dataType, 1);
      
      expect(errors.some(e => e.column === 'FTD Sum')).toBe(true);
    });
  });

  describe('Error severity and types', () => {
    it('should mark critical validation failures as errors', () => {
      const headers = ['Date'];
      const record = ['invalid-date'];

      const errors = validateRecord(record, headers, 'traffic_report', 1);
      
      expect(errors[0]?.severity).toBe('error');
    });

    it('should include column information in errors', () => {
      const headers = ['Date', 'All Clicks'];
      const record = ['invalid-date', 'not-a-number'];

      const errors = validateRecord(record, headers, 'traffic_report', 1);
      
      const columns = errors.map(e => e.column);
      expect(columns).toContain('Date');
      expect(columns).toContain('All Clicks');
    });

    it('should include the problematic value in error details', () => {
      const headers = ['Date'];
      const invalidValue = 'clearly-invalid-date';
      const record = [invalidValue];

      const errors = validateRecord(record, headers, 'traffic_report', 1);
      
      expect(errors[0]?.value).toBe(invalidValue);
    });
  });
});