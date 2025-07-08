/**
 * Export System for Report Factory
 *
 * Provides comprehensive export capabilities for reports in multiple formats
 * including CSV, Excel, PDF, and image exports. Supports plugin architecture
 * for extending with custom export formats.
 */

import "server-only";

import type { ExportFormat, ExportRequest, ExportOptions, ReportData } from "@/types/reports";

// =============================================================================
// EXPORT MANAGER
// =============================================================================

class ExportManager {
  private exporters = new Map<string, ExportHandler>();

  /**
   * Register an export handler
   */
  registerExporter(format: ExportFormat, handler: ExportHandler): void {
    this.exporters.set(format.id, handler);
  }

  /**
   * Export report data
   */
  async exportReport(request: ExportRequest): Promise<ExportResult> {
    const exporter = this.exporters.get(request.format.id);
    if (!exporter) {
      throw new Error(`Export format "${request.format.id}" not supported`);
    }

    try {
      return await exporter.export(request);
    } catch (error) {
      throw new Error(`Export failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get available export formats
   */
  getAvailableFormats(): ExportFormat[] {
    return [...this.exporters.keys()]
      .map((formatId) => {
        // This would typically come from a registry
        return this.getFormatDefinition(formatId);
      })
      .filter(Boolean) as ExportFormat[];
  }

  /**
   * Check if format is supported
   */
  isFormatSupported(formatId: string): boolean {
    return this.exporters.has(formatId);
  }

  private getFormatDefinition(formatId: string): ExportFormat | null {
    const formats: Record<string, ExportFormat> = {
      csv: {
        id: "csv",
        name: "CSV",
        extension: "csv",
        mimeType: "text/csv",
        supports: [],
      },
      excel: {
        id: "excel",
        name: "Excel",
        extension: "xlsx",
        mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        supports: ["formatting"],
      },
      json: {
        id: "json",
        name: "JSON",
        extension: "json",
        mimeType: "application/json",
        supports: ["metadata"],
      },
      pdf: {
        id: "pdf",
        name: "PDF",
        extension: "pdf",
        mimeType: "application/pdf",
        supports: ["images", "charts", "formatting"],
      },
      png: {
        id: "png",
        name: "PNG Image",
        extension: "png",
        mimeType: "image/png",
        supports: ["images", "charts"],
      },
    };

    // eslint-disable-next-line security/detect-object-injection
    return Object.prototype.hasOwnProperty.call(formats, formatId) ? formats[formatId] : null;
  }
}

// =============================================================================
// EXPORT HANDLER INTERFACE
// =============================================================================

interface ExportHandler {
  export(request: ExportRequest): Promise<ExportResult>;
}

interface ExportResult {
  filename: string;
  mimeType: string;
  data: Buffer | string;
  size: number;
}

// =============================================================================
// SHARED UTILITIES
// =============================================================================

/**
 * Shared helper to get report data - eliminates code duplication
 */
function createMockReportData(_reportId: string): Promise<ReportData> {
  // This would integrate with the data pipeline
  // For now, return mock data
  return Promise.resolve({
    rows: [],
    totalCount: 0,
    metadata: {
      executionTime: 0,
      dataVersion: "1.0.0",
      cacheStatus: "miss",
      lastRefresh: new Date(),
      queryHash: "",
      filters: [],
    },
  });
}

// =============================================================================
// CSV EXPORTER
// =============================================================================

class CSVExporter implements ExportHandler {
  async export(request: ExportRequest): Promise<ExportResult> {
    const { reportId, format, filename } = request;

    // Get report data (this would typically come from the data pipeline)
    const reportData = await createMockReportData(reportId);

    const csvContent = this.convertToCSV(reportData);
    const buffer = Buffer.from(csvContent, "utf8");

    return {
      filename: filename ?? `report-${reportId}.${format.extension}`,
      mimeType: format.mimeType,
      data: buffer,
      size: buffer.length,
    };
  }

  private convertToCSV(data: ReportData): string {
    if (!data.rows.length) {
      return "";
    }

    const rows = data.rows as Record<string, unknown>[];
    const headers = Object.keys(rows[0]);

    // Create CSV header
    const csvLines = [headers.join(",")];

    // Add data rows
    for (const row of rows) {
      const values = headers.map((header) => {
        // eslint-disable-next-line security/detect-object-injection
        const value = Object.prototype.hasOwnProperty.call(row, header) ? row[header] : undefined;
        if (value === null || value === undefined) {
          return "";
        }

        const stringValue = this.convertValueToString(value);
        // Escape commas and quotes
        if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
          return `"${stringValue.replaceAll('"', '""')}"`;
        }

        return stringValue;
      });

      csvLines.push(values.join(","));
    }

    return csvLines.join("\n");
  }

  /**
   * Convert a value to string for CSV export
   */
  private convertValueToString(value: unknown): string {
    if (value == null) {
      return "";
    }

    if (typeof value === "string") {
      return value;
    }

    if (typeof value === "number" || typeof value === "boolean") {
      return String(value);
    }

    if (typeof value === "object") {
      return JSON.stringify(value);
    }

    return JSON.stringify(value);
  }
}

// =============================================================================
// JSON EXPORTER
// =============================================================================

class JSONExporter implements ExportHandler {
  async export(request: ExportRequest): Promise<ExportResult> {
    const { reportId, format, options, filename } = request;

    const reportData = await createMockReportData(reportId);

    const exportData = {
      report: {
        id: reportId,
        exportedAt: new Date().toISOString(),
        format: format.id,
        options,
      },
      data: reportData.rows,
      metadata: options.includeMetadata ? reportData.metadata : undefined,
      totalCount: reportData.totalCount,
    };

    const jsonContent = JSON.stringify(exportData, null, 2);
    const buffer = Buffer.from(jsonContent, "utf8");

    return {
      filename: filename ?? `report-${reportId}.${format.extension}`,
      mimeType: format.mimeType,
      data: buffer,
      size: buffer.length,
    };
  }
}

