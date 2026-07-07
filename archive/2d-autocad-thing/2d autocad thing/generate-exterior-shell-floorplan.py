from __future__ import annotations

import json
import math
from pathlib import Path
from xml.sax.saxutils import escape

from PIL import Image, ImageDraw, ImageFont


OUT_DIR = Path(__file__).resolve().parent

# Trace coordinate system from the supplied reference images.
# The right exterior wall height is the provided real-world reference.
SRC_LEFT = 28.0
SRC_RIGHT = 811.0
SRC_TOP = 78.0
SRC_BOTTOM = 548.0
RIGHT_WALL_FT = 44.03
FT_PER_SRC = RIGHT_WALL_FT / (SRC_BOTTOM - SRC_TOP)
M_PER_FT = 0.3048

WALL_THICKNESS_FT = 0.52
PARTITION_THICKNESS_FT = 0.34
DOOR_FT = 3.2

NAME = "exact-office-exterior-shell"


def pt(x: float, y: float) -> tuple[float, float]:
    return ((x - SRC_LEFT) * FT_PER_SRC, (SRC_BOTTOM - y) * FT_PER_SRC)


def length(a: tuple[float, float], b: tuple[float, float]) -> float:
    return math.hypot(b[0] - a[0], b[1] - a[1])


def wall_rect(a: tuple[float, float], b: tuple[float, float], thickness: float) -> list[tuple[float, float]]:
    dx = b[0] - a[0]
    dy = b[1] - a[1]
    ln = math.hypot(dx, dy)
    if ln == 0:
        return [a, b, b, a]
    nx = -dy / ln
    ny = dx / ln
    t = thickness / 2.0
    return [
        (a[0] + nx * t, a[1] + ny * t),
        (b[0] + nx * t, b[1] + ny * t),
        (b[0] - nx * t, b[1] - ny * t),
        (a[0] - nx * t, a[1] - ny * t),
    ]


walls: list[dict] = []
doors: list[dict] = []
windows: list[dict] = []
labels: list[dict] = []
dimensions: list[dict] = []


def add_wall(name: str, x1: float, y1: float, x2: float, y2: float, thickness: float = WALL_THICKNESS_FT) -> None:
    walls.append({"name": name, "a": pt(x1, y1), "b": pt(x2, y2), "src": [x1, y1, x2, y2], "thickness": thickness})


def add_partition(name: str, x1: float, y1: float, x2: float, y2: float) -> None:
    add_wall(name, x1, y1, x2, y2, PARTITION_THICKNESS_FT)


def add_door(name: str, x: float, y: float, angle_deg: float, width_ft: float = DOOR_FT) -> None:
    doors.append({"name": name, "p": pt(x, y), "angle": angle_deg, "width": width_ft})


def add_window(name: str, x1: float, y1: float, x2: float, y2: float) -> None:
    windows.append({"name": name, "a": pt(x1, y1), "b": pt(x2, y2)})


def add_label(text: str, x: float, y: float, size: float = 0.70, rotation: float = 0) -> None:
    labels.append({"text": text, "p": pt(x, y), "size": size, "rotation": rotation})


def add_dimension(name: str, x1: float, y1: float, x2: float, y2: float, offset: float) -> None:
    dimensions.append({"name": name, "a": pt(x1, y1), "b": pt(x2, y2), "offset": offset})


# Exterior shell, drawn as segmented walls so entrances/windows are visible instead of blocked.
# North/top wall with window interruptions matching the references.
add_wall("North exterior left", 28, 78, 246, 78)
add_wall("North exterior mid 1", 286, 78, 333, 78)
add_wall("North exterior mid 2", 370, 78, 505, 78)
add_wall("North exterior mid 3", 548, 78, 690, 78)
add_wall("North exterior right", 742, 78, 811, 78)

# East/right wall: continuous measured reference wall.
add_wall("East exterior reference wall", 811, 78, 811, 548)

# South/bottom wall with window interruptions.
add_wall("South exterior left", 28, 548, 323, 548)
add_wall("South exterior middle", 365, 548, 650, 548)
add_wall("South exterior right", 716, 548, 811, 548)

