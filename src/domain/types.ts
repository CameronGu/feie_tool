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
  /** Explicit foreign-presence declaration, with U.S. periods as exceptions. */
  foreign_coverage?: Interval;
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
  supporting_windows?: QualifiedWindow[];
  qualifying_coverage?: Interval[];
  qualifying_days?: number;
  coverage_fraction?: number;
  qualifying_window_count?: number;
  closest_window?: QualifiedWindow;
  leap_day_review?: LeapDayReview;
}

export interface LeapDayReview {
  alternative_coverage_days: number;
  alternative_coverage: Interval[];
  additional_windows: QualifiedWindow[];
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
  | 'UNSUPPORTED_TAX_YEAR'
  | 'MISSING_COVERAGE'
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
