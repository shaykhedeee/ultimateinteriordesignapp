#!/usr/bin/env python3
"""
Local (offline) furniture-elevation component detector.
No cloud API. Uses PIL + numpy projection-profile analysis on a 3D render/photo
to estimate horizontal divisions (shelves/drawer banks) and vertical divisions
(door/drawer gaps), then emits the same JSON `components` shape the cloud vision
path produces so componentsToModel() can consume it.

Usage: echo <base64-image> | python3 local_elevation_vision.py <widthMm> <heightMm> [unitType]
Output (stdout): JSON { unitType, confidence, components:[...], detectedMaterial, notes }
Exit non-zero / empty -> caller falls back to deterministic archetype.
"""
import sys, json, base64, io

def main():
    try:
        width_mm = float(sys.argv[1]) if len(sys.argv) > 1 else 2000.0
        height_mm = float(sys.argv[2]) if len(sys.argv) > 2 else 2400.0
        unit_type = sys.argv[3] if len(sys.argv) > 3 else "other"

        raw = sys.stdin.buffer.read()
        if not raw:
            return 1
        try:
            img_bytes = base64.b64decode(raw)
        except Exception:
            img_bytes = raw

        import numpy as np

        a = None
        # Prefer PyMuPDF (fitz) — it decodes JPEG/PNG without PIL's _imaging C ext.
        try:
            import fitz
            pix = fitz.Pixmap(img_bytes)
            if pix.n >= 4:
                pix = fitz.Pixmap(fitz.csRGB, pix)
            buf = np.frombuffer(pix.samples, dtype=np.uint8)
            arr = buf.reshape(pix.height, pix.width, pix.n)
            if pix.n >= 3:
                gray = (0.299 * arr[:, :, 0] + 0.587 * arr[:, :, 1] + 0.114 * arr[:, :, 2])
            else:
                gray = arr[:, :, 0].astype(np.float32)
            step = max(1, int(max(pix.width, pix.height) / 400))
            a = (gray[::step, ::step].astype(np.float32)) / 255.0
        except Exception:
            a = None
        # Fallback: PIL (if its codecs happen to work)
        if a is None:
            from PIL import Image, ImageOps
            img = Image.open(io.BytesIO(img_bytes)).convert("L")
            img = ImageOps.autocontrast(img)
            W, H = img.size
            scale = 400.0 / max(W, H)
            if scale < 1.0:
                img = img.resize((max(1, int(W * scale)), max(1, int(H * scale))))
            a = np.asarray(img, dtype=np.float32) / 255.0
        # light contrast stretch
        lo, hi = float(a.min()), float(a.max())
        if hi > lo:
            a = (a - lo) / (hi - lo)
        h, w = a.shape

        # gradient magnitude to emphasise edges (cabinet seams/handles)
        gx = np.abs(np.diff(a, axis=1))
        gy = np.abs(np.diff(a, axis=0))

        # vertical divisions: columns with strong horizontal gradient (vertical seams)
        col_energy = gx.mean(axis=0)                    # len w-1
        row_energy = gy.mean(axis=1)                    # len h-1

        def find_peaks(energy, min_gap_frac=0.06, thresh_k=1.4):
            if energy.size == 0:
                return []
            m, s = energy.mean(), energy.std() + 1e-6
            thr = m + thresh_k * s
            min_gap = max(3, int(len(energy) * min_gap_frac))
            peaks, last = [], -10**9
            order = np.argsort(-energy)
            chosen = []
            for idx in order:
                if energy[idx] < thr:
                    break
                if all(abs(idx - c) >= min_gap for c in chosen):
                    chosen.append(int(idx))
            return sorted(chosen)

        vcuts = find_peaks(col_energy)   # x positions (px) of vertical seams
        hcuts = find_peaks(row_energy)   # y positions (px) of horizontal seams

        # map px -> mm (image x -> width, image y inverted -> height from bottom)
        def x_to_mm(px):
            return round(px / max(1, w) * width_mm)
        def y_to_mm_from_bottom(py):
            return round((1.0 - py / max(1, h)) * height_mm)

        # Build vertical panel boundaries across width
        xb = [0] + [x_to_mm(x) for x in vcuts] + [round(width_mm)]
        xb = sorted(set(min(max(0, v), round(width_mm)) for v in xb))
        # collapse tiny panels
        panels = []
        for i in range(len(xb) - 1):
            if xb[i+1] - xb[i] >= max(150, width_mm * 0.06):
                panels.append((xb[i], xb[i+1]))
        if not panels:
            panels = [(0, round(width_mm))]

        # Horizontal band: detect a drawer bank near the bottom if a strong low hcut exists
        hb_mm = sorted(y_to_mm_from_bottom(y) for y in hcuts)
        components = []
        # heuristic: lowest strong horizontal seam within bottom 45% => drawer bank line
        drawer_top = None
        for ymm in hb_mm:
            if 150 <= ymm <= height_mm * 0.45:
                drawer_top = ymm
                break

        for (x0, x1) in panels:
            if drawer_top:
                # drawers below the line
                components.append({
                    "kind": "drawer", "xStartMm": x0, "xEndMm": x1,
                    "yStartMm": 0, "yEndMm": drawer_top,
                    "label": "drawer", "leafCount": 1, "note": "local-detect"
                })
                # door above the line
                components.append({
                    "kind": "door", "xStartMm": x0, "xEndMm": x1,
                    "yStartMm": drawer_top, "yEndMm": round(height_mm),
                    "label": "shutter", "leafCount": 1, "note": "local-detect"
                })
            else:
                components.append({
                    "kind": "door", "xStartMm": x0, "xEndMm": x1,
                    "yStartMm": 0, "yEndMm": round(height_mm),
                    "label": "shutter", "leafCount": 1, "note": "local-detect"
                })

        # add interior shelves for door panels (from remaining horizontal seams)
        shelf_lines = [y for y in hb_mm if (not drawer_top or y > drawer_top) and 300 < y < height_mm - 100]
        for ymm in shelf_lines[:6]:
            components.append({
                "kind": "open-shelf", "xStartMm": panels[0][0], "xEndMm": panels[-1][1],
                "yStartMm": ymm, "yEndMm": ymm, "label": "shelf line", "leafCount": 1, "note": "local-detect"
            })

        # confidence: more detected structure -> higher, capped modestly (it's heuristic)
        struct = len(vcuts) + len(hcuts)
        confidence = round(min(0.55, 0.28 + 0.03 * struct), 2)

        # crude material guess from mean brightness/tone
        mean_b = float(a.mean())
        material = "wood" if mean_b < 0.45 else ("laminate" if mean_b < 0.6 else "mdf")

        out = {
            "unitType": unit_type or "other",
            "confidence": confidence,
            "components": components,
            "detectedMaterial": material,
            "notes": f"local projection-profile detect: {len(panels)} panels, {len(shelf_lines)} shelf lines"
        }
        sys.stdout.write(json.dumps(out))
        return 0
    except Exception as e:
        sys.stderr.write(f"local vision error: {e}")
        return 2

if __name__ == "__main__":
    sys.exit(main())
