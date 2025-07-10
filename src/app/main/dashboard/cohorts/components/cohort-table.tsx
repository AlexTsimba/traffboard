// Функция форматирования значений в зависимости от метрики
const formatValue = (value: number, metric: string) => {
  switch (metric) {
    case "retention": {
      return `${(value * 100).toFixed(1)}%`;
    }
    case "dep2cost": {
      return `${value.toFixed(1)}%`;
    }
    case "roas": {
      return `${value.toFixed(2)}x`;
    }
    case "adpu": {
      return `$${value.toFixed(2)}`;
    }
    default: {
      return value.toFixed(2);
    }
  }
};

// Цветовая схема для разных breakpoints
const getBreakpointColor = (index: number) => {
  const colors = [
    "bg-green-100 text-green-800",
    "bg-blue-100 text-blue-800",
    "bg-yellow-100 text-yellow-800",
    "bg-purple-100 text-purple-800",
    "bg-orange-100 text-orange-800",
    "bg-pink-100 text-pink-800",
    "bg-red-100 text-red-800",
    "bg-gray-100 text-gray-800",
    "bg-slate-100 text-slate-800",
    "bg-cyan-100 text-cyan-800",
  ];
  return colors[index % colors.length];
};

interface CohortTableProps {
  data: Record<string, unknown>[];
  metric: string;
  mode: "day" | "week";
}

export function CohortTable({ data, metric, mode }: CohortTableProps) {
  if (!data || data.length === 0) {
    return (
      <div className="text-muted-foreground p-8 text-center">
        <p>No cohort data available for the selected filters</p>
      </div>
    );
  }

  // Определяем breakpoints в зависимости от режима
  const breakpoints = mode === "day" ? [1, 3, 5, 7, 14, 17, 21, 24, 27, 30] : [7, 14, 21, 28, 35, 42];

  return (
    <div className="space-y-2">
      <div className="overflow-x-auto">
        <table className="w-full border-separate border-spacing-0 text-sm">
          <thead>
            <tr className="bg-muted/50 border-b">
              <th className="border-muted w-20 border-r px-2 py-2 text-center">Date</th>
              <th className="border-muted w-16 border-r px-2 py-2 text-center">Players</th>
              {breakpoints.map((bp, _index) => (
                <th key={bp} className="border-muted min-w-[80px] border-r px-1 py-2 text-center last:border-r-0">
                  {mode === "day" ? `Day ${bp}` : `Week ${bp / 7}`}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.slice(0, 15).map((row: Record<string, unknown>, rowIndex: number) => (
              <tr key={rowIndex} className="hover:bg-muted/30 border-b">
                <td className="border-muted/50 border-r px-2 py-2 text-center font-mono text-sm">
                  {row.cohort_date
                    ? new Date(row.cohort_date as string).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })
                    : "---"}
                </td>
                <td className="border-muted/50 border-r px-2 py-2 text-center font-medium">
                  {(row.initial_players as number) || (row.total_players as number) || "---"}
                </td>
                {breakpoints.map((bp, bpIndex) => {
                  const fieldName = mode === "day" ? `day${bp}_${metric}` : `week${bp / 7}_${metric}`;
                  const value = row[fieldName];

                  return (
                    <td key={bp} className="border-muted/50 border-r px-1 py-2 text-center last:border-r-0">
                      <span className={`inline-block w-full rounded px-2 py-1 text-sm ${getBreakpointColor(bpIndex)}`}>
                        {value !== null && value !== undefined ? formatValue(value as number, metric) : "---"}
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
        <p className="text-muted-foreground pt-2 text-center text-xs">
          Showing first 15 of {data.length} cohort records
        </p>
      )}
    </div>
  );
}
