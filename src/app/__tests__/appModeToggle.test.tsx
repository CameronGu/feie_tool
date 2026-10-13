import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { StrictMode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../App';
import { STORAGE_KEY } from '../../services/historyStorage';

beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-10-12T12:00:00Z'));
});
afterEach(() => { cleanup(); vi.useRealTimers(); vi.restoreAllMocks(); });
function open() { render(<StrictMode><App /></StrictMode>); fireEvent.change(screen.getByLabelText('Calendar tax year'), { target: { value: '2024' } }); }
function add(kind: string, start: string, end: string, proposed = false) {
  fireEvent.change(screen.getByLabelText('Record type'), { target: { value: kind } });
  fireEvent.change(screen.getByLabelText(kind.startsWith('foreign') ? 'First full foreign day' : 'Start date'), { target: { value: start } });
  fireEvent.change(screen.getByLabelText(kind.startsWith('foreign') ? 'Last full foreign day' : 'End date'), { target: { value: end } });
  fireEvent.change(screen.getByLabelText('Travel status'), { target: { value: proposed ? 'proposed' : 'completed' } });
  if (kind === 'foreign_assumption') fireEvent.click(screen.getByLabelText(/I explicitly assume/));
  fireEvent.click(screen.getByRole('button', { name: 'Save travel record' }));
}

describe('primary travel workflows', () => {
  it('leaves an empty U.S. entry view incomplete and does not require a mode-transfer dialog', () => {
    open(); fireEvent.click(screen.getByRole('button', { name: 'Enter U.S. visits' }));
    expect(screen.getByRole('heading', { name: 'Add travel evidence to begin' })).toBeTruthy();
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).records).toEqual([]);
  });
  it('preserves old travel dates through year and view changes and supports correction', () => {
    open(); add('foreign', '2016-01-01', '2016-12-31');
    fireEvent.change(screen.getByLabelText('Calendar tax year'), { target: { value: '2027' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enter U.S. visits' }));
    fireEvent.click(screen.getByRole('button', { name: 'Enter foreign stays' }));
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).records[0].start_date).toBe('2016-01-01');
    fireEvent.click(screen.getByRole('button', { name: 'Edit Full foreign days 2016-01-01' }));
    fireEvent.change(screen.getByLabelText('Last full foreign day'), { target: { value: '2016-11-30' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).records[0].end_date).toBe('2016-11-30');
  });
  it('keeps report evidence consistent when switching entry views', async () => {
    const copy = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: copy }, configurable: true });
    open(); add('foreign_assumption', '2024-01-01', '2024-12-31'); add('us', '2024-12-01', '2024-12-31');
    fireEvent.click(screen.getByRole('button', { name: 'Enter U.S. visits' }));
    fireEvent.click(screen.getByRole('button', { name: 'Enter foreign stays' }));
    expect(screen.getByRole('heading', { name: 'Threshold met under declared assumptions' })).toBeTruthy();
    const report = (screen.getByLabelText('Preparer report text') as HTMLTextAreaElement).value;
    expect(report).toContain('335 / 330 required');
    expect(report).toContain('2024-12-01 to 2024-12-31 | us | recorded');
    expect(report).toContain('366 / 366');
    fireEvent.click(screen.getByRole('button', { name: 'Copy preparer report' }));
    await waitFor(() => expect(copy).toHaveBeenCalledWith(report));
  });
  it('previews the example without replacing user history', () => {
    open(); add('unknown', '2024-01-01', '2024-01-02');
    const saved = localStorage.getItem(STORAGE_KEY);
    fireEvent.click(screen.getByRole('button', { name: 'Preview an example' }));
    expect(screen.getByRole('heading', { name: 'Physical presence · 2025' })).toBeTruthy();
    expect(localStorage.getItem(STORAGE_KEY)).toBe(saved);
    fireEvent.click(screen.getByRole('button', { name: 'Close example' }));
    expect(screen.getByRole('heading', { name: 'Physical presence · 2024' })).toBeTruthy();
  });
  it('compares a proposal without replacing the completed-record result', () => {
    open(); add('foreign', '2024-01-01', '2024-12-31', true);
    expect(screen.getByRole('heading', { name: 'Add travel evidence to begin' })).toBeTruthy();
    fireEvent.click(screen.getByLabelText('Compare proposed and future travel'));
    expect(screen.getByRole('heading', { name: 'Projected physical-presence coverage' })).toBeTruthy();
    fireEvent.click(screen.getByLabelText('Compare proposed and future travel'));
    expect(screen.getByRole('heading', { name: 'Add travel evidence to begin' })).toBeTruthy();
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).records[0].status).toBe('proposed');
  });
  it('rejects conflicts and requires a deliberate reset; undo restores records', () => {
    open(); add('foreign', '2024-01-01', '2024-12-31'); add('us', '2024-06-01', '2024-06-02');
    expect(screen.getByRole('alert').textContent).toContain('Overlapping');
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).records).toHaveLength(1);
    const reset = screen.getByRole('button', { name: 'Reset saved history', hidden: true }) as HTMLButtonElement;
    expect(reset.disabled).toBe(true);
    fireEvent.click(screen.getByLabelText('I want to remove all saved travel records.')); fireEvent.click(reset);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).records).toHaveLength(0);
    fireEvent.click(screen.getByRole('button', { name: 'Undo last history change' }));
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).records).toHaveLength(1);
  });
  it('reviews an import before merging and never silently replaces history', async () => {
    open(); add('us', '2024-01-01', '2024-01-02');
    const imported = { schema_version: 1, records: [{ id: 'imported', kind: 'unknown', status: 'completed', start_date: '2024-03-01', end_date: '2024-03-02', note: '' }] };
    const file = new File([JSON.stringify(imported)], 'backup.json', { type: 'application/json' });
    Object.defineProperty(file, 'text', { value: async () => JSON.stringify(imported) });
    fireEvent.change(screen.getByLabelText('Choose travel-history backup'), { target: { files: [file] } });
    await screen.findByRole('heading', { name: 'Review import: 1 records' });
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).records).toHaveLength(1);
    expect((screen.getByRole('button', { name: 'Replace history with backup' }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Merge imported records' }));
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).records).toHaveLength(2);
  });
  it('does not crash or emit hook-order warnings across empty, successful and invalid states', () => {
    const error = vi.spyOn(console, 'error');
    open(); add('foreign', '2024-01-01', '2024-12-31');
    fireEvent.click(screen.getByRole('button', { name: 'Delete Full foreign days 2024-01-01' }));
    expect(screen.getByRole('heading', { name: 'Add travel evidence to begin' })).toBeTruthy();
    expect(error).not.toHaveBeenCalled();
  });
});

