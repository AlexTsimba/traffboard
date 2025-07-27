import { type NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '~/lib/auth';
import { db } from '~/server/db';

interface RouteParams {
  params: Promise<{
    jobId: string;
  }>;
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
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

    // 2. Get job ID from params
    const { jobId } = await params;
    
    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID required' },
        { status: 400 }
      );
    }

    // 3. Find import job
    const importJob = await db.importJob.findUnique({
      where: { id: jobId },
      select: {
        id: true,
        status: true,
        filename: true,
        type: true,
        totalRows: true,
        processedRows: true,
        errors: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    if (!importJob) {
      return NextResponse.json(
        { error: 'Import job not found' },
        { status: 404 }
      );
    }

    // 4. Calculate progress percentage
    const progressPercentage = importJob.totalRows && importJob.totalRows > 0
      ? Math.round((importJob.processedRows / importJob.totalRows) * 100)
      : 0;

    // 5. Determine if job is active
    const isActive = importJob.status === 'uploading' || importJob.status === 'processing';

    // 6. Format error count
    const errorCount = Array.isArray(importJob.errors) ? importJob.errors.length : 0;

    // 7. Calculate processing time
    const processingTimeMs = importJob.updatedAt.getTime() - importJob.createdAt.getTime();
    const processingTimeSeconds = Math.round(processingTimeMs / 1000);

    // 8. Return job status
    return NextResponse.json({
      id: importJob.id,
      status: importJob.status,
      filename: importJob.filename,
      type: importJob.type,
      totalRows: importJob.totalRows,
      processedRows: importJob.processedRows,
      progressPercentage,
      isActive,
      errorCount,
      errors: importJob.errors,
      processingTimeSeconds,
      createdAt: importJob.createdAt.toISOString(),
      updatedAt: importJob.updatedAt.toISOString(),
      user: importJob.user
    });

  } catch (error) {
    console.error('Status check error:', error);
    return NextResponse.json(
      { error: 'Failed to check job status' },
      { status: 500 }
    );
  }
}