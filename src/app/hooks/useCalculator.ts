import { useEffect, useMemo, useState } from 'react';
import { calculateFeie } from '../../services/calculator';
import type { CalculatorInput, CalculatorOutput, Interval } from '../../domain/types';
import { isIsoDate, shiftYears } from '../../domain/dates';

export type Mode = 'US_PERIODS' | 'FOREIGN_PERIODS';

export interface PeriodFormRow {
  id: string;
  start_date: string;
  end_date: string;
}

export interface CalculatorState {
  taxYear: number;
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
  taxYearStart: string;
  taxYearEnd: string;
  coverageStart: string;
  coverageEnd: string;
  taxYearOptions: number[];
  setTaxYear(value: number): void;
  setMode(mode: Mode): void;
  togglePlanningMode(): void;
  addPeriod(): void;
  removePeriod(id: string): void;
  updatePeriod(id: string, field: 'start_date' | 'end_date', value: string): void;
  commitInterval(interval: Interval): void;
  clearPeriods(): void;
  result: CalculatorOutput | null;
  errors: ValidationErrors;
  activePeriods: PeriodFormRow[];
}

function getTaxYearBounds(year: number) {
  return {
    start: `${year}-01-01`,
    end: `${year}-12-31`
  } as const;
}

function getDefaultTaxYear(referenceDate: Date): number {
  const currentYear = referenceDate.getUTCFullYear();
  const oct15 = Date.UTC(currentYear, 9, 15, 23, 59, 59, 999);
  if (referenceDate.getTime() <= oct15) {
    return currentYear - 1;
  }
  return currentYear;
}

function getTaxYearOptions(referenceDate: Date): number[] {
  const currentYear = referenceDate.getUTCFullYear();
  const minYear = currentYear - 7;
  const maxYear = currentYear + 1;
  const options: number[] = [];
  for (let year = maxYear; year >= minYear; year -= 1) {
    options.push(year);
  }
  return options;
}

function createRow(): PeriodFormRow {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    start_date: '',
    end_date: ''
  };
}

function createRowFromInterval(interval: Interval): PeriodFormRow {
  return {
    ...createRow(),
    start_date: interval.start_date,
    end_date: interval.end_date
  };
}

function sanitizePeriods(rows: PeriodFormRow[]): Interval[] {
  return rows
    .filter(row => row.start_date && row.end_date && isIsoDate(row.start_date) && isIsoDate(row.end_date))
    .map(row => ({ start_date: row.start_date, end_date: row.end_date }));
}

function validate(
  taxYearStart: string,
  taxYearEnd: string,
  coverageStart: string,
  coverageEnd: string,
  activePeriods: PeriodFormRow[]
): ValidationErrors {
  const errors: ValidationErrors = {};

  if (!isIsoDate(taxYearStart) || !isIsoDate(taxYearEnd)) {
    errors.tax_year = 'Select a valid tax year.';
  }

  activePeriods.forEach((row, index) => {
    const hasStart = row.start_date.length > 0;
    const hasEnd = row.end_date.length > 0;

    if (!hasStart && !hasEnd) {
      return;
    }

    if (!hasStart || !hasEnd) {
      errors[`period_${index}`] = 'Select both start and end dates within the tax year.';
      return;
    }

    if (!isIsoDate(row.start_date) || !isIsoDate(row.end_date)) {
      errors[`period_${index}`] = 'Enter valid calendar dates (YYYY-MM-DD).';
      return;
    }

    if (row.start_date > row.end_date) {
      errors[`period_${index}`] = 'Interval start must be on or before end date.';
      return;
    }

    if (row.start_date < coverageStart || row.end_date > coverageEnd) {
      errors[`period_${index}`] = `Keep intervals within ${coverageStart} and ${coverageEnd}.`;
    }
  });

  return errors;
}

