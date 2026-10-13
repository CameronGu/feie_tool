import type { jsPDF } from 'jspdf';

/** Decode emitted embedded-font glyph commands, independently of report formatting. */
export function pdfPageText(doc: jsPDF): string[] {
  const maps = new Map<string, Map<number, string>>();
  for (const style of ['normal', 'bold']) {
    doc.setFont('Noto', style);
    const font = doc.getFont() as unknown as { id: string; metadata: { cmap: { unicode: { codeMap: Record<string, number> } } } };
    const reverse = new Map<number, string>();
    Object.entries(font.metadata.cmap.unicode.codeMap).forEach(([point, glyph]) => reverse.set(glyph, String.fromCodePoint(Number(point))));
    maps.set(font.id, reverse);
  }
  return (doc.internal.pages as unknown as string[][]).slice(1).map(page => {
    let font = 'F15';
    const words: string[] = [];
    for (const command of page) {
      for (const match of command.matchAll(/\/(F\d+) [\d.]+ Tf|<([\da-fA-F]+)> Tj/g)) {
        if (match[1]) font = match[1];
        else words.push((match[2].match(/.{4}/g) || []).map(code => maps.get(font)?.get(parseInt(code, 16)) ?? '�').join(''));
      }
    }
    return words.join('\n');
  });
}
