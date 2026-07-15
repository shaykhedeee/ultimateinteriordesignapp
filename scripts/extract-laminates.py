import fitz, re, os, json, glob

LAM_DIR = r"C:\Users\USER\Documents\Muskans autocad solution\THE ULTIMATE INTERIOR DESIGN APPLICATION\spacious-venture-onboarding\reference-library\laminates"

# Laminate code patterns seen across Indian catalogues: e.g. M-7012, SP-345, GL-209,
# SH-1142, HW-225, 1MM-445, FAB-90, EWC-330, PENTONE-12
CODE_RE = re.compile(r'\b([A-Z]{1,4}[-_]?\d{2,5}|[A-Z]{2,4}\d{3,4})\b')
# Brand hints
BRANDS = {
    'merino': 'Merino', 'sampada': 'Sampada', 'shaurya': 'Shaurya',
    'hanex': 'Hanex', 'grande': 'Grande', 'woodline': 'Woodline',
    'pentone': 'Pentone', 'lvt': 'LVT Flooring', 'ewc': 'Merino EWC',
    'fabwood': 'Merino FABWood', '1mm': '1mm Laminate', 'play': 'Merino Play'
}

def brand_for(fname):
    l = fname.lower()
    for k, v in BRANDS.items():
        if k in l:
            return v
    return os.path.splitext(os.path.basename(fname))[0]

def finish_guess(text):
    t = text.lower()
    fins = []
    for f in ['matte', 'gloss', 'glossy', 'suede', 'texture', 'textured', 'wood', 'woodgrain',
             'metalic', 'metallic', 'mirror', 'soft', 'satin', 'high gloss', 'acrylic', 'pvc',
             'fabric', 'leather', 'solid', 'unicolor', 'chalk', 'linen', 'marble', 'stone']:
        if f in t:
            fins.append(f)
    return fins[:3]

out = {}
for pdf in sorted(glob.glob(os.path.join(LAM_DIR, '*.pdf'))):
    try:
        doc = fitz.open(pdf)
    except Exception as e:
        print(f"FAIL {pdf}: {e}")
        continue
    brand = brand_for(pdf)
    codes = {}
    sample_text = []
    pages = min(len(doc), 12)  # first 12 pages carry the index/colour names
    for pi in range(pages):
        try:
            txt = doc[pi].get_text()
        except Exception:
            continue
        for m in CODE_RE.finditer(txt):
            code = m.group(1)
            # capture surrounding line as the name
            line_start = txt.rfind('\n', 0, m.start()) + 1
            line_end = txt.find('\n', m.end())
            line = txt[line_start:line_end].strip()
            name = re.sub(CODE_RE, '', line).strip(' -–|')
            name = re.sub(r'\s+', ' ', name)[:60]
            codes.setdefault(code, name or code)
        if pi < 2:
            sample_text.append(txt[:400])
    page_count = len(doc)
    doc.close()
    finishes = set()
    for s in sample_text:
        finishes.update(finish_guess(s))
    out[os.path.basename(pdf)] = {
        'brand': brand,
        'pages': page_count,
        'finishHints': sorted(finishes),
        'codeCount': len(codes),
        'sampleCodes': dict(list(codes.items())[:25]),
        'sampleText': ' | '.join(sample_text)[:600]
    }

print(json.dumps(out, indent=2, ensure_ascii=False))
