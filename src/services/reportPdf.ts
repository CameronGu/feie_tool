import type { jsPDF } from 'jspdf';
import coverage from '../assets/fonts/coverage.json';
import { appendixSections, dateLabel, displayPeriods, fractionLabel, reportSections, type ReportSection, type ReportTable, type TravelReport } from './report';

/** Preserve every unsupported code point visibly; clipboard/backup retain original Unicode. */
export function pdfSafeText(value: string): string {
  return [...value].map(character => {
    const point = character.codePointAt(0)!;
    return point === 10 || point === 13 || point >= 32 && coverage.some(([start, end]) => point >= start && point <= end)
      ? character : `[U+${point.toString(16).toUpperCase()}]`;
  }).join('');
}
export interface PdfOptions { includeAppendix?: boolean }
const COLORS = { navy: '#19354A', teal: '#116D72', ink: '#263A47', muted: '#526571', line: '#CED9DE', wash: '#F2F6F7' };

export async function createReportPdf(report: TravelReport, options: PdfOptions = {}): Promise<jsPDF> {
  const [{ jsPDF: Pdf }, { default: regularFont }, { default: boldFont }] = await Promise.all([
    import('jspdf'), import('../assets/fonts/NotoSans-Regular.base64?raw'), import('../assets/fonts/NotoSans-Bold.base64?raw')
  ]);
  const doc = new Pdf({ format: 'a4', unit: 'mm', compress: true, putOnlyUsedFonts: true });
  doc.addFileToVFS('NotoSans-Regular.ttf', regularFont.trim()); doc.addFont('NotoSans-Regular.ttf', 'Noto', 'normal');
  doc.addFileToVFS('NotoSans-Bold.ttf', boldFont.trim()); doc.addFont('NotoSans-Bold.ttf', 'Noto', 'bold');
  const left = 19, right = 191, width = right - left, bottom = 269;
  let y = 52, appendix = false;
  const pageKinds: boolean[] = [false];
  const setFont = (size: number, bold = false) => { doc.setFont('Noto', bold ? 'bold' : 'normal'); doc.setFontSize(size); };
  const text = (value: string, x: number, top: number, size = 10, bold = false, color = COLORS.ink) => {
    setFont(size, bold); doc.setTextColor(color); doc.text(pdfSafeText(value), x, top, { baseline: 'top' });
  };
  const rule = (top: number, color = COLORS.line, weight = .25) => { doc.setDrawColor(color); doc.setLineWidth(weight); doc.line(left, top, right, top); };
  const header = (first = false) => {
    if (first) {
      text('Physical Presence Test', left, 19, 25, true, COLORS.navy);
      text(`Foreign Earned Income Exclusion | Tax Year ${report.tax_year}`, left, 34, 11, false, COLORS.muted);
      rule(45, COLORS.teal, .7); y = 51;
    } else {
      text(appendix ? 'Detailed supporting records' : 'Physical Presence Test', left, 17, 14, true, COLORS.navy);
      text(`Tax Year ${report.tax_year} | ${appendix ? 'Supporting appendix' : 'Continued'}`, left, 26, 9, false, COLORS.muted);
      rule(34, COLORS.teal, .5); y = 41;
    }
  };
  const newPage = () => { doc.addPage(); pageKinds.push(appendix); header(); };
  const ensure = (height: number) => { if (y + height > bottom) newPage(); };
  const wrapped = (value: string, size: number, maxWidth = width, bold = false): string[] => {
    setFont(size, bold); return doc.splitTextToSize(pdfSafeText(value), maxWidth) as string[];
  };
  // Split even a single unusually long paragraph while keeping the next two lines together.
  const paragraph = (value: string, size = 10, bold = false, color = COLORS.ink, gap = 1.8, url?: string) => {
    const lines = wrapped(value, size, width, bold), leading = size * .352778 * 1.36;
    ensure(Math.min(lines.length, 2) * leading + gap);
    for (const line of lines) {
      ensure(leading);
      text(line, left, y, size, bold, url ? COLORS.teal : color);
      if (url) doc.link(left, y, doc.getTextWidth(line), leading, { url });
      y += leading;
    }
    y += gap;
  };
  const table = (data: ReportTable) => {
    const widths = data.widths.map(fraction => fraction * width);
    const xs = widths.map((_, index) => left + widths.slice(0, index).reduce((a, b) => a + b, 0));
    const size = 9.5, leading = 4.6, padding = 2;
    const prepare = (row: string[], bold = false) => row.map((cell, index) => wrapped(cell, size, widths[index] - padding * 2, bold));
    const headerLines = prepare(data.headers, true);
    const headerHeight = Math.max(...headerLines.map(lines => lines.length)) * leading + padding * 2;
    const draw = (cells: string[][], height: number, heading = false) => {
      if (heading) { doc.setFillColor(COLORS.wash); doc.rect(left, y, width, height, 'F'); }
      cells.forEach((lines, index) => lines.forEach((line, n) => {
        const numeric = /^\d+$/.test(line) && index > 0;
        setFont(size, heading); doc.setTextColor(heading ? COLORS.muted : COLORS.ink);
        doc.text(line, numeric ? xs[index] + widths[index] - padding : xs[index] + padding, y + padding + n * leading,
          { baseline: 'top', ...(numeric ? { align: 'right' as const } : {}) });
      }));
      y += height; rule(y);
    };
    const firstCells = data.rows.length ? prepare(data.rows[0]) : [];
    ensure(headerHeight + Math.min(32, Math.max(1, ...firstCells.map(lines => lines.length)) * leading + padding * 2));
    draw(headerLines, headerHeight, true);
    for (const row of data.rows) {
      const cells = prepare(row);
      let offset = 0;
      const count = Math.max(...cells.map(lines => lines.length));
      if (count * leading + padding * 2 <= bottom - 41 - headerHeight && y + count * leading + padding * 2 > bottom) {
        newPage(); draw(headerLines, headerHeight, true);
      }
      while (offset < count) {
        const capacity = Math.floor((bottom - y - padding * 2) / leading);
        if (capacity < 1) { newPage(); draw(headerLines, headerHeight, true); continue; }
        const take = Math.min(capacity, count - offset);
        draw(cells.map(lines => lines.slice(offset, offset + take)), take * leading + padding * 2);
        offset += take;
        if (offset < count) { newPage(); draw(headerLines, headerHeight, true); }
      }
    }
    y += 3;
  };
  const renderSection = (section: ReportSection) => {
    if (!appendix && section.title === 'References') {
      ensure(12); y += 3;
      let x = left;
      for (const line of section.lines) {
        setFont(8.5); const label = pdfSafeText(line.text), labelWidth = doc.getTextWidth(label);
        if (x + labelWidth > right) { x = left; y += 5.5; }
        text(label, x, y, 8.5, false, COLORS.teal);
        if (line.url) doc.link(x, y, labelWidth, 4.5, { url: line.url });
        x += labelWidth + 5;
      }
      y += 6; return;
    }
    const first = section.lines[0];
    const firstSize = first?.emphasis === 'period' ? 11.5 : 10;
    const firstHeight = first ? Math.max(first.emphasis === 'period' ? 24 : 0, Math.min(3, wrapped(first.text, firstSize).length) * firstSize * .352778 * 1.36) : section.table ? 48 : 0;
    if (appendix && section.title === 'Primary technical and legal references') {
      ensure(9 + section.lines.reduce((total, line) => total + wrapped(line.text, 8.5).length * 8.5 * .352778 * 1.36 + 1.5, 0));
    }
    if (section.title === 'Basis and limitations') {
      const basisHeight = section.lines.reduce((total, line) => total + wrapped(line.text, 10).length * 10 * .352778 * 1.36 + 1.5, 0);
      if (basisHeight < 130) ensure(9 + basisHeight + 12);
    }
    ensure(9 + firstHeight);
    // Clipped-count notes follow the schedule without another visual heading.
    if (section.title !== 'Counted portions') {
      y += 2; paragraph(section.title, 11.5, true, COLORS.navy, 1.6);
    }
    for (const line of section.lines) {
      if (line.emphasis === 'period') ensure(24); // Keep dates with their evidence.
      paragraph(line.text, line.url ? 8.5 : line.emphasis === 'period' ? 11.5 : section.title === 'Counted portions' || appendix ? 9.5 : 10,
        Boolean(line.emphasis), line.emphasis ? COLORS.navy : COLORS.ink, 1.5, line.url);
    }
    if (section.table) table(section.table);
  };
  header(true);
  paragraph(report.status_label, 13, true, COLORS.navy, 4);
  const incomplete = report.status === 'incomplete' || report.status === 'review-required' || !report.has_evidence;
  const periods = displayPeriods(report);
  if (incomplete || report.status === 'not-met') {
    if (report.has_evidence) {
      paragraph(`${report.status === 'not-met' ? report.max_possible_foreign_days : report.closest_period.foreign_days} / 330`, 28, true, COLORS.navy, 2);
      paragraph(report.status === 'not-met' ? 'Maximum attainable full foreign days' : 'Supported full foreign days; evidence incomplete', 10, false, COLORS.muted);
    }
    paragraph(`${report.tax_year} supported qualifying-period days: ${fractionLabel(report.qualifying_days, report.tax_year_days)}`, 10);
  } else {
    rule(y); y += 4;
    text(`${report.tax_year} qualifying-period days`, left, y, 10, true, COLORS.navy);
    text(periods.length === 1 ? 'Full foreign days in period' : 'Full foreign days per period', 122, y, 10, true, COLORS.navy);
    y += 7;
    text(`${report.qualifying_days} / ${report.tax_year_days}`, left, y, 30, true, COLORS.navy);
    const min = Math.min(...periods.map(period => period.foreign_days)), max = Math.max(...periods.map(period => period.foreign_days));
    const foreign = min === max ? String(min) : `${min}–${max}`;
    text(foreign, 122, y, foreign.length > 5 ? 24 : 30, true, COLORS.teal);
    y += 16;
    text(fractionLabel(report.qualifying_days, report.tax_year_days), left, y, 10);
    text('330 required in each 12 months', 122, y, 9.5, false, COLORS.muted);
    y += 6;
    text(`${(report.fraction * 100).toFixed(2)}% qualifying-period coverage`, left, y, 9.5, false, COLORS.muted);
    y += 8; rule(y); y += 2;
  }
  reportSections(report).forEach(renderSection);
  if (options.includeAppendix) {
    appendix = true; newPage();
    const sections = appendixSections(report);
    const originalText = sections.flatMap(section => section.lines.map(line => line.text)).join('');
    if (pdfSafeText(originalText) !== originalText) sections.push({ title: 'PDF character preservation', lines: [
      { text: 'Characters outside the bundled Noto Sans coverage appear as [U+codepoint]. Clipboard and JSON backup retain original Unicode.' }
    ] });
    sections.forEach(renderSection);
  }
  const count = doc.getNumberOfPages();
  for (let page = 1; page <= count; page++) {
    doc.setPage(page); rule(275);
    text('FEIE Window Optimizer | by Cameron Guthrie', left, 279, 8, false, COLORS.muted);
    setFont(8); doc.text(`${pageKinds[page - 1] ? 'Appendix | ' : ''}${page} / ${count}`, right, 279, { baseline: 'top', align: 'right' });
    text(`Generated ${dateLabel(report.generated_at.slice(0, 10))} | App ${report.app_version} | ${report.calculation_version}`, left, 285, 7.5, false, COLORS.muted);
  }
  doc.setProperties({ title: `Physical Presence Test | Tax Year ${report.tax_year}`, author: 'Cameron Guthrie',
    subject: 'Physical-presence evidence and conditional qualifying-period coverage', creator: `FEIE Window Optimizer ${report.app_version}` });
  return doc;
}
