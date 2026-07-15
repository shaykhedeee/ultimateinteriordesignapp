import fitz, re, os, json, glob

LAM_DIR = r"C:\Users\USER\Documents\Muskans autocad solution\THE ULTIMATE INTERIOR DESIGN APPLICATION\spacious-venture-onboarding\reference-library\laminates"

def clean(name):
    name = re.sub(r'\)\*?', '', name)
    name = re.sub(r'MERINO[-\s]*HANEX COLLECTION', '', name, flags=re.I)
    name = re.sub(r'Note:.*', '', name, flags=re.I)
    name = re.sub(r'\s+', ' ', name).strip(' -–|()').strip()
    return name[:40]

# ---- Hanex ----
doc = fitz.open(os.path.join(LAM_DIR, 'Hanex.pdf'))
hanex = {}
for pi in range(len(doc)):
    txt = doc[pi].get_text()
    for m in re.finditer(r'\b([A-Z]{1,3}[-_]?\d{2,4})\b', txt):
        code = m.group(1)
        if code in hanex:
            continue
        # name from same line after code, plus next short line
        line = txt[m.start():m.end()+60]
        after = re.sub(r'^[A-Z]{1,3}[-_]?\d{2,4}\s*', '', line)
        nm = clean(after)
        if not nm:
            # peek next line
            rest = txt[m.end():]
            nl = rest.split('\n')[1] if '\n' in rest else ''
            nm = clean(nl)
        hanex[code] = nm or code
doc.close()

# ---- Grande (codes like 21333 FT, 14103NSC, 99977 MT, 14664 VN) ----
doc = fitz.open(os.path.join(LAM_DIR, 'Grande-Collection.pdf'))
grande = {}
for pi in range(len(doc)):
    txt = doc[pi].get_text()
    # pattern: digits then optional letters (FT/MT/VN/TMB/NS/SC...)
    for m in re.finditer(r'\b(\d{4,6}\s?[A-Z]{0,4})\b', txt):
        code = m.group(1).replace(' ', '')
        if code in grande or len(code) < 5:
            continue
        line = txt[m.start():m.end()+50]
        after = re.sub(r'^\d{4,6}\s?[A-Z]{0,4}\s*', '', line)
        nm = clean(after)
        if nm and nm.lower() not in ('ft', 'mt', 'vn', 'tmb', 'nsc', 'sc'):
            grande[code] = nm
doc.close()

print("HANEX_COUNT", len(hanex))
print("GRANDE_COUNT", len(grande))
print(json.dumps({"hanex": hanex, "grande": grande}, ensure_ascii=False, indent=1))