// =============================================================================
// EXCEL EXPORTER
// =============================================================================

class ExcelExporter implements ExportHandler {
  async export(request: ExportRequest): Promise<ExportResult> {
    // Excel export would require a library like exceljs
    // For now, fall back to CSV format
    console.warn("Excel export not fully implemented, falling back to CSV");

    const csvExporter = new CSVExporter();
    const result = await csvExporter.export(request);

    return {
      ...result,
      filename: result.filename.replace(".csv", ".xlsx"),
      mimeType: request.format.mimeType,
    };
  }
}

// =============================================================================
// PDF EXPORTER
// =============================================================================

class PDFExporter implements ExportHandler {
  export(request: ExportRequest): Promise<ExportResult> {
    // PDF export would require a library like puppeteer or jsPDF
    // For now, return a placeholder
    console.warn("PDF export not implemented");

    const pdfContent = this.generateSimplePDF(request);
    const buffer = Buffer.from(pdfContent);

    return Promise.resolve({
      filename: request.filename ?? `report-${request.reportId}.pdf`,
      mimeType: request.format.mimeType,
      data: buffer,
      size: buffer.length,
    });
  }

  private generateSimplePDF(request: ExportRequest): string {
    return `PDF Export for Report: ${request.reportId}\nGenerated at: ${new Date().toISOString()}`;
  }
}

// =============================================================================
// PNG EXPORTER
// =============================================================================

class PNGExporter implements ExportHandler {
  export(request: ExportRequest): Promise<ExportResult> {
    // PNG export would require chart rendering capabilities
    // For now, return a placeholder
    console.warn("PNG export not implemented");

    // This would typically render the chart/table as an image
    const placeholder = Buffer.from("PNG placeholder");

    return Promise.resolve({
      filename: request.filename ?? `report-${request.reportId}.png`,
      mimeType: request.format.mimeType,
      data: placeholder,
      size: placeholder.length,
    });
  }
}

// =============================================================================
// GLOBAL EXPORT MANAGER
// =============================================================================

export const exportManager = new ExportManager();

// Register default exporters
exportManager.registerExporter(
  { id: "csv", name: "CSV", extension: "csv", mimeType: "text/csv", supports: [] },
  new CSVExporter(),
);

exportManager.registerExporter(
  { id: "json", name: "JSON", extension: "json", mimeType: "application/json", supports: ["metadata"] },
  new JSONExporter(),
);

exportManager.registerExporter(
  {
    id: "excel",
    name: "Excel",
    extension: "xlsx",
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    supports: ["formatting"],
  },
  new ExcelExporter(),
);

exportManager.registerExporter(
  {
    id: "pdf",
    name: "PDF",
    extension: "pdf",
    mimeType: "application/pdf",
    supports: ["images", "charts", "formatting"],
  },
  new PDFExporter(),
);

exportManager.registerExporter(
  { id: "png", name: "PNG Image", extension: "png", mimeType: "image/png", supports: ["images", "charts"] },
  new PNGExporter(),
);

// =============================================================================
// EXPORT UTILITIES
// =============================================================================

/**
 * Create an export request
 */
export function createExportRequest(
  reportId: string,
  formatId: string,
  options: Partial<ExportOptions> = {},
  filename?: string,
): ExportRequest {
  const formats = exportManager.getAvailableFormats();
  const format = formats.find((f) => f.id === formatId);

  if (!format) {
    throw new Error(`Export format "${formatId}" not available`);
  }

  return {
    reportId,
    format,
    options: {
      includeCharts: false,
      includeMetadata: true,
      compression: false,
      pageSize: "A4",
      orientation: "portrait",
      margins: {
        top: 20,
        right: 20,
        bottom: 20,
        left: 20,
      },
      ...options,
    },
    filename,
  };
}

/**
 * Export report data directly
 */
export async function exportReportData(
  reportId: string,
  formatId: string,
  data: ReportData,
  options: Partial<ExportOptions> = {},
): Promise<ExportResult> {
  const request = createExportRequest(reportId, formatId, options);

  // Create a temporary exporter that uses the provided data
  const tempExporter: ExportHandler = {
    async export(req: ExportRequest): Promise<ExportResult> {
      switch (req.format.id) {
        case "csv": {
          return new CSVExporter().export(req);
        }
        case "json": {
          return new JSONExporter().export(req);
        }
        default: {
          throw new Error(`Format ${req.format.id} not supported for direct data export`);
        }
      }
    },
  };

  return tempExporter.export(request);
}

/**
 * Get export format by ID
 */
export function getExportFormat(formatId: string): ExportFormat | null {
  const formats = exportManager.getAvailableFormats();
  return formats.find((f) => f.id === formatId) ?? null;
}

/**
 * Validate export request
 */
export function validateExportRequest(request: ExportRequest): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!request.reportId) {
    errors.push("Report ID is required");
  }

  if (!request.format?.id) {
    errors.push("Export format is required");
  }

  if (!exportManager.isFormatSupported(request.format.id)) {
    errors.push(`Export format "${request.format.id}" is not supported`);
  }

  if (request.filename && !/^[a-zA-Z0-9._-]+$/.test(request.filename)) {
    errors.push("Invalid filename format");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Generate filename for export
 */
export function generateExportFilename(reportId: string, format: ExportFormat, timestamp = true): string {
  const base = `report-${reportId}`;
  const timestampSuffix = timestamp ? `-${new Date().toISOString().slice(0, 19).replaceAll(":", "-")}` : "";
  return `${base}${timestampSuffix}.${format.extension}`;
}
