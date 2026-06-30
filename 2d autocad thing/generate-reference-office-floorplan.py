from __future__ import annotations

import json
import math
from pathlib import Path
from xml.sax.saxutils import escape

from PIL import Image, ImageDraw, ImageFont


OUT_DIR = Path(__file__).resolve().parent
NAME = "reference-office-floorplan"

# Reference trace bounds from the supplied office floorplan image.
SRC_LEFT = 28.0
SRC_RIGHT = 811.0
SRC_TOP = 78.0
SRC_BOTTOM = 548.0
RIGHT_WALL_FT = 44.03
FT_PER_SRC = RIGHT_WALL_FT / (SRC_BOTTOM - SRC_TOP)
M_PER_FT = 0.3048

EXTERIOR_T = 0.50
WALL_T = 0.32


def pt(x: float, y: float) -> tuple[float, float]:
    return ((x - SRC_LEFT) * FT_PER_SRC, (SRC_BOTTOM - y) * FT_PER_SRC)


def wall_poly(a: tuple[float, float], b: tuple[float, float], t: float) -> list[tuple[float, float]]:
    dx, dy = b[0] - a[0], b[1] - a[1]
    ln = math.hypot(dx, dy)
    if ln == 0:
        return [a, b, b, a]
    nx, ny = -dy / ln, dx / ln
    h = t / 2
    return [(a[0] + nx * h, a[1] + ny * h), (b[0] + nx * h, b[1] + ny * h), (b[0] - nx * h, b[1] - ny * h), (a[0] - nx * h, a[1] - ny * h)]


walls: list[dict] = []
doors: list[dict] = []
windows: list[dict] = []
labels: list[dict] = []
stairs: list[dict] = []
dims: list[dict] = []


def wall(name: str, x1: float, y1: float, x2: float, y2: float, t: float = WALL_T) -> None:
    walls.append({"name": name, "a": pt(x1, y1), "b": pt(x2, y2), "src": [x1, y1, x2, y2], "t": t})


def door(name: str, x: float, y: float, angle: float, width: float = 3.0) -> None:
    doors.append({"name": name, "p": pt(x, y), "angle": angle, "width": width})


def window(name: str, x1: float, y1: float, x2: float, y2: float) -> None:
    windows.append({"name": name, "a": pt(x1, y1), "b": pt(x2, y2)})


def label(text: str, x: float, y: float, size: float = 0.58, rot: float = 0) -> None:
    labels.append({"text": text, "p": pt(x, y), "size": size, "rot": rot})


def dim(text: str, x1: float, y1: float, x2: float, y2: float, offset: float) -> None:
    dims.append({"text": text, "a": pt(x1, y1), "b": pt(x2, y2), "offset": offset})


# Exterior, segmented where the reference shows windows/entry interruptions.
wall("top exterior left", 28, 78, 248, 78, EXTERIOR_T)
wall("top exterior center-left", 286, 78, 333, 78, EXTERIOR_T)
wall("top exterior center", 368, 78, 505, 78, EXTERIOR_T)
wall("top exterior center-right", 548, 78, 690, 78, EXTERIOR_T)
wall("top exterior right", 742, 78, 811, 78, EXTERIOR_T)
wall("right exterior measured", 811, 78, 811, 548, EXTERIOR_T)
wall("bottom exterior left", 28, 548, 320, 548, EXTERIOR_T)
wall("bottom exterior mid-left", 362, 548, 665, 548, EXTERIOR_T)
wall("bottom exterior mid-right", 716, 548, 748, 548, EXTERIOR_T)
wall("bottom exterior right", 802, 548, 811, 548, EXTERIOR_T)
wall("left exterior upper", 28, 78, 28, 336, EXTERIOR_T)
wall("left exterior entry upper jamb", 28, 336, 28, 355, EXTERIOR_T)
wall("left exterior entry lower jamb", 28, 383, 28, 548, EXTERIOR_T)

# Left/pantry/stair strip.
wall("pantry east", 98, 78, 98, 335)
wall("pantry south", 28, 182, 98, 182)
wall("left mid division", 28, 335, 98, 335)
wall("stair block north", 28, 383, 260, 383, EXTERIOR_T)
wall("stair block south", 28, 478, 260, 478, EXTERIOR_T)
wall("stair block east", 260, 383, 260, 478, EXTERIOR_T)
wall("stair lower extension", 28, 478, 320, 478, EXTERIOR_T)

