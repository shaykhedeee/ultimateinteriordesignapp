from __future__ import annotations

import json
import math
from pathlib import Path
from xml.sax.saxutils import escape

from PIL import Image, ImageDraw, ImageFont


OUT_DIR = Path(__file__).resolve().parent
NAME = "architectural-professional-floorplan"

# Working trace grid follows the previous reference image proportions.
SRC_LEFT = 28.0
SRC_RIGHT = 811.0
SRC_TOP = 78.0
SRC_BOTTOM = 548.0
RIGHT_WALL_FT = 44.03
FT_PER_SRC = RIGHT_WALL_FT / (SRC_BOTTOM - SRC_TOP)
M_PER_FT = 0.3048

WALL_GAP = 0.36
THIN_GAP = 0.24


def pt(x: float, y: float) -> tuple[float, float]:
    return ((x - SRC_LEFT) * FT_PER_SRC, (SRC_BOTTOM - y) * FT_PER_SRC)


def offset_points(a: tuple[float, float], b: tuple[float, float], gap: float) -> tuple[tuple[float, float], tuple[float, float], tuple[float, float], tuple[float, float]]:
    dx, dy = b[0] - a[0], b[1] - a[1]
    ln = math.hypot(dx, dy)
    if not ln:
        return a, b, a, b
    nx, ny = -dy / ln, dx / ln
    h = gap / 2
    return (
        (a[0] + nx * h, a[1] + ny * h),
        (b[0] + nx * h, b[1] + ny * h),
        (a[0] - nx * h, a[1] - ny * h),
        (b[0] - nx * h, b[1] - ny * h),
    )


walls: list[dict] = []
doors: list[dict] = []
windows: list[dict] = []
labels: list[dict] = []
stairs: list[dict] = []
dims: list[dict] = []
gray_lines: list[dict] = []
wall_caps: list[dict] = []
ref_lines: list[dict] = []
symbols: list[dict] = []


def wall(name: str, x1: float, y1: float, x2: float, y2: float, gap: float = WALL_GAP) -> None:
    w = {"name": name, "a": pt(x1, y1), "b": pt(x2, y2), "src": [x1, y1, x2, y2], "gap": gap}
    walls.append(w)
    wall_caps.append(w)


def gray(name: str, x1: float, y1: float, x2: float, y2: float) -> None:
    gray_lines.append({"name": name, "a": pt(x1, y1), "b": pt(x2, y2)})


def ref_line(name: str, x1: float, y1: float, x2: float, y2: float) -> None:
    ref_lines.append({"name": name, "a": pt(x1, y1), "b": pt(x2, y2)})


def symbol_rect(name: str, x1: float, y1: float, x2: float, y2: float, layer: str = "A-DETAIL") -> None:
    symbols.append({"name": name, "type": "rect", "a": pt(x1, y1), "b": pt(x2, y2), "layer": layer})


def door(name: str, x: float, y: float, angle: float, width: float = 3.0, swing: int = -1) -> None:
    doors.append({"name": name, "p": pt(x, y), "angle": angle, "width": width, "swing": swing})


def window(name: str, x1: float, y1: float, x2: float, y2: float) -> None:
    windows.append({"name": name, "a": pt(x1, y1), "b": pt(x2, y2)})


def label(text: str, x: float, y: float, size: float = 0.55, rot: float = 0) -> None:
    labels.append({"text": text, "p": pt(x, y), "size": size, "rot": rot})


def dim(text: str, x1: float, y1: float, x2: float, y2: float, offset: float) -> None:
    dims.append({"text": text, "a": pt(x1, y1), "b": pt(x2, y2), "offset": offset})


