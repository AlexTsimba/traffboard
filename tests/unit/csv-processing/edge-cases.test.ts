import { describe, it, expect } from 'vitest';
import { prepareTrafficReportData, preparePlayersData } from '~/lib/csv-processing/data-transformation';
import { validateRecord } from '~/lib/csv-processing/validation';
import { getMappedField } from '~/lib/csv-processing/field-mappings';

describe('CSV Processing Edge Cases', () => {
  describe('Data Transformation Edge Cases', () => {
    it('should handle extremely large numbers', () => {
      const headers = ['All Clicks', 'Unique Clicks'];
      const record = ['999999999999', '888888888888'];

      const result = prepareTrafficReportData(record, headers);

      expect(result.allClicks).toBe(999999999999);
      expect(result.uniqueClicks).toBe(888888888888);
    });

    it('should handle decimal numbers in integer fields', () => {
      const headers = ['All Clicks'];
      const record = ['100.7'];

      const result = prepareTrafficReportData(record, headers);

      expect(result.allClicks).toBe(100); // parseInt truncates decimal
    });

    it('should handle various date formats', () => {
      const testCases = [
        { input: '2023-01-01', expected: new Date('2023-01-01') },
        { input: '01/01/2023', expected: new Date('01/01/2023') },
        { input: '2023-12-31T23:59:59.999Z', expected: new Date('2023-12-31T23:59:59.999Z') },
      ];

      testCases.forEach(({ input, expected }) => {
        const headers = ['Date'];
        const record = [input];
        const result = prepareTrafficReportData(record, headers);
        expect(result.date).toEqual(expected);
      });
    });

    it('should handle special characters in text fields', () => {
      const headers = ['Traffic Source', 'User Agent Family', 'Country'];
      const record = ['google.com/search?q=test&param=value', 'Chrome/91.0.4472.124', 'Côte d\'Ivoire'];

      const result = prepareTrafficReportData(record, headers);

      expect(result.trafficSource).toBe('google.com/search?q=test&param=value');
      expect(result.userAgentFamily).toBe('Chrome/91.0.4472.124');
      expect(result.country).toBe('Côte d\'Ivoire');
    });

    it('should handle Unicode characters', () => {
      const headers = ['Traffic Source', 'Country'];
      const record = ['微信', '中国'];

      const result = prepareTrafficReportData(record, headers);

      expect(result.trafficSource).toBe('微信');
      expect(result.country).toBe('中国');
    });

    it('should handle very long strings', () => {
      const longString = 'a'.repeat(1000);
      const headers = ['Traffic Source'];
      const record = [longString];

      const result = prepareTrafficReportData(record, headers);

      expect(result.trafficSource).toBe(longString);
    });

    it('should handle null-like string values', () => {
      const nullLikeValues = ['null', 'NULL', 'undefined', 'UNDEFINED', 'nil', 'NIL'];
      
      nullLikeValues.forEach(nullValue => {
        const headers = ['Traffic Source'];
        const record = [nullValue];
        const result = prepareTrafficReportData(record, headers);
        
        // These should be treated as regular strings, not converted to null
        expect(result.trafficSource).toBe(nullValue);
      });
    });

    it('should handle boolean-like string values', () => {
      const headers = ['Traffic Source'];
      const booleanValues = ['true', 'false', 'TRUE', 'FALSE', '1', '0'];
      
      booleanValues.forEach(boolValue => {
        const record = [boolValue];
        const result = prepareTrafficReportData(record, headers);
        expect(result.trafficSource).toBe(boolValue);
      });
    });
  });

  describe('Validation Edge Cases', () => {
    it('should handle negative numbers appropriately', () => {
      const headers = ['All Clicks', 'Unique Clicks'];
      const record = ['-100', '-50'];

      const errors = validateRecord(record, headers, 'traffic_report', 1);

      // Negative numbers should be flagged as invalid for click counts
      expect(errors.some(e => e.column === 'All Clicks' && e.value === '-100')).toBe(true);
      expect(errors.some(e => e.column === 'Unique Clicks' && e.value === '-50')).toBe(true);
    });

    it('should handle zero values correctly', () => {
      const headers = ['All Clicks', 'Unique Clicks', 'Registrations Count'];
      const record = ['0', '0', '0'];

      const errors = validateRecord(record, headers, 'traffic_report', 1);

      // Zero should be valid for these fields
      expect(errors.filter(e => e.severity === 'error')).toHaveLength(0);
    });

    it('should handle very large dates', () => {
      const headers = ['Date'];
      const record = ['9999-12-31'];

      const errors = validateRecord(record, headers, 'traffic_report', 1);

      // Should be valid date
      expect(errors.filter(e => e.severity === 'error')).toHaveLength(0);
    });

    it('should handle malformed CSV edge cases', () => {
      const headers = ['Date', 'All Clicks'];
      
      // Test various malformed scenarios
      const edgeCases = [
        { record: ['2023-01-01'], description: 'missing columns' },
        { record: ['2023-01-01', '100', 'extra'], description: 'extra columns' },
        { record: ['', ''], description: 'all empty values' },
      ];

      edgeCases.forEach(({ record, description }) => {
        expect(() => validateRecord(record, headers, 'traffic_report', 1)).not.toThrow();
      });
    });

    it('should handle scientific notation in numeric fields', () => {
      const headers = ['All Clicks'];
      const record = ['1e5']; // 100000

      const result = prepareTrafficReportData(record, headers);
      expect(result.allClicks).toBe(100000);

      const errors = validateRecord(record, headers, 'traffic_report', 1);
      expect(errors.filter(e => e.severity === 'error')).toHaveLength(0);
    });

    it('should handle hexadecimal-like strings', () => {
      const headers = ['All Clicks'];
      const record = ['0xFF']; // Number('0xFF') converts to 255

      const result = prepareTrafficReportData(record, headers);
      expect(result.allClicks).toBe(255); // Number() correctly converts hex to decimal
    });
  });

  describe('Field Mapping Edge Cases', () => {
    it('should handle headers with extra whitespace', () => {
      expect(getMappedField('  Date  ', 'traffic_report')).toBe('date');
      expect(getMappedField('\tAll Clicks\n', 'traffic_report')).toBe('allClicks');
    });

    it('should handle headers with mixed case consistently', () => {
      const variations = [
        'traffic source',
        'Traffic Source',
        'TRAFFIC SOURCE',
        'tRaFfIc SoUrCe',
      ];

      variations.forEach(header => {
        expect(getMappedField(header, 'traffic_report')).toBe('trafficSource');
      });
    });

    it('should handle headers with punctuation', () => {
      expect(getMappedField('Traffic Source!', 'traffic_report')).toBe('trafficSource');
      expect(getMappedField('All Clicks???', 'traffic_report')).toBe('allClicks');
      expect(getMappedField('Date (YYYY-MM-DD)', 'traffic_report')).toBe('dateYyyyMmDd');
    });

    it('should handle completely unknown headers', () => {
      const unknownHeaders = [
        'Completely Unknown Field',
        'Random Data Column',
        'Something Not In Schema',
      ];

      unknownHeaders.forEach(header => {
        const mapped = getMappedField(header, 'traffic_report');
        // Should convert to camelCase with punctuation removed
        const expected = header
          .toLowerCase()
          .replace(/[^a-z0-9]/g, ' ')
          .trim()
          .replace(/\s+/g, ' ')
          .split(' ')
          .map((word, index) => index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1))
          .join('');
        expect(mapped).toBe(expected);
      });
    });
  });

  describe('Memory and Performance Edge Cases', () => {
    it('should handle processing many records without memory issues', () => {
      const headers = ['Date', 'All Clicks', 'Traffic Source'];
      const records = Array.from({ length: 10000 }, (_, i) => [
        `2023-01-${String((i % 31) + 1).padStart(2, '0')}`,
        String(i * 10),
        `source-${i % 10}`,
      ]);

      expect(() => {
        records.forEach(record => prepareTrafficReportData(record, headers));
      }).not.toThrow();
    });

    it('should handle concurrent transformations', async () => {
      const headers = ['Date', 'All Clicks', 'Traffic Source'];
      const record = ['2023-01-01', '100', 'google'];

      const promises = Array.from({ length: 100 }, () =>
        Promise.resolve(prepareTrafficReportData(record, headers))
      );

      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(100);
      results.forEach(result => {
        expect(result.date).toEqual(new Date('2023-01-01'));
        expect(result.allClicks).toBe(100);
        expect(result.trafficSource).toBe('google');
      });
    });
  });

  describe('Boundary Value Testing', () => {
    it('should handle minimum and maximum integer values', () => {
      const headers = ['All Clicks'];
      
      // Test maximum safe integer
      const maxRecord = [String(Number.MAX_SAFE_INTEGER)];
      const maxResult = prepareTrafficReportData(maxRecord, headers);
      expect(maxResult.allClicks).toBe(Number.MAX_SAFE_INTEGER);

      // Test minimum safe integer
      const minRecord = [String(Number.MIN_SAFE_INTEGER)];
      const minResult = prepareTrafficReportData(minRecord, headers);
      expect(minResult.allClicks).toBe(Number.MIN_SAFE_INTEGER);
    });

    it('should handle edge case dates', () => {
      const edgeDates = [
        '1970-01-01', // Unix epoch
        '2000-02-29', // Leap year
        '2100-02-28', // Non-leap year
        '1900-01-01', // Edge of valid range
      ];

      edgeDates.forEach(dateStr => {
        const headers = ['Date'];
        const record = [dateStr];
        const result = prepareTrafficReportData(record, headers);
        expect(result.date).toEqual(new Date(dateStr));
      });
    });

    it('should handle empty strings vs undefined vs null', () => {
      const headers = ['Traffic Source'];
      
      // Empty string
      const emptyResult = prepareTrafficReportData([''], headers);
      expect(emptyResult.trafficSource).toBe('');

      // Missing value (undefined in array)
      const undefinedResult = prepareTrafficReportData([], headers);
      expect(undefinedResult.trafficSource).toBe('');
    });
  });
});