# Top row rooms and washrooms.
wall("top left room south", 98, 165, 230, 165)
wall("top left divider", 230, 78, 230, 165)
wall("business cabin divider", 307, 78, 307, 165)
wall("business cabin south left", 230, 165, 258, 165)
wall("business cabin south right", 285, 165, 307, 165)
wall("washroom U west", 312, 78, 312, 178)
wall("washroom U north/south upper", 312, 112, 388, 112)
wall("washroom U east", 388, 112, 388, 178)
wall("washroom U bottom left", 312, 178, 337, 178)
wall("washroom U bottom right", 363, 178, 388, 178)
wall("founder office west", 474, 78, 474, 178)
wall("founder office south", 388, 178, 474, 178)
wall("large top room east", 655, 78, 655, 178)

# Right washroom / room stack.
wall("washroom M west", 697, 78, 697, 178)
wall("washroom split", 748, 78, 748, 178)
wall("right washroom south", 697, 178, 811, 178)
wall("right room spine top", 706, 178, 706, 235)
wall("right room division top", 706, 235, 811, 235)
wall("right room spine mid", 706, 235, 706, 348)
wall("right room division mid", 706, 348, 811, 348)
wall("right room spine low", 706, 348, 706, 445)
wall("right bottom room top", 706, 445, 811, 445)

# Middle-left small rooms and jogged lobby edge.
wall("meeting rooms north", 98, 205, 230, 205)
wall("meeting rooms south", 98, 265, 230, 265)
wall("meeting room split", 158, 205, 158, 265)
wall("meeting rooms east", 230, 205, 230, 265)
wall("production bay south", 98, 318, 244, 318)
wall("production bay east", 244, 265, 318, 265)
wall("production bay vertical", 244, 265, 244, 318)
wall("lobby upper step", 244, 318, 350, 318)
wall("lobby step down", 350, 318, 350, 360)
wall("main corridor lower", 350, 360, 470, 360)

# Entrance and lower rooms.
wall("entrance bay west", 230, 383, 230, 478)
wall("entrance bay north", 230, 383, 320, 383)
wall("entrance bay east", 320, 383, 320, 478)
wall("big meeting west", 320, 383, 320, 525)
wall("big meeting north", 320, 383, 460, 383)
wall("big meeting east", 460, 383, 460, 525)
wall("server west", 460, 383, 460, 525)
wall("server east", 522, 383, 522, 525)
wall("server north", 460, 383, 522, 383)
wall("right lower office west", 548, 383, 548, 548)
wall("right lower office north left", 548, 383, 586, 383)
wall("right lower office north right", 620, 383, 678, 383)
wall("right lower office east", 678, 383, 548, 678)  # corrected below by script sanity would be diagonal, keep disabled? 

# Replace accidental diagonal with intended right-side vertical for lower center/right block.
walls.pop()
wall("right lower office east", 678, 383, 678, 548)
wall("right lower office split", 548, 445, 678, 445)

# Openings and door swings.
door("pantry door", 98, 172, 180, 3.0)
door("side entrance", 28, 355, 0, 3.6)
door("stair lobby door", 98, 335, 0, 3.3)
door("top left room door", 230, 154, 180, 3.0)
door("meeting room 1 door", 158, 205, 90, 2.7)
door("washroom U left", 312, 112, 270, 2.4)
door("washroom U bottom", 350, 178, 90, 2.4)
door("open office top door", 474, 178, 180, 3.0)
door("right wash M", 697, 178, 0, 2.8)
door("right wash F", 748, 178, 90, 2.8)
door("right upper room door", 706, 205, 180, 3.0)
door("right mid room door", 706, 295, 180, 3.0)
door("main entrance", 350, 360, 180, 3.4)
door("big meeting door", 460, 383, 90, 3.2)
door("server door", 522, 383, 90, 2.6)
door("production bay door", 98, 205, 0, 2.8)
door("lower corridor door west", 230, 383, 0, 2.4)
door("lower corridor door east", 260, 383, 180, 2.4)
door("right lower room door", 586, 383, 90, 3.0)

