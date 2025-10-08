import { useCallback, useEffect, useMemo, useState } from 'react';
import { APP_NAME, APP_URL, AUTHOR_CREDIT, DISCLAIMER, SOURCE_FOOTER } from '@/constants/meta';
import { APP_VERSION } from '@/version';
import { compareDate, diffDaysInclusive, maxDate, minDate } from '../../domain/dates';
import type { CalculatorOutput, DateISO } from '../../domain/types';
import type { PeriodFormRow } from '../hooks/useCalculator';
import { sanitizePeriodRows } from '../utils/periods';
import { Timeline } from './Timeline';

interface ResultsPanelProps {
  result: CalculatorOutput | null;
  planning: boolean;
  taxYear: number;
  usPeriods: PeriodFormRow[];
  foreignPeriods: PeriodFormRow[];
}

interface TravelIntervalRow {
  location: 'Foreign' | 'U.S.';
  start: DateISO;
  end: DateISO;
  duration: number;
}

interface FeieSummaryData {
  summary: {
    taxYear: number;
    qualifyingPeriodStart: DateISO;
    qualifyingPeriodEnd: DateISO;
    totalForeignDays: number;
    taxYearOverlapDays: number;
    prorationFraction: string;
  };
  travelIntervals: TravelIntervalRow[];
  clampedTravelIntervals: TravelIntervalRow[];
  notes: string;
}

