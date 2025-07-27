import { type NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '~/lib/auth';
import { db } from '~/server/db';
import { readFile, unlink } from 'fs/promises';
import { join } from 'path';
import { parse } from 'csv-parse/sync';
import type { Prisma } from '@prisma/client';
import { 
  validateRecord, 
  prepareTrafficReportData, 
  preparePlayersData,
  type ValidationError,
  type DataType
} from '~/lib/csv-processing';

// Types for API processing

interface ProcessRequestBody {
  jobId: string;
}

type ImportJobWithUser = Prisma.ImportJobGetPayload<{
  include: { user: true };
}>;

type TrafficReportCreateInput = Prisma.TrafficReportCreateManyInput;
type PlayersDataCreateInput = Prisma.PlayersDataCreateManyInput;

// Data preparation functions are now imported from modular CSV processing library

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Processing request started');
    
    // 1. Admin authentication check
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user || session.user.role !== 'admin') {
      console.log('❌ Authentication failed');
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }
    
    console.log('✅ Authentication passed');

    // 2. Get job ID from request
    const requestBody = await request.json() as ProcessRequestBody;
    const { jobId } = requestBody;
    console.log('📋 Job ID:', jobId);
    
    if (!jobId) {
      console.log('❌ No job ID provided');
      return NextResponse.json(
        { error: 'Job ID required' },
        { status: 400 }
      );
    }

    // 3. Load import job
    console.log('🔍 Looking up import job...');
    const importJob: ImportJobWithUser | null = await db.importJob.findUnique({
      where: { id: jobId },
      include: { user: true }
    });

    if (!importJob) {
      console.log('❌ Import job not found');
      return NextResponse.json(
        { error: 'Import job not found' },
        { status: 404 }
      );
    }

    console.log('✅ Import job found:', importJob.type, importJob.status);

    if (importJob.status !== 'uploading') {
      console.log('❌ Job not ready for processing, status:', importJob.status);
      return NextResponse.json(
        { error: 'Job not ready for processing' },
        { status: 400 }
      );
    }

    // 4. Update job status to processing
    console.log('🔄 Updating job status to processing...');
    await db.importJob.update({
      where: { id: jobId },
      data: { status: 'processing' }
    });

    // 5. Read CSV file
    console.log('📁 Reading CSV file...');
    const tempDir = process.env.NODE_ENV === 'production' 
      ? '/tmp/uploads' 
      : join(process.cwd(), 'temp', 'uploads');
    const filePath = join(tempDir, `${jobId}.csv`);
    console.log('📂 File path:', filePath);
    
    let csvContent: string;
    try {
      csvContent = await readFile(filePath, 'utf-8');
      console.log('✅ CSV file read successfully, length:', csvContent.length);
    } catch (fileError) {
      console.log('❌ Failed to read CSV file:', fileError);
      await db.importJob.update({
        where: { id: jobId },
        data: { 
          status: 'failed',
          errors: [{ error: 'Failed to read uploaded file' }]
        }
      });
      return NextResponse.json(
        { error: 'Failed to read uploaded file' },
        { status: 500 }
      );
    }

    // 6. Parse CSV
    let records: string[][];
    try {
      records = parse(csvContent, {
        delimiter: ',',
        skip_empty_lines: true,
        from_line: 1
      });
    } catch {
      await db.importJob.update({
        where: { id: jobId },
        data: { 
          status: 'failed',
          errors: [{ error: 'Failed to parse CSV file' }]
        }
      });
      return NextResponse.json(
        { error: 'Failed to parse CSV file' },
        { status: 500 }
      );
    }

    if (records.length < 2) {
      await db.importJob.update({
        where: { id: jobId },
        data: { 
          status: 'failed',
          errors: [{ error: 'CSV must contain headers and at least one data row' }]
        }
      });
      return NextResponse.json(
        { error: 'CSV must contain headers and at least one data row' },
        { status: 400 }
      );
    }

    // 7. Process data in chunks
    const csvHeaders = records[0];
    if (!csvHeaders) {
      await db.importJob.update({
        where: { id: jobId },
        data: { 
          status: 'failed',
          errors: [{ error: 'No headers found in CSV' }]
        }
      });
      return NextResponse.json(
        { error: 'No headers found in CSV' },
        { status: 400 }
      );
    }
    
    // Debug logging for headers and first few rows
    console.log('🔍 CSV Headers:', csvHeaders);
    console.log('🔍 Import job type:', importJob.type);
    console.log('📊 Total data rows:', records.length - 1);
    if (records.length > 1) {
      console.log('🔍 Sample data row 1:', records[1]);
      if (records.length > 2) {
        console.log('🔍 Sample data row 2:', records[2]);
      }
    }
    
    const dataRows = records.slice(1);
    const chunkSize = 500;
    const allErrors: ValidationError[] = [];
    let processedRows = 0;
    let successfulInserts = 0;
    let totalAttemptedInserts = 0;
    let totalSkippedDuplicates = 0;

    for (let i = 0; i < dataRows.length; i += chunkSize) {
      const chunk = dataRows.slice(i, i + chunkSize);
      
      // Validate chunk
      for (let j = 0; j < chunk.length; j++) {
        const rowNumber = i + j + 2; // +2 for header and 0-based index
        const errors = validateRecord(chunk[j] ?? [], csvHeaders, importJob.type as DataType, rowNumber);
        if (errors.length > 0) {
          console.log(`❌ Row ${rowNumber} validation errors:`, errors);
          console.log(`📝 Row ${rowNumber} data:`, chunk[j]);
        }
        allErrors.push(...errors);
      }
      
      console.log(`🔍 Chunk ${Math.floor(i/chunkSize) + 1}: ${chunk.length} rows, ${allErrors.filter(e => e.row >= i + 2 && e.row < i + 2 + chunk.length && e.severity === 'error').length} validation errors`);

      // Process valid records only
      const validRecords = chunk.filter((_, index) => {
        const rowNumber = i + index + 2;
        const hasErrors = allErrors.some(err => err.row === rowNumber && err.severity === 'error');
        return !hasErrors;
      });

      // Insert valid records into database
      if (validRecords.length > 0) {
        try {
          if (importJob.type === 'traffic_report') {
            const dataToInsert: TrafficReportCreateInput[] = validRecords.map(record => 
              prepareTrafficReportData(record, csvHeaders)
            );
            
            console.log(`💾 Attempting to insert ${dataToInsert.length} traffic_report records`);
            const result = await db.trafficReport.createMany({
              data: dataToInsert,
              skipDuplicates: true
            });
            console.log(`💾 Successfully inserted ${result.count} traffic_report records`);
            console.log(`💾 Skipped duplicates: ${dataToInsert.length - result.count}`);
            
            totalAttemptedInserts += dataToInsert.length;
            totalSkippedDuplicates += (dataToInsert.length - result.count);
            successfulInserts += result.count;
          } else if (importJob.type === 'players_data') {
            const dataToInsert: PlayersDataCreateInput[] = validRecords.map(record => 
              preparePlayersData(record, csvHeaders)
            );
            
            console.log(`💾 Attempting to insert ${dataToInsert.length} players_data records`);
            const result = await db.playersData.createMany({
              data: dataToInsert,
              skipDuplicates: true
            });
            console.log(`💾 Actually inserted ${result.count} players_data records`);
            successfulInserts += result.count;
          }
        } catch (dbError) {
          console.error('Database error:', dbError);
          allErrors.push({
            row: i + 1,
            column: 'database',
            value: 'chunk',
            error: `Database insertion failed for chunk starting at row ${i + 2}`,
            severity: 'error'
          });
        }
      }

      processedRows += chunk.length;

      // Update progress
      await db.importJob.update({
        where: { id: jobId },
        data: { processedRows }
      });
    }

    // 8. Finalize job
    console.log(`📊 Processing summary:`);
    console.log(`📊 Total rows in CSV: ${dataRows.length}`);
    console.log(`📊 Total validation errors: ${allErrors.length}`);
    console.log(`📊 Rows with errors: ${allErrors.filter(e => e.severity === 'error').length}`);
    console.log(`📊 Valid rows: ${dataRows.length - new Set(allErrors.filter(e => e.severity === 'error').map(e => e.row)).size}`);
    console.log(`📊 Total attempted insertions: ${totalAttemptedInserts}`);
    console.log(`📊 Successfully inserted: ${successfulInserts}`);
    console.log(`📊 Total skipped duplicates: ${totalSkippedDuplicates}`);
    
    const finalStatus = allErrors.filter(e => e.severity === 'error').length > 0 
      ? (successfulInserts > 0 ? 'completed' : 'failed')
      : 'completed';

    await db.importJob.update({
      where: { id: jobId },
      data: {
        status: finalStatus,
        processedRows,
        errors: allErrors.length > 0 ? JSON.parse(JSON.stringify(allErrors)) as Prisma.InputJsonValue : undefined
      }
    });

    // 9. Clean up temp file
    try {
      await unlink(filePath);
    } catch {
      console.warn('Failed to delete temp file');
    }

    // 10. Return results
    return NextResponse.json({
      success: true,
      status: finalStatus,
      processedRows,
      successfulInserts,
      errorCount: allErrors.length,
      errors: allErrors.slice(0, 50) // Return first 50 errors for display
    });

  } catch (error) {
    console.error('Processing error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
    return NextResponse.json(
      { error: 'Processing failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}