# Windows and facade openings.
window("top window 1", 248, 78, 286, 78)
window("top window 2", 333, 78, 368, 78)
window("top window 3", 505, 78, 548, 78)
window("top window 4", 690, 78, 742, 78)
window("bottom window 1", 320, 548, 362, 548)
window("bottom window 2", 665, 548, 716, 548)
window("bottom window 3", 748, 548, 802, 548)
window("right window upper", 811, 235, 811, 348)
window("left facade window upper", 28, 88, 28, 165)
window("left facade window middle", 28, 205, 28, 318)
window("left facade window lower", 28, 478, 28, 535)
window("right facade window lower", 811, 445, 811, 525)

# Stair detail.
stairs.append({"box": [pt(58, 395), pt(180, 395), pt(180, 478), pt(58, 478)]})

label("PANTRY", 58, 132, 0.60)
label("washroom U", 350, 96, 0.42)
label("Washroom M", 720, 120, 0.42, -90)
label("Washroom F", 775, 120, 0.42, -90)
label("STAIR", 118, 438, 0.48)
label("ENTRANCE", 285, 430, 0.38)
label("OPEN OFFICE", 540, 280, 0.58)

dim("RIGHT EXTERIOR WALL = 44.03 ft / 13.420 m", 811, 78, 811, 548, 3.0)
dim(f"DERIVED WIDTH = {(SRC_RIGHT - SRC_LEFT) * FT_PER_SRC:.2f} ft", 28, 548, 811, 548, -3.0)

# Field-note dimensions read from the rough notebook sketch. These are annotation
# checks from the handwritten survey, not additional scale anchors.
dim("FIELD NOTE: BALCONY 29.7 ft", 28, 58, 345, 58, 0.0)
dim("FIELD NOTE: TOP RUN 20.6 ft", 548, 95, 768, 95, 0.0)
dim("FIELD NOTE: ROOM WIDTH 10.6 ft", 548, 135, 661, 135, 0.0)
dim("FIELD NOTE: RIGHT ROOM 10.2 ft", 690, 310, 799, 310, 0.0)
dim("FIELD NOTE: 16.3 ft", 320, 374, 494, 374, 0.0)
dim("FIELD NOTE: 6.7 ft", 494, 374, 565, 374, 0.0)
dim("FIELD NOTE: 12 ft", 565, 374, 693, 374, 0.0)
dim("FIELD NOTE: 13.1 ft", 693, 374, 811, 374, 0.0)
dim("FIELD NOTE: 12.8 ft", 28, 586, 165, 586, 0.0)
dim("FIELD NOTE: 32.3 ft BOTTOM NOTE", 420, 586, 765, 586, 0.0)
dim("FIELD NOTE: LEFT VERTICAL 12 ft", 12, 430, 12, 548, 0.0)
dim("FIELD NOTE: LEFT VERTICAL 18.7 ft", 12, 265, 12, 430, 0.0)


class Dxf:
    def __init__(self) -> None:
        self.s: list[str] = []

    def w(self, code: int, value: object) -> None:
        self.s.extend([str(code), str(value)])

    def line(self, layer: str, a: tuple[float, float], b: tuple[float, float]) -> None:
        self.w(0, "LINE"); self.w(8, layer)
        self.w(10, f"{a[0]:.4f}"); self.w(20, f"{a[1]:.4f}"); self.w(30, "0")
        self.w(11, f"{b[0]:.4f}"); self.w(21, f"{b[1]:.4f}"); self.w(31, "0")

    def arc(self, layer: str, c: tuple[float, float], r: float, start: float, end: float) -> None:
        self.w(0, "ARC"); self.w(8, layer)
        self.w(10, f"{c[0]:.4f}"); self.w(20, f"{c[1]:.4f}"); self.w(30, "0")
        self.w(40, f"{r:.4f}"); self.w(50, f"{start:.2f}"); self.w(51, f"{end:.2f}")

    def text(self, layer: str, text: str, p: tuple[float, float], h: float, rot: float = 0) -> None:
        self.w(0, "TEXT"); self.w(8, layer)
        self.w(10, f"{p[0]:.4f}"); self.w(20, f"{p[1]:.4f}"); self.w(30, "0")
        self.w(40, f"{h:.4f}"); self.w(1, text); self.w(50, f"{rot:.2f}")

    def poly(self, layer: str, points: list[tuple[float, float]]) -> None:
        self.w(0, "POLYLINE"); self.w(8, layer); self.w(66, 1); self.w(70, 1)
        for p in points:
            self.w(0, "VERTEX"); self.w(8, layer); self.w(10, f"{p[0]:.4f}"); self.w(20, f"{p[1]:.4f}"); self.w(30, "0")
        self.w(0, "SEQEND")

    def build(self) -> str:
        return "\n".join(self.s) + "\n"


