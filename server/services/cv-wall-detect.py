#!/usr/bin/env python3
"""
cv-wall-detect.py  —  Offline wall/opening detection for floorplan & room images.
-------------------------------------------------------------------------------------
Decodes an image (PyMuPDF/fitz -> numpy when available, else PIL-only fallback),
runs real computer-vision (projection-profile line detection on edge maps) and
returns axis-aligned wall segments + doorway/window openings as JSON on stdout.

Design notes:
  * No cloud. Tries fitz+numpy (fast C path); falls back to a pure-Python + PIL
    path when those aren't installed, so the script still runs on a minimal box.
  * Floorplans are overwhelmingly axis-aligned; we detect horizontal & vertical
    wall runs via row/column edge-density projection, then locate gaps (openings).
  * Output is in IMAGE PIXELS (the caller converts to mm via the project ppm or a
    supplied scale). Coordinates are {x1,y1,x2,y2} so the CAD tracer can consume
    them directly.
  * On any decode/dependency failure we emit a clean JSON error (not a traceback)
    so the orchestrator can safely fall back to its JS detector.

Usage:
  python3 cv-wall-detect.py <image_path> [--minwall 40] [--opengap 60]
  Reads base64 from stdin if no path arg and '--stdin' is given.
"""
import sys
import os
import json
import base64

# ----------------------------------------------------------------------------
# Dependency resolution (lazy + graceful). We try the fast fitz+numpy stack
# first; if it's missing we fall back to a pure-Python implementation backed
# only by PIL. `HAVE_NUMPY` flips the internal helper implementations.
# ----------------------------------------------------------------------------
HAVE_NUMPY = False
HAVE_FITZ = False
try:
    import numpy as np  # type: ignore
    HAVE_NUMPY = True
except Exception:
    np = None  # noqa: N816

try:
    import fitz  # PyMuPDF
    HAVE_FITZ = True
except Exception:
    fitz = None

try:
    from PIL import Image
    HAVE_PIL = True
except Exception:
    Image = None
    HAVE_PIL = False


# ----------------------------------------------------------------------------
# Image decoding
# ----------------------------------------------------------------------------
def decode_to_gray(data):
    """Return a 2D grayscale image as a numpy array (if available) or a list of
    lists of ints (pure-Python fallback)."""
    if HAVE_FITZ and HAVE_NUMPY:
        return _decode_fitz_numpy(data)
    if HAVE_PIL:
        return _decode_pil(data)
    raise RuntimeError("No image backend available (need PyMuPDF+numpy or Pillow)")


def _decode_fitz_numpy(data):
    raw = data if isinstance(data, (bytes, bytearray)) else open(data, "rb").read()
    try:
        doc = fitz.open(stream=raw, filetype="png")
        if doc.page_count > 0:
            pix = doc[0].get_pixmap(alpha=False)
        else:
            pix = fitz.Pixmap(raw)
            if pix.n > 1:
                pix = fitz.Pixmap(pix, 0)
    except Exception:
        pix = fitz.Pixmap(raw)
        if pix.n > 1:
            pix = fitz.Pixmap(pix, 0)
    arr = np.frombuffer(pix.samples, dtype=np.uint8)
    if pix.n == 1:
        return arr.reshape(pix.height, pix.width).astype(np.uint8)
    per = pix.n
    flat = arr.reshape(pix.height, pix.width, per).astype(np.float32)
    return (0.299 * flat[:, :, 0] + 0.587 * flat[:, :, 1] + 0.114 * flat[:, :, 2]).astype(np.uint8)


def _decode_pil(data):
    raw = data if isinstance(data, (bytes, bytearray)) else open(data, "rb").read()
    img = Image.open(__import__("io").BytesIO(raw)).convert("L")
    w, h = img.size
    px = img.load()
    return [[px[x, y] for x in range(w)] for y in range(h)]


# ----------------------------------------------------------------------------
# Edge map + wall detection (dispatch on HAVE_NUMPY)
# ----------------------------------------------------------------------------
def edge_map(gray):
    return _edge_numpy(gray) if HAVE_NUMPY else _edge_pure(gray)


def _edge_numpy(gray):
    gx = np.zeros_like(gray, dtype=np.float32)
    gy = np.zeros_like(gray, dtype=np.float32)
    gx[:, 1:-1] = gray[:, 2:].astype(np.float32) - gray[:, :-2].astype(np.float32)
    gy[1:-1, :] = gray[2:, :].astype(np.float32) - gray[:-2, :].astype(np.float32)
    mag = np.hypot(gx, gy)
    mag = np.clip(mag, 0, 255).astype(np.uint8)
    thr = max(40, int(np.percentile(mag, 88)))
    return (mag >= thr).astype(np.uint8)


