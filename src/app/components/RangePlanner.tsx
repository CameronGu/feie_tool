import { useEffect, useMemo, useState } from 'react';
import { addDays, compareDate } from '../../domain/dates';
import type { Interval } from '../../domain/types';
import type { Mode, PeriodFormRow } from '../hooks/useCalculator';

interface RangePlannerProps {
  mode: Mode;
  taxYear: number;
  coverageStart: string;
  coverageEnd: string;
  periods: PeriodFormRow[];
  onRangeSelected(start: string, end: string): void;
}

interface DayCell {
  date: string;
  label: number;
  inMonth: boolean;
  inRange: boolean;
  inDraftRange: boolean;
  isDraftStart: boolean;
  isDraftEnd: boolean;
  disabled: boolean;
}

interface MonthData {
  label: string;
  year: number;
  weeks: DayCell[][];
}

const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const monthFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  timeZone: 'UTC'
});

function toISODate(year: number, monthIndex: number, day: number): string {
  const month = `${monthIndex + 1}`.padStart(2, '0');
  const dd = `${day}`.padStart(2, '0');
  return `${year}-${month}-${dd}`;
}

function lastDayOfMonth(year: number, monthIndex: number): number {
  return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
}

function enumerateYears(start: string, end: string): number[] {
  const startYear = Number(start.slice(0, 4));
  const endYear = Number(end.slice(0, 4));
  const years: number[] = [];
  for (let year = startYear; year <= endYear; year += 1) {
    years.push(year);
  }
  return years;
}

function monthIntersectsCoverage(
  year: number,
  monthIndex: number,
  coverageStart: string,
  coverageEnd: string
): boolean {
  const monthStart = toISODate(year, monthIndex, 1);
  const monthEnd = toISODate(year, monthIndex, lastDayOfMonth(year, monthIndex));
  return !(compareDate(monthEnd, coverageStart) < 0 || compareDate(monthStart, coverageEnd) > 0);
}

function buildDayCells(
  year: number,
  monthIndex: number,
  coverageStart: string,
  coverageEnd: string,
  intervals: Interval[],
  draftStart: string | null,
  draftHover: string | null
) {
  const monthStart = toISODate(year, monthIndex, 1);
  const firstDay = new Date(Date.UTC(year, monthIndex, 1));
  const offset = firstDay.getUTCDay();
  let cursor = addDays(monthStart, -offset);
  const weeks: DayCell[][] = [];

  const draftEndCandidate = (() => {
    if (!draftStart) return null;
    if (!draftHover) return draftStart;
    return compareDate(draftHover, draftStart) >= 0 ? draftHover : draftStart;
  })();

  for (let week = 0; week < 6; week += 1) {
    const cells: DayCell[] = [];
    for (let day = 0; day < 7; day += 1) {
      const inMonth = cursor.startsWith(`${year}-${`${monthIndex + 1}`.padStart(2, '0')}`);
      const disabled = compareDate(cursor, coverageStart) < 0 || compareDate(cursor, coverageEnd) > 0;
      const inRange = intervals.some(
        interval => compareDate(cursor, interval.start_date) >= 0 && compareDate(cursor, interval.end_date) <= 0
      );

      let inDraftRange = false;
      let isDraftStart = false;
      let isDraftEnd = false;

      if (!disabled && draftStart) {
        const draftEnd = draftEndCandidate ?? draftStart;
        const start = compareDate(draftStart, draftEnd) <= 0 ? draftStart : draftEnd;
        const end = compareDate(draftStart, draftEnd) <= 0 ? draftEnd : draftStart;

        if (compareDate(cursor, start) === 0) {
          isDraftStart = true;
        }
        if (compareDate(cursor, end) === 0) {
          isDraftEnd = true;
        }
        if (compareDate(cursor, start) >= 0 && compareDate(cursor, end) <= 0) {
          inDraftRange = true;
        }
      }

      cells.push({
        date: cursor,
        label: Number(cursor.split('-')[2]),
        inMonth,
        inRange,
        inDraftRange,
        isDraftStart,
        isDraftEnd,
        disabled
      });
      cursor = addDays(cursor, 1);
    }
    weeks.push(cells);
  }

  return weeks;
}

function buildMonthsForYear(
  year: number,
  coverageStart: string,
  coverageEnd: string,
  intervals: Interval[],
  draftStart: string | null,
  draftHover: string | null
): MonthData[] {
  const months: MonthData[] = [];
  for (let monthIndex = 0; monthIndex < 12; monthIndex += 1) {
    if (!monthIntersectsCoverage(year, monthIndex, coverageStart, coverageEnd)) {
      continue;
    }
    const label = `${monthFormatter.format(new Date(Date.UTC(year, monthIndex, 1)))} ${year}`;
    months.push({
      label,
      year,
      weeks: buildDayCells(year, monthIndex, coverageStart, coverageEnd, intervals, draftStart, draftHover)
    });
  }
  return months;
}

