import fitz, os, shutil, json

ROOT = r"C:\Users\USER\Documents\Muskans autocad solution\THE ULTIMATE INTERIOR DESIGN APPLICATION"
LAM = os.path.join(ROOT, "spacious-venture-onboarding", "reference-library", "laminates")
REF = os.path.join(ROOT, "spacious-venture-onboarding", "reference-library")
PUB_CAT = os.path.join(ROOT, "frontend", "public", "catalogues")
PUB_REF = os.path.join(ROOT, "frontend", "public", "reference-library")
os.makedirs(PUB_CAT, exist_ok=True)
os.makedirs(PUB_REF, exist_ok=True)

# --- Rasterize PDF covers (page 1) to PNG in frontend/public/catalogues ---
slugs = {
    "Merino-Laminates-Play-E-Catalogue-2025.pdf": "merino-play",
    "Merino-FABWood-E-Catalogue-E1-Grade.pdf": "merino-fabwood",
    "Merino-EWC-E-Catalouge.pdf": "merino-ewc",
    "Sampada-TrendBook.pdf": "sampada",
    "Shaurya_Catalogue_ECatalogue.pdf": "shaurya",
    "Hanex.pdf": "hanex",
    "Grande-Collection.pdf": "grande",
    "woodline-1mm.pdf": "woodline",
    "1mm-catalogue.pdf": "laminate-1mm",
    "PENTONE CATALOGUE_2025 VERSON-4.pdf": "pentone",
    "LVT-Flooring.pdf": "lvt-flooring",
}
covers = {}
for pdf, slug in slugs.items():
    p = os.path.join(LAM, pdf)
    if not os.path.exists(p):
        print("MISSING", pdf); continue
    doc = fitz.open(p)
    pages = [0]
    if doc.page_count > 3:
        pages.append(3)
    for idx in pages:
        pg = doc[idx]
        pix = pg.get_pixmap(matrix=fitz.Matrix(1.4, 1.4))
        suffix = "" if idx == 0 else f"-p{idx+1}"
        out = os.path.join(PUB_CAT, f"{slug}{suffix}.png")
        pix.save(out)
    doc.close()
    covers[slug] = {
        "cover": f"/catalogues/{slug}.png",
        "swatch": f"/catalogues/{slug}-p4.png" if os.path.exists(os.path.join(PUB_CAT, f"{slug}-p4.png")) else f"/catalogues/{slug}.png",
    }
    print("cover", slug, os.path.getsize(os.path.join(PUB_CAT, f"{slug}.png")), "bytes")

# --- Copy indian-interiors images + floor plan into frontend/public/reference-library ---
cat_src = os.path.join(REF, "indian-interiors")
copied = 0
for root, dirs, files in os.walk(cat_src):
    for f in files:
        if f.lower().endswith((".jpg", ".jpeg", ".png", ".webp")):
            rel = os.path.relpath(root, cat_src)
            dst_dir = os.path.join(PUB_REF, rel)
            os.makedirs(dst_dir, exist_ok=True)
            shutil.copy2(os.path.join(root, f), os.path.join(dst_dir, f))
            copied += 1
fp = os.path.join(REF, "floor-plans", "3bhk", "3bhk-sample-floorplan.jpg")
if os.path.exists(fp):
    os.makedirs(os.path.join(PUB_REF, "floor-plans"), exist_ok=True)
    shutil.copy2(fp, os.path.join(PUB_REF, "floor-plans", "3bhk-sample-floorplan.jpg"))
    copied += 1

print("images copied:", copied)
with open(os.path.join(PUB_CAT, "manifest.json"), "w") as fh:
    json.dump(covers, fh, indent=2)
print("DONE")