def _edge_pure(gray):
    """Pure-Python Sobel magnitude -> binary edge map (list of lists)."""
    h = len(gray)
    w = len(gray[0]) if h else 0
    mag = [[0] * w for _ in range(h)]
    for y in range(1, h - 1):
        row = gray[y]
        prev = gray[y - 1]
        nxt = gray[y + 1]
        for x in range(1, w - 1):
            gx = int(row[x + 1]) - int(row[x - 1])
            gy = int(nxt[x]) - int(prev[x])
            m = int((gx * gx + gy * gy) ** 0.5)
            mag[y][x] = m
    # threshold at 88th percentile-ish
    flat = sorted(v for row in mag for v in row)
    thr = 40
    if flat:
        idx = int(len(flat) * 0.88)
        thr = max(40, flat[min(idx, len(flat) - 1)])
    return [[1 if mag[y][x] >= thr else 0 for x in range(w)] for y in range(h)]


def detect_walls(edge, min_wall=40, open_gap=60):
    return _detect_numpy(edge, min_wall, open_gap) if HAVE_NUMPY else _detect_pure(edge, min_wall, open_gap)


def _runs(mask):
    out = []
    i = 0
    n = len(mask)
    while i < n:
        if mask[i]:
            j = i
            while j < n and mask[j]:
                j += 1
            out.append((i, j - 1))
            i = j
        else:
            i += 1
    return out


def _merge(span_list, min_gap=4):
    merged = []
    for (a, b) in span_list:
        if merged and a - merged[-1][1] <= min_gap:
            merged[-1] = (merged[-1][0], b)
        else:
            merged.append([a, b])
    return [(a, b) for (a, b) in merged]


def _detect_numpy(edge, min_wall, open_gap):
    H, W = edge.shape
    col_sum = edge.sum(axis=0)
    row_sum = edge.sum(axis=1)
    cvals = col_sum[col_sum > 0]
    rvals = row_sum[row_sum > 0]
    cthr = max(12, int(np.percentile(cvals, 80)) if cvals.size else 12)
    rthr = max(12, int(np.percentile(rvals, 80)) if rvals.size else 12)
    return _assemble(edge, H, W, col_sum, row_sum, cthr, rthr, min_wall, open_gap,
                     lambda a: int(a))


def _detect_pure(edge, min_wall, open_gap):
    H = len(edge)
    W = len(edge[0]) if H else 0
    col_sum = [sum(edge[y][x] for y in range(H)) for x in range(W)]
    row_sum = [sum(edge[y]) for y in range(H)]
    cvals = [v for v in col_sum if v > 0]
    rvals = [v for v in row_sum if v > 0]
    cthr = max(12, int(sorted(cvals)[int(len(cvals) * 0.8)]) if cvals else 12)
    rthr = max(12, int(sorted(rvals)[int(len(rvals) * 0.8)]) if rvals else 12)
    return _assemble(edge, H, W, col_sum, row_sum, cthr, rthr, min_wall, open_gap,
                     lambda a: a)