# Outer double-line boundary, segmented around windows.
wall("outer top left", 28, 78, 245, 78)
wall("outer top window break 1 right", 283, 78, 335, 78)
wall("outer top mid", 370, 78, 505, 78)
wall("outer top right room", 545, 78, 690, 78)
wall("outer top washrooms", 745, 78, 811, 78)
wall("outer right", 811, 78, 811, 548)
wall("outer bottom left", 28, 548, 320, 548)
wall("outer bottom mid", 362, 548, 665, 548)
wall("outer bottom right A", 715, 548, 748, 548)
wall("outer bottom right B", 802, 548, 811, 548)
wall("outer left top", 28, 78, 28, 335)
wall("outer left entry upper", 28, 335, 28, 360)
wall("outer left lower", 28, 383, 28, 548)

# Left strip, pantry, staircase zone.
wall("pantry east", 98, 78, 98, 335)
wall("pantry south", 28, 182, 98, 182)
wall("left middle south", 28, 335, 98, 335)
wall("left stair upper wall", 28, 383, 260, 383)
wall("left stair lower wall", 28, 478, 260, 478)
wall("stair east", 260, 383, 260, 478)
wall("bottom left lobby wall", 28, 478, 320, 478)

# Top row and upper rooms.
wall("top room 1 south", 98, 165, 230, 165)
wall("top room 1 east", 230, 78, 230, 165)
wall("top room 2 west", 310, 78, 310, 165)
wall("top room 2 south left", 230, 165, 258, 165)
wall("top room 2 south right", 285, 165, 310, 165)
wall("wash U left", 315, 78, 315, 178)
wall("wash U top internal", 315, 112, 390, 112)
wall("wash U right", 390, 112, 390, 178)
wall("wash U bottom left", 315, 178, 337, 178)
wall("wash U bottom right", 363, 178, 390, 178)
wall("founder/right top west", 475, 78, 475, 178)
wall("founder/right top south", 390, 178, 475, 178)
wall("large top right west", 655, 78, 655, 178)

# Right washrooms and stacked cabins.
wall("wash M west", 697, 78, 697, 178)
wall("wash M/F split", 748, 78, 748, 178)
wall("right washroom bottom", 697, 178, 811, 178)
wall("right spine upper", 706, 178, 706, 235)
wall("right upper cabin bottom", 706, 235, 811, 235)
wall("right spine mid", 706, 235, 706, 348)
wall("right mid cabin bottom", 706, 348, 811, 348)
wall("right spine lower", 706, 348, 706, 445)
wall("right lower cabin top", 706, 445, 811, 445)

# Left central small rooms and jogged lobby edge.
wall("meeting rooms top", 98, 205, 230, 205)
wall("meeting rooms bottom", 98, 265, 230, 265)
wall("meeting split", 158, 205, 158, 265)
wall("meeting east", 230, 205, 230, 265)
wall("production bottom", 98, 318, 244, 318)
wall("production right short", 244, 265, 244, 318)
wall("production upper right", 244, 265, 318, 265)
wall("jog horizontal", 244, 318, 350, 318)
wall("jog drop", 350, 318, 350, 360)
wall("corridor lower left", 350, 360, 470, 360)
wall("corridor lower right", 535, 360, 585, 360)
wall("right corridor short", 620, 360, 678, 360)
gray("faint lobby line A", 165, 360, 350, 360)
gray("faint lobby line B", 165, 318, 244, 318)

# Lower blocks.
wall("entrance left", 230, 383, 230, 478)
wall("entrance top", 230, 383, 320, 383)
wall("entrance right", 320, 383, 320, 478)
wall("big meeting left", 320, 383, 320, 525)
wall("big meeting top", 320, 383, 460, 383)
wall("big meeting right", 460, 383, 460, 525)
wall("server left", 460, 383, 460, 525)
wall("server right", 522, 383, 522, 525)
wall("server top", 460, 383, 522, 383)
wall("lower right left", 548, 383, 548, 548)
wall("lower right top left", 548, 383, 586, 383)
wall("lower right top right", 620, 383, 678, 383)
wall("lower right east", 678, 383, 678, 548)
wall("lower right split", 548, 445, 678, 445)

