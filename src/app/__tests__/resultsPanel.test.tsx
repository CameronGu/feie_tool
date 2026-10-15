import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ResultsPanel } from '../components/ResultsPanel';
import { buildReport, reportText } from '../../services/report';
import { assessTravel } from '../../services/travelCalculator';
import { EMPTY_HISTORY, type TravelHistory } from '../../domain/history';

const { pdfFactory } = vi.hoisted(() => ({ pdfFactory: vi.fn() }));
vi.mock('../../services/reportPdf', () => ({ createReportPdf: pdfFactory }));
afterEach(() => { cleanup(); vi.restoreAllMocks(); pdfFactory.mockReset(); });
const report = buildReport(assessTravel(EMPTY_HISTORY, 2024, '2026-10-12'));

describe('report export fallbacks', () => {
  it('shows a copyable-text fallback when clipboard permission is denied', async () => {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: vi.fn().mockRejectedValue(new Error('denied')) } });
    render(<ResultsPanel report={report} />);
    fireEvent.click(screen.getByRole('button', { name: 'Copy preparer report' }));
    expect((await screen.findByRole('alert')).textContent).toContain('Clipboard unavailable');
    expect((screen.getByLabelText('Preparer report text') as HTMLTextAreaElement).value).toBe(reportText(report));
  });
  it('reports PDF failure visibly and re-enables export', async () => {
    pdfFactory.mockRejectedValue(new Error('generation failed'));
    render(<ResultsPanel report={report} />);
    fireEvent.click(screen.getByRole('button', { name: 'Download PDF report' }));
    expect((await screen.findByRole('alert')).textContent).toContain('PDF export failed');
    expect((screen.getByRole('button', { name: 'Download PDF report' }) as HTMLButtonElement).disabled).toBe(false);
  });
  it('adds the detailed appendix only when selected', async () => {
    const save = vi.fn(); pdfFactory.mockResolvedValue({ save });
    render(<ResultsPanel report={report} />);
    const option = screen.getByLabelText('Include detailed supporting records') as HTMLInputElement;
    expect(option.checked).toBe(false);
    fireEvent.click(option);
    fireEvent.click(screen.getByRole('button', { name: 'Download PDF report' }));
    await screen.findByText('PDF report downloaded.');
    expect(pdfFactory).toHaveBeenCalledWith(report, { includeAppendix: true });
  });
  it('exports an incomplete result using the same report model', async () => {
    const save = vi.fn(); pdfFactory.mockResolvedValue({ save });
    render(<ResultsPanel report={report} />);
    fireEvent.click(screen.getByRole('button', { name: 'Download PDF report' }));
    await screen.findByText('PDF report downloaded.');
    expect(pdfFactory).toHaveBeenCalledWith(report, { includeAppendix: false });
    expect(save).toHaveBeenCalledWith('feie-physical-presence-2024.pdf');
  });
});

describe('contextual result explanations', () => {
  const history: TravelHistory = { schema_version: 1, records: [
    { id: 'assumption', kind: 'foreign_assumption', status: 'completed', start_date: '2015-01-01', end_date: '2025-12-31', note: '' },
    { id: 'may', kind: 'us', status: 'completed', start_date: '2025-05-31', end_date: '2025-06-29', note: '' },
    { id: 'december', kind: 'us', status: 'completed', start_date: '2025-12-13', end_date: '2026-01-13', note: '' }
  ] };
  it('explains the validated 330 foreign / 351 qualifying-period days with the actual selected period', () => {
    const model = buildReport(assessTravel(history, 2025, '2026-10-13'));
    expect(model.qualifying_days).toBe(351);
    render(<ResultsPanel report={model} />);
    expect(screen.getByText('Your travel dates meet the 330-day physical presence test under the assumptions you’ve provided.')).toBeTruthy();
    expect(screen.getByText('This period supplies all 351 supported qualifying-period days in 2025.')).toBeTruthy();
    expect(screen.getByText('2024-12-18 to 2025-12-17')).toBeTruthy();
    expect(screen.getByText('330 / 330 required')).toBeTruthy();
    expect(screen.getByText(/Pay for work performed in the United States/)).toBeTruthy();
    expect(screen.getByText('Day-count details').closest('details')?.open).toBe(false);
  });
  it('bases the multiple-period explanation on distinct union coverage', () => {
    const multiple: TravelHistory = { schema_version: 1, records: [
      { ...history.records[0], start_date: '2023-01-01', end_date: '2025-12-31' },
      { ...history.records[1], start_date: '2024-06-01', end_date: '2024-07-31' }
    ] };
    const model = buildReport(assessTravel(multiple, 2024, '2026-10-13'));
    expect(model.supporting_periods).toHaveLength(2);
    render(<ResultsPanel report={model} />);
    expect(screen.getByText(/These 2 periods together supply 366 distinct qualifying-period days in 2024/)).toBeTruthy();
    expect(screen.queryByText(/This period supplies all/)).toBeNull();
  });
  it('explains missing dates as upper-bound possibilities, not recorded evidence', () => {
    const incomplete: TravelHistory = { schema_version: 1, records: [{ ...history.records[0], kind: 'foreign', start_date: '2025-01-01', end_date: '2025-11-25' }] };
    const model = buildReport(assessTravel(incomplete, 2025, '2026-10-13'));
    expect(model.status).toBe('incomplete');
    render(<ResultsPanel report={model} />);
    expect(screen.getByText('We need more travel information to determine whether a qualifying period is supported.')).toBeTruthy();
    expect(screen.getByText(/The strongest supported count is a lower bound/)).toBeTruthy();
    expect(screen.getByText('Unresolved dates in that period:')).toBeTruthy();
  });
  it('offers residence guidance only as a separate possibility after confirmed failure', () => {
    const failedHistory: TravelHistory = { schema_version: 1, records: [{ ...history.records[0], kind: 'us', start_date: '2024-01-02', end_date: '2026-12-30' }] };
    const model = buildReport(assessTravel(failedHistory, 2025, '2026-10-13'));
    expect(model.status).toBe('not-met');
    render(<ResultsPanel report={model} />);
    expect(screen.getByText('Your recorded travel doesn’t meet the 330-day test for this tax year.')).toBeTruthy();
    expect(screen.getByText(/The bona fide residence test works differently/)).toBeTruthy();
    expect(screen.getByText(/That is 330 days short/)).toBeTruthy();
  });
  it('clips unresolved-date help to its upper-bound period and the completed-day cutoff', () => {
    const incomplete: TravelHistory = { schema_version: 1, records: [{ ...history.records[0], kind: 'foreign', start_date: '2025-12-01', end_date: '2026-10-10' }] };
    const model = buildReport(assessTravel(incomplete, 2026, '2026-10-13'));
    render(<ResultsPanel report={model} />);
    const details = screen.getByText('Why is this calculation incomplete?').closest('details')!;
    expect(within(details).getAllByRole('listitem', { hidden: true }).map(item => item.textContent?.trim())).toEqual([
      '2025-10-13 to 2025-11-30', '2026-10-11 to 2026-10-12'
    ]);
  });
  it('labels projected support without claiming completed qualification', () => {
    const model = buildReport(assessTravel(history, 2025, '2025-06-01', true));
    expect(model.status).toBe('projected');
    render(<ResultsPanel report={model} />);
    expect(screen.getByText(/This projected result meets the 330-day count/)).toBeTruthy();
    expect(screen.queryByText(/Your travel dates meet/)).toBeNull();
  });
});
