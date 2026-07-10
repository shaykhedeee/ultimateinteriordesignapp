#!/usr/bin/env python3
"""
cv-wall-detect.py  —  Offline wall/opening detection for floorplan & room images.
-------------------------------------------------------------------------------------
Decodes an image (PyMuPDF/fitz — no PIL needed), runs real computer-vision
(projection-profile line detection on edge maps) and returns axis-aligned wall
segments + doorway/window openings as JSON on stdout.

Design notes:
  * No cloud, no native builds (fitz + numpy only).
  * Floorplans are overwhelmingly axis-aligned; we detect horizontal & vertical
    wall runs via row/column edge-density projection, then locate gaps (openings).
  * Output is in IMAGE PIXELS (the caller converts to mm via the project ppm or a
    supplied scale). Coordinates are {x1,y1,x2,y2} so the CAD tracer can consume
    them directly.

Usage:
  python3 cv-wall-detect.py <image_path> [--minwall 40] [--opengap 60]
  Reads base64 from stdin if no path arg and '--stdin' is given.
"""
import sys, os, json, base64, io

try:
    import fitz  # PyMuPDF
except Exception as e:
    sys.stderr.write("fitz missing: %s\n" % e); sys.exit(2)

try:
    import numpy as np
except Exception as e:
    sys.stderr.write("numpy missing: %s\n" % e); sys.exit(2)


def decode_to_gray(path_or_bytes):
    raw = path_or_bytes if isinstance(path_or_bytes, (bytes, bytearray)) else open(path_or_bytes, "rb").read()
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
    # pix.samples is one byte per pixel after alpha=False / grayscale conversion
    if pix.n == 1:
        img = arr.reshape(pix.height, pix.width).astype(np.uint8)
    else:
        # fallback: convert RGB to gray
        per = pix.n
        flat = arr.reshape(pix.height, pix.width, per).astype(np.float32)
        img = (0.299 * flat[:, :, 0] + 0.587 * flat[:, :, 1] + 0.114 * flat[:, :, 2]).astype(np.uint8)
    return img


def edge_map(gray):
    # Sobel gradients
    gx = np.zeros_like(gray, dtype=np.float32)
    gy = np.zeros_like(gray, dtype=np.float32)
    gx[:, 1:-1] = gray[:, 2:].astype(np.float32) - gray[:, :-2].astype(np.float32)
    gy[1:-1, :] = gray[2:, :].astype(np.float32) - gray[:-2, :].astype(np.float32)
    mag = np.hypot(gx, gy)
    mag = np.clip(mag, 0, 255).astype(np.uint8)
    # threshold (keep strong edges = ink lines on plans)
    thr = max(40, int(np.percentile(mag, 88)))
    return (mag >= thr).astype(np.uint8)