def write_dxf() -> None:
    d = Dxf()
    d.w(0, "SECTION"); d.w(2, "HEADER"); d.w(9, "$ACADVER"); d.w(1, "AC1009"); d.w(9, "$INSUNITS"); d.w(70, 2); d.w(0, "ENDSEC")
    d.w(0, "SECTION"); d.w(2, "TABLES"); d.w(0, "TABLE"); d.w(2, "LAYER")
    layers = [("A-WALL", 7), ("A-DOOR", 1), ("A-GLAZ", 4), ("A-STAIR", 3), ("A-TEXT", 2), ("A-ANNO", 6), ("0", 7)]
    d.w(70, len(layers))
    for name, color in layers:
        d.w(0, "LAYER"); d.w(2, name); d.w(70, 0); d.w(62, color); d.w(6, "CONTINUOUS")
    d.w(0, "ENDTAB"); d.w(0, "ENDSEC"); d.w(0, "SECTION"); d.w(2, "ENTITIES")
    for w in walls:
        d.poly("A-WALL", wall_poly(w["a"], w["b"], w["t"]))
    for win in windows:
        d.line("A-GLAZ", win["a"], win["b"])
    for dr in doors:
        a = math.radians(dr["angle"])
        hinge = dr["p"]
        jamb = (hinge[0] + dr["width"] * math.cos(a), hinge[1] + dr["width"] * math.sin(a))
        leaf_ang = a - math.pi / 2
        leaf = (hinge[0] + dr["width"] * math.cos(leaf_ang), hinge[1] + dr["width"] * math.sin(leaf_ang))
        d.line("A-DOOR", hinge, leaf); d.line("A-DOOR", hinge, jamb)
        start, end = math.degrees(leaf_ang) % 360, math.degrees(a) % 360
        d.arc("A-DOOR", hinge, dr["width"], min(start, end), max(start, end))
    for st in stairs:
        d.poly("A-STAIR", st["box"])
        left, top, right, bottom = st["box"][0][0], st["box"][0][1], st["box"][1][0], st["box"][2][1]
        for i in range(1, 13):
            x = left + (right - left) * i / 13
            d.line("A-STAIR", (x, bottom), (x, top))
    for lb in labels:
        d.text("A-TEXT", lb["text"], lb["p"], lb["size"], lb["rot"])
    d.text("A-ANNO", "REFERENCE OFFICE FLOORPLAN TRACE - SCALE FROM RIGHT EXTERIOR WALL.", (0, -4.3), 0.48)
    for dm in dims:
        a, b = dm["a"], dm["b"]
        dx, dy = b[0] - a[0], b[1] - a[1]
        ln = math.hypot(dx, dy)
        nx, ny = -dy / ln, dx / ln
        da, db = (a[0] + nx * dm["offset"], a[1] + ny * dm["offset"]), (b[0] + nx * dm["offset"], b[1] + ny * dm["offset"])
        d.line("A-ANNO", da, db); d.line("A-ANNO", a, da); d.line("A-ANNO", b, db)
        d.text("A-ANNO", dm["text"], ((da[0] + db[0]) / 2 - 5.5, (da[1] + db[1]) / 2 + 0.25), 0.42, math.degrees(math.atan2(dy, dx)))
    d.w(0, "ENDSEC"); d.w(0, "EOF")
    (OUT_DIR / f"{NAME}.dxf").write_text(d.build(), encoding="utf-8")


def svg_points(points: list[tuple[float, float]]) -> str:
    return " ".join(f"{x:.3f},{-y:.3f}" for x, y in points)


