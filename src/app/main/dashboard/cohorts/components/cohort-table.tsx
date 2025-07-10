interface CohortTableProps {
  data: any[];
  metric: string;
  mode: 'day' | 'week';
}

export function CohortTable({ data, metric, mode }: CohortTableProps) {
  if (!data || data.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <p>No cohort data available for the selected filters</p>
      </div>
    );
  }

  // Определяем breakpoints в зависимости от режима
  const breakpoints = mode === 'day' 
    ? [1, 3, 5, 7, 14, 17, 21, 24, 27, 30]
    : [7, 14, 21, 28, 35, 42];

  // Функция форматирования значений в зависимости от метрики
  const formatValue = (value: number, metric: string) => {
    switch (metric) {
      case 'retention':
        return `${(value * 100).toFixed(1)}%`;
      case 'dep2cost':
        return `${value.toFixed(1)}%`;
      case 'roas':
        return `${value.toFixed(2)}x`;
      case 'adpu':
        return `$${value.toFixed(2)}`;
      default:
        return value.toFixed(2);
    }
  };

  // Цветовая схема для разных breakpoints
  const getBreakpointColor = (index: number) => {
    const colors = [
      'bg-green-100 text-green-800',
      'bg-blue-100 text-blue-800', 
      'bg-yellow-100 text-yellow-800',
      'bg-purple-100 text-purple-800',
      'bg-orange-100 text-orange-800',
      'bg-pink-100 text-pink-800',
      'bg-red-100 text-red-800',
      'bg-gray-100 text-gray-800',
      'bg-slate-100 text-slate-800',
      'bg-cyan-100 text-cyan-800'
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="space-y-2">
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-separate border-spacing-0">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-2 py-2 text-center w-20 border-r border-muted">
                Date
              </th>
              <th className="px-2 py-2 text-center w-16 border-r border-muted">
                Players
              </th>
              {breakpoints.map((bp, index) => (
                <th 
                  key={bp} 
                  className="px-1 py-2 text-center min-w-[80px] border-r border-muted last:border-r-0"
                >
                  {mode === 'day' ? `Day ${bp}` : `Week ${bp/7}`}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.slice(0, 15).map((row: any, rowIndex: number) => (
              <tr key={rowIndex} className="border-b hover:bg-muted/30">
                <td className="px-2 py-2 font-mono text-sm border-r border-muted/50 text-center">
                  {row.cohort_date 
                    ? new Date(row.cohort_date).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric' 
                      })
                    : '---'
                  }
                </td>
                <td className="px-2 py-2 text-center font-medium border-r border-muted/50">
                  {row.initial_players || row.total_players || '---'}
                </td>
                {breakpoints.map((bp, bpIndex) => {
                  const fieldName = mode === 'day' 
                    ? `day${bp}_${metric}`
                    : `week${bp/7}_${metric}`;
                  const value = row[fieldName];
                  
                  return (
                    <td key={bp} className="px-1 py-2 text-center border-r border-muted/50 last:border-r-0">
                      <span className={`rounded px-2 py-1 text-sm inline-block w-full ${getBreakpointColor(bpIndex)}`}>
                        {value !== null && value !== undefined 
                          ? formatValue(value, metric)
                          : '---'
                        }
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Show more indicator */}
      {data.length > 15 && (
        <p className="text-center text-xs text-muted-foreground pt-2">
          Showing first 15 of {data.length} cohort records
        </p>
      )}
    </div>
  );
}