# Door symbols placed to match the source swing arcs.
door("pantry", 98, 168, 180, 2.55)
door("side entrance upper", 28, 335, 0, 2.85, 1)
door("side entrance lower", 98, 335, 180, 2.75, -1)
door("top room 1", 230, 153, 180, 2.85)
door("meeting left", 158, 205, 90, 2.35, -1)
door("meeting right", 178, 205, 90, 2.35, 1)
door("wash U top left", 315, 112, 270, 2.05, -1)
door("wash U bottom left", 337, 178, 90, 1.95, -1)
door("wash U bottom right", 363, 178, 90, 1.95, 1)
door("top middle", 475, 178, 180, 2.65)
door("wash M", 697, 178, 0, 2.35, -1)
door("wash F", 748, 178, 90, 2.35, -1)
door("right upper", 706, 205, 180, 2.65)
door("right middle", 706, 295, 180, 2.65)
door("main central", 350, 360, 180, 3.05)
door("small toilet pair A", 250, 383, 90, 1.45, -1)
door("small toilet pair B", 270, 383, 90, 1.45, 1)
door("big meeting", 460, 383, 90, 2.65, -1)
door("server", 522, 383, 90, 2.15, 1)
door("lower right", 586, 383, 90, 2.65, -1)

# Window marks. These are intentionally gray/black CAD-style instead of bright blue.
window("top window 1", 245, 78, 283, 78)
window("top window 2", 335, 78, 370, 78)
window("top window 3", 505, 78, 545, 78)
window("top window 4", 690, 78, 745, 78)
window("bottom window 1", 320, 548, 362, 548)
window("bottom window 2", 665, 548, 715, 548)
window("bottom window 3", 748, 548, 802, 548)
window("left high window", 28, 90, 28, 165)
window("left mid window", 28, 205, 28, 318)
window("right mid window", 811, 235, 811, 348)
window("right low window", 811, 445, 811, 525)

# Staircase treads.
stairs.append({"box": [pt(60, 395), pt(180, 395), pt(180, 478), pt(60, 478)]})

label("PANTRY", 58, 132, 0.58)
label("washroom\nU", 350, 100, 0.38)
label("Washroom M", 720, 123, 0.42, -90)
label("Washroom F", 775, 123, 0.42, -90)

dim("44.03 ft reference", 811, 78, 811, 548, 3.0)

# Thin reference/dimension construction lines visible in the source image.
ref_line("top dimension baseline", 28, 62, 811, 62)
ref_line("top dimension upper", 28, 54, 811, 54)
ref_line("left dimension line", 14, 78, 14, 548)
ref_line("right dimension line", 825, 78, 825, 548)
ref_line("left top extension", 28, 78, 14, 78)
ref_line("left bottom extension", 28, 548, 14, 548)
ref_line("right top extension", 811, 78, 825, 78)
ref_line("right bottom extension", 811, 548, 825, 548)

# Small architectural details visible in the plan.
symbol_rect("bottom center small column", 522, 522, 535, 535, "A-DETAIL")
symbol_rect("service niche left", 225, 382, 235, 405, "A-DETAIL")
symbol_rect("right lower column", 540, 383, 550, 393, "A-DETAIL")


def cap_lines(w: dict) -> list[tuple[tuple[float, float], tuple[float, float]]]:
    a1, b1, a2, b2 = offset_points(w["a"], w["b"], w["gap"])
    return [(a1, a2), (b1, b2)]


def door_jamb_lines(dr: dict) -> list[tuple[tuple[float, float], tuple[float, float]]]:
    a = math.radians(dr["angle"])
    hinge = dr["p"]
    jamb = (hinge[0] + dr["width"] * math.cos(a), hinge[1] + dr["width"] * math.sin(a))
    nx, ny = -math.sin(a), math.cos(a)
    half = 0.17
    return [
        ((hinge[0] - nx * half, hinge[1] - ny * half), (hinge[0] + nx * half, hinge[1] + ny * half)),
        ((jamb[0] - nx * half, jamb[1] - ny * half), (jamb[0] + nx * half, jamb[1] + ny * half)),
    ]