def detect_walls(edge, min_wall=40, open_gap=60):
    H, W = edge.shape
    col_sum = edge.sum(axis=0)          # vertical walls (dark columns)
    row_sum = edge.sum(axis=1)          # horizontal walls (dark rows)

    # threshold: a wall column/row has many edge pixels. Raise percentile so only
    # strong (thick, dark) lines qualify — furniture detail is filtered out.
    cvals = col_sum[col_sum > 0]
    rvals = row_sum[row_sum > 0]
    cthr = max(12, int(np.percentile(cvals, 80)) if cvals.size else 12)
    rthr = max(12, int(np.percentile(rvals, 80)) if rvals.size else 12)

    walls = []

    def runs(mask):
        out = []
        i = 0
        m = list(mask)
        n = len(m)
        while i < n:
            if m[i]:
                j = i
                while j < n and m[j]:
                    j += 1
                out.append((i, j - 1))
                i = j
            else:
                i += 1
        return out

    def merge(span_list, min_gap=4):
        # merge adjacent spans separated by < min_gap into one band; keep band center
        merged = []
        for (a, b) in span_list:
            if merged and a - merged[-1][1] <= min_gap:
                merged[-1] = (merged[-1][0], b)
            else:
                merged.append([a, b])
        return [(a, b) for (a, b) in merged]

    # ---- vertical walls ----
    vmask = col_sum >= cthr
    vspans = merge(runs(vmask))
    for (x0, x1) in vspans:
        band = x1 - x0 + 1
        if band < 3:
            continue  # ignore 1-2px hairlines (furniture detail)
        cx = (x0 + x1) // 2
        # vertical span of this wall band: where are edge pixels dense along y?
        col_edge = edge[:, max(0, x0):x1 + 1].sum(axis=1)
        ymask = col_edge >= max(2, rthr * 0.25)
        # find contiguous y-runs of the wall (skip gaps = openings)
        seg_runs = runs(ymask)
        openings = []
        if len(seg_runs) > 1:
            # there are gaps -> openings between runs
            prev_end = None
            for (ya, yb) in seg_runs:
                if prev_end is not None:
                    gap = ya - prev_end
                    if gap >= open_gap:
                        openings.append((prev_end + gap // 2, min(gap, 120)))
                prev_end = yb
            # emit wall segments between openings
            prev = 0
            for (ya, yb) in seg_runs:
                walls.append({"x1": cx, "y1": ya, "x2": cx, "y2": yb, "axis": "v"})
                prev = yb
            for (oy, og) in openings:
                walls.append({"_opening": True, "axis": "v", "x": cx, "y": oy, "width": og, "type": "door"})
        else:
            # single continuous wall (no opening detected)
            walls.append({"x1": cx, "y1": 0, "x2": cx, "y2": H, "axis": "v"})

    # ---- horizontal walls ----
    hmask = row_sum >= rthr
    hspans = merge(runs(hmask))
    for (y0, y1) in hspans:
        band = y1 - y0 + 1
        if band < 3:
            continue
        cy = (y0 + y1) // 2
        row_edge = edge[max(0, y0):y1 + 1, :].sum(axis=0)
        xmask = row_edge >= max(2, cthr * 0.25)
        seg_runs = runs(xmask)
        openings = []
        if len(seg_runs) > 1:
            prev_end = None
            for (xa, xb) in seg_runs:
                if prev_end is not None:
                    gap = xa - prev_end
                    if gap >= open_gap:
                        openings.append((prev_end + gap // 2, min(gap, 120)))
                prev_end = xb
            for (xa, xb) in seg_runs:
                walls.append({"x1": xa, "y1": cy, "x2": xb, "y2": cy, "axis": "h"})
            for (ox, og) in openings:
                walls.append({"_opening": True, "axis": "h", "x": ox, "y": cy, "width": og, "type": "door"})
        else:
            walls.append({"x1": 0, "y1": cy, "x2": W, "y2": cy, "axis": "h"})

    openings = [w for w in walls if w.get("_opening")]
    seg_walls = [w for w in walls if not w.get("_opening")]

    # ---- length + room-rectangle filter ----
    # Furnished-room photos are ill-posed for full wall extraction. We keep:
    #  - the 4 outermost long walls (the room box), and
    #  - internal long walls clearly separated from the border (partitions).
    # This yields a clean, usable trace instead of furniture-edge noise.
    def room_filter(items, coord_key, span_key, dim, is_v):
        items = [w for w in items if (w[span_key[1]] - w[span_key[0]]) >= (0.35 * dim if is_v else 0.35 * dim)]
        if not items:
            return []
        coords = sorted(w[coord_key] for w in items)
        lo, hi = coords[0], coords[-1]
        kept = []
        for w in items:
            c = w[coord_key]
            # border walls (room box)
            if c <= lo + 0.03 * dim or c >= hi - 0.03 * dim:
                kept.append(w); continue
            # internal partition: clearly inside and long
            if 0.12 * dim <= c <= 0.88 * dim and (w[span_key[1]] - w[span_key[0]]) >= 0.6 * dim:
                kept.append(w)
        # dedupe near-duplicates
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
    for a in args:
        if a == "--stdin":
            stdin = True
        elif a.startswith("--minwall"):
            min_wall = int(a.split("=")[1])
        elif a.startswith("--opengap"):
            open_gap = int(a.split("=")[1])
        elif not a.startswith("--"):
            path = a
    data = None
    if stdin:
        b64 = sys.stdin.read().strip()
        data = base64.b64decode(b64)
    else:
        if not path or not os.path.exists(path):
            sys.stderr.write("image path not found: %s\n" % path); sys.exit(3)
        data = open(path, "rb").read()
    try:
        gray = decode_to_gray(data)
    except Exception as e:
        sys.stderr.write("decode error: %s\n" % e); sys.exit(4)
    edge = edge_map(gray)
    seg, openings = detect_walls(edge, min_wall, open_gap)
    out = {
        "success": True,
        "imageWidth": int(gray.shape[1]),
        "imageHeight": int(gray.shape[0]),
        "walls": [{"x1": int(w["x1"]), "y1": int(w["y1"]), "x2": int(w["x2"]), "y2": int(w["y2"]), "axis": w["axis"]} for w in seg],
        "openings": [{"x": int(o["x"]), "y": int(o["y"]), "width": int(o["width"]), "type": o["type"], "axis": o["axis"]} for o in openings],
        "source": "local-cv"
    }
    sys.stdout.write(json.dumps(out))


if __name__ == "__main__":
    main()
