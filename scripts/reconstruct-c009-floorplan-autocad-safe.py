from pathlib import Path

import ezdxf


ROOT = Path(__file__).resolve().parents[1]
OUT_PRIMARY = ROOT / "ground-floor-plan-reconstructed.dxf"
OUT_SECONDARY = ROOT / "storage" / "uploads" / "reconstructed-c009-floorplan.dxf"
OUT_NOTES = ROOT / "docs" / "C009_FLOORPLAN_RECONSTRUCTION.md"


def ft(*parts):
    total = 0.0
    for part in parts:
        total += float(part)
    return round(total * 304.8)


def add_closed_polyline(msp, pts, layer):
    for i in range(len(pts)):
        x1, y1 = pts[i]
        x2, y2 = pts[(i + 1) % len(pts)]
        msp.add_line((x1, y1), (x2, y2), dxfattribs={"layer": layer})


def add_room(msp, label, dims, pts, offset=(0, 0)):
    ox, oy = offset
    shifted = [(x + ox, y + oy) for x, y in pts]
    add_closed_polyline(msp, shifted, "WALL_OUTLINE")
    xs = [p[0] for p in shifted]
    ys = [p[1] for p in shifted]
    cx = sum(xs) / len(xs)
    cy = sum(ys) / len(ys)
    msp.add_text(
        label,
        dxfattribs={"height": 180, "layer": "ANNOTATIONS"},
    ).set_placement((cx, cy + 160), align=ezdxf.enums.TextEntityAlignment.MIDDLE_CENTER)
    msp.add_text(
        dims,
        dxfattribs={"height": 120, "layer": "ANNOTATIONS"},
    ).set_placement((cx, cy - 120), align=ezdxf.enums.TextEntityAlignment.MIDDLE_CENTER)


def add_door(msp, hinge, width, direction, offset=(0, 0)):
    ox, oy = offset
    hx, hy = hinge[0] + ox, hinge[1] + oy
    w = width

    if direction == "right":
        msp.add_line((hx, hy), (hx + w, hy), dxfattribs={"layer": "OPENINGS"})
        msp.add_arc((hx, hy), w, 90, 180, dxfattribs={"layer": "OPENINGS"})
    elif direction == "left":
        msp.add_line((hx, hy), (hx - w, hy), dxfattribs={"layer": "OPENINGS"})
        msp.add_arc((hx, hy), w, 0, 90, dxfattribs={"layer": "OPENINGS"})
    elif direction == "up":
        msp.add_line((hx, hy), (hx, hy + w), dxfattribs={"layer": "OPENINGS"})
        msp.add_arc((hx, hy), w, 270, 360, dxfattribs={"layer": "OPENINGS"})
    else:
        msp.add_line((hx, hy), (hx, hy - w), dxfattribs={"layer": "OPENINGS"})
        msp.add_arc((hx, hy), w, 0, 90, dxfattribs={"layer": "OPENINGS"})


def add_window(msp, a, b, offset=(0, 0)):
    ox, oy = offset
    x1, y1 = a[0] + ox, a[1] + oy
    x2, y2 = b[0] + ox, b[1] + oy
    msp.add_line((x1, y1), (x2, y2), dxfattribs={"layer": "OPENINGS"})
    dx, dy = x2 - x1, y2 - y1
    length = (dx * dx + dy * dy) ** 0.5 or 1.0
    nx, ny = -dy / length, dx / length
    gap = 55
    msp.add_line((x1 + nx * gap, y1 + ny * gap), (x2 + nx * gap, y2 + ny * gap), dxfattribs={"layer": "OPENINGS"})
    msp.add_line((x1 - nx * gap, y1 - ny * gap), (x2 - nx * gap, y2 - ny * gap), dxfattribs={"layer": "OPENINGS"})