# West/left wall segmented for the visible side entrance door.
add_wall("West exterior top", 28, 78, 28, 330)
add_wall("West exterior entry jamb upper", 28, 330, 28, 355)
add_wall("West exterior lower", 28, 383, 28, 548)

# Balcony / left exterior strip divisions from the second reference image.
add_partition("Balcony strip east wall", 98, 78, 98, 355)
add_partition("Balcony pantry division", 28, 192, 98, 192)
add_partition("Balcony sitting division", 28, 355, 98, 355)
add_partition("Balcony lower court division", 28, 478, 257, 478)
add_partition("Balcony/stair enclosure east", 257, 395, 257, 478)
add_partition("Stair/sunken zone north", 28, 395, 257, 395)

# Small exterior recess around the lower center entrance bay from the references.
add_partition("Entrance bay north return", 257, 395, 329, 395)
add_partition("Entrance bay east jamb", 329, 395, 329, 478)
add_partition("Entrance bay south return", 257, 478, 329, 478)

# A few exterior-adjacent toilet block divisions are retained because they shape the right facade/balcony massing.
add_partition("Right washroom west", 697, 78, 697, 190)
add_partition("Right washroom split", 778, 78, 778, 190)
add_partition("Right washroom south", 697, 190, 811, 190)

# Doors/entrances.
add_door("Side entrance", 28, 355, 0, 3.6)
add_door("Pantry balcony door", 98, 182, 180, 3.0)
add_door("Lower balcony/stair door", 98, 355, 180, 3.2)
add_door("Main entrance bay", 329, 395, 180, 3.5)
add_door("Washroom M entrance", 697, 174, 0, 2.7)
add_door("Washroom F entrance", 778, 190, 90, 2.7)

# Windows/openings on exterior walls.
add_window("North window left", 246, 78, 286, 78)
add_window("North window center", 333, 78, 370, 78)
add_window("North window long", 505, 78, 548, 78)
add_window("North window right", 690, 78, 742, 78)
add_window("South window left", 323, 548, 365, 548)
add_window("South window right 1", 650, 548, 716, 548)
add_window("South window right 2", 748, 548, 802, 548)
add_window("East facade window upper", 811, 253, 811, 310)
add_window("East facade window lower", 811, 383, 811, 450)

add_label("PANTRY", 58, 133, 0.72)
add_label("BALCONY / SITTING", 63, 270, 0.42)
add_label("SIDE ENTRY", 50, 365, 0.50)
add_label("STAIR / SERVICE", 142, 438, 0.60)
add_label("ENTRANCE BAY", 292, 438, 0.42)
add_label("WASH M", 730, 125, 0.40)
add_label("WASH F", 793, 125, 0.40)

add_dimension("RIGHT EXTERIOR WALL = 44.03 ft / 13.420 m", 811, 78, 811, 548, 3.0)
derived_width = (SRC_RIGHT - SRC_LEFT) * FT_PER_SRC
add_dimension(f"DERIVED OVERALL WIDTH = {derived_width:.2f} ft", 28, 548, 811, 548, -3.0)


class Dxf:
    def __init__(self) -> None:
        self.rows: list[str] = []

    def w(self, code: int, value: object) -> None:
        self.rows.extend([str(code), str(value)])

    def line(self, layer: str, a: tuple[float, float], b: tuple[float, float]) -> None:
        self.w(0, "LINE")
        self.w(8, layer)
        self.w(10, f"{a[0]:.4f}")
        self.w(20, f"{a[1]:.4f}")
        self.w(30, "0.0")
        self.w(11, f"{b[0]:.4f}")
        self.w(21, f"{b[1]:.4f}")
        self.w(31, "0.0")

    def arc(self, layer: str, c: tuple[float, float], radius: float, start: float, end: float) -> None:
        self.w(0, "ARC")
        self.w(8, layer)
        self.w(10, f"{c[0]:.4f}")
        self.w(20, f"{c[1]:.4f}")
        self.w(30, "0.0")
        self.w(40, f"{radius:.4f}")
        self.w(50, f"{start:.2f}")
        self.w(51, f"{end:.2f}")

    def text(self, layer: str, text: str, p: tuple[float, float], height: float, rotation: float = 0) -> None:
        self.w(0, "TEXT")
        self.w(8, layer)
        self.w(10, f"{p[0]:.4f}")
        self.w(20, f"{p[1]:.4f}")
        self.w(30, "0.0")
        self.w(40, f"{height:.4f}")
        self.w(1, text)
        self.w(50, f"{rotation:.2f}")

    def polyline(self, layer: str, points: list[tuple[float, float]], closed: bool = True) -> None:
        self.w(0, "POLYLINE")
        self.w(8, layer)
        self.w(66, 1)
        self.w(70, 1 if closed else 0)
        for p in points:
            self.w(0, "VERTEX")
            self.w(8, layer)
            self.w(10, f"{p[0]:.4f}")
            self.w(20, f"{p[1]:.4f}")
            self.w(30, "0.0")
        self.w(0, "SEQEND")

    def build(self) -> str:
        return "\n".join(self.rows) + "\n"


