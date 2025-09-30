export type DateISO = string;

export interface Interval {
  start_date: DateISO;
  end_date: DateISO;
}

export interface CalculatorInput {
  tax_year_start: DateISO;
  tax_year_end: DateISO;
  mode: 'US_PERIODS' | 'FOREIGN_PERIODS';
  us_periods?: Interval[];
  foreign_periods?: Interval[];
  planning_mode?: boolean;
}

export interface QualifiedWindow {
  window_start: DateISO;
  window_end: DateISO;
  foreign_days: number;
  overlap_days: number;
  pro_rata_fraction: number;
}

export interface PlanningInfo {
  us_days_remaining: number;
  optimal_starts: DateISO[];
}

export interface CalculatorOutput {
  qualified: boolean;
  best_windows?: QualifiedWindow[];
  total_tax_year_days?: number;
  planning_info?: PlanningInfo;
  error?: CalculatorError;
}

export type CalculatorErrorCode =
  | 'DATE_FORMAT_ERROR'
  | 'INVALID_INTERVAL_BOUNDS'
  | 'INTERVAL_OVERLAP'
  | 'INTERVAL_DUPLICATE'
  | 'INTERVAL_OUT_OF_RANGE'
  | 'MISSING_PERIODS'
  | 'UNEXPECTED_PERIODS'
  | 'INVALID_MODE'
  | 'TAX_YEAR_ORDER'
  | 'WINDOW_TOO_SHORT'
  | 'UNKNOWN_ERROR';

export interface CalculatorError {
  code: CalculatorErrorCode;
  message: string;
  details?: unknown;
}

export interface NormalizedInput {
  taxYearStart: DateISO;
  taxYearEnd: DateISO;
  taxYearDays: number;
  usPeriods: Interval[];
  foreignPeriods: Interval[];
}
