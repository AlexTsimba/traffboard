import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Database, Download, Upload, Trash2 } from 'lucide-react';
import { PageContainer } from '~/components/page-container';

export default function AdminDataPage() {
  // Auth check is handled by parent admin layout

  return (
    <PageContainer>
      <div className="grid gap-4 md:grid-cols-2 max-w-4xl">
        <Card className="opacity-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Download className="h-5 w-5" />
              Data Export
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Export system data and analytics for backup or analysis
            </p>
            <p className="text-xs text-muted-foreground italic">
              Coming soon - Export functionality will be implemented in future releases
            </p>
          </CardContent>
        </Card>

        <Card className="opacity-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Upload className="h-5 w-5" />
              Data Import
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Import data from external sources or backup files
            </p>
            <p className="text-xs text-muted-foreground italic">
              Coming soon - Import functionality will be implemented in future releases
            </p>
          </CardContent>
        </Card>

        <Card className="opacity-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Database className="h-5 w-5" />
              Database Maintenance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Database optimization, cleanup, and maintenance operations
            </p>
            <p className="text-xs text-muted-foreground italic">
              Coming soon - Database maintenance tools will be implemented in future releases
            </p>
          </CardContent>
        </Card>

        <Card className="opacity-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Trash2 className="h-5 w-5" />
              Data Cleanup
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Remove old data, cleanup temporary files, and manage storage
            </p>
            <p className="text-xs text-muted-foreground italic">
              Coming soon - Data cleanup tools will be implemented in future releases
            </p>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}