def window_detail_lines(win: dict) -> list[tuple[tuple[float, float], tuple[float, float]]]:
    a, b = win["a"], win["b"]
    dx, dy = b[0] - a[0], b[1] - a[1]
    ln = math.hypot(dx, dy)
    if not ln:
        return []
    nx, ny = -dy / ln, dx / ln
    tx, ty = dx / ln, dy / ln
    return [
        ((a[0] - tx * 0.18, a[1] - ty * 0.18), (a[0] + nx * 0.30, a[1] + ny * 0.30)),
        ((b[0] + tx * 0.18, b[1] + ty * 0.18), (b[0] + nx * 0.30, b[1] + ny * 0.30)),
        ((a[0] - nx * 0.30, a[1] - ny * 0.30), (b[0] - nx * 0.30, b[1] - ny * 0.30)),
    ]


class Dxf:
    def __init__(self) -> None:
        self.rows: list[str] = []

    def w(self, code: int, value: object) -> None:
        self.rows.extend([str(code), str(value)])

    def line(self, layer: str, a: tuple[float, float], b: tuple[float, float]) -> None:
        self.w(0, "LINE"); self.w(8, layer)
        self.w(10, f"{a[0]:.4f}"); self.w(20, f"{a[1]:.4f}"); self.w(30, "0")
        self.w(11, f"{b[0]:.4f}"); self.w(21, f"{b[1]:.4f}"); self.w(31, "0")

    def poly(self, layer: str, points: list[tuple[float, float]], closed: bool = True) -> None:
        self.w(0, "POLYLINE"); self.w(8, layer); self.w(66, 1); self.w(70, 1 if closed else 0)
        for p in points:
            self.w(0, "VERTEX"); self.w(8, layer)
            self.w(10, f"{p[0]:.4f}"); self.w(20, f"{p[1]:.4f}"); self.w(30, "0")
        self.w(0, "SEQEND")

    def arc(self, layer: str, c: tuple[float, float], r: float, start: float, end: float) -> None:
        self.w(0, "ARC"); self.w(8, layer)
        self.w(10, f"{c[0]:.4f}"); self.w(20, f"{c[1]:.4f}"); self.w(30, "0")
        self.w(40, f"{r:.4f}"); self.w(50, f"{start:.2f}"); self.w(51, f"{end:.2f}")

    def text(self, layer: str, text: str, p: tuple[float, float], h: float, rot: float = 0) -> None:
        self.w(0, "TEXT"); self.w(8, layer)
        self.w(10, f"{p[0]:.4f}"); self.w(20, f"{p[1]:.4f}"); self.w(30, "0")
        self.w(40, f"{h:.4f}"); self.w(1, text.replace("\n", " ")); self.w(50, f"{rot:.2f}")

    def build(self) -> str:
        return "\n".join(self.rows) + "\n"


def door_geom(dr: dict) -> tuple[tuple[float, float], tuple[float, float], tuple[float, float], float, float]:
    a = math.radians(dr["angle"])
    hinge = dr["p"]
    jamb = (hinge[0] + dr["width"] * math.cos(a), hinge[1] + dr["width"] * math.sin(a))
    leaf_ang = a + dr["swing"] * math.pi / 2
    leaf = (hinge[0] + dr["width"] * math.cos(leaf_ang), hinge[1] + dr["width"] * math.sin(leaf_ang))
    start, end = math.degrees(leaf_ang) % 360, math.degrees(a) % 360
    return hinge, jamb, leaf, min(start, end), max(start, end)


def door_arc_angles(dr: dict) -> tuple[float, float]:
    base = math.radians(dr["angle"])
    leaf = base + dr["swing"] * math.pi / 2
    return leaf, base


