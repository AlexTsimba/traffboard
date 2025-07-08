"use client";

import React, { useState, useMemo } from "react";
import { Area, AreaChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, XAxis, YAxis } from "recharts";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface CohortData {
  cohortDate: string;
  ftdCount: number;
  breakpointValues: Record<number, number | null>;
}

interface BreakpointChartProps {
  data: CohortData[];
  metric: "dep2cost" | "roas" | "avgDepositSum" | "retentionRate";
  breakpoints: number[];
  title?: string;
  description?: string;
  className?: string;
  showAverage?: boolean;
  showConfidenceBands?: boolean;
}

const metricConfigs = {
  dep2cost: {
    label: "DEP2COST",
    color: "#ef4444",
    format: (value: number) => `$${value.toFixed(2)}`,
    yAxisDomain: [0, "auto"] as const,
  },
  roas: {
    label: "ROAS",
    color: "#22c55e",
    format: (value: number) => `${value.toFixed(2)}x`,
    yAxisDomain: [0, "auto"] as const,
  },
  avgDepositSum: {
    label: "AVG DEPOSIT SUM",
    color: "#3b82f6",
    format: (value: number) => `$${value.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
    yAxisDomain: [0, "auto"] as const,
  },
  retentionRate: {
    label: "RETENTION RATE",
    color: "#8b5cf6",
    format: (value: number) => `${(value * 100).toFixed(1)}%`,
    yAxisDomain: [0, 1] as const,
  },
};

const cohortColors = [
  "#ef4444",
  "#22c55e",
  "#3b82f6",
  "#f59e0b",
  "#8b5cf6",
  "#06b6d4",
  "#84cc16",
  "#f97316",
  "#ec4899",
  "#14b8a6",
];

export function BreakpointChart({
  data,
  metric,
  breakpoints,
  title = "Breakpoint Analysis",
  description,
  className,
  showAverage = true,
  showConfidenceBands = false,
}: BreakpointChartProps) {
  const [cohortFilter, setCohortFilter] = useState<"all" | "selected" | "top" | "recent">("all");
  const [topCount, setTopCount] = useState(5);

  const metricConfig = metricConfigs[metric];

  // Filter cohorts based on selection
  const filteredCohorts = useMemo(() => {
    let filtered = [...data];

    switch (cohortFilter) {
      case "top": {
        // Sort by average performance across all breakpoints
        const sortedFiltered = filtered
          .map((cohort) => {
            const validValues = breakpoints
              .map((bp) => cohort.breakpointValues[bp])
              .filter((val): val is number => val !== null);
            const avgValue =
              validValues.length > 0 ? validValues.reduce((sum, val) => sum + val, 0) / validValues.length : 0;
            return { ...cohort, avgValue };
          })
          .toSorted((a, b) => b.avgValue - a.avgValue);
        filtered = sortedFiltered.slice(0, topCount);
        break;
      }
      case "recent": {
        const sortedByDate = filtered.toSorted((a, b) => new Date(b.cohortDate).getTime() - new Date(a.cohortDate).getTime());
        filtered = sortedByDate.slice(0, topCount);
        break;
      }
      case "selected": {
        // For now, just return all - in real implementation would check selection state
        break;
      }
      case "all":
      default: {
        // "all" or any other case - no filtering
        break;
      }
    }

    return filtered;
  }, [data, cohortFilter, topCount, breakpoints]);

  // Transform data for chart
  const chartData = useMemo(() => {
    return breakpoints.map((breakpoint) => {
      const dataPoint: Record<string, unknown> = {
        breakpoint,
        day: `Day ${breakpoint}`,
      };

      // Add data for each cohort
      for (const [index, cohort] of filteredCohorts.entries()) {
        const value = cohort.breakpointValues[breakpoint];
        if (value !== null) {
          dataPoint[`cohort_${index}`] = value;
          dataPoint[`cohort_${index}_label`] = new Date(cohort.cohortDate).toLocaleDateString();
        }
      }

      // Calculate average if enabled
      if (showAverage) {
        const validValues = filteredCohorts
          .map((cohort) => cohort.breakpointValues[breakpoint])
          .filter((val): val is number => val !== null);

        if (validValues.length > 0) {
          dataPoint.average = validValues.reduce((sum, val) => sum + val, 0) / validValues.length;
        }
      }

      return dataPoint;
    });
  }, [filteredCohorts, breakpoints, showAverage]);

  // Chart configuration for shadcn/ui ChartContainer
  const chartConfig = useMemo(() => {
    const config: Record<string, { label: string; color: string }> = {};

    for (const [index, cohort] of filteredCohorts.entries()) {
      config[`cohort_${index}`] = {
        label: new Date(cohort.cohortDate).toLocaleDateString(),
        color: cohortColors[index % cohortColors.length],
      };
    }

    if (showAverage) {
      config.average = {
        label: "Average",
        color: "hsl(var(--foreground))",
      };
    }

    return config;
  }, [filteredCohorts, showAverage]);

  const renderLineChart = () => (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
        <YAxis
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
          domain={metricConfig.yAxisDomain}
          tickFormatter={metricConfig.format}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value, name) => {
                if (name === "average") {
                  return [metricConfig.format(Number(value)), "Average"];
                }
                const cohortIndex = name.toString().split("_")[1];
                const label = chartData[0]?.[`cohort_${cohortIndex}_label`] as string;
                return [metricConfig.format(Number(value)), label || name];
              }}
              labelFormatter={(label) => `${label}`}
            />
          }
        />
        <Legend content={<ChartLegendContent />} />

        {/* Individual cohort lines */}
        {filteredCohorts.map((cohort, index) => (
          <Line
            key={cohort.cohortDate}
            type="monotone"
            dataKey={`cohort_${index}`}
            stroke={cohortColors[index % cohortColors.length]}
            strokeWidth={2}
            dot={{ r: 3, fill: cohortColors[index % cohortColors.length] }}
            activeDot={{ r: 5, fill: cohortColors[index % cohortColors.length] }}
            connectNulls={false}
          />
        ))}

        {/* Average line */}
        {showAverage && (
          <Line
            type="monotone"
            dataKey="average"
            stroke="hsl(var(--foreground))"
            strokeWidth={3}
            strokeDasharray="5 5"
            dot={{ r: 4, fill: "hsl(var(--foreground))" }}
            activeDot={{ r: 6, fill: "hsl(var(--foreground))" }}
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  );

  const renderAreaChart = () => (
    <ResponsiveContainer width="100%" height={400}>
      <AreaChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
        <YAxis
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
          domain={metricConfig.yAxisDomain}
          tickFormatter={metricConfig.format}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value, name) => {
                if (name === "average") {
                  return [metricConfig.format(Number(value)), "Average"];
                }
                const cohortIndex = name.toString().split("_")[1];
                const label = chartData[0]?.[`cohort_${cohortIndex}_label`] as string;
                return [metricConfig.format(Number(value)), label || name];
              }}
              labelFormatter={(label) => `${label}`}
            />
          }
        />
        <Legend content={<ChartLegendContent />} />

        {/* Individual cohort areas */}
        {filteredCohorts.map((cohort, index) => (
          <Area
            key={cohort.cohortDate}
            type="monotone"
            dataKey={`cohort_${index}`}
            stroke={cohortColors[index % cohortColors.length]}
            fill={cohortColors[index % cohortColors.length]}
            fillOpacity={0.1}
            strokeWidth={1.5}
            dot={{ r: 3, fill: cohortColors[index % cohortColors.length] }}
            activeDot={{ r: 5, fill: cohortColors[index % cohortColors.length] }}
            connectNulls={false}
          />
        ))}

        {/* Average area */}
        {showAverage && (
          <Area
            type="monotone"
            dataKey="average"
            stroke="hsl(var(--foreground))"
            fill="hsl(var(--foreground))"
            fillOpacity={0.2}
            strokeWidth={3}
            strokeDasharray="5 5"
            dot={{ r: 4, fill: "hsl(var(--foreground))" }}
            activeDot={{ r: 6, fill: "hsl(var(--foreground))" }}
          />
        )}
      </AreaChart>
    </ResponsiveContainer>
  );

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            {description && <p className="text-muted-foreground mt-1 text-sm">{description}</p>}
            <p className="text-muted-foreground mt-2 text-xs">{metricConfig.label} evolution across breakpoints</p>
          </div>

          {/* Controls */}
          <div className="flex items-center space-x-2">
            <Select
              value={cohortFilter}
              onValueChange={(value: typeof cohortFilter) => {
                setCohortFilter(value);
              }}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cohorts</SelectItem>
                <SelectItem value="selected">Selected</SelectItem>
                <SelectItem value="top">Top Performers</SelectItem>
                <SelectItem value="recent">Most Recent</SelectItem>
              </SelectContent>
            </Select>

            {(cohortFilter === "top" || cohortFilter === "recent") && (
              <Select
                value={topCount.toString()}
                onValueChange={(value) => {
                  setTopCount(Number(value));
                }}
              >
                <SelectTrigger className="w-16">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3</SelectItem>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        {/* Metric Badge */}
        <div className="mt-4 flex items-center space-x-2">
          <Badge
            variant="default"
            style={{
              backgroundColor: metricConfig.color,
              color: "white",
            }}
          >
            {metricConfig.label}
          </Badge>
          {showAverage && <Badge variant="outline">Average Included</Badge>}
          {showConfidenceBands && <Badge variant="outline">Confidence Bands</Badge>}
        </div>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="chart" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="chart">Chart View</TabsTrigger>
            <TabsTrigger value="cohorts">Cohort List</TabsTrigger>
            <TabsTrigger value="analysis">Analysis</TabsTrigger>
          </TabsList>

          <TabsContent value="chart" className="mt-4">
            <ChartContainer config={chartConfig}>
              <Tabs defaultValue={chartType} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="line">Line Chart</TabsTrigger>
                  <TabsTrigger value="area">Area Chart</TabsTrigger>
                </TabsList>

                <TabsContent value="line" className="mt-4">
                  {renderLineChart()}
                </TabsContent>

                <TabsContent value="area" className="mt-4">
                  {renderAreaChart()}
                </TabsContent>
              </Tabs>
            </ChartContainer>
          </TabsContent>

          <TabsContent value="cohorts" className="mt-4">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">
                {cohortFilter === "all"
                  ? "All Cohorts"
                  : cohortFilter === "selected"
                    ? "Selected Cohorts"
                    : cohortFilter === "top"
                      ? `Top ${topCount} Performers`
                      : `${topCount} Most Recent Cohorts`}
              </h3>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredCohorts.map((cohort, index) => {
                  const validValues = breakpoints
                    .map((bp) => cohort.breakpointValues[bp])
                    .filter((val): val is number => val !== null);
                  const avgValue =
                    validValues.length > 0 ? validValues.reduce((sum, val) => sum + val, 0) / validValues.length : 0;

                  return (
                    <Card key={cohort.cohortDate}>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm">{new Date(cohort.cohortDate).toLocaleDateString()}</CardTitle>
                          <div
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: cohortColors[index % cohortColors.length] }}
                          />
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">FTD Count:</span>
                          <span className="font-medium">{cohort.ftdCount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Average {metricConfig.label}:</span>
                          <span className="font-medium">{metricConfig.format(avgValue)}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Data Points:</span>
                          <span className="font-medium">
                            {validValues.length}/{breakpoints.length}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="analysis" className="mt-4">
            <div className="space-y-6">
              <div>
                <h3 className="mb-4 text-lg font-semibold">Breakpoint Analysis</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="p-2 text-left">Breakpoint</th>
                        <th className="p-2 text-center">Average</th>
                        <th className="p-2 text-center">Min</th>
                        <th className="p-2 text-center">Max</th>
                        <th className="p-2 text-center">Std Dev</th>
                        <th className="p-2 text-center">Data Points</th>
                      </tr>
                    </thead>
                    <tbody>
                      {chartData.map((point) => {
                        const breakpoint = point.breakpoint as number;
                        const values = filteredCohorts
                          .map((cohort) => cohort.breakpointValues[breakpoint])
                          .filter((val): val is number => val !== null);

                        if (values.length === 0) return null;

                        const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
                        const min = Math.min(...values);
                        const max = Math.max(...values);
                        const variance = values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / values.length;
                        const stdDev = Math.sqrt(variance);

                        return (
                          <tr key={breakpoint} className="hover:bg-muted/50 border-b">
                            <td className="p-2 font-medium">Day {breakpoint}</td>
                            <td className="p-2 text-center">{metricConfig.format(avg)}</td>
                            <td className="p-2 text-center">{metricConfig.format(min)}</td>
                            <td className="p-2 text-center">{metricConfig.format(max)}</td>
                            <td className="p-2 text-center">{metricConfig.format(stdDev)}</td>
                            <td className="p-2 text-center">{values.length}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Key Insights */}
              <div>
                <h4 className="mb-2 font-semibold">Key Insights</h4>
                <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
                  <Card>
                    <CardContent className="p-4">
                      <h5 className="mb-2 font-medium">Performance Trend</h5>
                      <p className="text-muted-foreground">
                        {(() => {
                          const firstPoint = chartData[0]?.average as number;
                          const lastPoint = chartData.at(-1)?.average as number;
                          if (firstPoint && lastPoint) {
                            const change = ((lastPoint - firstPoint) / firstPoint) * 100;
                            return change > 0
                              ? `Improving trend: +${change.toFixed(1)}% from Day ${breakpoints[0]} to Day ${breakpoints.at(-1)}`
                              : `Declining trend: ${change.toFixed(1)}% from Day ${breakpoints[0]} to Day ${breakpoints.at(-1)}`;
                          }
                          return "Insufficient data for trend analysis";
                        })()}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <h5 className="mb-2 font-medium">Variability</h5>
                      <p className="text-muted-foreground">
                        {(() => {
                          const avgStdDev =
                            chartData.reduce((sum, point) => {
                              const breakpoint = point.breakpoint as number;
                              const values = filteredCohorts
                                .map((cohort) => cohort.breakpointValues[breakpoint])
                                .filter((val): val is number => val !== null);

                              if (values.length > 1) {
                                const avg = values.reduce((s, v) => s + v, 0) / values.length;
                                const variance = values.reduce((s, v) => s + Math.pow(v - avg, 2), 0) / values.length;
                                return sum + Math.sqrt(variance);
                              }
                              return sum;
                            }, 0) / chartData.length;

                          return avgStdDev > 0
                            ? `Average variability: ${metricConfig.format(avgStdDev)} across breakpoints`
                            : "Low variability across cohorts";
                        })()}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