export function ResultsPanel({ result, planning, taxYear, usPeriods, foreignPeriods }: ResultsPanelProps) {
  if (!result) {
    return (
      <aside className="panel results">
        <h2>Results</h2>
        <p>Enter tax year dates and travel intervals to see FEIE qualification analysis.</p>
      </aside>
    );
  }

  const status = result.qualified ? 'Qualified' : 'Not qualified yet';
  const tone = result.qualified ? 'status ok' : 'status warning';
  const primaryWindow = result.best_windows?.[0];
  const additionalCount = result.best_windows ? result.best_windows.length - 1 : 0;

  const feieData = useMemo<FeieSummaryData | null>(() => {
    if (!primaryWindow) {
      return null;
    }

    const foreignIntervals = sanitizePeriodRows(foreignPeriods).map(interval => ({
      location: 'Foreign' as const,
      start: interval.start_date,
      end: interval.end_date,
      duration: diffDaysInclusive(interval.start_date, interval.end_date)
    }));

    const usIntervals = sanitizePeriodRows(usPeriods).map(interval => ({
      location: 'U.S.' as const,
      start: interval.start_date,
      end: interval.end_date,
      duration: diffDaysInclusive(interval.start_date, interval.end_date)
    }));

    const travelIntervals = [...foreignIntervals, ...usIntervals].sort((a, b) => (a.start < b.start ? -1 : a.start > b.start ? 1 : 0));
    const qualifyingStart = primaryWindow.window_start;
    const qualifyingEnd = primaryWindow.window_end;

    // Clamp travel intervals to the qualifying window so displayed durations stay aligned with the 330-day test results.
    const clampedTravelIntervals = travelIntervals.reduce<TravelIntervalRow[]>((acc, interval) => {
      const displayStart = maxDate(interval.start, qualifyingStart);
      const displayEnd = minDate(interval.end, qualifyingEnd);

      if (compareDate(displayStart, displayEnd) > 0) {
        return acc;
      }

      acc.push({
        location: interval.location,
        start: displayStart,
        end: displayEnd,
        duration: Math.max(0, diffDaysInclusive(displayStart, displayEnd))
      });

      return acc;
    }, []).sort((a, b) => (a.start < b.start ? -1 : a.start > b.start ? 1 : compareDate(a.end, b.end)));
    const prorationFraction = Number(primaryWindow.pro_rata_fraction ?? 0).toFixed(3);

    return {
      summary: {
        taxYear,
        qualifyingPeriodStart: primaryWindow.window_start,
        qualifyingPeriodEnd: primaryWindow.window_end,
        totalForeignDays: primaryWindow.foreign_days,
        taxYearOverlapDays: primaryWindow.overlap_days,
        prorationFraction
      },
      travelIntervals,
      clampedTravelIntervals,
      notes: `This qualifying period was selected to maximize overlap with the ${taxYear} tax year while satisfying the 330-day physical presence test.`
    };
  }, [foreignPeriods, primaryWindow, taxYear, usPeriods]);

  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'error'>('idle');
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  useEffect(() => {
    if (copyStatus === 'copied') {
      const timer = window.setTimeout(() => setCopyStatus('idle'), 2000);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [copyStatus]);

  const handleCopySummary = useCallback(async () => {
    if (!feieData) {
      return;
    }

    const lines = [
      `Tax Year: ${feieData.summary.taxYear}`,
      `Qualifying Period: ${feieData.summary.qualifyingPeriodStart} → ${feieData.summary.qualifyingPeriodEnd}`,
      `Total Foreign Days: ${feieData.summary.totalForeignDays}`,
      `Tax Year Overlap Days: ${feieData.summary.taxYearOverlapDays}`,
      `Proration Fraction: ${feieData.summary.prorationFraction}`,
      '',
      'Travel Intervals:'
    ];

    if (feieData.clampedTravelIntervals.length > 0) {
      lines.push(
        ...feieData.clampedTravelIntervals.map(interval =>
          `${interval.location} | ${interval.start} → ${interval.end} | ${interval.duration}`
        )
      );
    } else {
      lines.push('No travel intervals captured.');
    }

    lines.push('', `Notes: ${feieData.notes}`);
    const timestamp = new Date().toISOString().split('T')[0];
    lines.push(
      '',
      '—',
      `${APP_NAME} — ${APP_URL}`,
      `${AUTHOR_CREDIT} · ${DISCLAIMER}`,
      `Generated ${timestamp} | Build ${APP_VERSION}`
    );

    try {
      if (!navigator.clipboard) {
        throw new Error('Clipboard API unavailable');
      }
      await navigator.clipboard.writeText(lines.join('\n'));
      setCopyStatus('copied');
    } catch (error) {
      console.error('Copy failed', error);
      setCopyStatus('error');
    }
  }, [feieData]);

  const handleExportPdf = useCallback(async () => {
    if (!feieData || isExportingPdf) {
      return;
    }

    setIsExportingPdf(true);
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF({ unit: 'pt', format: 'letter' });
      const timestamp = new Date().toISOString().split('T')[0];
      const footer = `${SOURCE_FOOTER} · Generated ${timestamp} | Build ${APP_VERSION}`;

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const marginX = 48;
      const marginY = 48;
      const contentWidth = pageWidth - marginX * 2;
      const bottomLimit = pageHeight - marginY;

      let cursorY = marginY;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.setTextColor(31, 41, 55);
      doc.text('FEIE Window Summary', marginX, cursorY);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.setTextColor(79, 70, 229);
      doc.text(`Tax year ${feieData.summary.taxYear}`, marginX, cursorY + 18);

      cursorY += 44;

      const summaryRows = [
        { label: 'Tax Year', value: String(feieData.summary.taxYear) },
        { label: 'Qualifying Period Start', value: feieData.summary.qualifyingPeriodStart },
        { label: 'Qualifying Period End', value: feieData.summary.qualifyingPeriodEnd },
        { label: 'Total Foreign Days', value: String(feieData.summary.totalForeignDays) },
        { label: 'Tax Year Overlap Days', value: String(feieData.summary.taxYearOverlapDays) },
        { label: 'Proration Fraction', value: feieData.summary.prorationFraction }
      ];

      const summaryRowHeight = 26;
      const summaryBlockHeight = summaryRows.length * summaryRowHeight + 48;
      doc.setFillColor(246, 248, 255);
      doc.setDrawColor(199, 210, 254);
      doc.setLineWidth(1);
      doc.roundedRect(marginX, cursorY, contentWidth, summaryBlockHeight, 12, 12, 'FD');

      let summaryCursorY = cursorY + 32;
      const labelX = marginX + 24;
      const valueX = marginX + contentWidth / 2;

      summaryRows.forEach(row => {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(88, 28, 135);
        doc.text(row.label, labelX, summaryCursorY);

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(31, 41, 55);
        doc.text(row.value, valueX, summaryCursorY);

        summaryCursorY += summaryRowHeight;
      });

      cursorY += summaryBlockHeight + 32;

      const ensureSpace = (height: number) => {
        if (cursorY + height > bottomLimit) {
          doc.addPage();
          cursorY = marginY;
        }
      };

      ensureSpace(60);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(31, 41, 55);
      doc.text('Travel Intervals', marginX, cursorY);
      cursorY += 12;

      const tableColumns = [
        { key: 'location', label: 'Location', width: 96 },
        { key: 'start', label: 'Start', width: 136 },
        { key: 'end', label: 'End', width: 136 },
        { key: 'duration', label: 'Duration (days)', width: contentWidth - 96 - 136 - 136 }
      ] as const;

      const headerHeight = 28;
      const rowHeight = 24;

      const drawTableHeader = () => {
        doc.setFillColor(224, 231, 255);
        doc.setDrawColor(199, 210, 254);
        doc.rect(marginX, cursorY, contentWidth, headerHeight, 'FD');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(17, 24, 39);

        let cellX = marginX + 16;
        tableColumns.forEach(column => {
          doc.text(column.label, cellX, cursorY + 18);
          cellX += column.width;
        });

        cursorY += headerHeight;
      };

      ensureSpace(headerHeight + 12);
      drawTableHeader();

      if (feieData.clampedTravelIntervals.length === 0) {
        const message = 'Add U.S. or foreign travel intervals to see them summarized here.';
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        doc.setTextColor(71, 85, 105);
        const wrapped = doc.splitTextToSize(message, contentWidth - 32);
        doc.text(wrapped, marginX + 16, cursorY + 16);
        cursorY += wrapped.length * 14 + 24;
      } else {
        feieData.clampedTravelIntervals.forEach((interval, index) => {
          if (cursorY + rowHeight > bottomLimit) {
            doc.addPage();
            cursorY = marginY;
            drawTableHeader();
          }

          const fillColor = index % 2 === 0 ? [255, 255, 255] : [243, 248, 255];
          doc.setFillColor(fillColor[0], fillColor[1], fillColor[2]);
          doc.setDrawColor(226, 232, 240);
          doc.rect(marginX, cursorY, contentWidth, rowHeight, 'FD');

          doc.setFont('helvetica', 'normal');
          doc.setFontSize(11);
          doc.setTextColor(31, 41, 55);

          const values = [
            interval.location,
            interval.start,
            interval.end,
            `${interval.duration} days`
          ];

          let cellX = marginX + 16;
          values.forEach((value, valueIndex) => {
            const column = tableColumns[valueIndex];
            doc.text(String(value), cellX, cursorY + 16);
            cellX += column.width;
          });

          cursorY += rowHeight;
        });
      }

      cursorY += 28;

      ensureSpace(80);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(31, 41, 55);
      doc.text('Notes', marginX, cursorY);
      cursorY += 20;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.setTextColor(71, 85, 105);
      const noteLines = doc.splitTextToSize(feieData.notes, contentWidth);
      doc.text(noteLines, marginX, cursorY);
      cursorY += noteLines.length * 14 + 24;

      if (cursorY > bottomLimit) {
        doc.addPage();
        cursorY = marginY;
      }

      const pageCount = doc.getNumberOfPages();
      doc.setPage(pageCount);
      const lastPageWidth = doc.internal.pageSize.getWidth();
      const lastPageHeight = doc.internal.pageSize.getHeight();

      const footerLines = doc.splitTextToSize(footer, lastPageWidth - marginX * 2);

      doc.setDrawColor(229, 231, 235);
      doc.line(marginX, lastPageHeight - marginY, lastPageWidth - marginX, lastPageHeight - marginY);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(136, 136, 136);
      doc.text(footerLines, lastPageWidth / 2, lastPageHeight - marginY + 10, {
        align: 'center',
        maxWidth: lastPageWidth - marginX * 2
      });

      doc.save(`feie-window-summary-${feieData.summary.taxYear}.pdf`);
    } catch (error) {
      console.error('PDF export failed', error);
    } finally {
      setIsExportingPdf(false);
    }
  }, [feieData, isExportingPdf]);

  return (
    <aside className="panel results">
      <h2>Results</h2>
      <div className={tone}>{status}</div>
      <div className="field">
        <span>Total tax-year days</span>
        <strong>{result.total_tax_year_days ?? '—'}</strong>
      </div>

      {primaryWindow && (
        <div className="optimized-copy">
          <h3>Optimized FEIE window</h3>
          <p>
            We evaluated every possible 12-month combination to lock in the window that shields the most of your {primaryWindow.overlap_days}{' '}
            tax-year days. Stay abroad from <strong>{primaryWindow.window_start}</strong> through <strong>{primaryWindow.window_end}</strong> to
            capture the maximum FEIE benefit.
          </p>
          {additionalCount > 0 && (
            <p>
              We also found {additionalCount} other {additionalCount === 1 ? 'window' : 'windows'} with the same coverage—check the timeline for
              alternate date ranges that still qualify.
            </p>
          )}
        </div>
      )}

      {feieData && (
        <div className="feie-summary-card">
          <div className="feie-summary-header">
            <h3>FEIE Window Summary</h3>
            <div className="feie-summary-actions">
              <button type="button" className="ghost" onClick={handleExportPdf} disabled={isExportingPdf}>
                {isExportingPdf ? 'Exporting...' : 'Export PDF'}
              </button>
              <button type="button" className="secondary" onClick={handleCopySummary}>
                Copy to Clipboard
              </button>
            </div>
          </div>

          {(copyStatus === 'copied' || copyStatus === 'error') && (
            <div className={copyStatus === 'copied' ? 'feie-inline-status success' : 'feie-inline-status error'}>
              {copyStatus === 'copied' ? 'Summary copied to clipboard.' : 'Copy failed. Try again.'}
            </div>
          )}

          <table className="feie-summary-table">
            <tbody>
              <tr>
                <th scope="row">Tax Year</th>
                <td>{feieData.summary.taxYear}</td>
              </tr>
              <tr>
                <th scope="row">Qualifying Period Start</th>
                <td>{feieData.summary.qualifyingPeriodStart}</td>
              </tr>
              <tr>
                <th scope="row">Qualifying Period End</th>
                <td>{feieData.summary.qualifyingPeriodEnd}</td>
              </tr>
              <tr>
                <th scope="row">Total Foreign Days</th>
                <td>{feieData.summary.totalForeignDays}</td>
              </tr>
              <tr>
                <th scope="row">Tax Year Overlap Days</th>
                <td>{feieData.summary.taxYearOverlapDays}</td>
              </tr>
              <tr>
                <th scope="row">Proration Fraction</th>
                <td>{feieData.summary.prorationFraction}</td>
              </tr>
            </tbody>
          </table>

          <div className="feie-travel-table-wrapper">
            <table className="feie-travel-table">
              <thead>
                <tr>
                  <th scope="col">Location</th>
                  <th scope="col">Start</th>
                  <th scope="col">End</th>
                  <th scope="col">Duration (days)</th>
                </tr>
              </thead>
              <tbody>
                {feieData.clampedTravelIntervals.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="feie-table-empty">
                      Add U.S. or foreign travel intervals to see them summarized here.
                    </td>
                  </tr>
                ) : (
                  feieData.clampedTravelIntervals.map(interval => (
                    <tr key={`${interval.location}-${interval.start}-${interval.end}`}>
                      <td>{interval.location}</td>
                      <td>{interval.start}</td>
                      <td>{interval.end}</td>
                      <td>{interval.duration}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <p className="feie-notes">{feieData.notes}</p>
        </div>
      )}

      {result.best_windows && result.best_windows.length > 0 ? (
        <Timeline windows={result.best_windows} />
      ) : (
        <p>
          We analyzed every 12-month window in this range, but none of them reached 330 foreign days. Adjust your travel plan or enable planning mode
          to see how many additional days you need.
        </p>
      )}

      {result.planning_info && (
        <div className="planning">
          <h3>Planning Insights</h3>
          <p>
            Foreign days needed: <strong>{result.planning_info.us_days_remaining}</strong>
          </p>
          {result.planning_info.optimal_starts.length > 0 ? (
            <ul>
              {result.planning_info.optimal_starts.map(date => (
                <li key={date}>{date}</li>
              ))}
            </ul>
          ) : (
            <p>{planning ? 'All goals met for selected windows.' : 'Enable planning mode to see optimal starts.'}</p>
          )}
        </div>
      )}

      {result.error && <div className="error">{result.error.message}</div>}
    </aside>
  );
}