def _assemble(edge, H, W, col_sum, row_sum, cthr, rthr, min_wall, open_gap, asint):
    walls = []

    def merge_runs(mask):
        return _merge(_runs(list(mask)))

    # ---- vertical walls ----
    vmask = [1 if col_sum[x] >= cthr else 0 for x in range(W)]
    for (x0, x1) in merge_runs(vmask):
        band = x1 - x0 + 1
        if band < 3:
            continue
        cx = (x0 + x1) // 2
        col_edge = [sum(edge[y][max(0, x0):x1 + 1]) for y in range(H)]
        ymask = [1 if col_edge[y] >= max(2, int(rthr * 0.25)) else 0 for y in range(H)]
        seg_runs = _runs(ymask)
        if len(seg_runs) > 1:
            prev_end = None
            for (ya, yb) in seg_runs:
                if prev_end is not None:
                    gap = ya - prev_end
                    if gap >= open_gap:
                        walls.append({"_opening": True, "axis": "v", "x": cx, "y": prev_end + gap // 2, "width": min(gap, 120), "type": "door"})
                prev_end = yb
            for (ya, yb) in seg_runs:
                walls.append({"x1": cx, "y1": ya, "x2": cx, "y2": yb, "axis": "v"})
        else:
            walls.append({"x1": cx, "y1": 0, "x2": cx, "y2": H, "axis": "v"})

    # ---- horizontal walls ----
    hmask = [1 if row_sum[y] >= rthr else 0 for y in range(H)]
    for (y0, y1) in merge_runs(hmask):
        band = y1 - y0 + 1
        if band < 3:
            continue
        cy = (y0 + y1) // 2
        # FIX: iterate columns (x in 0..W-1), inner sum over the band's ROWS
        # (y0..y1). The previous code swapped axes (for y in range(W)) and indexed
        # edge[y] with y up to W-1, which throws "index N out of bounds for axis 0"
        # whenever the image is wider than it is tall (W > H).
        row_edge = [sum(edge[y][x] for y in range(max(0, y0), y1 + 1)) for x in range(W)]
        xmask = [1 if row_edge[x] >= max(2, int(cthr * 0.25)) else 0 for x in range(W)]
        seg_runs = _runs(xmask)
        if len(seg_runs) > 1:
            prev_end = None
            for (xa, xb) in seg_runs:
                if prev_end is not None:
                    gap = xa - prev_end
                    if gap >= open_gap:
                        walls.append({"_opening": True, "axis": "h", "x": prev_end + gap // 2, "y": cy, "width": min(gap, 120), "type": "door"})
                prev_end = xb
            for (xa, xb) in seg_runs:
                walls.append({"x1": xa, "y1": cy, "x2": xb, "y2": cy, "axis": "h"})
        else:
            walls.append({"x1": 0, "y1": cy, "x2": W, "y2": cy, "axis": "h"})

    openings = [w for w in walls if w.get("_opening")]
    seg_walls = [w for w in walls if not w.get("_opening")]

    def room_filter(items, coord_key, span_key, dim, is_v):
        items = [w for w in items if (w[span_key[1]] - w[span_key[0]]) >= (0.35 * dim if is_v else 0.35 * dim)]
        if not items:
            return []
        coords = sorted(w[coord_key] for w in items)
        lo, hi = coords[0], coords[-1]
        kept = []
        for w in items:
            c = w[coord_key]
            if c <= lo + 0.03 * dim or c >= hi - 0.03 * dim:
                kept.append(w)
                continue
            if 0.12 * dim <= c <= 0.88 * dim and (w[span_key[1]] - w[span_key[0]]) >= 0.6 * dim:
                kept.append(w)
        out = []
        for w in sorted(kept, key=lambda x: -abs(x[span_key[1]] - x[span_key[0]])):
            if any(abs(w[coord_key] - k[coord_key]) <= 14 for k in out):
                continue
            out.append(w)
        return out

    vf = room_filter([w for w in seg_walls if w["axis"] == "v"], "x1", ("y1", "y2"), H, True)
    hf = room_filter([w for w in seg_walls if w["axis"] == "h"], "y1", ("x1", "x2"), W, False)

    kept_openings = []
    for o in openings:
        near = any(abs(o["x"] - w["x1"]) <= 30 for w in vf) if o["axis"] == "v" else any(abs(o["y"] - w["y1"]) <= 30 for w in hf)
        if near:
            kept_openings.append(o)

    return vf + hf, kept_openings


def main():
    args = sys.argv[1:]
    path = None
    stdin = False
    min_wall = 40
    open_gap = 60
    i = 0
    while i < len(args):
        a = args[i]
        if a == "--stdin":
            stdin = True
        elif a.startswith("--minwall"):
            min_wall = int(a.split("=", 1)[1]) if "=" in a else int(args[i + 1]); i += (0 if "=" in a else 1)
        elif a.startswith("--opengap"):
            open_gap = int(a.split("=", 1)[1]) if "=" in a else int(args[i + 1]); i += (0 if "=" in a else 1)
        elif not a.startswith("--"):
            path = a
        i += 1
    data = None
    if stdin:
        b64 = sys.stdin.read().strip()
        data = base64.b64decode(b64)
    else:
        if not path or not os.path.exists(path):
            sys.stderr.write("image path not found: %s\n" % path)
            print(json.dumps({"success": False, "error": "image path not found", "source": "local-cv"}))
            sys.exit(3)
        data = open(path, "rb").read()
    try:
        gray = decode_to_gray(data)
    except Exception as e:
        sys.stderr.write("decode error: %s\n" % e)
        print(json.dumps({"success": False, "error": "decode error: %s" % e, "source": "local-cv"}))
        sys.exit(4)
    try:
        edge = edge_map(gray)
        seg, openings = detect_walls(edge, min_wall, open_gap)
    except Exception as e:
        sys.stderr.write("detect error: %s\n" % e)
        print(json.dumps({"success": False, "error": "detect error: %s" % e, "source": "local-cv"}))
        sys.exit(5)
    H = len(gray)
    W = len(gray[0]) if H else 0
    out = {
        "success": True,
        "imageWidth": int(W),
        "imageHeight": int(H),
        "walls": [{"x1": int(w["x1"]), "y1": int(w["y1"]), "x2": int(w["x2"]), "y2": int(w["y2"]), "axis": w["axis"]} for w in seg],
        "openings": [{"x": int(o["x"]), "y": int(o["y"]), "width": int(o["width"]), "type": o["type"], "axis": o["axis"]} for o in openings],
        "source": "local-cv"
    }
    sys.stdout.write(json.dumps(out))


if __name__ == "__main__":
    main()
