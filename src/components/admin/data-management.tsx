'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { Progress } from '~/components/ui/progress';
import { Badge } from '~/components/ui/badge';
import { Separator } from '~/components/ui/separator';
import { Alert, AlertDescription } from '~/components/ui/alert';
import { 
  Upload, 
  Database, 
  FileText, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  X,
  RefreshCw
} from 'lucide-react';
import { adminNotifications } from '~/lib/toast-utils';

interface ImportJob {
  id: string;
  status: 'uploading' | 'processing' | 'completed' | 'failed';
  filename: string;
  type: 'traffic_report' | 'players_data';
  totalRows: number | null;
  processedRows: number;
  progressPercentage: number;
  isActive: boolean;
  errorCount: number;
  errors: unknown[] | null;
  processingTimeSeconds: number;
  createdAt: string;
  updatedAt: string;
  user: {
    name: string;
    email: string;
  };
}

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

export function DataManagement() {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [currentJob, setCurrentJob] = useState<ImportJob | null>(null);
  const [dbStatus, setDbStatus] = useState<DatabaseStatus | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load database status
  const loadDatabaseStatus = useCallback(async () => {
    try {
      setIsLoadingStatus(true);
      const response = await fetch('/api/admin/data/database-status');
      if (response.ok) {
        const status = await response.json() as DatabaseStatus;
        setDbStatus(status);
      } else {
        console.error('Failed to load database status');
      }
    } catch (error) {
      console.error('Error loading database status:', error);
    } finally {
      setIsLoadingStatus(false);
    }
  }, []);

  // Poll job status
  const pollJobStatus = useCallback(async (jobId: string) => {
    try {
      const response = await fetch(`/api/admin/data/status/${jobId}`);
      if (response.ok) {
        const job = await response.json() as ImportJob;
        setCurrentJob(job);
        
        if (!job.isActive) {
          // Job completed, stop polling
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }
          
          // Job completed - no toast here since promise-based loading handles it
          
          // Refresh database status
          void loadDatabaseStatus();
        }
      }
    } catch (error) {
      console.error('Error polling job status:', error);
    }
  }, [loadDatabaseStatus]);

  // Start polling
  const startPolling = useCallback((jobId: string) => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }
    
    pollIntervalRef.current = setInterval(() => {
      void pollJobStatus(jobId);
    }, 2000); // Poll every 2 seconds
    
    // Initial poll
    void pollJobStatus(jobId);
  }, [pollJobStatus]);

  // Handle file upload
  const handleFileUpload = async (file: File) => {
    if (!file) return;

    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/admin/data/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json() as { 
        success: boolean;
        jobId: string;
        type: string;
        error?: string;
      };

      if (response.ok) {
        // Create promise for the entire processing operation
        const processingPromise = fetch('/api/admin/data/process', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jobId: result.jobId }),
        }).then(async (processResponse) => {
          if (!processResponse.ok) {
            throw new Error('Processing failed');
          }
          const processResult = await processResponse.json() as {successfulInserts: number};
          return {
            type: result.type.replace('_', ' '),
            count: processResult.successfulInserts
          };
        });

        // Show loading toast for the actual processing time
        adminNotifications.data.loading(processingPromise, `Processing ${result.type.replace('_', ' ')} data`);
        
        // Start polling for UI progress updates
        startPolling(result.jobId);
      } else {
        adminNotifications.data.error(result.error ?? 'File upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      adminNotifications.data.error('Upload failed due to a network or server error');
    } finally {
      setIsUploading(false);
    }
  };

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      void handleFileUpload(file);
    }
  };

  // Handle drag and drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      void handleFileUpload(file);
    }
  };

  // Load initial status
  useEffect(() => {
    void loadDatabaseStatus();
  }, [loadDatabaseStatus]);

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Data Import
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              dragActive 
                ? 'border-primary bg-primary/5' 
                : 'border-muted-foreground/25 hover:border-muted-foreground/50'
            } ${isUploading ? 'opacity-50' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mb-2">
              Drop CSV files here or click to browse
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              Supports Traffic Report and Players Data CSV files
            </p>
            <Button 
              variant="outline" 
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading ? 'Uploading...' : 'Select File'}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {/* Progress Section */}
          {currentJob && (
            <div className="space-y-3">
              <Separator />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span className="font-medium">{currentJob.filename}</span>
                  <Badge variant={
                    currentJob.status === 'completed' ? 'default' :
                    currentJob.status === 'failed' ? 'destructive' :
                    'secondary'
                  }>
                    {currentJob.status}
                  </Badge>
                </div>
                {currentJob.isActive && (
                  <Clock className="h-4 w-4 text-muted-foreground animate-spin" />
                )}
              </div>

              {currentJob.totalRows && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>{currentJob.processedRows} / {currentJob.totalRows} rows</span>
                  </div>
                  <Progress value={currentJob.progressPercentage} />
                </div>
              )}

              {currentJob.errorCount > 0 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {currentJob.errorCount} validation errors found during processing
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Database Status */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Database Status
          </CardTitle>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadDatabaseStatus}
            disabled={isLoadingStatus}
          >
            <RefreshCw className={`h-4 w-4 ${isLoadingStatus ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {dbStatus && (
            <>
              <div className="flex items-center gap-2">
                {dbStatus.connection === 'connected' ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <X className="h-4 w-4 text-red-500" />
                )}
                <span className="text-sm">
                  Database: {dbStatus.connection}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Traffic Reports</h4>
                  <p className="text-sm text-muted-foreground">
                    {dbStatus.tables.traffic_report.count.toLocaleString()} records
                  </p>
                  {dbStatus.tables.traffic_report.dateRange && (
                    <p className="text-xs text-muted-foreground">
                      {new Date(dbStatus.tables.traffic_report.dateRange.min).toLocaleDateString()} - {new Date(dbStatus.tables.traffic_report.dateRange.max).toLocaleDateString()}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Players Data</h4>
                  <p className="text-sm text-muted-foreground">
                    {dbStatus.tables.players_data.count.toLocaleString()} records
                  </p>
                  {dbStatus.tables.players_data.dateRange && (
                    <p className="text-xs text-muted-foreground">
                      {new Date(dbStatus.tables.players_data.dateRange.min).toLocaleDateString()} - {new Date(dbStatus.tables.players_data.dateRange.max).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>

              {dbStatus.activeImports > 0 && (
                <Alert>
                  <Clock className="h-4 w-4" />
                  <AlertDescription>
                    {dbStatus.activeImports} import(s) currently in progress
                  </AlertDescription>
                </Alert>
              )}

              {dbStatus.recentImports.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium">Recent Imports</h4>
                  <div className="space-y-2">
                    {dbStatus.recentImports.slice(0, 5).map((importJob) => (
                      <div key={importJob.id} className="flex items-center justify-between text-sm p-2 rounded border">
                        <div className="flex items-center gap-2">
                          <span className="truncate max-w-[200px]">{importJob.filename}</span>
                          <Badge variant="outline" className="text-xs">
                            {importJob.type}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={
                            importJob.status === 'completed' ? 'default' :
                            importJob.status === 'failed' ? 'destructive' :
                            'secondary'
                          }>
                            {importJob.status}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(importJob.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}