def write_dxf() -> None:
    d = Dxf()
    d.w(0, "SECTION"); d.w(2, "HEADER"); d.w(9, "$ACADVER"); d.w(1, "AC1009"); d.w(9, "$INSUNITS"); d.w(70, 2); d.w(0, "ENDSEC")
    d.w(0, "SECTION"); d.w(2, "TABLES"); d.w(0, "TABLE"); d.w(2, "LAYER")
    layers = [("A-WALL", 7), ("A-WALL-CAP", 7), ("A-DOOR", 1), ("A-DOOR-JAMB", 8), ("A-GLAZ", 8), ("A-STAIR", 8), ("A-DETAIL", 8), ("A-REF-DIMS", 9), ("A-TEXT", 7), ("A-ANNO", 8), ("A-SHEET", 8), ("0", 7)]
    d.w(70, len(layers))
    for name, color in layers:
        d.w(0, "LAYER"); d.w(2, name); d.w(70, 0); d.w(62, color); d.w(6, "CONTINUOUS")
    d.w(0, "ENDTAB"); d.w(0, "ENDSEC"); d.w(0, "SECTION"); d.w(2, "ENTITIES")
    for w in walls:
        a1, b1, a2, b2 = offset_points(w["a"], w["b"], w["gap"])
        d.line("A-WALL", a1, b1); d.line("A-WALL", a2, b2)
    for w in wall_caps:
        for a, b in cap_lines(w):
            d.line("A-WALL-CAP", a, b)
    for gl in gray_lines:
        d.line("A-GLAZ", gl["a"], gl["b"])
    for rl in ref_lines:
        d.line("A-REF-DIMS", rl["a"], rl["b"])
    for win in windows:
        d.line("A-GLAZ", win["a"], win["b"])
        a1, b1, a2, b2 = offset_points(win["a"], win["b"], 0.16)
        d.line("A-GLAZ", a1, b1); d.line("A-GLAZ", a2, b2)
        for a, b in window_detail_lines(win):
            d.line("A-GLAZ", a, b)
    for dr in doors:
        hinge, jamb, leaf, start, end = door_geom(dr)
        d.line("A-DOOR", hinge, leaf); d.line("A-DOOR", hinge, jamb); d.arc("A-DOOR", hinge, dr["width"], start, end)
        for a, b in door_jamb_lines(dr):
            d.line("A-DOOR-JAMB", a, b)
    for st in stairs:
        pts = st["box"]
        for i in range(len(pts)):
            d.line("A-STAIR", pts[i], pts[(i + 1) % len(pts)])
        left, top, right, bottom = pts[0][0], pts[0][1], pts[1][0], pts[2][1]
        for i in range(1, 13):
            x = left + (right - left) * i / 13
            d.line("A-STAIR", (x, bottom), (x, top))
        mid_y = (top + bottom) / 2
        d.line("A-STAIR", (left, mid_y), (right, mid_y))
        d.line("A-STAIR", (right - 0.9, mid_y + 0.35), (right - 0.25, mid_y))
        d.line("A-STAIR", (right - 0.9, mid_y - 0.35), (right - 0.25, mid_y))
    for sym in symbols:
        if sym["type"] == "rect":
            a, b = sym["a"], sym["b"]
            d.poly(sym["layer"], [(a[0], a[1]), (b[0], a[1]), b, (a[0], b[1])], True)
    for lb in labels:
        d.text("A-TEXT", lb["text"], lb["p"], lb["size"], lb["rot"])
    # Sheet/reference border and concise title block.
    sheet_min = (-2.0, -2.2)
    sheet_max = ((SRC_RIGHT - SRC_LEFT) * FT_PER_SRC + 2.2, RIGHT_WALL_FT + 2.0)
    d.line("A-SHEET", sheet_min, (sheet_max[0], sheet_min[1]))
    d.line("A-SHEET", (sheet_max[0], sheet_min[1]), sheet_max)
    d.line("A-SHEET", sheet_max, (sheet_min[0], sheet_max[1]))
    d.line("A-SHEET", (sheet_min[0], sheet_max[1]), sheet_min)
    d.text("A-SHEET", "PROFESSIONAL ARCHITECTURAL OFFICE FLOORPLAN", (0, -2.9), 0.42)
    d.text("A-SHEET", "UNITS: FEET | SOURCE SCALE APPROX. | RIGHT WALL REF: 44.03 FT | CAD-READY DXF", (0, -3.5), 0.30)
    d.text("A-ANNO", "ARCHITECTURAL DOUBLE-LINE WALLS, SWING DOORS, WINDOW BREAKS, STAIR DETAIL, AND REFERENCE EXTENTS.", (0, -4.2), 0.36)
    d.w(0, "ENDSEC"); d.w(0, "EOF")
    (OUT_DIR / f"{NAME}.dxf").write_text(d.build(), encoding="utf-8")