def write_dxf() -> None:
    d = Dxf()
    d.w(0, "SECTION")
    d.w(2, "HEADER")
    d.w(9, "$ACADVER")
    d.w(1, "AC1009")
    d.w(9, "$INSUNITS")
    d.w(70, 2)
    d.w(0, "ENDSEC")
    d.w(0, "SECTION")
    d.w(2, "TABLES")
    d.w(0, "TABLE")
    d.w(2, "LAYER")
    layers = [("A-WALL", 7), ("A-DOOR", 1), ("A-GLAZ", 4), ("A-TEXT", 2), ("A-ANNO", 6), ("0", 7)]
    d.w(70, len(layers))
    for name, color in layers:
        d.w(0, "LAYER")
        d.w(2, name)
        d.w(70, 0)
        d.w(62, color)
        d.w(6, "CONTINUOUS")
    d.w(0, "ENDTAB")
    d.w(0, "ENDSEC")
    d.w(0, "SECTION")
    d.w(2, "ENTITIES")
    for wall in walls:
        d.polyline("A-WALL", wall_rect(wall["a"], wall["b"], wall["thickness"]))
    for win in windows:
        d.line("A-GLAZ", win["a"], win["b"])
        dx = win["b"][0] - win["a"][0]
        dy = win["b"][1] - win["a"][1]
        ln = math.hypot(dx, dy)
        if ln:
            nx, ny = -dy / ln, dx / ln
            d.line("A-GLAZ", (win["a"][0] + nx * 0.18, win["a"][1] + ny * 0.18), (win["b"][0] + nx * 0.18, win["b"][1] + ny * 0.18))
            d.line("A-GLAZ", (win["a"][0] - nx * 0.18, win["a"][1] - ny * 0.18), (win["b"][0] - nx * 0.18, win["b"][1] - ny * 0.18))
    for door in doors:
        a = math.radians(door["angle"])
        hinge = door["p"]
        jamb = (hinge[0] + door["width"] * math.cos(a), hinge[1] + door["width"] * math.sin(a))
        leaf_ang = a - math.pi / 2
        leaf = (hinge[0] + door["width"] * math.cos(leaf_ang), hinge[1] + door["width"] * math.sin(leaf_ang))
        d.line("A-DOOR", hinge, leaf)
        d.line("A-DOOR", hinge, jamb)
        start = math.degrees(leaf_ang) % 360
        end = math.degrees(a) % 360
        d.arc("A-DOOR", hinge, door["width"], min(start, end), max(start, end))
    for label in labels:
        d.text("A-TEXT", label["text"], label["p"], label["size"], label["rotation"])
    d.text("A-ANNO", "EXTERIOR SHELL TRACE ONLY - INTERIOR FIT-OUT REMOVED PER REVISION.", (0, -4.2), 0.50)
    d.text("A-ANNO", "SCALE: RIGHT EXTERIOR WALL FIXED AT 44.03 FT / 13.420 M.", (0, -5.0), 0.50)
    for dim in dimensions:
        a = dim["a"]
        b = dim["b"]
        dx, dy = b[0] - a[0], b[1] - a[1]
        ln = math.hypot(dx, dy)
        nx, ny = -dy / ln, dx / ln
        da = (a[0] + nx * dim["offset"], a[1] + ny * dim["offset"])
        db = (b[0] + nx * dim["offset"], b[1] + ny * dim["offset"])
        d.line("A-ANNO", da, db)
        d.line("A-ANNO", a, da)
        d.line("A-ANNO", b, db)
        d.text("A-ANNO", dim["name"], ((da[0] + db[0]) / 2 - 5.4, (da[1] + db[1]) / 2 + 0.25), 0.44, math.degrees(math.atan2(dy, dx)))
    d.w(0, "ENDSEC")
    d.w(0, "EOF")
    (OUT_DIR / f"{NAME}.dxf").write_text(d.build(), encoding="utf-8")


