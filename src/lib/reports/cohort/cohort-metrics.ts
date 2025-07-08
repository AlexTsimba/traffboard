/**
 * Cohort Metrics Calculation
 *
 * Business logic for calculating the 4 cohort metrics:
 * - DEP2COST: (cumulative_deposits / initial_costs) * 100
 * - ROAS: (cumulative_ngr / initial_costs) * 100
 * - AVG DEPOSIT SUM: cumulative_deposit_sum / cohort_size
 * - RETENTION RATE: active_players / initial_cohort_size * 100
 */

import type { CohortMetric } from "@/types/reports";

// =============================================================================
// METRIC CALCULATION INTERFACES
// =============================================================================

interface MetricCalculationInput {
  metric: CohortMetric;
  activePlayers: number;
  depositSum: number;
  ngrSum: number;
  costSum: number;
  cohortSize: number;
}

interface MetricResult {
  value: number | null;
  rawValue: number;
  formatted: string;
  isValid: boolean;
}

// =============================================================================
// CORE METRIC CALCULATIONS
// =============================================================================

/**
 * Calculate DEP2COST metric
 * Formula: (cumulative_deposits / initial_costs) * 100
 */
function calculateDep2Cost(depositSum: number, costSum: number): MetricResult {
  if (costSum <= 0) {
    return {
      value: null,
      rawValue: 0,
      formatted: "—",
      isValid: false,
    };
  }

  const rawValue = (depositSum / costSum) * 100;

  return {
    value: rawValue,
    rawValue,
    formatted: `${rawValue.toFixed(1)}%`,
    isValid: true,
  };
}

/**
 * Calculate ROAS (Return on Ad Spend) metric
 * Formula: (cumulative_ngr / initial_costs) * 100
 */
function calculateRoas(ngrSum: number, costSum: number): MetricResult {
  if (costSum <= 0) {
    return {
      value: null,
      rawValue: 0,
      formatted: "—",
      isValid: false,
    };
  }

  const rawValue = (ngrSum / costSum) * 100;

  return {
    value: rawValue,
    rawValue,
    formatted: `${rawValue.toFixed(1)}%`,
    isValid: true,
  };
}

/**
 * Calculate Average Deposit Sum metric
 * Formula: cumulative_deposit_sum / cohort_size
 */
function calculateAvgDepositSum(depositSum: number, cohortSize: number): MetricResult {
  if (cohortSize <= 0) {
    return {
      value: null,
      rawValue: 0,
      formatted: "—",
      isValid: false,
    };
  }

  const rawValue = depositSum / cohortSize;

  return {
    value: rawValue,
    rawValue,
    formatted: `$${rawValue.toFixed(2)}`,
    isValid: true,
  };
}

/**
 * Calculate Retention Rate metric
 * Formula: active_players / initial_cohort_size * 100
 */
function calculateRetentionRate(activePlayers: number, cohortSize: number): MetricResult {
  if (cohortSize <= 0) {
    return {
      value: null,
      rawValue: 0,
      formatted: "—",
      isValid: false,
    };
  }

  const rawValue = (activePlayers / cohortSize) * 100;

  return {
    value: rawValue,
    rawValue,
    formatted: `${rawValue.toFixed(1)}%`,
    isValid: true,
  };
}

// =============================================================================
// PUBLIC API FUNCTIONS
// =============================================================================

/**
 * Calculate cohort metric value based on type
 */
export function calculateCohortMetrics(input: MetricCalculationInput): number | null {
  const { metric, activePlayers, depositSum, ngrSum, costSum, cohortSize } = input;

  switch (metric) {
    case "dep2cost": {
      return calculateDep2Cost(depositSum, costSum).value;
    }

    case "roas": {
      return calculateRoas(ngrSum, costSum).value;
    }

    case "avg_deposit_sum": {
      return calculateAvgDepositSum(depositSum, cohortSize).value;
    }

    case "retention_rate": {
      return calculateRetentionRate(activePlayers, cohortSize).value;
    }

    default: {
      throw new Error(`Unknown cohort metric: ${String(metric)}`);
    }
  }
}

/**
 * Calculate detailed metric result with formatting
 */
export function calculateDetailedMetric(input: MetricCalculationInput): MetricResult {
  const { metric, activePlayers, depositSum, ngrSum, costSum, cohortSize } = input;

  switch (metric) {
    case "dep2cost": {
      return calculateDep2Cost(depositSum, costSum);
    }

    case "roas": {
      return calculateRoas(ngrSum, costSum);
    }

    case "avg_deposit_sum": {
      return calculateAvgDepositSum(depositSum, cohortSize);
    }

    case "retention_rate": {
      return calculateRetentionRate(activePlayers, cohortSize);
    }

    default: {
      throw new Error(`Unknown cohort metric: ${String(metric)}`);
    }
  }
}

/**
 * Calculate all metrics for a given input
 */
export function calculateAllMetrics(input: Omit<MetricCalculationInput, "metric">): Record<CohortMetric, MetricResult> {
  return {
    dep2cost: calculateDep2Cost(input.depositSum, input.costSum),
    roas: calculateRoas(input.ngrSum, input.costSum),
    avg_deposit_sum: calculateAvgDepositSum(input.depositSum, input.cohortSize),
    retention_rate: calculateRetentionRate(input.activePlayers, input.cohortSize),
  };
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get metric display name
 */
export function getMetricDisplayName(metric: CohortMetric): string {
  switch (metric) {
    case "dep2cost": {
      return "DEP2COST";
    }
    case "roas": {
      return "ROAS";
    }
    case "avg_deposit_sum": {
      return "AVG DEPOSIT SUM";
    }
    case "retention_rate": {
      return "RETENTION RATE";
    }
    default: {
      // This should never happen with proper TypeScript usage
      return String(metric).toUpperCase();
    }
  }
}

/**
 * Get metric description
 */
export function getMetricDescription(metric: CohortMetric): string {
  switch (metric) {
    case "dep2cost": {
      return "Отношение депозитов к затратам на привлечение";
    }
    case "roas": {
      return "Return on Ad Spend - возврат на рекламные вложения";
    }
    case "avg_deposit_sum": {
      return "Средняя сумма депозитов по когорте";
    }
    case "retention_rate": {
      return "Коэффициент удержания игроков в когорте";
    }
    default: {
      return "";
    }
  }
}

/**
 * Get metric unit
 */
export function getMetricUnit(metric: CohortMetric): string {
  switch (metric) {
    case "dep2cost":
    case "roas":
    case "retention_rate": {
      return "%";
    }
    case "avg_deposit_sum": {
      return "$";
    }
    default: {
      return "";
    }
  }
}

/**
 * Validate metric input values
 */
export function validateMetricInput(input: Omit<MetricCalculationInput, "metric">): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (input.cohortSize < 0) {
    errors.push("Cohort size cannot be negative");
  }

  if (input.activePlayers < 0) {
    errors.push("Active players cannot be negative");
  }

  if (input.activePlayers > input.cohortSize) {
    errors.push("Active players cannot exceed cohort size");
  }

  if (input.depositSum < 0) {
    errors.push("Deposit sum cannot be negative");
  }

  if (input.costSum < 0) {
    errors.push("Cost sum cannot be negative");
  }

  if (input.ngrSum < 0) {
    errors.push("NGR sum cannot be negative");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