def svg_line(a: tuple[float, float], b: tuple[float, float], cls: str) -> str:
    return f'<line class="{cls}" x1="{a[0]:.3f}" y1="{-a[1]:.3f}" x2="{b[0]:.3f}" y2="{-b[1]:.3f}"/>'


def write_svg() -> None:
    width, height = (SRC_RIGHT - SRC_LEFT) * FT_PER_SRC, RIGHT_WALL_FT
    parts = [
        f'<svg xmlns="http://www.w3.org/2000/svg" width="1800" height="1150" viewBox="-3 {-height - 4:.3f} {width + 8:.3f} {height + 8:.3f}">',
        '<rect x="-100" y="-100" width="300" height="300" fill="white"/>',
        '<style>text{font-family:Arial,Helvetica,sans-serif}.sheet{stroke:#aaa;stroke-width:.045;fill:none}.ref{stroke:#9a9a9a;stroke-width:.045;fill:none}.detail{stroke:#555;stroke-width:.065;fill:none}.wall{stroke:#111;stroke-width:.105;fill:none;stroke-linecap:square}.cap{stroke:#111;stroke-width:.085;fill:none}.gray{stroke:#8a8a8a;stroke-width:.085;fill:none}.door{stroke:#5f5f5f;stroke-width:.075;fill:none}.jamb{stroke:#6f6f6f;stroke-width:.06;fill:none}.window{stroke:#777;stroke-width:.075;fill:none}.stair{stroke:#555;stroke-width:.055;fill:none}.label{font-size:.50px;fill:#333}.anno{font-size:.38px;fill:#777}</style>',
    ]
    width_ft = (SRC_RIGHT - SRC_LEFT) * FT_PER_SRC
    parts.append(f'<rect class="sheet" x="-2.000" y="{-(RIGHT_WALL_FT + 2.0):.3f}" width="{width_ft + 4.2:.3f}" height="{RIGHT_WALL_FT + 4.2:.3f}"/>')
    for w in walls:
        a1, b1, a2, b2 = offset_points(w["a"], w["b"], w["gap"])
        parts.append(svg_line(a1, b1, "wall")); parts.append(svg_line(a2, b2, "wall"))
    for w in wall_caps:
        for a, b in cap_lines(w):
            parts.append(svg_line(a, b, "cap"))
    for gl in gray_lines:
        parts.append(svg_line(gl["a"], gl["b"], "gray"))
    for rl in ref_lines:
        parts.append(svg_line(rl["a"], rl["b"], "ref"))
    for win in windows:
        parts.append(svg_line(win["a"], win["b"], "window"))
        a1, b1, a2, b2 = offset_points(win["a"], win["b"], 0.16)
        parts.append(svg_line(a1, b1, "window")); parts.append(svg_line(a2, b2, "window"))
        for a, b in window_detail_lines(win):
            parts.append(svg_line(a, b, "window"))
    for dr in doors:
        hinge, jamb, leaf, _, _ = door_geom(dr)
        parts.append(svg_line(hinge, leaf, "door")); parts.append(svg_line(hinge, jamb, "door"))
        for a, b in door_jamb_lines(dr):
            parts.append(svg_line(a, b, "jamb"))
        sweep = 1 if dr["swing"] < 0 else 0
        parts.append(f'<path class="door" d="M {leaf[0]:.3f},{-leaf[1]:.3f} A {dr["width"]:.3f},{dr["width"]:.3f} 0 0 {sweep} {jamb[0]:.3f},{-jamb[1]:.3f}"/>')
    for st in stairs:
        pts = st["box"]
        for i in range(len(pts)):
            parts.append(svg_line(pts[i], pts[(i + 1) % len(pts)], "stair"))
        left, top, right, bottom = pts[0][0], pts[0][1], pts[1][0], pts[2][1]
        for i in range(1, 13):
            x = left + (right - left) * i / 13
            parts.append(svg_line((x, bottom), (x, top), "stair"))
        mid_y = (top + bottom) / 2
        parts.append(svg_line((left, mid_y), (right, mid_y), "stair"))
        parts.append(svg_line((right - .9, mid_y + .35), (right - .25, mid_y), "stair"))
        parts.append(svg_line((right - .9, mid_y - .35), (right - .25, mid_y), "stair"))
    for sym in symbols:
        if sym["type"] == "rect":
            a, b = sym["a"], sym["b"]
            x, y = min(a[0], b[0]), -max(a[1], b[1])
            width, height = abs(b[0] - a[0]), abs(b[1] - a[1])
            parts.append(f'<rect class="detail" x="{x:.3f}" y="{y:.3f}" width="{width:.3f}" height="{height:.3f}"/>')
    for lb in labels:
        x, y = lb["p"]
        transform = f' transform="rotate({-lb["rot"]:.1f} {x:.3f} {-y:.3f})"' if lb["rot"] else ""
        lines = lb["text"].split("\n")
        for idx, text in enumerate(lines):
            parts.append(f'<text class="label" x="{x:.3f}" y="{-y + idx * .52:.3f}" text-anchor="middle"{transform}>{escape(text)}</text>')
    parts.append('<text class="anno" x="0" y="2.8">PROFESSIONAL ARCHITECTURAL OFFICE FLOORPLAN</text>')
    parts.append('<text class="anno" x="0" y="3.4">Units: feet. Approximate source scale. Right wall reference: 44.03 ft. CAD-ready DXF.</text>')
    parts.append("</svg>")
    (OUT_DIR / f"{NAME}.svg").write_text("\n".join(parts), encoding="utf-8")