def svg_points(points: list[tuple[float, float]]) -> str:
    return " ".join(f"{x:.3f},{-y:.3f}" for x, y in points)


def write_svg() -> None:
    width = (SRC_RIGHT - SRC_LEFT) * FT_PER_SRC
    height = RIGHT_WALL_FT
    parts = [
        f'<svg xmlns="http://www.w3.org/2000/svg" width="1800" height="1150" viewBox="-4 {-height - 6:.3f} {width + 11:.3f} {height + 12:.3f}">',
        '<rect x="-100" y="-100" width="300" height="300" fill="white"/>',
        '<style>text{font-family:Arial,Helvetica,sans-serif}.wall{fill:#111827;stroke:#111827;stroke-width:.03}.door{stroke:#b91c1c;stroke-width:.11;fill:none}.glaz{stroke:#0369a1;stroke-width:.12;fill:none}.label{font-size:.66px;font-weight:700;fill:#111827}.anno{font-size:.45px;fill:#7c2d12}.dim{stroke:#dc2626;stroke-width:.08;fill:none;stroke-dasharray:.35 .25}</style>',
    ]
    for wall in walls:
        parts.append(f'<polygon class="wall" points="{svg_points(wall_rect(wall["a"], wall["b"], wall["thickness"]))}"/>')
    for win in windows:
        parts.append(f'<line class="glaz" x1="{win["a"][0]:.3f}" y1="{-win["a"][1]:.3f}" x2="{win["b"][0]:.3f}" y2="{-win["b"][1]:.3f}"/>')
    for door in doors:
        a = math.radians(door["angle"])
        hinge = door["p"]
        jamb = (hinge[0] + door["width"] * math.cos(a), hinge[1] + door["width"] * math.sin(a))
        leaf_ang = a - math.pi / 2
        leaf = (hinge[0] + door["width"] * math.cos(leaf_ang), hinge[1] + door["width"] * math.sin(leaf_ang))
        parts.append(f'<line class="door" x1="{hinge[0]:.3f}" y1="{-hinge[1]:.3f}" x2="{leaf[0]:.3f}" y2="{-leaf[1]:.3f}"/>')
        parts.append(f'<line class="door" x1="{hinge[0]:.3f}" y1="{-hinge[1]:.3f}" x2="{jamb[0]:.3f}" y2="{-jamb[1]:.3f}"/>')
        parts.append(f'<path class="door" d="M {leaf[0]:.3f},{-leaf[1]:.3f} A {door["width"]:.3f},{door["width"]:.3f} 0 0 0 {jamb[0]:.3f},{-jamb[1]:.3f}"/>')
    for label in labels:
        x, y = label["p"]
        transform = f' transform="rotate({-label["rotation"]:.1f} {x:.3f} {-y:.3f})"' if label["rotation"] else ""
        parts.append(f'<text class="label" x="{x:.3f}" y="{-y:.3f}" text-anchor="middle"{transform}>{escape(label["text"])}</text>')
    for dim in dimensions:
        a = dim["a"]
        b = dim["b"]
        dx, dy = b[0] - a[0], b[1] - a[1]
        ln = math.hypot(dx, dy)
        nx, ny = -dy / ln, dx / ln
        da = (a[0] + nx * dim["offset"], a[1] + ny * dim["offset"])
        db = (b[0] + nx * dim["offset"], b[1] + ny * dim["offset"])
        parts.append(f'<line class="dim" x1="{da[0]:.3f}" y1="{-da[1]:.3f}" x2="{db[0]:.3f}" y2="{-db[1]:.3f}"/>')
        parts.append(f'<text class="anno" x="{(da[0] + db[0]) / 2:.3f}" y="{-(da[1] + db[1]) / 2 - .25:.3f}" text-anchor="middle">{escape(dim["name"])}</text>')
    parts.append('<text class="anno" x="0" y="4.2">Exterior shell trace only. Interior fit-out removed. Scale fixed from right exterior wall.</text>')
    parts.append("</svg>")
    (OUT_DIR / f"{NAME}.svg").write_text("\n".join(parts), encoding="utf-8")