def draw_dim_line(msp, p1, p2, label, offset, horizontal=True, base=(0, 0)):
    ox, oy = base
    x1, y1 = p1[0] + ox, p1[1] + oy
    x2, y2 = p2[0] + ox, p2[1] + oy
    if horizontal:
        ey = y1 + offset
        msp.add_line((x1, y1), (x1, ey), dxfattribs={"layer": "DIMENSIONS"})
        msp.add_line((x2, y2), (x2, ey), dxfattribs={"layer": "DIMENSIONS"})
        msp.add_line((x1, ey), (x2, ey), dxfattribs={"layer": "DIMENSIONS"})
        msp.add_line((x1 - 45, ey - 45), (x1 + 45, ey + 45), dxfattribs={"layer": "DIMENSIONS"})
        msp.add_line((x2 - 45, ey - 45), (x2 + 45, ey + 45), dxfattribs={"layer": "DIMENSIONS"})
        msp.add_text(label, dxfattribs={"height": 120, "layer": "DIMENSIONS"}).set_placement(
            ((x1 + x2) / 2, ey + (160 if offset > 0 else -260)),
            align=ezdxf.enums.TextEntityAlignment.MIDDLE_CENTER,
        )
    else:
        ex = x1 + offset
        msp.add_line((x1, y1), (ex, y1), dxfattribs={"layer": "DIMENSIONS"})
        msp.add_line((x2, y2), (ex, y2), dxfattribs={"layer": "DIMENSIONS"})
        msp.add_line((ex, y1), (ex, y2), dxfattribs={"layer": "DIMENSIONS"})
        msp.add_line((ex - 45, y1 - 45), (ex + 45, y1 + 45), dxfattribs={"layer": "DIMENSIONS"})
        msp.add_line((ex - 45, y2 - 45), (ex + 45, y2 + 45), dxfattribs={"layer": "DIMENSIONS"})
        msp.add_text(label, dxfattribs={"height": 120, "layer": "DIMENSIONS"}).set_placement(
            (ex + (160 if offset > 0 else -320), (y1 + y2) / 2),
            align=ezdxf.enums.TextEntityAlignment.MIDDLE_CENTER,
        )


doc = ezdxf.new("R12")
doc.header["$INSUNITS"] = 4
doc.header["$MEASUREMENT"] = 1
doc.header["$EXTMIN"] = (0, 0, 0)
doc.header["$EXTMAX"] = (13000, 14000, 0)
doc.header["$LIMMIN"] = (0, 0)
doc.header["$LIMMAX"] = (13000, 14000)

for layer, color in [
    ("WALL_OUTLINE", 7),
    ("OPENINGS", 1),
    ("DIMENSIONS", 1),
    ("ANNOTATIONS", 7),
    ("TITLEBLOCK", 3),
]:
    if layer not in doc.layers:
        doc.layers.add(layer, color=color)

msp = doc.modelspace()
offset = (1200, 1200)

# Room geometry reconstructed from the readable labels on the photograph.
rooms = [
    ("M. BEDROOM - 01", "10'0\" x 14'8\"  |  3048 x 4470 mm", [(0, 0), (3048, 0), (3048, 4470), (0, 4470)]),
    ("TOILET", "5'0\" x 7'6\"  |  1524 x 2286 mm", [(3048, 0), (4572, 0), (4572, 2286), (3048, 2286)]),
    ("BEDROOM - 03", "11'0\" x 10'0\"  |  3353 x 3048 mm", [(4572, 0), (7925, 0), (7925, 3048), (4572, 3048)]),
    ("LIVING/DINING", "26'0\" x 11'0\"  |  7874 x 3353 mm", [(0, 4470), (7874, 4470), (7874, 7823), (0, 7823)]),
    ("BALCONY", "5'2\" x 10'8\"  |  1575 x 3251 mm", [(7874, 4470), (9450, 4470), (9450, 7721), (7874, 7721)]),
    ("UTILITY", "5'11\" x 4'11\"  |  1803 x 1499 mm", [(0, 7823), (1803, 7823), (1803, 9322), (0, 9322)]),
    ("KITCHEN", "8'0\" x 10'0\"  |  2438 x 3048 mm", [(1803, 7823), (4241, 7823), (4241, 10861), (1803, 10861)]),
    ("TOILET", "4'6\" x 7'6\"  |  1372 x 2286 mm", [(4241, 7823), (5765, 7823), (5765, 10109), (4241, 10109)]),
    ("BEDROOM - 02", "11'10\" x 10'0\"  |  3607 x 3048 mm", [(5765, 7823), (9372, 7823), (9372, 10861), (5765, 10861)]),
]

for label, dims, pts in rooms:
    add_room(msp, label, dims, pts, offset=offset)

