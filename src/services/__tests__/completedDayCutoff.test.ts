// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { deviceCutoff, latestCompletedDay, manualCutoff } from '../completedDayCutoff';
import { assessTravel } from '../travelCalculator';
import { buildReport, reportText } from '../report';
import { createReportPdf } from '../reportPdf';
import type { TravelHistory } from '../../domain/history';

describe('completed calendar-day boundary', () => {
  it.each([
    ['2026-11-27T01:30:00Z', 'America/Managua', '2026-11-25', '2026-11-26'],
    ['2026-11-27T06:00:00Z', 'America/Managua', '2026-11-26', '2026-11-27'],
    ['2026-12-31T11:00:00Z', 'Pacific/Kiritimati', '2026-12-31', '2027-01-01'],
    ['2026-01-01T01:00:00Z', 'America/Managua', '2025-12-30', '2025-12-31'],
    ['2024-03-01T06:00:00Z', 'America/Managua', '2024-02-29', '2024-03-01'],
    ['2026-03-08T07:30:00Z', 'America/New_York', '2026-03-07', '2026-03-08'],
    ['2026-11-01T06:30:00Z', 'America/New_York', '2026-10-31', '2026-11-01']
  ])('%s in %s uses last completed %s and exclusive boundary %s', (instant, zone, last, asOf) => {
    expect(deviceCutoff(new Date(instant), zone)).toMatchObject({ lastCompletedDay: last, asOf, device_time_zone: zone });
  });

  it('does not prematurely reach 330 after UTC midnight and keeps the next day projected', () => {
    const history: TravelHistory = { schema_version: 1, records: [{ id: 'boundary', kind: 'foreign', status: 'completed',
      start_date: '2026-01-01', end_date: '2026-11-26', note: '' }] };
    const cutoff = deviceCutoff(new Date('2026-11-27T01:30:00Z'), 'America/Managua');
    const completed = assessTravel(history, 2026, cutoff.asOf);
    expect(completed.calculation.closestWindow.foreign_days).toBe(329);
    expect(completed.calculation.qualifyingDays).toBe(0);
    const projected = buildReport(assessTravel(history, 2026, cutoff.asOf, true), undefined, completed, cutoff);
    expect(projected.status).toBe('projected');
    expect(projected.supporting_periods[0]).toMatchObject({ foreign_days: 330, recorded_foreign_days: 329, projected_foreign_days: 1 });
    const afterMidnight = deviceCutoff(new Date('2026-11-27T06:00:00Z'), 'America/Managua');
    expect(assessTravel(history, 2026, afterMidnight.asOf).calculation.closestWindow.foreign_days).toBe(330);
  });

  it('permits travel-calendar adjustment but rejects invalid and globally unfinished dates', () => {
    const now = new Date('2026-11-27T11:00:00Z');
    expect(deviceCutoff(now, 'America/Managua').lastCompletedDay).toBe('2026-11-26');
    expect(latestCompletedDay(now)).toBe('2026-11-27');
    expect(manualCutoff('2026-11-27', now)).toMatchObject({ asOf: '2026-11-28', basis: 'manual' });
    expect(manualCutoff('2026-11-20', now).asOf).toBe('2026-11-21');
    for (const date of ['2026-11-28', '2026-02-30', '', '1899-12-31']) expect(() => manualCutoff(date, now)).toThrow('completed calendar day');
  });

  it('retains the effective inclusive and exclusive boundary and manual provenance in both exports', async () => {
    const cutoff = manualCutoff('2026-11-25', new Date('2026-11-27T01:30:00Z'));
    const report = buildReport(assessTravel({ schema_version: 1, records: [] }, 2026, cutoff.asOf), undefined, undefined, cutoff);
    expect(report).toMatchObject({ as_of: '2026-11-26', last_completed_day: '2026-11-25', cutoff: { basis: 'manual' } });
    const text = reportText(report);
    expect(text).toContain('Completed through: 2026-11-25');
    expect(text).toContain('Exclusive as-of date: 2026-11-26');
    const doc = await createReportPdf(report);
    const commands = (doc.internal.pages as unknown as string[][]).flat().join(' ');
    expect(commands).toContain('Completed through: 2026-11-25');
    expect(commands).toContain('Cutoff basis: manual');
    expect(commands).toContain('Exclusive as-of date: 2026-11-26');
  });
});
