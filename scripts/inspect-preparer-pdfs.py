"""Inspect native browser report exports. Requires Poppler and Pillow; no runtime dependency.
Run after e2e/reports.spec.ts: python3 scripts/inspect-preparer-pdfs.py
"""
from pathlib import Path
import json
import re
import sys
from datetime import date
import calendar
import subprocess
import xml.etree.ElementTree as ET
from PIL import Image, ImageOps, ImageDraw

OUT = Path(sys.argv[1]) if len(sys.argv) > 1 else Path('output/playwright/report-redesign')
NATIVE = OUT / 'chromium-desktop'
NS = {'p': 'http://www.w3.org/1999/xhtml'}
APP_URL = re.search(r"export const APP_URL = '([^']+)'", (Path(__file__).resolve().parents[1] / 'src/constants/meta.ts').read_text()).group(1)
CALCULATOR_LINK = f'Run your own calculation: {APP_URL}'

def run(*args):
    return subprocess.run(args, check=True, text=True, capture_output=True).stdout

inspections = []
rasters = []
for pdf in sorted(OUT.glob('*/*.pdf')):
    directory = pdf.parent
    stem = pdf.stem
    text = run('pdftotext', '-layout', str(pdf), '-')
    (directory / f'{stem}.pdf-text.txt').write_text(text)
    document = ET.fromstring(run('pdftotext', '-bbox-layout', str(pdf), '-'))
    pages = document.findall('.//p:page', NS)
    for index, page in enumerate(pages):
        assert abs(float(page.attrib['width']) - 595.28) < .1
        assert abs(float(page.attrib['height']) - 841.89) < .1
        words = page.findall('.//p:word', NS)
        content = ' '.join(word.text or '' for word in words)
        assert 'FEIE Window Optimizer | by Cameron Guthrie' in content
        assert CALCULATOR_LINK in content
        assert f'{index + 1} / {len(pages)}' in content
        assert 'physical-presence-2.2' in content
        for word in words:
            box = [float(word.attrib[k]) for k in ['xMin', 'yMin', 'xMax', 'yMax']]
            assert 47 < box[0] < box[2] < 548.5, (pdf.name, index + 1, word.text, box)
            assert 32 < box[1] < box[3] < 826, (pdf.name, index + 1, word.text, box)
        ordered = sorted(words, key=lambda word: float(word.attrib['yMin']))
        for i, a in enumerate(ordered):
            for b in ordered[i + 1:]:
                if float(b.attrib['yMin']) >= float(a.attrib['yMax']):
                    break
                overlap_x = min(float(a.attrib['xMax']), float(b.attrib['xMax'])) - max(float(a.attrib['xMin']), float(b.attrib['xMin']))
                overlap_y = min(float(a.attrib['yMax']), float(b.attrib['yMax'])) - max(float(a.attrib['yMin']), float(b.attrib['yMin']))
                assert not (overlap_x > .8 and overlap_y > 1), (pdf.name, index + 1, a.text, b.text, overlap_x, overlap_y)
    # Inspect every actual page; use a representative subset only in the compact contact sheet.
    run('pdftoppm', '-scale-to', '1500', '-png', str(pdf), str(directory / stem))
    for index in range(1, len(pages) + 1):
        raster = directory / f'{stem}-{index:0{len(str(len(pages)))}d}.png'
        if directory == NATIVE and index in {1, len(pages)}:
            rasters.append((f'{stem} / {index}', raster))
    if stem == 'standard-2025':
        assert len(pages) == 1
        for expected in ['351 / 365 = 0.961644', '96.16%', '330 full foreign days', '35 U.S. days', 'December 13, 2025 to January 13, 2026', 'December 17, 2025 (5 days)']:
            assert expected in text, expected
        for absent in ['sample-december', 'UNRELATED SOURCE', '2100-12-31', 'Detailed supporting records']:
            assert absent not in text, absent
        pdf_bytes = pdf.read_bytes()
        assert b'https://www.irs.gov/individuals/international-taxpayers/foreign-earned-income-exclusion-physical-presence-test' in pdf_bytes
        assert b'/FontFile2' in pdf_bytes and b'/ToUnicode' in pdf_bytes
    if '-appendix' in stem:
        assert 'completed / unresolved' not in text
        assert 'normalized evidence — relevant selection' in text
        reference_pages = [p for p in text.split('\f') if 'Primary technical and legal references' in p]
        assert len(reference_pages) == 1
        assert 'Ordinary rules are anchored' in reference_pages[0]
        assert 'not a restorable JSON' in reference_pages[0]
    if stem == 'standard-2025-appendix':
        assert len(pages) == 2
        assert 'Assumed full foreign days (elapsed)' in text
        assert 'Recorded U.S. days (completed)' in text
        assert 'Omitted dates: 2024-01-02 to 2024-01-04; 2026-01-14 to 2026-12-30.' in text
        assert 'this is not the full engine input' in text
        assert 'sample-december: 2025-12-13 to 2026-01-13' in text
        assert 'UNRELATED SOURCE' not in text
        assert 'Cutoff basis: device-local; device time zone: America/Managua' in text
    if stem == 'incomplete':
        assert '329 / 330' in text and '36 days; zero supported foreign days' in text
        assert '%' not in text
    if stem == 'failure':
        assert 'Shortfall: 1 day' in text
    if stem == 'unicode-appendix':
        assert 'Résumé — Málaga Ελληνικά Кириллица [U+6771][U+4EAC] [U+1F30D]' in text
        assert 'PDF character preservation' in text
    if stem == 'long-history':
        assert len(pages) > 1
        assert 'Record 23:' in text
        assert text.count('U.S. visit (original dates)') > 1
    links = run('pdfinfo', '-url', str(pdf))
    urls = {line.split()[-1] for line in links.splitlines() if 'Annotation' in line}
    calculator_links = [line for line in links.splitlines() if 'Annotation' in line and line.split()[-1] == APP_URL]
    assert [int(line.split()[0]) for line in calculator_links] == list(range(1, len(pages) + 1)), (stem, calculator_links)
    assert len(urls) == (8 if '-appendix' in stem else 3 if stem in {'failure', 'incomplete', 'negative-comparison'} else 4), (stem, urls)
    assert all(url == APP_URL or url.startswith(('https://www.irs.gov/', 'https://www.ecfr.gov/')) for url in urls)
    inspections.append({'hyperlinks': len(urls), 'file': str(pdf.relative_to(OUT)), 'pages': len(pages), 'a4': True, 'bounds_and_collisions': 'pass', 'every_footer': 'pass'})

