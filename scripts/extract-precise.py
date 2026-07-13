import fitz, re, os, json

LAM_DIR = r"C:\Users\USER\Documents\Muskans autocad solution\THE ULTIMATE INTERIOR DESIGN APPLICATION\spacious-venture-onboarding\reference-library\laminates"

def parse_codes(pdf, code_re, max_pages=None):
    doc = fitz.open(pdf)
    out = {}
    np = min(max_pages or len(doc), len(doc))
    for pi in range(np):
        txt = doc[pi].get_text()
        lines = [l.strip() for l in txt.split('\n')]
        for i, line in enumerate(lines):
            m = code_re.match(line)
            if not m:
                continue
            code = m.group(1).replace(' ', '')
            if code in out:
                continue
            # name: (NAME) same line, else next non-empty line first token group
            paren = re.search(r'\(([^)]+)\)', line)
            if paren:
                name = paren.group(1).strip()
            else:
                name = ''
                for j in range(i+1, min(i+3, len(lines))):
                    nl = lines[j].strip()
                    if nl and not code_re.match(nl) and len(nl) > 1 and not nl.startswith('10X4'):
                        name = nl.split('  ')[0][:40].strip()
                        break
            name = re.sub(r'\)\*?$', '', name).strip()
            if name and name.upper() not in ('FT','MT','VN','TMB','NSC','HGL','LX','LW','OSC','WVN','WV'):
                out[code] = name
    doc.close()
    return out

hanex_re = re.compile(r'^([A-Z]{1,3}[-_]?\d{2,4})\b')
grande_re = re.compile(r'^(\d{4,6}\s?[A-Z]{0,4})\b')

hanex = parse_codes(os.path.join(LAM_DIR, 'Hanex.pdf'), hanex_re)
grande = parse_codes(os.path.join(LAM_DIR, 'Grande-Collection.pdf'), grande_re)

# de-noise: drop entries whose name still contains a code of the other set
def noise(n):
    return bool(re.search(r'(VOCALISE|SILVER STONE|MERINO)', n, re.I)) and len(n) > 30
hanex = {k: v for k, v in hanex.items() if not noise(v)}
grande = {k: v for k, v in grande.items() if 'palette' not in v.lower() and '10X4' not in v}

print("HANEX", len(hanex), "GRANDE", len(grande))
print(json.dumps({"hanex": hanex, "grande": grande}, ensure_ascii=False, indent=1))
