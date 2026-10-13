import type { jsPDF } from 'jspdf';
import { reportSections, type TravelReport } from './report';

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
  const sections = reportSections(report);
  const originalText = sections.flatMap(section => section.lines.map(line => line.text)).join('');
  if (pdfSafeText(originalText) !== originalText) {
    sections.find(section => section.title === 'CALCULATION PROVENANCE')!.lines.push({
      text: 'PDF: [U+codepoint] preserves unsupported characters; copy/JSON retain Unicode.'
    });
  }
  const capacity = height - 24 - 32;
  const layout = (fontSize: number) => {
    doc.setFont('helvetica', 'normal'); doc.setFontSize(fontSize);
    return sections.map(section => ({ title: section.title, lines: section.lines.map(line => ({
      ...line, wrapped: doc.splitTextToSize(pdfSafeText(line.text), width - 2 * margin) as string[]
    })) }));
  };
  const measure = (blocks: ReturnType<typeof layout>, lineHeight: number) => blocks.reduce((sum, block) =>
    sum + 7 + block.lines.reduce((count, line) => count + line.wrapped.length * lineHeight, 0), 0);
  // Modest density adjustment avoids a routine second page without dropping evidence.
  let fontSize = 9;
  let lineHeight = 3.65;
  let blocks = layout(fontSize);
  if (measure(blocks, lineHeight) > capacity && measure(blocks, lineHeight) < capacity * 1.22) {
    fontSize = 8; lineHeight = 3.2; blocks = layout(fontSize);
  }
  const newPage = () => { doc.addPage(); header(); };
  for (let index = 0; index < blocks.length; index += 1) {
    const block = blocks[index];
    // Keep provenance and linked references together; never leave a URL-only tail.
    const following = block.title === 'CALCULATION PROVENANCE' ? blocks.slice(index, index + 2) : [block];
    const groupHeight = measure(following, lineHeight);
    if (y + (groupHeight <= capacity ? groupHeight : 7 + lineHeight * 2) > height - 24) newPage();
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
    doc.setTextColor(23, 47, 63);
    const heading = doc.splitTextToSize(pdfSafeText(block.title), width - 2 * margin) as string[];
    for (const line of heading) { doc.text(line, margin, y + 1); y += 4; }
    y += 3;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(fontSize);
    for (const paragraph of block.lines) {
      const paragraphHeight = paragraph.wrapped.length * lineHeight;
      if (paragraphHeight <= capacity && y + paragraphHeight > height - 24) {
        newPage(); doc.setFontSize(fontSize);
      }
      for (const line of paragraph.wrapped) {
        if (y + lineHeight > height - 24) { newPage(); doc.setFontSize(fontSize); }
        if (paragraph.url) doc.setTextColor(7, 95, 120);
        else doc.setTextColor(23, 47, 63);
        if (paragraph.url) doc.textWithLink(line, margin, y, { url: paragraph.url });
        else doc.text(line, margin, y);
        y += lineHeight;
      }
    }
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
