import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ResultsPanel } from '../components/ResultsPanel';
import { buildReport, reportText } from '../../services/report';
import { assessTravel } from '../../services/travelCalculator';
import { EMPTY_HISTORY } from '../../domain/history';

const { pdfFactory } = vi.hoisted(() => ({ pdfFactory: vi.fn() }));
vi.mock('../../services/reportPdf', () => ({ createReportPdf: pdfFactory }));
afterEach(() => { cleanup(); vi.restoreAllMocks(); pdfFactory.mockReset(); });
const report = buildReport(assessTravel(EMPTY_HISTORY, 2024, '2026-10-12'));

describe('report export fallbacks', () => {
  it('shows a copyable-text fallback when clipboard permission is denied', async () => {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: vi.fn().mockRejectedValue(new Error('denied')) } });
    render(<ResultsPanel report={report} baselineDays={0} />);
    fireEvent.click(screen.getByRole('button', { name: 'Copy preparer report' }));
    expect((await screen.findByRole('alert')).textContent).toContain('Clipboard unavailable');
    expect((screen.getByLabelText('Preparer report text') as HTMLTextAreaElement).value).toBe(reportText(report));
  });
  it('reports PDF failure visibly and re-enables export', async () => {
    pdfFactory.mockRejectedValue(new Error('generation failed'));
    render(<ResultsPanel report={report} baselineDays={0} />);
    fireEvent.click(screen.getByRole('button', { name: 'Download PDF report' }));
    expect((await screen.findByRole('alert')).textContent).toContain('PDF export failed');
    expect((screen.getByRole('button', { name: 'Download PDF report' }) as HTMLButtonElement).disabled).toBe(false);
  });
  it('exports an incomplete result using the same report model', async () => {
    const save = vi.fn(); pdfFactory.mockResolvedValue({ save });
    render(<ResultsPanel report={report} baselineDays={0} />);
    fireEvent.click(screen.getByRole('button', { name: 'Download PDF report' }));
    await screen.findByText('PDF report downloaded.');
    expect(pdfFactory).toHaveBeenCalledWith(report);
    expect(save).toHaveBeenCalledWith('feie-physical-presence-2024.pdf');
  });
});
