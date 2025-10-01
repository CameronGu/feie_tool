import { act, renderHook } from '@testing-library/react';
import { StrictMode, type ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { useCalculator } from '../useCalculator';

const strictWrapper = ({ children }: { children: ReactNode }) => <StrictMode>{children}</StrictMode>;

type PeriodRows = ReturnType<typeof useCalculator>['state']['foreignPeriods'];

function snapshotPeriods(rows: PeriodRows) {
  return rows.map(row => ({
    start: row.start_date,
    end: row.end_date
  }));
}

function filledRows(rows: PeriodRows) {
  return rows.filter(row => row.start_date && row.end_date);
}

describe('useCalculator', () => {
  it('retains foreign intervals when switching modes', () => {
    const { result } = renderHook(() => useCalculator(), { wrapper: strictWrapper });

    const firstRowId = result.current.state.foreignPeriods[0].id;

    act(() => {
      result.current.updatePeriod(firstRowId, 'start_date', '2023-01-01');
      result.current.updatePeriod(firstRowId, 'end_date', '2023-01-10');
    });

    expect(result.current.state.foreignPeriods[0].start_date).toBe('2023-01-01');
    expect(result.current.state.foreignPeriods[0].end_date).toBe('2023-01-10');

    act(() => {
      result.current.setMode('US_PERIODS');
    });

    act(() => {
      result.current.setMode('FOREIGN_PERIODS');
    });

    expect(result.current.state.foreignPeriods[0].start_date).toBe('2023-01-01');
    expect(result.current.state.foreignPeriods[0].end_date).toBe('2023-01-10');
  });

  it('retains multiple foreign intervals after the initial mode toggle', () => {
    const { result } = renderHook(() => useCalculator(), { wrapper: strictWrapper });

    const firstRowId = result.current.state.foreignPeriods[0].id;

    act(() => {
      result.current.updatePeriod(firstRowId, 'start_date', '2023-01-01');
      result.current.updatePeriod(firstRowId, 'end_date', '2023-01-10');
    });

    act(() => {
      result.current.addPeriod();
    });

    const secondRowId = result.current.state.foreignPeriods.find(row => row.id !== firstRowId)!.id;

    act(() => {
      result.current.updatePeriod(secondRowId, 'start_date', '2023-02-01');
      result.current.updatePeriod(secondRowId, 'end_date', '2023-02-15');
    });

    const beforeToggle = snapshotPeriods(result.current.state.foreignPeriods);

    act(() => {
      result.current.setMode('US_PERIODS');
    });

    act(() => {
      result.current.setMode('FOREIGN_PERIODS');
    });

    const afterToggle = snapshotPeriods(result.current.state.foreignPeriods);

    expect(afterToggle).toEqual(beforeToggle);
  });

  it('retains foreign intervals added via the range planner when switching modes', () => {
    const { result } = renderHook(() => useCalculator(), { wrapper: strictWrapper });

    act(() => {
      result.current.commitInterval({ start_date: '2023-03-01', end_date: '2023-03-10' });
      result.current.commitInterval({ start_date: '2023-04-01', end_date: '2023-04-20' });
    });

    expect(filledRows(result.current.state.usPeriods).length).toBeGreaterThan(0);

    const beforeToggle = snapshotPeriods(result.current.state.foreignPeriods);

    act(() => {
      result.current.setMode('US_PERIODS');
    });

    act(() => {
      result.current.setMode('FOREIGN_PERIODS');
    });

    const afterToggle = snapshotPeriods(result.current.state.foreignPeriods);

    expect(afterToggle).toEqual(beforeToggle);
  });

  it('retains US intervals added via the range planner across mode toggles', () => {
    const { result } = renderHook(() => useCalculator(), { wrapper: strictWrapper });

    act(() => {
      result.current.setMode('US_PERIODS');
    });

    act(() => {
      result.current.commitInterval({ start_date: '2023-05-01', end_date: '2023-05-10' });
      result.current.commitInterval({ start_date: '2023-06-01', end_date: '2023-06-15' });
      result.current.commitInterval({ start_date: '2023-07-04', end_date: '2023-07-20' });
    });

    expect(filledRows(result.current.state.foreignPeriods).length).toBeGreaterThan(0);

    const beforeForeignToggle = snapshotPeriods(result.current.state.usPeriods);

    act(() => {
      result.current.setMode('FOREIGN_PERIODS');
    });

    const immediatelyAfterForeignToggle = snapshotPeriods(result.current.state.usPeriods);
    expect(immediatelyAfterForeignToggle).toEqual(beforeForeignToggle);

    act(() => {
      result.current.setMode('US_PERIODS');
    });

    const afterToggleBack = snapshotPeriods(result.current.state.usPeriods);

    expect(afterToggleBack).toEqual(beforeForeignToggle);
  });

  it('moves literal intervals to the selected mode when requested', () => {
    const { result } = renderHook(() => useCalculator(), { wrapper: strictWrapper });

    act(() => {
      result.current.setMode('US_PERIODS');
    });

    const rowId = result.current.state.usPeriods[0].id;

    act(() => {
      result.current.updatePeriod(rowId, 'start_date', '2023-08-01');
      result.current.updatePeriod(rowId, 'end_date', '2023-08-10');
    });

    act(() => {
      result.current.setMode('FOREIGN_PERIODS', { strategy: 'literal' });
    });

    expect(result.current.state.mode).toBe('FOREIGN_PERIODS');
    expect(result.current.state.foreignPeriods[0].start_date).toBe('2023-08-01');
    expect(result.current.state.foreignPeriods[0].end_date).toBe('2023-08-10');
    expect(result.current.state.usPeriods.every(row => !row.start_date && !row.end_date)).toBe(true);
  });
});
