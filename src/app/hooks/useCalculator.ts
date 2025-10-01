import { useEffect, useMemo, useState } from 'react';
import { calculateFeie } from '../../services/calculator';
import type { CalculatorInput, CalculatorOutput, Interval, DateISO } from '../../domain/types';
import { isIsoDate, shiftYears } from '../../domain/dates';
import { invertPeriods } from '../../domain/intervals';

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
  taxYearStart: DateISO;
  taxYearEnd: DateISO;
  coverageStart: DateISO;
  coverageEnd: DateISO;
  taxYearOptions: number[];
  setTaxYear(value: number): void;
  setMode(mode: Mode, options?: { strategy?: 'convert' | 'literal' }): void;
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
    start: `${year}-01-01` as DateISO,
    end: `${year}-12-31` as DateISO
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

function ensureActiveRows(rows: PeriodFormRow[]): PeriodFormRow[] {
  if (rows.length === 0) {
    return [createRow()];
  }
  const hasBlank = rows.some(row => !row.start_date && !row.end_date);
  if (!hasBlank) {
    return [...rows, createRow()];
  }
  return rows;
}

function rowsFromIntervals(intervals: Interval[]): PeriodFormRow[] {
  if (intervals.length === 0) {
    return [createRow()];
  }
  const rows = intervals.map(createRowFromInterval);
  rows.push(createRow());
  return rows;
}

