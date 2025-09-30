import type { CalculatorError, CalculatorErrorCode } from './types';

export const errorMessages: Record<CalculatorErrorCode, string> = {
  DATE_FORMAT_ERROR: 'Invalid date format.',
  INVALID_INTERVAL_BOUNDS: 'Interval start date must be on or before end date.',
  INTERVAL_OVERLAP: 'Intervals must not overlap.',
  INTERVAL_DUPLICATE: 'Duplicate intervals detected.',
  INTERVAL_OUT_OF_RANGE: 'Intervals must stay within the allowed date bounds.',
  MISSING_PERIODS: 'Required periods are missing for the selected mode.',
  UNEXPECTED_PERIODS: 'Unexpected periods were provided for the selected mode.',
  INVALID_MODE: 'Mode must be set to either US or Foreign periods.',
  TAX_YEAR_ORDER: 'Tax year start must be on or before tax year end.',
  WINDOW_TOO_SHORT: 'Tax year window must be at least one day.',
  UNKNOWN_ERROR: 'An unknown error occurred.'
};

export function createError(
  code: CalculatorErrorCode,
  message?: string,
  details?: unknown
): CalculatorError {
  return {
    code,
    message: message ?? errorMessages[code],
    details
  };
}