it('establishes ongoing presence, returns to visits, edits and deliberately ends the same baseline', () => {
  open(); fireEvent.click(screen.getByRole('button', { name: 'Enter U.S. visits' }));
  fireEvent.click(screen.getByRole('button', { name: 'Establish default foreign presence' }));
  expect(screen.queryByLabelText('Travel status')).toBeNull();
  fireEvent.change(screen.getByLabelText('First full foreign day'), { target: { value: '2024-01-01' } });
  fireEvent.click(screen.getByLabelText(/I explicitly assume/));
  fireEvent.click(screen.getByRole('button', { name: 'Save default foreign presence' }));
  expect(screen.getByText('Default foreign presence since 2024-01-01 · Ongoing')).toBeTruthy();
  expect((screen.getByLabelText('Record type') as HTMLSelectElement).value).toBe('us');
  add('us', '2024-02-01', '2024-02-05'); add('us', '2024-06-01', '2024-06-05');
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
  expect(saved.records).toHaveLength(3);
  expect(saved.records[0].ongoing).toBe(true);
  fireEvent.click(screen.getByRole('button', { name: 'Edit default presence' }));
  fireEvent.change(screen.getByLabelText('First full foreign day'), { target: { value: '2023-12-31' } });
  fireEvent.click(screen.getByLabelText(/I explicitly assume/));
  fireEvent.click(screen.getByRole('button', { name: 'Save default foreign presence' }));
  fireEvent.click(screen.getByRole('button', { name: 'End default presence' }));
  const confirm = screen.getByRole('button', { name: 'Confirm end of foreign presence' }) as HTMLButtonElement;
  expect(confirm.disabled).toBe(true);
  fireEvent.change(screen.getByLabelText('Final covered full foreign day'), { target: { value: '2024-12-31' } });
  fireEvent.click(screen.getByLabelText(/I explicitly assume/));
  expect(confirm.disabled).toBe(true);
  fireEvent.click(screen.getByLabelText(/End default foreign presence after/));
  fireEvent.click(confirm);
  const ended = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
  expect(ended.records).toHaveLength(3);
  expect(ended.records[0]).toMatchObject({ id: saved.records[0].id, start_date: '2023-12-31', end_date: '2024-12-31' });
  expect(ended.records[0].ongoing).toBeUndefined();
  expect(screen.queryByText(/Default foreign presence since/)).toBeNull();
}, 15000);

it('C02: never mixes saved 2024 coverage with the 2025 example', () => {
  open(); add('foreign', '2024-01-01', '2024-12-31');
  fireEvent.click(screen.getByRole('button', { name: 'Preview an example' }));
  const text = (screen.getByLabelText('Preparer report text') as HTMLTextAreaElement).value;
  expect(text).toContain('Calendar tax year: 2025');
  expect(text).not.toContain('COMPLETED / SCENARIO COMPARISON');
  expect(screen.queryByText(/Completed-record coverage:/)).toBeNull();
});

it('shows an actionable empty state without an arbitrary candidate or deficit', () => {
  open();
  expect(screen.getByRole('heading', { name: 'Add travel evidence to begin' })).toBeTruthy();
  expect(screen.queryByText('Strongest supported period')).toBeNull();
  expect(screen.queryByText(/more would be needed/)).toBeNull();
});