manifest = json.loads((NATIVE / 'engine-reconciliation.json').read_text())
for case in manifest:
    text = (NATIVE / f'{case["name"]}.pdf-text.txt').read_text()
    clipboard = (NATIVE / f'{case["name"]}.clipboard.txt').read_text()
    assert clipboard.count(CALCULATOR_LINK) == 1
    fraction = f'{case["numerator"]} / {case["denominator"]} = {case["numerator"]/case["denominator"]:.6f}'
    assert fraction in text and fraction in clipboard, (case['name'], fraction)
    def label(value):
        parsed = date.fromisoformat(value)
        return f'{calendar.month_name[parsed.month]} {parsed.day}, {parsed.year}'
    for period in case['periods']:
        dates = f'{label(period["window_start"])} to {label(period["window_end"])}'
        assert dates in ' '.join(text.split()) and dates in ' '.join(clipboard.split()), (case['name'], dates)
        assert f'{period["foreign_days"]} full foreign days' in text and f'{period["foreign_days"]} full foreign days' in clipboard
        assert period['recorded_foreign_days'] + period['completed_assumed_foreign_days'] + period['projected_foreign_days'] == period['foreign_days']
        assert period['foreign_days'] + period['us_days'] + period['other_nonforeign_days'] + period['unknown_days'] == period['calendar_days']
        assert (date.fromisoformat(period['window_end']) - date.fromisoformat(period['window_start'])).days + 1 == period['calendar_days']
    assert sum(period['distinct_tax_year_days'] for period in case['periods']) == case['numerator']
    if 'delta' in case:
        delta = f'{case["delta"]:+d} days'
        assert delta in text and delta in clipboard

# Compact first/last-page review; full rasters remain alongside every native PDF.
selected = [(label, raster) for label, raster in rasters if '-appendix' not in label or label.startswith('standard-2025-appendix')]
w, h, pad, caption = 260, 368, 18, 26
rows = (len(selected) + 3) // 4
sheet = Image.new('RGB', (4 * (w + pad) + pad, rows * (h + caption + pad) + pad), '#e8edef')
draw = ImageDraw.Draw(sheet)
for i, (label, raster) in enumerate(selected):
    x, y = pad + i % 4 * (w + pad), pad + i // 4 * (h + caption + pad)
    draw.text((x, y), label, fill='#19354a')
    sheet.paste(ImageOps.contain(Image.open(raster).convert('RGB'), (w, h)), (x, y + caption))
sheet.save(OUT / 'pdf-contact-sheet.png')
(OUT / 'pdf-inspection.json').write_text(json.dumps(inspections, indent=2) + '\n')
print(f'PASS: {len(inspections)} native PDFs, {sum(item["pages"] for item in inspections)} rendered A4 pages, engine/clipboard parity, bounds, no text collisions, Unicode and footers.')
