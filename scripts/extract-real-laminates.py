import fitz, re, os, json, glob

LAM_DIR = r"C:\Users\USER\Documents\Muskans autocad solution\THE ULTIMATE INTERIOR DESIGN APPLICATION\spacious-venture-onboarding\reference-library\laminates"

CODE_RE = re.compile(r'\b([A-Z]{1,4}[-_]?\d{2,5}|[A-Z]{2,4}\d{3,4})\b')

def harvest(pdf, pages=None):
    doc = fitz.open(pdf)
    n = pages or len(doc)
    codes = {}
    for pi in range(min(n, len(doc))):
        txt = doc[pi].get_text()
        # split into lines, find code then trailing name on same/next line
        lines = txt.split('\n')
        for i, line in enumerate(lines):
            m = CODE_RE.search(line)
            if not m:
                continue
            code = m.group(1)
            if code in codes:
                continue
            # name = rest of this line after code, plus next non-empty line
            rest = line[m.end():].strip(' -–|()')
            name = rest
            for j in range(i+1, min(i+3, len(lines))):
                nl = lines[j].strip(' -–|()')
                if nl and not CODE_RE.search(nl) and len(nl) > 1:
                    name = (name + ' ' + nl).strip()
                    break
            name = re.sub(r'\s+', ' ', name)[:60].strip(' -–|')
            codes[code] = name or code
    doc.close()
    return codes

for f in ['Hanex.pdf', 'Grande-Collection.pdf']:
    p = os.path.join(LAM_DIR, f)
    c = harvest(p)
    print(f"=== {f} ({len(c)} codes) ===")
    for k, v in list(c.items())[:60]:
        print(f"{k}\t{v}")
