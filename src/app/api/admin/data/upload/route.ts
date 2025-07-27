import { type NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '~/lib/auth';
import { db } from '~/server/db';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { parse } from 'csv-parse/sync';
import { type DataType } from '~/lib/csv-processing';

// CSV schema definitions for auto-detection with flexible column matching
const CSV_SCHEMAS = {
  traffic_report: {
    requiredColumns: [
      { variations: ['date'] },
      { variations: ['foreignBrandId', 'foreign_brand_id', 'Foreign Brand ID'] },
      { variations: ['foreignPartnerId', 'foreign_partner_id', 'Foreign Partner ID'] },
      { variations: ['foreignCampaignId', 'foreign_campaign_id', 'Foreign Campaign ID'] },
      { variations: ['allClicks', 'all_clicks', 'All Clicks'] },
      { variations: ['uniqueClicks', 'unique_clicks', 'Unique Clicks'] }
    ],
    expectedColumnCount: 19
  },
  players_data: {
    requiredColumns: [
      { variations: ['playerId', 'player_id', 'Player ID'] },
      { variations: ['originalPlayerId', 'original_player_id', 'Original player ID'] },
      { variations: ['partnerId', 'partner_id', 'Partner ID'] },
      { variations: ['ftdSum', 'ftd_sum', 'FTD sum'] },
      { variations: ['depositsSum', 'deposits_sum', 'Deposits sum'] }
    ],
    expectedColumnCount: 35
  }
} as const;


interface DetectionResult {
  type: DataType | null;
  columnCount: number;
  headers: string[];
  errors: string[];
}

function detectCSVType(headers: string[]): DetectionResult {
  const columnCount = headers.length;
  const errors: string[] = [];
  
  // Helper function to check if any variation of a required column exists in headers
  const findColumnMatch = (columnDef: { readonly variations: readonly string[] }): string | null => {
    for (const variation of columnDef.variations) {
      const match = headers.find(header => 
        header.toLowerCase().trim() === variation.toLowerCase().trim()
      );
      if (match) return match;
    }
    return null;
  };
  
  // Check traffic_report schema
  const trafficMatches = CSV_SCHEMAS.traffic_report.requiredColumns.map(findColumnMatch);
  const trafficMissing = CSV_SCHEMAS.traffic_report.requiredColumns
    .filter((_, index) => trafficMatches[index] === null)
    .map(col => col.variations[0]); // Use first variation as representative
  
  // Check players_data schema  
  const playerMatches = CSV_SCHEMAS.players_data.requiredColumns.map(findColumnMatch);
  const playerMissing = CSV_SCHEMAS.players_data.requiredColumns
    .filter((_, index) => playerMatches[index] === null)
    .map(col => col.variations[0]); // Use first variation as representative
  
  // Determine type based on missing columns and count
  if (trafficMissing.length === 0 && columnCount === CSV_SCHEMAS.traffic_report.expectedColumnCount) {
    return { type: 'traffic_report', columnCount, headers, errors };
  }
  
  if (playerMissing.length === 0 && columnCount === CSV_SCHEMAS.players_data.expectedColumnCount) {
    return { type: 'players_data', columnCount, headers, errors };
  }
  
  // If column count matches but some columns are missing, provide detailed feedback
  if (columnCount === CSV_SCHEMAS.traffic_report.expectedColumnCount && trafficMissing.length > 0) {
    errors.push(`Matches traffic_report column count (${columnCount}) but missing: ${trafficMissing.join(', ')}`);
  }
  
  if (columnCount === CSV_SCHEMAS.players_data.expectedColumnCount && playerMissing.length > 0) {
    errors.push(`Matches players_data column count (${columnCount}) but missing: ${playerMissing.join(', ')}`);
  }
  
  // If no exact matches, try to determine the closest match
  if (trafficMissing.length > 0 && playerMissing.length > 0) {
    if (trafficMissing.length < playerMissing.length) {
      errors.push(`Closest match: traffic_report (missing ${trafficMissing.length} columns: ${trafficMissing.join(', ')})`);
    } else if (playerMissing.length < trafficMissing.length) {
      errors.push(`Closest match: players_data (missing ${playerMissing.length} columns: ${playerMissing.join(', ')})`);
    } else {
      errors.push(`CSV doesn't clearly match any format. Missing for traffic_report: ${trafficMissing.join(', ')} | Missing for players_data: ${playerMissing.join(', ')}`);
    }
  }
  
  if (columnCount !== CSV_SCHEMAS.traffic_report.expectedColumnCount && columnCount !== CSV_SCHEMAS.players_data.expectedColumnCount) {
    errors.push(`Unexpected column count: ${columnCount}. Expected 19 (traffic_report) or 35 (players_data)`);
  }
  
  return { type: null, columnCount, headers, errors };
}

export async function POST(request: NextRequest) {
  try {
    // 1. Admin authentication check
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    // 2. Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // 3. File validation
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 50MB' },
        { status: 400 }
      );
    }

    if (!file.name.toLowerCase().endsWith('.csv')) {
      return NextResponse.json(
        { error: 'Invalid file type. Only CSV files are allowed' },
        { status: 400 }
      );
    }

    // 4. Read and parse CSV headers for type detection
    const buffer = Buffer.from(await file.arrayBuffer());
    const csvText = buffer.toString('utf-8');
    
    // Parse just the first few rows for analysis
    let records: string[][];
    try {
      records = parse(csvText, {
        delimiter: ',',
        skip_empty_lines: true,
        from_line: 1,
        to_line: 5 // Only parse first 5 rows for detection
      });
    } catch {
      return NextResponse.json(
        { error: 'Invalid CSV format' },
        { status: 400 }
      );
    }

    if (records.length === 0) {
      return NextResponse.json(
        { error: 'CSV file is empty' },
        { status: 400 }
      );
    }

    // 5. Detect CSV type
    const csvHeaders = records[0];
    if (!csvHeaders) {
      return NextResponse.json(
        { error: 'No headers found in CSV' },
        { status: 400 }
      );
    }
    const detection = detectCSVType(csvHeaders);

    if (!detection.type) {
      return NextResponse.json(
        { 
          error: 'Unable to detect CSV format',
          details: detection.errors
        },
        { status: 400 }
      );
    }

    // 6. Count total rows (excluding header)
    const allRecords = parse(csvText, {
      delimiter: ',',
      skip_empty_lines: true,
      from_line: 2 // Skip header
    });
    const totalRows = allRecords.length;

    // 7. Create ImportJob record first to get the ID
    const importJob = await db.importJob.create({
      data: {
        userId: session.user.id,
        type: detection.type,
        status: 'uploading',
        filename: file.name,
        totalRows,
        processedRows: 0
      }
    });

    // 8. Create temp directory if it doesn't exist
    const tempDir = process.env.NODE_ENV === 'production' 
      ? '/tmp/uploads' 
      : join(process.cwd(), 'temp', 'uploads');
    await mkdir(tempDir, { recursive: true });

    // 9. Save file with job ID as filename
    const filePath = join(tempDir, `${importJob.id}.csv`);
    await writeFile(filePath, buffer);

    // 10. Return job info for client
    return NextResponse.json({
      success: true,
      jobId: importJob.id,
      type: detection.type,
      filename: file.name,
      totalRows,
      columnCount: detection.columnCount,
      preview: records.slice(0, 3) // First 3 rows including header
    });

  } catch {
    console.error('Upload error');
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    );
  }
}