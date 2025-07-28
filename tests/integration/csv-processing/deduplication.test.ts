import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { db } from '~/server/db';
import { prepareTrafficReportData } from '~/lib/csv-processing/data-transformation';
import type { Prisma } from '@prisma/client';

describe('Traffic Report Deduplication Integration', () => {
  beforeEach(async () => {
    // Clean up any existing traffic reports
    await db.trafficReport.deleteMany({});
  });

  afterEach(async () => {
    // Clean up after each test
    await db.trafficReport.deleteMany({});
  });

  describe('Database Unique Constraint', () => {
    it('should prevent duplicate records with same unique key combination', async () => {
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

      const transformedData = prepareTrafficReportData(record, headers);

      // Insert first record
      const result1 = await db.trafficReport.createMany({
        data: [transformedData],
        skipDuplicates: true
      });

      expect(result1.count).toBe(1);

      // Try to insert the same record again
      const result2 = await db.trafficReport.createMany({
        data: [transformedData],
        skipDuplicates: true
      });

      expect(result2.count).toBe(0); // Should skip duplicate

      // Verify only one record exists
      const totalRecords = await db.trafficReport.count();
      expect(totalRecords).toBe(1);
    });

    it('should allow records with different unique key combinations', async () => {
      const headers = [
        'Date', 'Foreign Brand ID', 'Foreign Partner ID', 'Foreign Campaign ID',
        'Foreign Landing ID', 'All Clicks', 'Unique Clicks', 'Registrations Count',
        'FTD Count', 'Deposits Count', 'Traffic Source', 'Device Type',
        'User Agent Family', 'OS Family', 'Country'
      ];

      const record1 = [
        '2023-01-01', '1', '123', '456', '789', '100', '80', '10',
        '5', '15', 'google', 'desktop', 'Chrome', 'Windows', 'US'
      ];

      const record2 = [
        '2023-01-01', '1', '123', '456', '789', '120', '90', '12',
        '6', '18', 'facebook', 'desktop', 'Chrome', 'Windows', 'US' // Different traffic source
      ];

      const data1 = prepareTrafficReportData(record1, headers);
      const data2 = prepareTrafficReportData(record2, headers);

      const result = await db.trafficReport.createMany({
        data: [data1, data2],
        skipDuplicates: true
      });

      expect(result.count).toBe(2);

      const totalRecords = await db.trafficReport.count();
      expect(totalRecords).toBe(2);
    });

    it('should handle empty traffic source in unique constraint', async () => {
      const headers = [
        'Date', 'Foreign Brand ID', 'Foreign Partner ID', 'Foreign Campaign ID',
        'Foreign Landing ID', 'All Clicks', 'Unique Clicks', 'Registrations Count',
        'FTD Count', 'Deposits Count', 'Traffic Source', 'Device Type',
        'User Agent Family', 'OS Family', 'Country'
      ];

      const record1 = [
        '2023-01-01', '1', '123', '456', '789', '100', '80', '10',
        '5', '15', '', 'desktop', 'Chrome', 'Windows', 'US'
      ];

      const record2 = [
        '2023-01-01', '1', '123', '456', '789', '100', '80', '10',
        '5', '15', '', 'desktop', 'Chrome', 'Windows', 'US'
      ];

      const data1 = prepareTrafficReportData(record1, headers);
      const data2 = prepareTrafficReportData(record2, headers);

      // Insert first record with empty traffic source
      const result1 = await db.trafficReport.createMany({
        data: [data1],
        skipDuplicates: true
      });

      expect(result1.count).toBe(1);

      // Try to insert duplicate with empty traffic source
      const result2 = await db.trafficReport.createMany({
        data: [data2],
        skipDuplicates: true
      });

      expect(result2.count).toBe(0); // Should be treated as duplicate

      const totalRecords = await db.trafficReport.count();
      expect(totalRecords).toBe(1);
    });
  });

  describe('Batch Processing with Deduplication', () => {
    it('should handle mixed duplicate and unique records in batch', async () => {
      const headers = [
        'Date', 'Foreign Brand ID', 'Foreign Partner ID', 'Foreign Campaign ID',
        'Foreign Landing ID', 'All Clicks', 'Unique Clicks', 'Registrations Count',
        'FTD Count', 'Deposits Count', 'Traffic Source', 'Device Type',
        'User Agent Family', 'OS Family', 'Country'
      ];

      const records = [
        ['2023-01-01', '1', '123', '456', '789', '100', '80', '10', '5', '15', 'google', 'desktop', 'Chrome', 'Windows', 'US'],
        ['2023-01-01', '1', '123', '456', '789', '120', '90', '12', '6', '18', 'facebook', 'desktop', 'Chrome', 'Windows', 'US'], // Unique
        ['2023-01-01', '1', '123', '456', '789', '100', '80', '10', '5', '15', 'google', 'desktop', 'Chrome', 'Windows', 'US'], // Duplicate of first
        ['2023-01-02', '1', '123', '456', '789', '150', '110', '15', '8', '20', 'google', 'desktop', 'Chrome', 'Windows', 'US'], // Unique (different date)
      ];

      const transformedData = records.map(record => prepareTrafficReportData(record, headers));

      const result = await db.trafficReport.createMany({
        data: transformedData,
        skipDuplicates: true
      });

      expect(result.count).toBe(3); // Should insert 3 unique records, skip 1 duplicate

      const totalRecords = await db.trafficReport.count();
      expect(totalRecords).toBe(3);
    });

    it('should maintain data integrity during large batch operations', async () => {
      const headers = [
        'Date', 'Foreign Brand ID', 'Foreign Partner ID', 'Foreign Campaign ID',
        'Foreign Landing ID', 'All Clicks', 'Unique Clicks', 'Registrations Count',
        'FTD Count', 'Deposits Count', 'Traffic Source', 'Device Type',
        'User Agent Family', 'OS Family', 'Country'
      ];

      // Create 84 records where every 3rd is a duplicate (28 unique dates)
      const records: string[][] = [];
      for (let i = 0; i < 84; i++) { // 84 records = 28 * 3, so exactly 28 unique combinations
        const dayOffset = Math.floor(i / 3) + 1; // Every 3rd record will have same date
        records.push([
          `2023-01-${String(dayOffset).padStart(2, '0')}`,
          '1', '123', '456', '789', '100', '80', '10', '5', '15',
          'google', 'desktop', 'Chrome', 'Windows', 'US'
        ]);
      }

      const transformedData = records.map(record => prepareTrafficReportData(record, headers));

      const result = await db.trafficReport.createMany({
        data: transformedData,
        skipDuplicates: true
      });

      // Should insert unique records only (28 unique dates)
      const expectedUniqueCount = 28;
      expect(result.count).toBe(expectedUniqueCount);

      const totalRecords = await db.trafficReport.count();
      expect(totalRecords).toBe(expectedUniqueCount);
    });
  });

  describe('Real-world CSV Upload Simulation', () => {
    it('should handle uploading the same CSV data twice with zero new insertions', async () => {
      const csvData = [
        ['Date', 'Foreign Brand ID', 'Foreign Partner ID', 'Foreign Campaign ID', 'Foreign Landing ID', 'All Clicks', 'Unique Clicks', 'Registrations Count', 'FTD Count', 'Deposits Count', 'Traffic Source', 'Device Type', 'User Agent Family', 'OS Family', 'Country'],
        ['2023-01-01', '1', '123', '456', '789', '100', '80', '10', '5', '15', 'google', 'desktop', 'Chrome', 'Windows', 'US'],
        ['2023-01-01', '1', '123', '456', '789', '120', '90', '12', '6', '18', 'facebook', 'mobile', 'Safari', 'iOS', 'CA'],
        ['2023-01-02', '1', '123', '456', '789', '150', '110', '15', '8', '20', '', 'desktop', 'Firefox', 'Linux', 'UK'],
      ];

      const headers = csvData[0] as string[];
      const dataRows = csvData.slice(1);

      // First upload
      const transformedData1 = dataRows.map(record => prepareTrafficReportData(record, headers));
      const result1 = await db.trafficReport.createMany({
        data: transformedData1,
        skipDuplicates: true
      });

      expect(result1.count).toBe(3);

      // Second upload (same data)
      const transformedData2 = dataRows.map(record => prepareTrafficReportData(record, headers));
      const result2 = await db.trafficReport.createMany({
        data: transformedData2,
        skipDuplicates: true
      });

      expect(result2.count).toBe(0); // All should be duplicates

      // Verify total count
      const totalRecords = await db.trafficReport.count();
      expect(totalRecords).toBe(3);
    });

    it('should handle partial duplicates correctly', async () => {
      // Initial data
      const initialData = [
        ['2023-01-01', '1', '123', '456', '789', '100', '80', '10', '5', '15', 'google', 'desktop', 'Chrome', 'Windows', 'US'],
        ['2023-01-02', '1', '123', '456', '789', '120', '90', '12', '6', '18', 'facebook', 'mobile', 'Safari', 'iOS', 'CA'],
      ];

      // Second upload with 1 duplicate + 2 new records
      const secondData = [
        ['2023-01-01', '1', '123', '456', '789', '100', '80', '10', '5', '15', 'google', 'desktop', 'Chrome', 'Windows', 'US'], // Duplicate
        ['2023-01-03', '1', '123', '456', '789', '150', '110', '15', '8', '20', 'twitter', 'tablet', 'Chrome', 'Android', 'AU'], // New
        ['2023-01-04', '1', '123', '456', '789', '200', '160', '20', '10', '25', '', 'desktop', 'Edge', 'Windows', 'DE'], // New
      ];

      const headers = [
        'Date', 'Foreign Brand ID', 'Foreign Partner ID', 'Foreign Campaign ID',
        'Foreign Landing ID', 'All Clicks', 'Unique Clicks', 'Registrations Count',
        'FTD Count', 'Deposits Count', 'Traffic Source', 'Device Type',
        'User Agent Family', 'OS Family', 'Country'
      ];

      // First upload
      const transformedInitial = initialData.map(record => prepareTrafficReportData(record, headers));
      const result1 = await db.trafficReport.createMany({
        data: transformedInitial,
        skipDuplicates: true
      });

      expect(result1.count).toBe(2);

      // Second upload
      const transformedSecond = secondData.map(record => prepareTrafficReportData(record, headers));
      const result2 = await db.trafficReport.createMany({
        data: transformedSecond,
        skipDuplicates: true
      });

      expect(result2.count).toBe(2); // 2 new records, 1 duplicate skipped

      // Verify total count
      const totalRecords = await db.trafficReport.count();
      expect(totalRecords).toBe(4);
    });
  });
});