def write_png() -> None:
    width_ft = (SRC_RIGHT - SRC_LEFT) * FT_PER_SRC
    height_ft = RIGHT_WALL_FT
    scale = 18
    margin = 95
    img = Image.new("RGB", (int(width_ft * scale) + margin * 2, int(height_ft * scale) + margin * 2 + 70), "white")
    draw = ImageDraw.Draw(img)

    def font(size: int):
        try:
            return ImageFont.truetype("arial.ttf", size)
        except OSError:
            return ImageFont.load_default()

    def pp(p: tuple[float, float]) -> tuple[int, int]:
        return (round(margin + p[0] * scale), round(margin + (height_ft - p[1]) * scale))

    for wall in walls:
        draw.polygon([pp(p) for p in wall_rect(wall["a"], wall["b"], wall["thickness"])], fill=(17, 24, 39))
    for win in windows:
        draw.line([pp(win["a"]), pp(win["b"])], fill=(3, 105, 161), width=4)
    for door in doors:
        a = math.radians(door["angle"])
        hinge = door["p"]
        jamb = (hinge[0] + door["width"] * math.cos(a), hinge[1] + door["width"] * math.sin(a))
        leaf_ang = a - math.pi / 2
        leaf = (hinge[0] + door["width"] * math.cos(leaf_ang), hinge[1] + door["width"] * math.sin(leaf_ang))
        draw.line([pp(hinge), pp(leaf)], fill=(185, 28, 28), width=2)
        draw.line([pp(hinge), pp(jamb)], fill=(185, 28, 28), width=2)
    for label in labels:
        f = font(max(9, round(label["size"] * 18)))
        x, y = pp(label["p"])
        text = label["text"]
        bbox = draw.textbbox((x, y), text, font=f)
        draw.text((x - (bbox[2] - bbox[0]) / 2, y - (bbox[3] - bbox[1]) / 2), text, fill=(17, 24, 39), font=f)
    draw.text((margin, img.height - 50), "Exterior shell trace only - interior fit-out removed. Right exterior wall = 44.03 ft / 13.420 m.", fill=(124, 45, 18), font=font(11))
    draw.text((margin + int(width_ft * scale) + 18, margin + int(height_ft * scale / 2)), "44.03 ft", fill=(220, 38, 38), font=font(15))
    img.save(OUT_DIR / f"{NAME}.png")


def write_json() -> None:
    payload = {
        "name": NAME,
        "intent": "Exterior shell trace only with balcony divisions, entrances, and windows.",
        "scale": {
            "reference": "right exterior wall",
            "feet": RIGHT_WALL_FT,
            "meters": RIGHT_WALL_FT * M_PER_FT,
            "feetPerSourcePixel": FT_PER_SRC,
        },
        "walls": walls,
        "doors": doors,
        "windows": windows,
        "labels": labels,
        "dimensions": dimensions,
    }
    (OUT_DIR / f"{NAME}.project.json").write_text(json.dumps(payload, indent=2), encoding="utf-8")


def main() -> None:
    write_dxf()
    write_svg()
    write_png()
    write_json()
    print(f"Wrote {NAME}.dxf")
    print(f"Wrote {NAME}.svg")
    print(f"Wrote {NAME}.png")
    print(f"Wrote {NAME}.project.json")
    print(f"Scale check: right exterior wall = {length(pt(SRC_RIGHT, SRC_TOP), pt(SRC_RIGHT, SRC_BOTTOM)):.2f} ft / {RIGHT_WALL_FT * M_PER_FT:.3f} m")


if __name__ == "__main__":
    main()
