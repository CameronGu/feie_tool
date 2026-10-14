"""Render actual PDFs and independently reconcile the synthetic design fixtures.
Run from repository root after generate.mjs. Requires installed Poppler and Pillow.
"""
from datetime import date
from pathlib import Path
import json
import subprocess
import xml.etree.ElementTree as ET
from PIL import Image, ImageOps, ImageDraw

OUT = Path(__file__).resolve().parent
PDFS = ["standard-2025", "multiple-periods", "incomplete-result", "unsuccessful-result", "proposed-comparison", "supporting-appendix"]

def days(a, b):
    return (date.fromisoformat(b) - date.fromisoformat(a)).days + 1

def run(*args):
    return subprocess.run(args, check=True, capture_output=True, text=True).stdout

assert days('2024-12-18', '2025-12-17') == 365
assert days('2025-05-31', '2025-06-29') == 30
assert days('2025-12-13', '2025-12-17') == 5
assert 365 - 30 - 5 == 330
assert days('2025-01-01', '2025-12-17') == 351
assert f'{351/365:.6f}' == '0.961644'
assert f'{351/365*100:.2f}' == '96.16'
reconciliation = json.loads((OUT / 'reconciliation.json').read_text())
assert reconciliation['comparison']['delta_days'] == 365 - 351 == 14
assert days('2025-07-03', '2025-12-12') == 163
assert days('2026-01-14', '2026-06-29') == 167
assert days('2025-12-13', '2026-01-13') == 32
assert days('2026-06-30', '2026-07-02') == 3
assert 163 + 167 == 330
assert 330 + 32 + 3 == 365
assert 351 + 182 - days('2025-07-03', '2025-12-17') == 365
assert 330 + 36 == 366
assert 340 + 25 == 365
assert 188 + 178 == 366
assert reconciliation['incomplete']['status'] == 'incomplete'
assert reconciliation['unsuccessful']['status'] == 'not-met'

namespace = {'p': 'http://www.w3.org/1999/xhtml'}
inspections = []
images = []
for name in PDFS:
    pdf = OUT / f'{name}.pdf'
    extracted = run('pdftotext', '-layout', str(pdf), '-')
    (OUT / f'{name}.pdf-text.txt').write_text(extracted)
    bbox = ET.fromstring(run('pdftotext', '-bbox-layout', str(pdf), '-'))
    pages = bbox.findall('.//p:page', namespace)
    expected = 2 if name == 'supporting-appendix' else 1
    assert len(pages) == expected, (name, len(pages))
    for page in pages:
        assert abs(float(page.attrib['width']) - 595.28) < .1
        assert abs(float(page.attrib['height']) - 841.89) < .1
        words = page.findall('.//p:word', namespace)
        # Inspect actual text extents, including every footer, rather than planned positions.
        for word in words:
            box = [float(word.attrib[k]) for k in ['xMin', 'yMin', 'xMax', 'yMax']]
            assert 47 < box[0] < box[2] < 548.3, (name, word.text, box)
            assert 30 < box[1] < box[3] < 826, (name, word.text, box)
        # Separate drawn text must not collide. Ignore only sub-point font-metric tolerance.
        for i, a in enumerate(words):
            for b in words[i + 1:]:
                overlap_x = min(float(a.attrib['xMax']), float(b.attrib['xMax'])) - max(float(a.attrib['xMin']), float(b.attrib['xMin']))
                overlap_y = min(float(a.attrib['yMax']), float(b.attrib['yMax'])) - max(float(a.attrib['yMin']), float(b.attrib['yMin']))
                assert not (overlap_x > .8 and overlap_y > 1), (name, a.text, b.text, overlap_x, overlap_y)
    if expected == 1:
        run('pdftoppm', '-r', '144', '-png', '-singlefile', str(pdf), str(OUT / name))
        images.append((name, OUT / f'{name}.png'))
    else:
        run('pdftoppm', '-r', '144', '-png', str(pdf), str(OUT / name))
        for page in range(1, expected + 1):
            images.append((f'{name} / {page}', OUT / f'{name}-{page}.png'))
    inspections.append({'file': pdf.name, 'pages': len(pages), 'a4': True, 'text_in_bounds': True, 'no_text_collisions': True})

text = (OUT / 'standard-2025.pdf-text.txt').read_text()
clipboard = (OUT / 'clipboard-2025.txt').read_text()
for phrase in ['351/365 = 0.961644', '96.16%', '330', '35', 'December 18, 2024 to December 17, 2025', 'May 31 to June 29, 2025', 'December 13, 2025 to January 13, 2026', 'January 1, 2015', 'December 31, 2025', 'not been independently verified', 'exclusion amounts are not calculated', 'physical-presence-2.2']:
    assert phrase in text, phrase
    assert phrase in clipboard, phrase
for forbidden in ['SYN-A01', 'SYN-U01', '2100-12-31', 'algorithm', 'SOURCE RECORDS']:
    assert forbidden not in text
assert '0/365' in (OUT / 'incomplete-result.pdf-text.txt').read_text()
assert '0/365 = 0.000000' in (OUT / 'unsuccessful-result.pdf-text.txt').read_text()
assert '+14 days' in (OUT / 'proposed-comparison.pdf-text.txt').read_text()
assert '3 unresolved days, counted as zero foreign' in (OUT / 'proposed-comparison.pdf-text.txt').read_text()
assert '188 + 178 = 366' in (OUT / 'multiple-periods.pdf-text.txt').read_text()
assert 'SYN-P01' in (OUT / 'supporting-appendix.pdf-text.txt').read_text()

# A review index is a contact sheet, never a substitute for actual PDF rasters.
thumb_w, thumb_h, pad, caption = 330, 467, 20, 28
sheet = Image.new('RGB', (3 * (thumb_w + pad) + pad, 3 * (thumb_h + caption + pad) + pad), '#e8edef')
draw = ImageDraw.Draw(sheet)
for i, (label, image) in enumerate(images):
    thumb = ImageOps.contain(Image.open(image).convert('RGB'), (thumb_w, thumb_h))
    x = pad + i % 3 * (thumb_w + pad)
    y = pad + i // 3 * (thumb_h + caption + pad)
    draw.text((x, y), label, fill='#19354a')
    sheet.paste(thumb, (x, y + caption))
sheet.save(OUT / 'review-contact-sheet.png')
(OUT / 'verification.json').write_text(json.dumps({'independent_day_checks': 'pass', 'pdf_clipboard_principal_content': 'match', 'pdf_inspections': inspections}, indent=2) + '\n')
print('PASS: seven rendered A4 pages; all text in bounds; no text collisions; counts and principal clipboard/PDF content reconcile.')