def write_svg() -> None:
    width, height = (SRC_RIGHT - SRC_LEFT) * FT_PER_SRC, RIGHT_WALL_FT
    parts = [
        f'<svg xmlns="http://www.w3.org/2000/svg" width="1800" height="1150" viewBox="-4 {-height - 6:.3f} {width + 11:.3f} {height + 12:.3f}">',
        '<rect x="-100" y="-100" width="300" height="300" fill="white"/>',
        '<style>text{font-family:Arial,Helvetica,sans-serif}.wall{fill:#111827;stroke:#111827;stroke-width:.025}.door{stroke:#b91c1c;stroke-width:.10;fill:none}.glaz{stroke:#0369a1;stroke-width:.10;fill:none}.stair{stroke:#374151;stroke-width:.06;fill:none}.label{font-size:.55px;font-weight:700;fill:#111827}.anno{font-size:.42px;fill:#7c2d12}.dim{stroke:#dc2626;stroke-width:.07;fill:none;stroke-dasharray:.35 .25}</style>',
    ]
    for w in walls:
        parts.append(f'<polygon class="wall" points="{svg_points(wall_poly(w["a"], w["b"], w["t"]))}"/>')
    for win in windows:
        parts.append(f'<line class="glaz" x1="{win["a"][0]:.3f}" y1="{-win["a"][1]:.3f}" x2="{win["b"][0]:.3f}" y2="{-win["b"][1]:.3f}"/>')
    for dr in doors:
        a = math.radians(dr["angle"]); hinge = dr["p"]
        jamb = (hinge[0] + dr["width"] * math.cos(a), hinge[1] + dr["width"] * math.sin(a))
        leaf_ang = a - math.pi / 2
        leaf = (hinge[0] + dr["width"] * math.cos(leaf_ang), hinge[1] + dr["width"] * math.sin(leaf_ang))
        parts.append(f'<line class="door" x1="{hinge[0]:.3f}" y1="{-hinge[1]:.3f}" x2="{leaf[0]:.3f}" y2="{-leaf[1]:.3f}"/>')
        parts.append(f'<line class="door" x1="{hinge[0]:.3f}" y1="{-hinge[1]:.3f}" x2="{jamb[0]:.3f}" y2="{-jamb[1]:.3f}"/>')
        parts.append(f'<path class="door" d="M {leaf[0]:.3f},{-leaf[1]:.3f} A {dr["width"]:.3f},{dr["width"]:.3f} 0 0 0 {jamb[0]:.3f},{-jamb[1]:.3f}"/>')
    for st in stairs:
        parts.append(f'<polygon class="stair" points="{svg_points(st["box"])}"/>')
        left, top, right, bottom = st["box"][0][0], st["box"][0][1], st["box"][1][0], st["box"][2][1]
        for i in range(1, 13):
            x = left + (right - left) * i / 13
            parts.append(f'<line class="stair" x1="{x:.3f}" y1="{-bottom:.3f}" x2="{x:.3f}" y2="{-top:.3f}"/>')
    for lb in labels:
        x, y = lb["p"]; tr = f' transform="rotate({-lb["rot"]:.1f} {x:.3f} {-y:.3f})"' if lb["rot"] else ""
        parts.append(f'<text class="label" x="{x:.3f}" y="{-y:.3f}" text-anchor="middle"{tr}>{escape(lb["text"])}</text>')
    for dm in dims:
        a, b = dm["a"], dm["b"]
        dx, dy = b[0] - a[0], b[1] - a[1]; ln = math.hypot(dx, dy)
        nx, ny = -dy / ln, dx / ln
        da, db = (a[0] + nx * dm["offset"], a[1] + ny * dm["offset"]), (b[0] + nx * dm["offset"], b[1] + ny * dm["offset"])
        parts.append(f'<line class="dim" x1="{da[0]:.3f}" y1="{-da[1]:.3f}" x2="{db[0]:.3f}" y2="{-db[1]:.3f}"/>')
        parts.append(f'<text class="anno" x="{(da[0] + db[0]) / 2:.3f}" y="{-(da[1] + db[1]) / 2 - .25:.3f}" text-anchor="middle">{escape(dm["text"])}</text>')
    parts.append('<text class="anno" x="0" y="4.2">Reference office trace. Right exterior wall fixed at 44.03 ft / 13.420 m.</text></svg>')
    (OUT_DIR / f"{NAME}.svg").write_text("\n".join(parts), encoding="utf-8")


