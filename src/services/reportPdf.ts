import type { jsPDF } from 'jspdf';
import { reportText, type TravelReport } from './report';

/** Core PDF fonts cannot represent every Unicode glyph; preserve unsupported text as code points. */
export function pdfSafeText(value: string): string {
  return [...value].map(character => {
    const point = character.codePointAt(0)!;
    return point === 10 || point === 13 || (point >= 32 && point <= 255) ? character : `[U+${point.toString(16).toUpperCase()}]`;
  }).join('');
}

export async function createReportPdf(report: TravelReport): Promise<jsPDF> {
  const { jsPDF: Pdf } = await import('jspdf');
  const doc = new Pdf({ format: 'a4', unit: 'mm', compress: true });
  const margin = 17;
  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();
  let y = 32;
  const header = () => {
    doc.setFont('helvetica', 'bold'); doc.setFontSize(13);
    doc.setTextColor(23, 47, 63); doc.text('FEIE Window Optimizer', margin, 16);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
    doc.text(`Tax year ${report.tax_year} | ${report.scenario ? 'Scenario' : 'Completed travel'} | by Cameron Guthrie`, margin, 22);
    doc.setDrawColor(190, 205, 215); doc.line(margin, 26, width - margin, 26);
    doc.setFontSize(9); y = 32;
  };
  header();
  // Product title and attribution already appear in the repeated page header.
  const body = reportText(report).split('\n').slice(2).join('\n');
  const safeBody = pdfSafeText(body);
  const text = safeBody === body ? body : safeBody + '\n\nPDF text note: unsupported characters use [U+codepoint]. Copy text and JSON preserve the original Unicode.';
  const lines = doc.splitTextToSize(text, width - 2 * margin) as string[];
  for (const line of lines) {
    if (y > height - 24) { doc.addPage(); header(); }
    doc.text(line, margin, y); y += 4.3;
  }
  const totalPages = doc.getNumberOfPages();
  for (let page = 1; page <= totalPages; page += 1) {
    doc.setPage(page); doc.setFontSize(7); doc.setTextColor(65, 86, 99);
    doc.line(margin, height - 18, width - margin, height - 18);
    doc.text(`Application ${report.app_version} | calculation ${report.calculation_version} | Generated ${report.generated_at}`, margin, height - 13);
    doc.text(`Page ${page} of ${totalPages} | Working report; not a completed Form 2555`, margin, height - 9);
  }
  doc.setProperties({ title: `FEIE Window Optimizer - tax year ${report.tax_year}`, author: 'Cameron Guthrie',
    subject: 'Physical-presence evidence and conditional calendar-year coverage', creator: `FEIE Window Optimizer ${report.app_version}` });
  return doc;
}