def write_png() -> None:
    width_ft, height_ft = (SRC_RIGHT - SRC_LEFT) * FT_PER_SRC, RIGHT_WALL_FT
    scale, margin = 18, 80
    img = Image.new("RGB", (int(width_ft * scale) + margin * 2, int(height_ft * scale) + margin * 2 + 50), "white")
    draw = ImageDraw.Draw(img)

    def pp(p: tuple[float, float]) -> tuple[int, int]:
        return round(margin + p[0] * scale), round(margin + (height_ft - p[1]) * scale)

    def font(size: int):
        try:
            return ImageFont.truetype("arial.ttf", size)
        except OSError:
            return ImageFont.load_default()

    def draw_line(a: tuple[float, float], b: tuple[float, float], fill=(17, 17, 17), width=2) -> None:
        draw.line([pp(a), pp(b)], fill=fill, width=width)

    border = [pp((-2.0, -2.2)), pp((width_ft + 2.2, -2.2)), pp((width_ft + 2.2, height_ft + 2.0)), pp((-2.0, height_ft + 2.0)), pp((-2.0, -2.2))]
    draw.line(border, fill=(170, 170, 170), width=1)
    for w in walls:
        a1, b1, a2, b2 = offset_points(w["a"], w["b"], w["gap"])
        draw_line(a1, b1, width=2); draw_line(a2, b2, width=2)
    for w in wall_caps:
        for a, b in cap_lines(w):
            draw_line(a, b, width=1)
    for gl in gray_lines:
        draw_line(gl["a"], gl["b"], fill=(145, 145, 145), width=1)
    for rl in ref_lines:
        draw_line(rl["a"], rl["b"], fill=(160, 160, 160), width=1)
    for win in windows:
        draw_line(win["a"], win["b"], fill=(120, 120, 120), width=2)
        a1, b1, a2, b2 = offset_points(win["a"], win["b"], 0.16)
        draw_line(a1, b1, fill=(120, 120, 120), width=1); draw_line(a2, b2, fill=(120, 120, 120), width=1)
        for a, b in window_detail_lines(win):
            draw_line(a, b, fill=(120, 120, 120), width=1)
    for dr in doors:
        hinge, jamb, leaf, _, _ = door_geom(dr)
        draw_line(hinge, leaf, fill=(90, 90, 90), width=1); draw_line(hinge, jamb, fill=(90, 90, 90), width=1)
        for a, b in door_jamb_lines(dr):
            draw_line(a, b, fill=(110, 110, 110), width=1)
        # Approximate swing with a polyline so the PNG resembles the source symbol.
        a0, a1 = door_arc_angles(dr)
        steps = 16
        pts = []
        for i in range(steps + 1):
            t = i / steps
            ang = a0 + (a1 - a0) * t
            pts.append(pp((hinge[0] + dr["width"] * math.cos(ang), hinge[1] + dr["width"] * math.sin(ang))))
        draw.line(pts, fill=(90, 90, 90), width=1)
    for st in stairs:
        pts = st["box"]
        for i in range(len(pts)):
            draw_line(pts[i], pts[(i + 1) % len(pts)], fill=(80, 80, 80), width=1)
        left, top, right, bottom = pts[0][0], pts[0][1], pts[1][0], pts[2][1]
        for i in range(1, 13):
            x = left + (right - left) * i / 13
            draw_line((x, bottom), (x, top), fill=(80, 80, 80), width=1)
        mid_y = (top + bottom) / 2
        draw_line((left, mid_y), (right, mid_y), fill=(80, 80, 80), width=1)
        draw_line((right - .9, mid_y + .35), (right - .25, mid_y), fill=(80, 80, 80), width=1)
        draw_line((right - .9, mid_y - .35), (right - .25, mid_y), fill=(80, 80, 80), width=1)
    for sym in symbols:
        if sym["type"] == "rect":
            a, b = pp(sym["a"]), pp(sym["b"])
            draw.rectangle((min(a[0], b[0]), min(a[1], b[1]), max(a[0], b[0]), max(a[1], b[1])), outline=(80, 80, 80), width=1)
    f = font(13)
    for lb in labels:
        x, y = pp(lb["p"])
        for idx, text in enumerate(lb["text"].split("\n")):
            box = draw.textbbox((x, y + idx * 12), text, font=f)
            draw.text((x - (box[2] - box[0]) / 2, y + idx * 12 - 7), text, fill=(50, 50, 50), font=f)
    draw.text((margin, img.height - 42), "PROFESSIONAL ARCHITECTURAL OFFICE FLOORPLAN", fill=(70, 70, 70), font=font(12))
    draw.text((margin, img.height - 25), "Units: feet. Approximate source scale. Right wall reference: 44.03 ft. CAD-ready DXF.", fill=(90, 90, 90), font=font(10))
    img.save(OUT_DIR / f"{NAME}.png")


def write_json() -> None:
    data = {
        "name": NAME,
        "intent": "Visual match to supplied black-and-white office floorplan.",
        "scale": {"reference": "right exterior wall", "feet": RIGHT_WALL_FT, "meters": RIGHT_WALL_FT * M_PER_FT, "feetPerSourcePixel": FT_PER_SRC},
        "walls": walls,
        "doors": doors,
        "windows": windows,
        "labels": labels,
    }
    (OUT_DIR / f"{NAME}.project.json").write_text(json.dumps(data, indent=2), encoding="utf-8")


def main() -> None:
    write_dxf(); write_svg(); write_png(); write_json()
    print(f"Wrote {NAME}.dxf")
    print(f"Wrote {NAME}.svg")
    print(f"Wrote {NAME}.png")
    print(f"Wrote {NAME}.project.json")
    print(f"Scale check: right exterior wall = {RIGHT_WALL_FT:.2f} ft / {RIGHT_WALL_FT * M_PER_FT:.3f} m")


if __name__ == "__main__":
    main()