export function RangePlanner({
  mode,
  taxYear,
  coverageStart,
  coverageEnd,
  periods,
  onRangeSelected
}: RangePlannerProps) {
  const intervals = useMemo(() => {
    return periods
      .filter(row => row.start_date && row.end_date)
      .map(row => ({ start_date: row.start_date, end_date: row.end_date }));
  }, [periods]);

  const years = useMemo(() => enumerateYears(coverageStart, coverageEnd), [coverageStart, coverageEnd]);

  const [draftStart, setDraftStart] = useState<string | null>(null);
  const [draftHover, setDraftHover] = useState<string | null>(null);
  const [expandedYears, setExpandedYears] = useState<Set<number>>(() => new Set([taxYear]));

  useEffect(() => {
    setExpandedYears(prev => {
      if (prev.has(taxYear)) {
        return prev;
      }
      const next = new Set(prev);
      next.add(taxYear);
      return next;
    });
  }, [taxYear]);

  const toggleYear = (year: number) => {
    setExpandedYears(prev => {
      const next = new Set(prev);
      if (next.has(year)) {
        next.delete(year);
      } else {
        next.add(year);
      }
      return next;
    });
  };

  const handleDayClick = (cell: DayCell) => {
    if (cell.disabled) {
      return;
    }

    if (!draftStart) {
      setDraftStart(cell.date);
      setDraftHover(cell.date);
      return;
    }

    if (compareDate(cell.date, draftStart) < 0) {
      setDraftStart(cell.date);
      setDraftHover(cell.date);
      return;
    }

    const start = compareDate(draftStart, cell.date) <= 0 ? draftStart : cell.date;
    const end = compareDate(draftStart, cell.date) <= 0 ? cell.date : draftStart;
    onRangeSelected(start, end);
    setDraftStart(null);
    setDraftHover(null);
  };

  const handleMouseEnter = (cell: DayCell) => {
    if (cell.disabled || !draftStart) {
      return;
    }
    setDraftHover(cell.date);
  };

  const clearDraft = () => {
    setDraftStart(null);
    setDraftHover(null);
  };

  const cardClass = ['presence-card', mode === 'US_PERIODS' ? 'presence-card--us' : 'presence-card--foreign'].join(' ');
  const title = mode === 'US_PERIODS' ? 'Quick add U.S. presence' : 'Quick add foreign travel';
  const instructions =
    mode === 'US_PERIODS'
      ? 'Select the stretch you remained in the U.S. by clicking your arrival and departure days.'
      : 'Select the stretch you were abroad by choosing the first and final day of that stay.';

  return (
    <div className={cardClass}>
      <div className="sheet-header">
        <h3>{title}</h3>
        {draftStart && (
          <button type="button" className="ghost" onClick={clearDraft}>
            Clear selection
          </button>
        )}
      </div>
      <p className="help-text">
        {instructions} The planner covers {coverageStart} through {coverageEnd} so you can capture qualifying windows that extend beyond the core tax year.
      </p>
      <div className="range-planner">
        {years.map(year => {
          const months = buildMonthsForYear(year, coverageStart, coverageEnd, intervals, draftStart, draftHover);
          if (months.length === 0) {
            return null;
          }
          const expanded = expandedYears.has(year);
          const panelId = `range-year-${year}`;
          return (
            <div key={year} className={`range-year ${expanded ? 'range-year--expanded' : 'range-year--collapsed'}`}>
              <button
                type="button"
                className="range-year-header"
                onClick={() => toggleYear(year)}
                aria-expanded={expanded}
                aria-controls={panelId}
              >
                <div className="range-year-title">
                  <h4>{year}</h4>
                  <span>{expanded ? 'Tap to hide months' : 'Tap to expand calendar'}</span>
                </div>
                <span className={`range-year-icon ${expanded ? 'expanded' : ''}`} aria-hidden="true">
                  ▾
                </span>
              </button>
              <div id={panelId} className={`range-year-content ${expanded ? 'expanded' : 'collapsed'}`}>
                <div className="presence-calendar">
                  {months.map(month => (
                    <div key={month.label} className="presence-month">
                      <div className="presence-month-title">{month.label}</div>
                      <div className="presence-weekday-row">
                        {dayLabels.map(label => (
                          <span key={label}>{label}</span>
                        ))}
                      </div>
                      {month.weeks.map((week, weekIndex) => (
                        <div key={weekIndex} className="presence-week">
                          {week.map(cell => (
                            <button
                              key={cell.date}
                              type="button"
                              className={[
                                'presence-day',
                                cell.inMonth ? '' : 'presence-day--muted',
                                cell.disabled ? 'presence-day--disabled' : '',
                                cell.inRange ? 'presence-day--active' : '',
                                cell.inDraftRange ? 'presence-day--draft' : '',
                                cell.isDraftStart ? 'presence-day--draft-start' : '',
                                cell.isDraftEnd ? 'presence-day--draft-end' : ''
                              ]
                                .filter(Boolean)
                                .join(' ')}
                              onClick={() => handleDayClick(cell)}
                              onMouseEnter={() => handleMouseEnter(cell)}
                              disabled={cell.disabled}
                            >
                              {cell.label}
                            </button>
                          ))}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
