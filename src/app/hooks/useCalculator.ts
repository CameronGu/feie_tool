import { useEffect, useMemo, useState } from 'react';
import { calculateFeie } from '../../services/calculator';
import type { CalculatorInput, CalculatorOutput, Interval } from '../../domain/types';
import { isIsoDate } from '../../domain/dates';

export type Mode = 'US_PERIODS' | 'FOREIGN_PERIODS';

export interface PeriodFormRow {
  id: string;
  start_date: string;
  end_date: string;
}

export interface CalculatorState {
  taxYearStart: string;
  taxYearEnd: string;
  mode: Mode;
  planningMode: boolean;
  usPeriods: PeriodFormRow[];
  foreignPeriods: PeriodFormRow[];
}

export interface ValidationErrors {
  [field: string]: string;
}

export interface UseCalculatorResult {
  state: CalculatorState;
  setTaxYearStart(value: string): void;
  setTaxYearEnd(value: string): void;
  setMode(mode: Mode): void;
  togglePlanningMode(): void;
  addPeriod(): void;
  removePeriod(id: string): void;
  updatePeriod(id: string, field: 'start_date' | 'end_date', value: string): void;
  result: CalculatorOutput | null;
  errors: ValidationErrors;
  activePeriods: PeriodFormRow[];
}

function createRow(): PeriodFormRow {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    start_date: '',
    end_date: ''
  };
}

function sanitizePeriods(rows: PeriodFormRow[]): Interval[] {
  return rows
    .filter(row => row.start_date && row.end_date && isIsoDate(row.start_date) && isIsoDate(row.end_date))
    .map(row => ({ start_date: row.start_date, end_date: row.end_date }));
}

function validate(state: CalculatorState, activePeriods: PeriodFormRow[]): ValidationErrors {
  const errors: ValidationErrors = {};

  if (!state.taxYearStart) {
    errors.tax_year_start = 'Tax year start is required.';
  } else if (!isIsoDate(state.taxYearStart)) {
    errors.tax_year_start = 'Use YYYY-MM-DD format.';
  }

  if (!state.taxYearEnd) {
    errors.tax_year_end = 'Tax year end is required.';
  } else if (!isIsoDate(state.taxYearEnd)) {
    errors.tax_year_end = 'Use YYYY-MM-DD format.';
  }

  if (state.taxYearStart && state.taxYearEnd && isIsoDate(state.taxYearStart) && isIsoDate(state.taxYearEnd)) {
    if (state.taxYearStart > state.taxYearEnd) {
      errors.tax_year_end = 'End must be on or after start.';
    }
  }

  activePeriods.forEach((row, index) => {
    const hasStart = row.start_date.length > 0;
    const hasEnd = row.end_date.length > 0;

    if (!hasStart && !hasEnd) {
      return;
    }

    if (!hasStart || !hasEnd) {
      errors[`period_${index}`] = 'Start and end dates are required for each interval.';
      return;
    }

    if (!isIsoDate(row.start_date) || !isIsoDate(row.end_date)) {
      errors[`period_${index}`] = 'Intervals must use YYYY-MM-DD format.';
      return;
    }

    if (row.start_date > row.end_date) {
      errors[`period_${index}`] = 'Interval start must be on or before end date.';
    }
  });

  return errors;
}

export function useCalculator(): UseCalculatorResult {
  const [state, setState] = useState<CalculatorState>({
    taxYearStart: '',
    taxYearEnd: '',
    mode: 'FOREIGN_PERIODS',
    planningMode: false,
    usPeriods: [createRow()],
    foreignPeriods: [createRow()]
  });
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [result, setResult] = useState<CalculatorOutput | null>(null);

  const activePeriods = useMemo(
    () => (state.mode === 'US_PERIODS' ? state.usPeriods : state.foreignPeriods),
    [state.mode, state.usPeriods, state.foreignPeriods]
  );

  useEffect(() => {
    const validationErrors = validate(state, activePeriods);
    const sanitized = sanitizePeriods(activePeriods);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setResult(null);
      return;
    }

    if (!state.taxYearStart || !state.taxYearEnd) {
      setErrors(validationErrors);
      setResult(null);
      return;
    }

    const calculatorInput: CalculatorInput = {
      tax_year_start: state.taxYearStart,
      tax_year_end: state.taxYearEnd,
      mode: state.mode,
      planning_mode: state.planningMode
    };

    if (state.mode === 'US_PERIODS') {
      calculatorInput.us_periods = sanitized;
    } else {
      calculatorInput.foreign_periods = sanitized;
    }

    const output = calculateFeie(calculatorInput);

    if (output.error) {
      const remoteErrors: ValidationErrors = { general: output.error.message };
      const field = (output.error.details as any)?.field;
      if (typeof field === 'string') {
        remoteErrors[field] = output.error.message;
      }
      setErrors(remoteErrors);
      setResult(output);
      return;
    }

    setErrors({});
    setResult(output);
  }, [state, activePeriods]);

  return {
    state,
    setTaxYearStart(value: string) {
      setState(prev => ({ ...prev, taxYearStart: value }));
    },
    setTaxYearEnd(value: string) {
      setState(prev => ({ ...prev, taxYearEnd: value }));
    },
    setMode(mode: Mode) {
      setState(prev => ({ ...prev, mode }));
    },
    togglePlanningMode() {
      setState(prev => ({ ...prev, planningMode: !prev.planningMode }));
    },
    addPeriod() {
      setState(prev => {
        const key = prev.mode === 'US_PERIODS' ? 'usPeriods' : 'foreignPeriods';
        return {
          ...prev,
          [key]: [...prev[key], createRow()]
        };
      });
    },
    removePeriod(id: string) {
      setState(prev => {
        const key = prev.mode === 'US_PERIODS' ? 'usPeriods' : 'foreignPeriods';
        return {
          ...prev,
          [key]: prev[key].length > 1 ? prev[key].filter(row => row.id !== id) : prev[key]
        };
      });
    },
    updatePeriod(id: string, field: 'start_date' | 'end_date', value: string) {
      setState(prev => {
        const key = prev.mode === 'US_PERIODS' ? 'usPeriods' : 'foreignPeriods';
        const updated = prev[key].map(row => (row.id === id ? { ...row, [field]: value } : row));
        return {
          ...prev,
          [key]: updated
        };
      });
    },
    result,
    errors,
    activePeriods
  };
}
