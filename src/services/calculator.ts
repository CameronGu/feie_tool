import { assertIsoDate, compareDate, diffDaysInclusive } from '../domain/dates';
import { createError } from '../domain/errors';
import { invertPeriods, normalizeIntervals } from '../domain/intervals';
import { evaluateFeie, summarizePlanning } from '../domain/feie';
import type {
  CalculatorError,
  CalculatorInput,
  CalculatorOutput,
  NormalizedInput
} from '../domain/types';

function normalizeInput(input: CalculatorInput): NormalizedInput {
  const { tax_year_start, tax_year_end, mode } = input;

  assertIsoDate(tax_year_start, 'tax_year_start');
  assertIsoDate(tax_year_end, 'tax_year_end');

  if (compareDate(tax_year_start, tax_year_end) > 0) {
    throw createError('TAX_YEAR_ORDER', 'Tax year start must not be after tax year end.');
  }

  const taxYearDays = diffDaysInclusive(tax_year_start, tax_year_end);
  if (!tax_year_start.endsWith('-01-01') || !tax_year_end.endsWith('-12-31') ||
    tax_year_start.slice(0, 4) !== tax_year_end.slice(0, 4)) {
    throw createError('UNSUPPORTED_TAX_YEAR');
  }

  if (mode !== 'US_PERIODS' && mode !== 'FOREIGN_PERIODS') {
    throw createError('INVALID_MODE', 'Mode must be either US or Foreign periods.');
  }

  const hasUs = Array.isArray(input.us_periods) && input.us_periods.length > 0;
  const hasForeign = Array.isArray(input.foreign_periods) && input.foreign_periods.length > 0;

  if (mode === 'US_PERIODS') {
    if (!input.us_periods) {
      throw createError('MISSING_PERIODS', 'US periods are required in US mode.');
    }
    if (hasForeign) {
      throw createError('UNEXPECTED_PERIODS', 'Foreign periods must be omitted when mode is US.');
    }
    if (!input.foreign_coverage) throw createError('MISSING_COVERAGE');
    const [coverage] = normalizeIntervals([input.foreign_coverage], { fieldName: 'foreign_coverage' });
    const usPeriods = normalizeIntervals(input.us_periods, { fieldName: 'us_periods' });
    const relevantUs = usPeriods.map(period => ({
      start_date: period.start_date < coverage.start_date ? coverage.start_date : period.start_date,
      end_date: period.end_date > coverage.end_date ? coverage.end_date : period.end_date
    })).filter(period => period.start_date <= period.end_date);
    const foreignPeriods = invertPeriods(relevantUs, coverage.start_date, coverage.end_date);

    return {
      taxYearStart: tax_year_start,
      taxYearEnd: tax_year_end,
      taxYearDays,
      usPeriods,
      foreignPeriods
    };
  }

  if (!input.foreign_periods) {
    throw createError('MISSING_PERIODS', 'Foreign periods are required in Foreign mode.');
  }
  if (hasUs) {
    throw createError('UNEXPECTED_PERIODS', 'US periods must be omitted when mode is Foreign.');
  }

  const foreignPeriods = normalizeIntervals(input.foreign_periods, {
    fieldName: 'foreign_periods'
  });

  return {
    taxYearStart: tax_year_start,
    taxYearEnd: tax_year_end,
    taxYearDays,
    usPeriods: [],
    foreignPeriods
  };
}

function toOutput(result: ReturnType<typeof evaluateFeie>): CalculatorOutput {
  return {
    qualified: result.qualified,
    best_windows: result.bestWindows.length > 0 ? result.bestWindows : undefined,
    total_tax_year_days: result.totalTaxYearDays,
    supporting_windows: result.supportingWindows,
    qualifying_coverage: result.qualifyingCoverage,
    qualifying_days: result.qualifyingDays,
    coverage_fraction: result.coverageFraction,
    qualifying_window_count: result.qualifyingWindowCount,
    closest_window: result.closestWindow,
    leap_day_review: result.leapDayReview
  };
}

export function calculateFeie(input: CalculatorInput): CalculatorOutput {
  try {
    const normalized = normalizeInput(input);
    const evaluation = evaluateFeie(normalized);
    const output = toOutput(evaluation);

    if (input.planning_mode) {
      const planning = summarizePlanning(normalized);
      output.planning_info = {
        us_days_remaining: planning.remaining,
        optimal_starts: planning.optimalStarts
      };
    }

    if (!evaluation.qualified && !input.planning_mode) {
      output.planning_info = {
        us_days_remaining: Math.max(0, 330 - evaluation.maxForeignDays),
        optimal_starts: []
      };
    }

    return output;
  } catch (error) {
    const calculatorError = normalizeError(error);
    return {
      qualified: false,
      error: calculatorError
    };
  }
}

function normalizeError(error: unknown): CalculatorError {
  if (error && typeof error === 'object' && 'code' in error && 'message' in error) {
    return error as CalculatorError;
  }
  return createError('UNKNOWN_ERROR', 'Unexpected calculator failure.', error);
}