export function useCalculator(): UseCalculatorResult {
  const [referenceDate] = useState(() => new Date());
  const taxYearOptions = useMemo(() => getTaxYearOptions(referenceDate), [referenceDate]);
  const [state, setState] = useState<CalculatorState>(() => ({
    taxYear: getDefaultTaxYear(referenceDate),
    mode: 'FOREIGN_PERIODS',
    planningMode: false,
    usPeriods: [createRow()],
    foreignPeriods: [createRow()]
  }));
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [result, setResult] = useState<CalculatorOutput | null>(null);
  const taxYearBounds = useMemo(() => getTaxYearBounds(state.taxYear), [state.taxYear]);
  const taxYearStart = taxYearBounds.start;
  const taxYearEnd = taxYearBounds.end;
  const coverageBounds = useMemo(() => {
    return {
      start: shiftYears(taxYearStart, -1),
      end: shiftYears(taxYearEnd, 1)
    } as const;
  }, [taxYearStart, taxYearEnd]);
  const coverageStart = coverageBounds.start;
  const coverageEnd = coverageBounds.end;

  const activePeriods = useMemo(
    () => (state.mode === 'US_PERIODS' ? state.usPeriods : state.foreignPeriods),
    [state.mode, state.usPeriods, state.foreignPeriods]
  );

  useEffect(() => {
    const min = coverageStart;
    const max = coverageEnd;

    setState(prev => {
      const clampRows = (rows: PeriodFormRow[]) => {
        let changed = false;
        const next = rows.map(row => {
          let start = row.start_date;
          let end = row.end_date;

          if (start && (start < min || start > max)) {
            start = '';
            changed = true;
          }
          if (end && (end < min || end > max)) {
            end = '';
            changed = true;
          }

          if (start !== row.start_date || end !== row.end_date) {
            return { ...row, start_date: start, end_date: end };
          }

          return row;
        });

        return changed ? next : rows;
      };

      const nextUs = clampRows(prev.usPeriods);
      const nextForeign = clampRows(prev.foreignPeriods);

      if (nextUs === prev.usPeriods && nextForeign === prev.foreignPeriods) {
        return prev;
      }

      return {
        ...prev,
        usPeriods: nextUs,
        foreignPeriods: nextForeign
      };
    });
  }, [taxYearStart, taxYearEnd, coverageStart, coverageEnd]);

  useEffect(() => {
    const validationErrors = validate(taxYearStart, taxYearEnd, coverageStart, coverageEnd, activePeriods);
    const sanitized = sanitizePeriods(activePeriods);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setResult(null);
      return;
    }

    const calculatorInput: CalculatorInput = {
      tax_year_start: taxYearStart,
      tax_year_end: taxYearEnd,
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
  }, [state, activePeriods, taxYearStart, taxYearEnd, coverageStart, coverageEnd]);

  return {
    state,
    taxYearStart,
    taxYearEnd,
    coverageStart,
    coverageEnd,
    taxYearOptions,
    setTaxYear(value: number) {
      setState(prev => ({ ...prev, taxYear: value }));
    },
    setMode(mode: Mode) {
      setState(prev => {
        if (prev.mode === mode) {
          return prev;
        }
        return {
          ...prev,
          mode
        };
      });
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
    commitInterval(interval: Interval) {
      setState(prev => {
        const key = prev.mode === 'US_PERIODS' ? 'usPeriods' : 'foreignPeriods';
        if (interval.start_date < coverageStart || interval.end_date > coverageEnd) {
          return prev;
        }
        const rows = prev[key];
        const blankIndex = rows.findIndex(row => !row.start_date && !row.end_date);
        let nextRows: PeriodFormRow[];

        if (blankIndex !== -1) {
          nextRows = rows.map((row, index) =>
            index === blankIndex ? { ...row, start_date: interval.start_date, end_date: interval.end_date } : row
          );
        } else {
          nextRows = [...rows, createRowFromInterval(interval)];
        }

        const hasBlank = nextRows.some(row => !row.start_date && !row.end_date);
        if (!hasBlank) {
          nextRows = [...nextRows, createRow()];
        }

        let blankSeen = false;
        nextRows = nextRows.filter(row => {
          if (!row.start_date && !row.end_date) {
            if (blankSeen) {
              return false;
            }
            blankSeen = true;
          }
          return true;
        });

        return {
          ...prev,
          [key]: nextRows
        };
      });
    },
    clearPeriods() {
      setState(prev => {
        const key = prev.mode === 'US_PERIODS' ? 'usPeriods' : 'foreignPeriods';
        const next = [createRow()];
        return {
          ...prev,
          [key]: next
        };
      });
    },
    result,
    errors,
    activePeriods
  };
}
