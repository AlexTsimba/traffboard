import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { writeFile, unlink, mkdir } from 'fs/promises';
import { join } from 'path';
import { db } from '~/server/db';
import { POST } from '~/app/api/admin/data/process/route';
import { NextRequest } from 'next/server';

describe('Traffic Report Processing API Integration', () => {
  const tempDir = join(process.cwd(), 'temp', 'uploads');
  
  beforeEach(async () => {
    await db.trafficReport.deleteMany({});
    await db.importJob.deleteMany({});
    await db.user.deleteMany({});
    
    try {
      await mkdir(tempDir, { recursive: true });
    } catch (e) {
      // Directory might already exist
    }
    
    await db.user.create({
      data: {
        id: 'test-admin-id',
        email: 'admin@test.com',
        name: 'Test Admin',
        role: 'admin',
        emailVerified: true,
      }
    });
  });

  afterEach(async () => {
    await db.trafficReport.deleteMany({});
    await db.importJob.deleteMany({});
    await db.user.deleteMany({});
  });

  describe('CSV File Processing', () => {
    it('should process valid CSV file and detect duplicates correctly', async () => {
      const csvContent = `Date,Foreign Brand ID,Foreign Partner ID,Foreign Campaign ID,Foreign Landing ID,All Clicks,Unique Clicks,Registrations Count,FTD Count,Deposits Count,Traffic Source,Device Type,User Agent Family,OS Family,Country
2023-01-01,1,123,456,789,100,80,10,5,15,google,desktop,Chrome,Windows,US
2023-01-01,1,123,456,789,120,90,12,6,18,facebook,mobile,Safari,iOS,CA
2023-01-02,1,123,456,789,150,110,15,8,20,,desktop,Firefox,Linux,UK`;

      const jobId = 'test-job-' + Date.now();
      const csvPath = join(tempDir, `${jobId}.csv`);
      
      // Write CSV file
      await writeFile(csvPath, csvContent);
      
      // Create import job
      const importJob = await db.importJob.create({
        data: {
          id: jobId,
          type: 'traffic_report',
          filename: 'test.csv',
          status: 'uploading',
          totalRows: 3,
          processedRows: 0,
          userId: 'test-admin-id'
        }
      });

      // Create request and call POST function directly
      const request = new NextRequest('http://localhost:3000/api/admin/data/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId }),
      });

      const response = await POST(request);
      expect(response.status).toBe(200);
      const result = await response.json();
      
      expect(result.success).toBe(true);
      expect(result.successfulInserts).toBe(3);
      expect(result.processedRows).toBe(3);
      
      // Verify database state
      const totalRecords = await db.trafficReport.count();
      expect(totalRecords).toBe(3);
      
      // Clean up (file may already be deleted by process route)
      try {
        await unlink(csvPath);
      } catch {
        // File already cleaned up by process route
      }
    });

    it('should handle file processing with internal duplicates', async () => {
      const csvContent = `Date,Foreign Brand ID,Foreign Partner ID,Foreign Campaign ID,Foreign Landing ID,All Clicks,Unique Clicks,Registrations Count,FTD Count,Deposits Count,Traffic Source,Device Type,User Agent Family,OS Family,Country
2023-01-01,1,123,456,789,100,80,10,5,15,google,desktop,Chrome,Windows,US
2023-01-01,1,123,456,789,120,90,12,6,18,facebook,mobile,Safari,iOS,CA
2023-01-01,1,123,456,789,100,80,10,5,15,google,desktop,Chrome,Windows,US
2023-01-01,1,123,456,789,120,90,12,6,18,facebook,mobile,Safari,iOS,CA
2023-01-02,1,123,456,789,150,110,15,8,20,,desktop,Firefox,Linux,UK`;

      const jobId = 'test-job-duplicates-' + Date.now();
      const csvPath = join(tempDir, `${jobId}.csv`);
      
      await writeFile(csvPath, csvContent);
      
      await db.importJob.create({
        data: {
          id: jobId,
          type: 'traffic_report',
          filename: 'test-duplicates.csv',
          status: 'uploading',
          totalRows: 5,
          processedRows: 0,
          userId: 'test-admin-id'
        }
      });

      const request = new NextRequest('http://localhost:3000/api/admin/data/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId }),
      });

      const response = await POST(request);
      expect(response.status).toBe(200);
      const result = await response.json();
      
      expect(result.success).toBe(true);
      expect(result.processedRows).toBe(5);
      expect(result.successfulInserts).toBe(3); // Only 3 unique records
      
      const totalRecords = await db.trafficReport.count();
      expect(totalRecords).toBe(3);
      
      // Clean up (file may already be deleted by process route)
      try {
        await unlink(csvPath);
      } catch {
        // File already cleaned up by process route
      }
    });

    it('should handle empty traffic source in deduplication', async () => {
      const csvContent = `Date,Foreign Brand ID,Foreign Partner ID,Foreign Campaign ID,Foreign Landing ID,All Clicks,Unique Clicks,Registrations Count,FTD Count,Deposits Count,Traffic Source,Device Type,User Agent Family,OS Family,Country
2023-01-01,1,123,456,789,100,80,10,5,15,,desktop,Chrome,Windows,US
2023-01-01,1,123,456,789,100,80,10,5,15,,desktop,Chrome,Windows,US`;

      const jobId = 'test-job-empty-source-' + Date.now();
      const csvPath = join(tempDir, `${jobId}.csv`);
      
      await writeFile(csvPath, csvContent);
      
      await db.importJob.create({
        data: {
          id: jobId,
          type: 'traffic_report',
          filename: 'test-empty-source.csv',
          status: 'uploading',
          totalRows: 2,
          processedRows: 0,
          userId: 'test-admin-id'
        }
      });

      const request = new NextRequest('http://localhost:3000/api/admin/data/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId }),
      });

      const response = await POST(request);
      expect(response.status).toBe(200);
      const result = await response.json();
      
      expect(result.success).toBe(true);
      expect(result.processedRows).toBe(2);
      expect(result.successfulInserts).toBe(1); // Second record should be duplicate
      
      const totalRecords = await db.trafficReport.count();
      expect(totalRecords).toBe(1);
      
      // Clean up (file may already be deleted by process route)
      try {
        await unlink(csvPath);
      } catch {
        // File already cleaned up by process route
      }
    });

    it('should handle large batch processing correctly', async () => {
      // Generate a large CSV with 1000+ rows
      const headers = 'Date,Foreign Brand ID,Foreign Partner ID,Foreign Campaign ID,Foreign Landing ID,All Clicks,Unique Clicks,Registrations Count,FTD Count,Deposits Count,Traffic Source,Device Type,User Agent Family,OS Family,Country';
      const rows = [];
      
      for (let i = 0; i < 1500; i++) {
        const date = `2023-01-${String((i % 31) + 1).padStart(2, '0')}`;
        const source = `source-${i % 10}`;
        rows.push(`${date},1,123,456,789,${i + 100},${i + 80},${i + 10},${i + 5},${i + 15},${source},desktop,Chrome,Windows,US`);
      }
      
      const csvContent = headers + '\n' + rows.join('\n');
      const jobId = 'test-job-large-' + Date.now();
      const csvPath = join(tempDir, `${jobId}.csv`);
      
      await writeFile(csvPath, csvContent);
      
      await db.importJob.create({
        data: {
          id: jobId,
          type: 'traffic_report',
          filename: 'test-large.csv',
          status: 'uploading',
          totalRows: 1500,
          processedRows: 0,
          userId: 'test-admin-id'
        }
      });

      const startTime = Date.now();
      const request = new NextRequest('http://localhost:3000/api/admin/data/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId }),
      });
      const response = await POST(request);
      const endTime = Date.now();

      expect(response.status).toBe(200);
      const result = await response.json();
      
      expect(result.success).toBe(true);
      expect(result.processedRows).toBe(1500);
      expect(result.successfulInserts).toBeGreaterThan(0);
      
      // Should complete within reasonable time (under 30 seconds)
      expect(endTime - startTime).toBeLessThan(30000);
      
      const totalRecords = await db.trafficReport.count();
      expect(totalRecords).toBe(result.successfulInserts);
      
      // Clean up (file may already be deleted by process route)
      try {
        await unlink(csvPath);
      } catch {
        // File already cleaned up by process route
      }
    });

    it('should handle validation errors appropriately', async () => {
      const csvContent = `Date,Foreign Brand ID,Foreign Partner ID,Foreign Campaign ID,Foreign Landing ID,All Clicks,Unique Clicks,Registrations Count,FTD Count,Deposits Count,Traffic Source,Device Type,User Agent Family,OS Family,Country
invalid-date,not-a-number,123,456,789,100,80,10,5,15,google,desktop,Chrome,Windows,US
2023-01-01,1,123,456,789,-100,80,10,5,15,facebook,mobile,Safari,iOS,CA
2023-01-02,1,123,456,789,150,110,15,8,20,,desktop,Firefox,Linux,UK`;

      const jobId = 'test-job-validation-' + Date.now();
      const csvPath = join(tempDir, `${jobId}.csv`);
      
      await writeFile(csvPath, csvContent);
      
      await db.importJob.create({
        data: {
          id: jobId,
          type: 'traffic_report',
          filename: 'test-validation.csv',
          status: 'uploading',
          totalRows: 3,
          processedRows: 0,
          userId: 'test-admin-id'
        }
      });

      const request = new NextRequest('http://localhost:3000/api/admin/data/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId }),
      });

      const response = await POST(request);
      expect(response.status).toBe(200);
      const result = await response.json();
      
      expect(result.success).toBe(true);
      expect(result.errorCount).toBeGreaterThan(0);
      expect(result.errors).toBeDefined();
      expect(Array.isArray(result.errors)).toBe(true);
      
      // Should insert valid records only
      expect(result.successfulInserts).toBe(1); // Only the third record is valid
      
      // Clean up (file may already be deleted by process route)
      try {
        await unlink(csvPath);
      } catch {
        // File already cleaned up by process route
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle missing file gracefully', async () => {
      const jobId = 'test-job-missing-file-' + Date.now();
      
      await db.importJob.create({
        data: {
          id: jobId,
          type: 'traffic_report',
          filename: 'nonexistent.csv',
          status: 'uploading',
          totalRows: 0,
          processedRows: 0,
          userId: 'test-admin-id'
        }
      });

      const request = new NextRequest('http://localhost:3000/api/admin/data/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId }),
      });

      const response = await POST(request);
      expect(response.status).toBe(500);
      
      const updatedJob = await db.importJob.findUnique({ where: { id: jobId } });
      expect(updatedJob?.status).toBe('failed');
    });

    it('should handle malformed CSV gracefully', async () => {
      const malformedCsv = `Date,Foreign Brand ID
2023-01-01,1,"unclosed quote
2023-01-02,2`;

      const jobId = 'test-job-malformed-' + Date.now();
      const csvPath = join(tempDir, `${jobId}.csv`);
      
      await writeFile(csvPath, malformedCsv);
      
      await db.importJob.create({
        data: {
          id: jobId,
          type: 'traffic_report',
          filename: 'malformed.csv',
          status: 'uploading',
          totalRows: 2,
          processedRows: 0,
          userId: 'test-admin-id'
        }
      });

      const request = new NextRequest('http://localhost:3000/api/admin/data/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId }),
      });

      const response = await POST(request);
      expect(response.status).toBe(500);
      
      // Clean up (file may already be deleted by process route)
      try {
        await unlink(csvPath);
      } catch {
        // File already cleaned up by process route
      }
    });

    it('should handle empty CSV file', async () => {
      const jobId = 'test-job-empty-' + Date.now();
      const csvPath = join(tempDir, `${jobId}.csv`);
      
      await writeFile(csvPath, '');
      
      await db.importJob.create({
        data: {
          id: jobId,
          type: 'traffic_report',
          filename: 'empty.csv',
          status: 'uploading',
          totalRows: 0,
          processedRows: 0,
          userId: 'test-admin-id'
        }
      });

      const request = new NextRequest('http://localhost:3000/api/admin/data/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId }),
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
      
      // Clean up (file may already be deleted by process route)
      try {
        await unlink(csvPath);
      } catch {
        // File already cleaned up by process route
      }
    });
  });
});