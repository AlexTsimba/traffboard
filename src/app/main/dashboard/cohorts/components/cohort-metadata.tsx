interface CohortMetadataProps {
  metadata: {
    totalCohorts: number;
    processingTime: number;
    breakpointsUsed: number[];
    queryHash: string;
    mode: string;
    metric: string;
  };
  mode: 'day' | 'week';
}

export function CohortMetadata({ metadata }: CohortMetadataProps) {
  return (
    <div className="bg-muted/30 rounded-lg p-3">
      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-1">
          <span className="font-medium">Cohorts:</span>
          <span>{metadata.totalCohorts}</span>
        </div>
        
        <div className="flex items-center gap-1">
          <span className="font-medium">Processing:</span>
          <span>{metadata.processingTime}ms</span>
        </div>
        
        <div className="flex items-center gap-1">
          <span className="font-medium">Mode:</span>
          <span className="capitalize">{metadata.mode}</span>
        </div>
        
        <div className="flex items-center gap-1">
          <span className="font-medium">Metric:</span>
          <span className="capitalize">{metadata.metric}</span>
        </div>
        
        <div className="flex items-center gap-1">
          <span className="font-medium">Breakpoints:</span>
          <span className="font-mono text-xs">
            [{metadata.breakpointsUsed.join(', ')}]
          </span>
        </div>
        
        <div className="flex items-center gap-1">
          <span className="font-medium">Query ID:</span>
          <span className="font-mono text-xs">{metadata.queryHash}</span>
        </div>
      </div>
    </div>
  );
}