def write_png() -> None:
    width_ft, height_ft = (SRC_RIGHT - SRC_LEFT) * FT_PER_SRC, RIGHT_WALL_FT
    scale, margin = 18, 95
    img = Image.new("RGB", (int(width_ft * scale) + margin * 2, int(height_ft * scale) + margin * 2 + 70), "white")
    draw = ImageDraw.Draw(img)

    def font(size: int):
        try:
            return ImageFont.truetype("arial.ttf", size)
        except OSError:
            return ImageFont.load_default()

    def pp(p: tuple[float, float]) -> tuple[int, int]:
        return round(margin + p[0] * scale), round(margin + (height_ft - p[1]) * scale)

    for w in walls:
        draw.polygon([pp(p) for p in wall_poly(w["a"], w["b"], w["t"])], fill=(17, 24, 39))
    for win in windows:
        draw.line([pp(win["a"]), pp(win["b"])], fill=(3, 105, 161), width=3)
    for dr in doors:
        a = math.radians(dr["angle"]); hinge = dr["p"]
        jamb = (hinge[0] + dr["width"] * math.cos(a), hinge[1] + dr["width"] * math.sin(a))
        leaf_ang = a - math.pi / 2
        leaf = (hinge[0] + dr["width"] * math.cos(leaf_ang), hinge[1] + dr["width"] * math.sin(leaf_ang))
        draw.line([pp(hinge), pp(leaf)], fill=(185, 28, 28), width=2); draw.line([pp(hinge), pp(jamb)], fill=(185, 28, 28), width=2)
    for st in stairs:
        draw.polygon([pp(p) for p in st["box"]], outline=(55, 65, 81))
        left, top, right, bottom = st["box"][0][0], st["box"][0][1], st["box"][1][0], st["box"][2][1]
        for i in range(1, 13):
            x = left + (right - left) * i / 13
            draw.line([pp((x, bottom)), pp((x, top))], fill=(55, 65, 81), width=1)
    for lb in labels:
        f = font(max(8, round(lb["size"] * 19)))
        x, y = pp(lb["p"]); text = lb["text"]
        box = draw.textbbox((x, y), text, font=f)
        draw.text((x - (box[2] - box[0]) / 2, y - (box[3] - box[1]) / 2), text, fill=(17, 24, 39), font=f)
    dim_font = font(10)
    for dm in dims:
        a, b = dm["a"], dm["b"]
        draw.line([pp(a), pp(b)], fill=(220, 38, 38), width=1)
        mx = (a[0] + b[0]) / 2
        my = (a[1] + b[1]) / 2
        x, y = pp((mx, my))
        text = dm["text"].replace("FIELD NOTE: ", "")
        box = draw.textbbox((x, y), text, font=dim_font)
        draw.rectangle((x - (box[2] - box[0]) / 2 - 3, y - 9, x + (box[2] - box[0]) / 2 + 3, y + 5), fill="white")
        draw.text((x - (box[2] - box[0]) / 2, y - 8), text, fill=(220, 38, 38), font=dim_font)
    draw.text((margin, img.height - 50), "Reference office floorplan trace. Right exterior wall = 44.03 ft / 13.420 m.", fill=(124, 45, 18), font=font(11))
    img.save(OUT_DIR / f"{NAME}.png")


def write_json() -> None:
    payload = {"name": NAME, "scale": {"reference": "right exterior wall", "feet": RIGHT_WALL_FT, "meters": RIGHT_WALL_FT * M_PER_FT, "feetPerSourcePixel": FT_PER_SRC}, "walls": walls, "doors": doors, "windows": windows, "labels": labels}
    (OUT_DIR / f"{NAME}.project.json").write_text(json.dumps(payload, indent=2), encoding="utf-8")


def main() -> None:
    write_dxf(); write_svg(); write_png(); write_json()
    print(f"Wrote {NAME}.dxf")
    print(f"Wrote {NAME}.svg")
    print(f"Wrote {NAME}.png")
    print(f"Wrote {NAME}.project.json")
    print(f"Scale check: right exterior wall = {RIGHT_WALL_FT:.2f} ft / {RIGHT_WALL_FT * M_PER_FT:.3f} m")


if __name__ == "__main__":
    main()
