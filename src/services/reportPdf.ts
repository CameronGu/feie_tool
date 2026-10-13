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
  // Summary and support receive room to read; reproducibility details remain compact.
  // Never shrink the whole document merely to hit a one-page target.
  const blocks = sections.map(section => {
    const technical = /SOURCE RECORDS|NORMALIZED EVIDENCE|PROVENANCE|TECHNICAL REFERENCES/.test(section.title);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
    const heading = doc.splitTextToSize(pdfSafeText(section.title), width - 2 * margin) as string[];
    return { title: section.title, heading, lines: section.lines.map(line => {
      const fontSize = line.emphasis === 'result' ? 14 : line.emphasis === 'period' ? 10.5 : technical ? 8.5 : 10;
      const lineHeight = line.emphasis === 'result' ? 6 : technical ? 3.7 : 4.5;
      const style = line.emphasis ? 'bold' : 'normal';
      doc.setFont('helvetica', style); doc.setFontSize(fontSize);
      const wrapped = doc.splitTextToSize(pdfSafeText(line.text), width - 2 * margin) as string[];
      return { ...line, wrapped, fontSize, lineHeight, style, size: wrapped.length * lineHeight + (technical ? .7 : 1.4) };
    }) };
  });
  const measure = (groups: typeof blocks) => groups.reduce((sum, block) =>
    sum + block.heading.length * 4.5 + 4 + block.lines.reduce((count, line) => count + line.size, 0), 0);
  const newPage = () => { doc.addPage(); header(); };
  for (let index = 0; index < blocks.length; index += 1) {
    const block = blocks[index];
    // If compact supporting details need another page, keep them with provenance
    // and references instead of leaving a page containing only closing material.
    const following = block.title.startsWith('SUPPORTING DETAILS') ? blocks.slice(index) :
      block.title === 'CALCULATION PROVENANCE' ? blocks.slice(index, index + 2) : [block];
    const groupHeight = measure(following);
    if (y + (groupHeight <= capacity ? groupHeight : block.heading.length * 4.5 + 4 + (block.lines[0]?.size ?? 0)) > height - 24) newPage();
    doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
    doc.setTextColor(23, 47, 63);
    for (const line of block.heading) { doc.text(line, margin, y + 1); y += 4.5; }
    y += 3;
    for (const paragraph of block.lines) {
      if (paragraph.size <= capacity && y + paragraph.size > height - 24) newPage();
      doc.setFont('helvetica', paragraph.style); doc.setFontSize(paragraph.fontSize);
      for (const line of paragraph.wrapped) {
        if (y + paragraph.lineHeight > height - 24) {
          newPage(); doc.setFont('helvetica', paragraph.style); doc.setFontSize(paragraph.fontSize);
        }
        if (paragraph.url) doc.setTextColor(7, 95, 120);
        else doc.setTextColor(23, 47, 63);
        if (paragraph.url) doc.textWithLink(line, margin, y, { url: paragraph.url });
        else doc.text(line, margin, y);
        y += paragraph.lineHeight;
      }
      y += paragraph.size - paragraph.wrapped.length * paragraph.lineHeight;
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
