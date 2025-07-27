import { type NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '~/lib/auth';
import { db } from '~/server/db';

interface DatabaseStatus {
  connection: 'connected' | 'disconnected';
  tables: {
    traffic_report: {
      count: number;
      dateRange: { min: string; max: string } | null;
    };
    players_data: {
      count: number;
      dateRange: { min: string; max: string } | null;
    };
  };
  activeImports: number;
  lastImport: string | null;
  recentImports: Array<{
    id: string;
    filename: string;
    type: string;
    status: string;
    totalRows: number | null;
    processedRows: number;
    createdAt: string;
    user: {
      name: string;
      email: string;
    };
  }>;
}

export async function GET(_request: NextRequest) {
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

    // 2. Check database connection
    let connectionStatus: 'connected' | 'disconnected' = 'connected';
    try {
      await db.$queryRaw`SELECT 1`;
    } catch {
      connectionStatus = 'disconnected';
    }

    // 3. Get traffic report statistics
    let trafficReportStats = {
      count: 0,
      dateRange: null as { min: string; max: string } | null
    };

    try {
      const trafficCount = await db.trafficReport.count();
      const trafficDateRange = await db.trafficReport.aggregate({
        _min: { date: true },
        _max: { date: true }
      });

      trafficReportStats = {
        count: trafficCount,
        dateRange: trafficDateRange._min.date && trafficDateRange._max.date ? {
          min: trafficDateRange._min.date.toISOString(),
          max: trafficDateRange._max.date.toISOString()
        } : null
      };
    } catch (error) {
      console.error('Error getting traffic report stats:', error);
    }

    // 4. Get players data statistics
    let playersDataStats = {
      count: 0,
      dateRange: null as { min: string; max: string } | null
    };

    try {
      const playerCount = await db.playersData.count();
      const playerDateRange = await db.playersData.aggregate({
        _min: { date: true },
        _max: { date: true }
      });

      playersDataStats = {
        count: playerCount,
        dateRange: playerDateRange._min.date && playerDateRange._max.date ? {
          min: playerDateRange._min.date.toISOString(),
          max: playerDateRange._max.date.toISOString()
        } : null
      };
    } catch (error) {
      console.error('Error getting players data stats:', error);
    }

    // 5. Get active imports count
    let activeImports = 0;
    try {
      activeImports = await db.importJob.count({
        where: {
          status: {
            in: ['uploading', 'processing']
          }
        }
      });
    } catch (error) {
      console.error('Error getting active imports:', error);
    }

    // 6. Get last import date
    let lastImport: string | null = null;
    try {
      const lastImportJob = await db.importJob.findFirst({
        where: { status: 'completed' },
        orderBy: { updatedAt: 'desc' },
        select: { updatedAt: true }
      });
      
      lastImport = lastImportJob?.updatedAt.toISOString() ?? null;
    } catch (error) {
      console.error('Error getting last import:', error);
    }

    // 7. Get recent imports (last 10)
    let recentImports: DatabaseStatus['recentImports'] = [];
    try {
      const recentImportJobs = await db.importJob.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          filename: true,
          type: true,
          status: true,
          totalRows: true,
          processedRows: true,
          createdAt: true,
          user: {
            select: {
              name: true,
              email: true
            }
          }
        }
      });

      recentImports = recentImportJobs.map(job => ({
        id: job.id,
        filename: job.filename,
        type: job.type,
        status: job.status,
        totalRows: job.totalRows,
        processedRows: job.processedRows,
        createdAt: job.createdAt.toISOString(),
        user: {
          name: job.user.name,
          email: job.user.email
        }
      }));
    } catch (error) {
      console.error('Error getting recent imports:', error);
    }

    // 8. Build response
    const status: DatabaseStatus = {
      connection: connectionStatus,
      tables: {
        traffic_report: trafficReportStats,
        players_data: playersDataStats
      },
      activeImports,
      lastImport,
      recentImports
    };

    return NextResponse.json(status);

  } catch (error) {
    console.error('Database status error:', error);
    return NextResponse.json(
      { error: 'Failed to get database status' },
      { status: 500 }
    );
  }
}