# Openings are approximate and placed from the visible door/window marks.
doors = [
    ((0, 5200), ft(3), "right"),
    ((1450, 4470), ft(3), "up"),
    ((6100, 3048), ft(3), "down"),
    ((2550, 7823), ft(3), "up"),
    ((6410, 7823), ft(3), "up"),
    ((4241, 9000), ft(30), "left"),
    ((3048, 1700), ft(30), "right"),
]

for hinge, width, direction in doors:
    add_door(msp, hinge, width, direction, offset=offset)

windows = [
    ((2650, 10861), (4200, 10861)),
    ((5900, 10861), (8450, 10861)),
    ((0, 900), (0, 2450)),
    ((0, 8580), (0, 9200)),
    ((9450, 5200), (9450, 7000)),
]

for a, b in windows:
    add_window(msp, a, b, offset=offset)

# Simple, readable dimension notes.
draw_dim_line(msp, (0, 0), (3048, 0), "3048", -350, True, offset)
draw_dim_line(msp, (3048, 0), (4572, 0), "1524", -350, True, offset)
draw_dim_line(msp, (4572, 0), (7925, 0), "3353", -350, True, offset)
draw_dim_line(msp, (0, 4470), (7874, 4470), "7874", 350, True, offset)
draw_dim_line(msp, (0, 7823), (9450, 7823), "9450", 350, True, offset)
draw_dim_line(msp, (0, 0), (0, 4470), "4470", -350, False, offset)
draw_dim_line(msp, (0, 4470), (0, 7823), "3353", -350, False, offset)
draw_dim_line(msp, (9450, 4470), (9450, 7721), "3251", 350, False, offset)

# Border and title note keep the drawing visible and orient AutoCAD extents.
msp.add_line((600, 600), (10850, 600), dxfattribs={"layer": "TITLEBLOCK"})
msp.add_line((10850, 600), (10850, 11650), dxfattribs={"layer": "TITLEBLOCK"})
msp.add_line((10850, 11650), (600, 11650), dxfattribs={"layer": "TITLEBLOCK"})
msp.add_line((600, 11650), (600, 600), dxfattribs={"layer": "TITLEBLOCK"})
msp.add_text("RECONSTRUCTED FLOOR PLAN C009", dxfattribs={"height": 180, "layer": "TITLEBLOCK"}).set_placement(
    (900, 11350), align=ezdxf.enums.TextEntityAlignment.LEFT
)
msp.add_text("ALL DIMS IN MM", dxfattribs={"height": 120, "layer": "TITLEBLOCK"}).set_placement(
    (900, 11150), align=ezdxf.enums.TextEntityAlignment.LEFT
)
msp.add_text("USE ZOOM EXTENTS AFTER OPENING IF YOUR VIEW IS BLANK", dxfattribs={"height": 100, "layer": "TITLEBLOCK"}).set_placement(
    (900, 10980), align=ezdxf.enums.TextEntityAlignment.LEFT
)

notes = """# C009 Floor Plan Reconstruction

This DXF was regenerated in an AutoCAD-safe R12 format from the visible handwritten dimensions on the supplied photo.

Measured labels used:
- Living/Dining: 26'0\" x 11'0\" = 7874 x 3353 mm
- Master Bedroom 01: 10'0\" x 14'8\" = 3048 x 4470 mm
- Bedroom 02: 11'10\" x 10'0\" = 3607 x 3048 mm
- Bedroom 03: 11'0\" x 10'0\" = 3353 x 3048 mm
- Kitchen: 8'0\" x 10'0\" = 2438 x 3048 mm
- Utility: 5'11\" x 4'11\" = 1803 x 1499 mm
- Toilet 1: 5'0\" x 7'6\" = 1524 x 2286 mm
- Toilet 2: 4'6\" x 7'6\" = 1372 x 2286 mm
- Balcony: 5'2\" x 10'8\" = 1575 x 3251 mm

Notes:
- The handwriting on the photo is partially obscured, so a few openings are approximate.
- This file prioritizes opening reliably in AutoCAD.
- Run ZOOM EXTENTS after opening if the view is not centered.
"""

OUT_PRIMARY.write_bytes(b"")
doc.saveas(OUT_PRIMARY)
OUT_SECONDARY.parent.mkdir(parents=True, exist_ok=True)
doc.saveas(OUT_SECONDARY)
OUT_NOTES.write_text(notes, encoding="utf-8")

print(f"Generated:\n- {OUT_PRIMARY}\n- {OUT_SECONDARY}\n- {OUT_NOTES}")