function sanitizePeriods(rows: PeriodFormRow[]): Interval[] {
  return rows
    .filter(row => row.start_date && row.end_date && isIsoDate(row.start_date) && isIsoDate(row.end_date))
    .map(row => ({ start_date: row.start_date as DateISO, end_date: row.end_date as DateISO }));
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
  const [taxYear, setTaxYearState] = useState(() => getDefaultTaxYear(referenceDate));
  const [modeState, setModeState] = useState<Mode>('FOREIGN_PERIODS');
  const [planningMode, setPlanningMode] = useState(false);
  const [usPeriods, setUsPeriods] = useState<PeriodFormRow[]>([createRow()]);
  const [foreignPeriods, setForeignPeriods] = useState<PeriodFormRow[]>([createRow()]);
  const [lastEditedMode, setLastEditedMode] = useState<Mode>('FOREIGN_PERIODS');
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [result, setResult] = useState<CalculatorOutput | null>(null);

  const taxYearBounds = useMemo(() => getTaxYearBounds(taxYear), [taxYear]);
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

  const activePeriods = modeState === 'US_PERIODS' ? usPeriods : foreignPeriods;

  const syncRows = (
    sourceMode: Mode,
    computeNext: (rows: PeriodFormRow[]) => PeriodFormRow[],
    options?: { preserveLastEditedMode?: boolean }
  ) => {
    if (sourceMode === 'US_PERIODS') {
      setUsPeriods(prev => {
        const next = ensureActiveRows(computeNext(prev));
        const sanitized = sanitizePeriods(next);
        const derivedForeignIntervals = sanitized.length > 0 ? invertPeriods(sanitized, coverageStart, coverageEnd) : [];
        setForeignPeriods(rowsFromIntervals(derivedForeignIntervals));
        if (!options?.preserveLastEditedMode) {
          setLastEditedMode('US_PERIODS');
        }
        return next;
      });
    } else {
      setForeignPeriods(prev => {
        const next = ensureActiveRows(computeNext(prev));
        const sanitized = sanitizePeriods(next);
        const derivedUsIntervals = sanitized.length > 0 ? invertPeriods(sanitized, coverageStart, coverageEnd) : [];
        setUsPeriods(rowsFromIntervals(derivedUsIntervals));
        if (!options?.preserveLastEditedMode) {
          setLastEditedMode('FOREIGN_PERIODS');
        }
        return next;
      });
    }
  };

  useEffect(() => {
    const clampRows = (rows: PeriodFormRow[]): PeriodFormRow[] => {
      let changed = false;
      const next = rows.map(row => {
        let start = row.start_date;
        let end = row.end_date;

        if (start && (start < coverageStart || start > coverageEnd)) {
          start = '';
          changed = true;
        }
        if (end && (end < coverageStart || end > coverageEnd)) {
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

    const canonicalRows = lastEditedMode === 'US_PERIODS' ? usPeriods : foreignPeriods;
    const clamped = clampRows(canonicalRows);
    syncRows(lastEditedMode, () => clamped, { preserveLastEditedMode: true });
  }, [coverageStart, coverageEnd]);

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
      mode: modeState,
      planning_mode: planningMode
    };

    if (modeState === 'US_PERIODS') {
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
  }, [modeState, planningMode, usPeriods, foreignPeriods, taxYearStart, taxYearEnd, coverageStart, coverageEnd]);

  const state: CalculatorState = useMemo(
    () => ({
      taxYear,
      mode: modeState,
      planningMode,
      usPeriods,
      foreignPeriods
    }),
    [taxYear, modeState, planningMode, usPeriods, foreignPeriods]
  );

  const updateModeRows = (targetMode: Mode, updater: (rows: PeriodFormRow[]) => PeriodFormRow[]) => {
    syncRows(targetMode, updater);
  };

  return {
    state,
    taxYearStart,
    taxYearEnd,
    coverageStart,
    coverageEnd,
    taxYearOptions,
    setTaxYear(value: number) {
      setTaxYearState(value);
    },
    setMode(mode: Mode, options?: { strategy?: 'convert' | 'literal' }) {
      const strategy = options?.strategy ?? 'convert';
      setModeState(prev => {
        if (prev === mode) {
          return prev;
        }

        if (strategy === 'literal') {
          const sourceRows = ensureActiveRows(prev === 'US_PERIODS' ? usPeriods : foreignPeriods);
          const literalRows = ensureActiveRows(
            sourceRows.map(row => ({
              ...createRow(),
              start_date: row.start_date,
              end_date: row.end_date
            }))
          );

          if (mode === 'US_PERIODS') {
            setUsPeriods(literalRows);
            setForeignPeriods([createRow()]);
            setLastEditedMode('US_PERIODS');
          } else {
            setForeignPeriods(literalRows);
            setUsPeriods([createRow()]);
            setLastEditedMode('FOREIGN_PERIODS');
          }
        } else {
          syncRows(prev, rows => [...rows], { preserveLastEditedMode: true });
        }

        return mode;
      });
    },
    togglePlanningMode() {
      setPlanningMode(prev => !prev);
    },
    addPeriod() {
      updateModeRows(modeState, rows => [...rows, createRow()]);
    },
    removePeriod(id: string) {
      updateModeRows(modeState, rows => {
        if (rows.length <= 1) {
          return rows;
        }
        const next = rows.filter(row => row.id !== id);
        return next.length === 0 ? [createRow()] : next;
      });
    },
    updatePeriod(id: string, field: 'start_date' | 'end_date', value: string) {
      updateModeRows(modeState, rows =>
        rows.map(row => (row.id === id ? { ...row, [field]: value } : row))
      );
    },
    commitInterval(interval: Interval) {
      updateModeRows(modeState, rows => {
        const blankIndex = rows.findIndex(row => !row.start_date && !row.end_date);
        let next: PeriodFormRow[];

        if (blankIndex !== -1) {
          next = rows.map((row, index) =>
            index === blankIndex ? { ...row, start_date: interval.start_date, end_date: interval.end_date } : row
          );
        } else {
          next = [...rows, createRowFromInterval(interval)];
        }

        if (!next.some(row => !row.start_date && !row.end_date)) {
          next = [...next, createRow()];
        }

        let blankSeen = false;
        next = next.filter(row => {
          if (!row.start_date && !row.end_date) {
            if (blankSeen) {
              return false;
            }
            blankSeen = true;
          }
          return true;
        });

        return next;
      });
    },
    clearPeriods() {
      updateModeRows(modeState, () => [createRow()]);
    },
    result,
    errors,
    activePeriods
  };
}
