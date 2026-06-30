from __future__ import annotations

import json
import math
from pathlib import Path
from xml.sax.saxutils import escape

from PIL import Image, ImageDraw, ImageFont


OUT_DIR = Path(__file__).resolve().parent

# Source trace bounds measured from the attached floorplan image.
# The right exterior wall height is the only real measurement supplied.
SRC_LEFT = 28.0
SRC_RIGHT = 811.0
SRC_TOP = 78.0
SRC_BOTTOM = 548.0
RIGHT_WALL_FT = 44.03
FT_PER_SRC = RIGHT_WALL_FT / (SRC_BOTTOM - SRC_TOP)
M_PER_FT = 0.3048

WALL_THICKNESS_FT = 0.46
PARTITION_THICKNESS_FT = 0.34
DOOR_FT = 3.0
WINDOW_FT = 4.0


def pt(x: float, y: float) -> tuple[float, float]:
    """Map image coordinates to CAD feet, origin at lower-left outside corner."""
    return ((x - SRC_LEFT) * FT_PER_SRC, (SRC_BOTTOM - y) * FT_PER_SRC)


def src_len(length: float) -> float:
    return length * FT_PER_SRC


def line_len(a: tuple[float, float], b: tuple[float, float]) -> float:
    return math.hypot(b[0] - a[0], b[1] - a[1])


def wall_rect(a: tuple[float, float], b: tuple[float, float], thickness: float) -> list[tuple[float, float]]:
    dx = b[0] - a[0]
    dy = b[1] - a[1]
    length = math.hypot(dx, dy)
    if length == 0:
        return [a, b, b, a]
    nx = -dy / length
    ny = dx / length
    t = thickness / 2.0
    return [
        (a[0] + nx * t, a[1] + ny * t),
        (b[0] + nx * t, b[1] + ny * t),
        (b[0] - nx * t, b[1] - ny * t),
        (a[0] - nx * t, a[1] - ny * t),
    ]


def interp(a: tuple[float, float], b: tuple[float, float], distance: float) -> tuple[float, float]:
    length = line_len(a, b)
    if length == 0:
        return a
    t = distance / length
    return (a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t)


walls: list[dict] = []
doors: list[dict] = []
windows: list[dict] = []
stairs: list[dict] = []
labels: list[dict] = []
dimensions: list[dict] = []


def add_wall(
    name: str,
    x1: float,
    y1: float,
    x2: float,
    y2: float,
    thickness: float = PARTITION_THICKNESS_FT,
    layer: str = "A-WALL",
) -> dict:
    wall = {
        "name": name,
        "a": pt(x1, y1),
        "b": pt(x2, y2),
        "src": [x1, y1, x2, y2],
        "thickness": thickness,
        "layer": layer,
    }
    walls.append(wall)
    return wall


def add_door(name: str, x: float, y: float, angle_deg: float, width_ft: float = DOOR_FT) -> None:
    doors.append({"name": name, "p": pt(x, y), "angle": angle_deg, "width": width_ft})


def add_window(name: str, x: float, y: float, angle_deg: float, width_ft: float = WINDOW_FT) -> None:
    windows.append({"name": name, "p": pt(x, y), "angle": angle_deg, "width": width_ft})


def add_label(text: str, x: float, y: float, size: float = 0.72, rotation: float = 0) -> None:
    labels.append({"text": text, "p": pt(x, y), "size": size, "rotation": rotation})


def add_dim(name: str, x1: float, y1: float, x2: float, y2: float, offset_ft: float = 2.1) -> None:
    dimensions.append({"name": name, "a": pt(x1, y1), "b": pt(x2, y2), "offset": offset_ft})


# Exterior shell.
add_wall("Exterior north", 28, 78, 811, 78, WALL_THICKNESS_FT)
add_wall("Exterior east - reference 44.03 ft", 811, 78, 811, 548, WALL_THICKNESS_FT)
add_wall("Exterior south", 811, 548, 28, 548, WALL_THICKNESS_FT)
add_wall("Exterior west", 28, 548, 28, 78, WALL_THICKNESS_FT)

# Primary internal partitions traced from the attached office plan.
add_wall("Pantry east", 98, 78, 98, 355)
add_wall("Pantry south", 28, 192, 98, 192)
add_wall("Left lower room split", 28, 355, 98, 355)
add_wall("Left top suite south", 98, 178, 245, 178)
add_wall("Top suite divider", 245, 78, 245, 178)
add_wall("Center top divider", 330, 78, 330, 178)
add_wall("Washroom U west", 398, 92, 398, 178)
add_wall("Washroom U south", 330, 112, 398, 112)
add_wall("Washroom U east", 398, 112, 398, 178)
add_wall("Meeting room divider", 504, 78, 504, 178)
add_wall("Meeting room south", 398, 178, 504, 178)
add_wall("Top-right cabin west", 697, 78, 697, 190)
add_wall("Right washroom M/F west", 747, 78, 747, 190)
add_wall("Right washroom split", 778, 78, 778, 190)
add_wall("Right washroom south", 697, 190, 811, 190)
add_wall("Right middle spine", 706, 190, 706, 383)
add_wall("Right middle split", 706, 253, 811, 253)
add_wall("Right lower split", 706, 383, 811, 383)
add_wall("Right bottom west", 678, 383, 678, 548)
add_wall("Bottom cabin split 1", 491, 383, 491, 548)
add_wall("Bottom cabin split 2", 548, 383, 548, 548)
add_wall("Bottom row north", 329, 383, 678, 383)
add_wall("Lower-left lobby north", 98, 395, 329, 395)
add_wall("Lower-left stair wall", 329, 395, 329, 548)
add_wall("Stair enclosure east", 257, 395, 257, 478, WALL_THICKNESS_FT)
add_wall("Stair enclosure north", 28, 478, 257, 478, WALL_THICKNESS_FT)
add_wall("Central left room west", 259, 178, 259, 337)
add_wall("Central left room south", 98, 276, 259, 276)
add_wall("Small cabins split", 170, 218, 170, 276)
add_wall("Small cabins east", 245, 218, 245, 276)
add_wall("Central jog wall", 259, 337, 373, 337)
add_wall("Central jog south", 373, 337, 373, 383)
add_wall("Lobby to lower cabins", 373, 383, 491, 383)
add_wall("Lobby right vertical", 706, 383, 706, 279)
add_wall("Lobby partial divider", 629, 383, 677, 383)

# Door and window symbols. Angles are SVG-style degrees: 0 east, 90 south, 180 west, 270 north.
add_door("Pantry door", 98, 182, 180)
add_door("Left lower door", 98, 354, 180)
add_door("Left office door", 245, 166, 180)
add_door("Small cabin A door", 170, 218, 90)
add_door("Small cabin B door", 170, 218, 90)
add_door("Central corridor door", 373, 383, 180)
add_door("Washroom U left", 330, 112, 90, 2.4)
add_door("Washroom U right", 398, 178, 180, 2.4)
add_door("Bottom cabin left", 491, 383, 90)
add_door("Bottom cabin middle", 548, 383, 90)
add_door("Right middle upper", 706, 220, 180)
add_door("Right middle lower", 706, 323, 180)
add_door("Washroom M", 747, 190, 90, 2.5)
add_door("Washroom F", 778, 190, 90, 2.5)

add_window("North window 1", 252, 78, 0, 3.6)
add_window("North window 2", 420, 78, 0, 4.2)
add_window("North window 3", 620, 78, 0, 4.2)
add_window("South window 1", 457, 548, 0, 5.2)
add_window("South window 2", 666, 548, 0, 5.0)
add_window("South window 3", 751, 548, 0, 4.5)

# Stair block details.
stair_box = [pt(62, 398), pt(190, 398), pt(190, 478), pt(62, 478)]
stairs.append({"box": stair_box})

add_label("PANTRY", 58, 133, 0.78)
add_label("WASHROOM U", 360, 98, 0.55)
add_label("WASH M", 727, 123, 0.46, -90)
add_label("WASH F", 779, 123, 0.46, -90)
add_label("STAIR", 120, 440, 0.7)
add_label("OFFICE", 175, 126, 0.65)
add_label("CABIN", 285, 126, 0.62)
add_label("MEETING", 452, 126, 0.62)
add_label("OPEN OFFICE / LOBBY", 515, 310, 0.75)
add_label("CABIN", 755, 293, 0.62)
add_label("CABIN", 754, 448, 0.62)

add_dim("RIGHT EXTERIOR WALL = 44.03 ft / 13.420 m", 811, 78, 811, 548, 2.8)
add_dim("DERIVED OVERALL WIDTH", 28, 548, 811, 548, -2.8)


class Dxf:
    def __init__(self) -> None:
        self.lines: list[str] = []

    def w(self, code: int, value: object) -> None:
        self.lines.append(str(code))
        self.lines.append(str(value))

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

    def text(self, layer: str, value: str, p: tuple[float, float], height: float, rotation: float = 0) -> None:
        self.w(0, "TEXT")
        self.w(8, layer)
        self.w(10, f"{p[0]:.4f}")
        self.w(20, f"{p[1]:.4f}")
        self.w(30, "0.0")
        self.w(40, f"{height:.4f}")
        self.w(1, value)
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
        return "\n".join(self.lines) + "\n"


def write_dxf() -> None:
    d = Dxf()
    d.w(0, "SECTION")
    d.w(2, "HEADER")
    d.w(9, "$ACADVER")
    d.w(1, "AC1009")
    d.w(9, "$INSUNITS")
    d.w(70, 2)  # feet
    d.w(0, "ENDSEC")
    d.w(0, "SECTION")
    d.w(2, "TABLES")
    d.w(0, "TABLE")
    d.w(2, "LAYER")
    layers = [
        ("A-WALL", 7),
        ("A-DOOR", 1),
        ("A-GLAZ", 4),
        ("A-STAIR", 3),
        ("A-TEXT", 2),
        ("A-ANNO", 6),
        ("0", 7),
    ]
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
        d.polyline(wall["layer"], wall_rect(wall["a"], wall["b"], wall["thickness"]), True)

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

    for win in windows:
        a = math.radians(win["angle"])
        p1 = win["p"]
        p2 = (p1[0] + win["width"] * math.cos(a), p1[1] + win["width"] * math.sin(a))
        dx = p2[0] - p1[0]
        dy = p2[1] - p1[1]
        length = math.hypot(dx, dy)
        nx = -dy / length
        ny = dx / length
        d.line("A-GLAZ", (p1[0] + nx * 0.12, p1[1] + ny * 0.12), (p2[0] + nx * 0.12, p2[1] + ny * 0.12))
        d.line("A-GLAZ", (p1[0] - nx * 0.12, p1[1] - ny * 0.12), (p2[0] - nx * 0.12, p2[1] - ny * 0.12))

    for stair in stairs:
        d.polyline("A-STAIR", stair["box"], True)
        left, top, right, bottom = stair["box"][0][0], stair["box"][0][1], stair["box"][1][0], stair["box"][2][1]
        for i in range(1, 13):
            x = left + (right - left) * i / 13
            d.line("A-STAIR", (x, bottom), (x, top))
        d.line("A-STAIR", (left, (top + bottom) / 2), (right, (top + bottom) / 2))

    for label in labels:
        d.text("A-TEXT", label["text"], label["p"], label["size"], label["rotation"])

    d.text(
        "A-ANNO",
        "SCALE NOTE: RIGHT EXTERIOR WALL SET TO 44.03 FT (13.420 M); OTHER DIMENSIONS DERIVED PROPORTIONALLY.",
        (0.0, -4.2),
        0.52,
    )

    for dim in dimensions:
        a = dim["a"]
        b = dim["b"]
        dx = b[0] - a[0]
        dy = b[1] - a[1]
        length = math.hypot(dx, dy)
        nx = -dy / length
        ny = dx / length
        off = dim["offset"]
        da = (a[0] + nx * off, a[1] + ny * off)
        db = (b[0] + nx * off, b[1] + ny * off)
        d.line("A-ANNO", da, db)
        d.line("A-ANNO", a, da)
        d.line("A-ANNO", b, db)
        mid = ((da[0] + db[0]) / 2, (da[1] + db[1]) / 2)
        d.text("A-ANNO", dim["name"], (mid[0] - 5.6, mid[1] + 0.25), 0.45, math.degrees(math.atan2(dy, dx)))

    d.w(0, "ENDSEC")
    d.w(0, "EOF")
    (OUT_DIR / "professional-office-floorplan.dxf").write_text(d.build(), encoding="utf-8")


def svg_path(points: list[tuple[float, float]]) -> str:
    return " ".join(f"{x:.3f},{-y:.3f}" for x, y in points)


def write_svg() -> str:
    width = (SRC_RIGHT - SRC_LEFT) * FT_PER_SRC
    height = RIGHT_WALL_FT
    min_x = -4.0
    min_y = -height - 6.0
    vb_w = width + 10.0
    vb_h = height + 11.0

    parts = [
        f'<svg xmlns="http://www.w3.org/2000/svg" width="1800" height="1150" viewBox="{min_x:.3f} {min_y:.3f} {vb_w:.3f} {vb_h:.3f}">',
        '<rect x="-100" y="-100" width="300" height="300" fill="#ffffff"/>',
        '<style>text{font-family:Arial,Helvetica,sans-serif}.label{font-size:0.72px;font-weight:700;fill:#111827}.anno{font-size:0.46px;fill:#7c2d12}.wall{fill:#111827;stroke:#111827;stroke-width:.03}.thin{stroke:#111827;stroke-width:.11;fill:none}.door{stroke:#b91c1c;stroke-width:.11;fill:none}.glaz{stroke:#0369a1;stroke-width:.10;fill:none}.dim{stroke:#dc2626;stroke-width:.08;fill:none;stroke-dasharray:.35 .25}</style>',
    ]
    for wall in walls:
        parts.append(f'<polygon class="wall" points="{svg_path(wall_rect(wall["a"], wall["b"], wall["thickness"]))}"/>')
    for win in windows:
        a = math.radians(win["angle"])
        p1 = win["p"]
        p2 = (p1[0] + win["width"] * math.cos(a), p1[1] + win["width"] * math.sin(a))
        parts.append(f'<line class="glaz" x1="{p1[0]:.3f}" y1="{-p1[1]:.3f}" x2="{p2[0]:.3f}" y2="{-p2[1]:.3f}"/>')
    for door in doors:
        a = math.radians(door["angle"])
        hinge = door["p"]
        jamb = (hinge[0] + door["width"] * math.cos(a), hinge[1] + door["width"] * math.sin(a))
        leaf_ang = a - math.pi / 2
        leaf = (hinge[0] + door["width"] * math.cos(leaf_ang), hinge[1] + door["width"] * math.sin(leaf_ang))
        r = door["width"]
        large = 0
        sweep = 0
        parts.append(f'<line class="door" x1="{hinge[0]:.3f}" y1="{-hinge[1]:.3f}" x2="{leaf[0]:.3f}" y2="{-leaf[1]:.3f}"/>')
        parts.append(f'<line class="door" x1="{hinge[0]:.3f}" y1="{-hinge[1]:.3f}" x2="{jamb[0]:.3f}" y2="{-jamb[1]:.3f}"/>')
        parts.append(f'<path class="door" d="M {leaf[0]:.3f},{-leaf[1]:.3f} A {r:.3f},{r:.3f} 0 {large} {sweep} {jamb[0]:.3f},{-jamb[1]:.3f}"/>')
    for stair in stairs:
        parts.append(f'<polygon class="thin" points="{svg_path(stair["box"])}"/>')
        left, top, right, bottom = stair["box"][0][0], stair["box"][0][1], stair["box"][1][0], stair["box"][2][1]
        for i in range(1, 13):
            x = left + (right - left) * i / 13
            parts.append(f'<line class="thin" x1="{x:.3f}" y1="{-bottom:.3f}" x2="{x:.3f}" y2="{-top:.3f}"/>')
        parts.append(f'<line class="thin" x1="{left:.3f}" y1="{-(top + bottom) / 2:.3f}" x2="{right:.3f}" y2="{-(top + bottom) / 2:.3f}"/>')
    for label in labels:
        x, y = label["p"]
        text = escape(label["text"])
        rot = label["rotation"]
        transform = f' transform="rotate({-rot:.1f} {x:.3f} {-y:.3f})"' if rot else ""
        parts.append(f'<text class="label" x="{x:.3f}" y="{-y:.3f}" text-anchor="middle"{transform}>{text}</text>')
    for dim in dimensions:
        a = dim["a"]
        b = dim["b"]
        dx = b[0] - a[0]
        dy = b[1] - a[1]
        length = math.hypot(dx, dy)
        nx = -dy / length
        ny = dx / length
        off = dim["offset"]
        da = (a[0] + nx * off, a[1] + ny * off)
        db = (b[0] + nx * off, b[1] + ny * off)
        parts.append(f'<line class="dim" x1="{da[0]:.3f}" y1="{-da[1]:.3f}" x2="{db[0]:.3f}" y2="{-db[1]:.3f}"/>')
        mx, my = (da[0] + db[0]) / 2, (da[1] + db[1]) / 2
        parts.append(f'<text class="anno" x="{mx:.3f}" y="{-my - 0.28:.3f}" text-anchor="middle">{escape(dim["name"])}</text>')
    parts.append('<text class="anno" x="0" y="4.2">Scale note: right exterior wall fixed at 44.03 ft / 13.420 m; other dimensions derived proportionally from the image.</text>')
    parts.append("</svg>")
    svg = "\n".join(parts)
    (OUT_DIR / "professional-office-floorplan.svg").write_text(svg, encoding="utf-8")
    return svg


def write_png() -> None:
    width_ft = (SRC_RIGHT - SRC_LEFT) * FT_PER_SRC
    height_ft = RIGHT_WALL_FT
    scale = 18
    margin = 90
    img = Image.new("RGB", (int(width_ft * scale) + margin * 2, int(height_ft * scale) + margin * 2 + 80), "white")
    draw = ImageDraw.Draw(img)
    def get_font(size: int):
        try:
            return ImageFont.truetype("arial.ttf", size)
        except OSError:
            return ImageFont.load_default()

    small_font = get_font(11)

    def pp(p: tuple[float, float]) -> tuple[int, int]:
        return (round(margin + p[0] * scale), round(margin + (height_ft - p[1]) * scale))

    for wall in walls:
        draw.polygon([pp(p) for p in wall_rect(wall["a"], wall["b"], wall["thickness"])], fill=(17, 24, 39), outline=(0, 0, 0))
    for win in windows:
        a = math.radians(win["angle"])
        p1 = win["p"]
        p2 = (p1[0] + win["width"] * math.cos(a), p1[1] + win["width"] * math.sin(a))
        draw.line([pp(p1), pp(p2)], fill=(3, 105, 161), width=3)
    for door in doors:
        a = math.radians(door["angle"])
        hinge = door["p"]
        jamb = (hinge[0] + door["width"] * math.cos(a), hinge[1] + door["width"] * math.sin(a))
        leaf_ang = a - math.pi / 2
        leaf = (hinge[0] + door["width"] * math.cos(leaf_ang), hinge[1] + door["width"] * math.sin(leaf_ang))
        draw.line([pp(hinge), pp(leaf)], fill=(185, 28, 28), width=2)
        draw.line([pp(hinge), pp(jamb)], fill=(185, 28, 28), width=2)
    for stair in stairs:
        box = [pp(p) for p in stair["box"]]
        draw.polygon(box, outline=(17, 24, 39))
        left, top, right, bottom = stair["box"][0][0], stair["box"][0][1], stair["box"][1][0], stair["box"][2][1]
        for i in range(1, 13):
            x = left + (right - left) * i / 13
            draw.line([pp((x, bottom)), pp((x, top))], fill=(17, 24, 39), width=1)
    for label in labels:
        x, y = pp(label["p"])
        text = label["text"]
        font = get_font(max(9, round(label["size"] * 19)))
        bbox = draw.textbbox((x, y), text, font=font)
        draw.text((x - (bbox[2] - bbox[0]) / 2, y - (bbox[3] - bbox[1]) / 2), text, fill=(17, 24, 39), font=font)
    draw.text((margin, img.height - 55), "Scale note: right exterior wall fixed at 44.03 ft / 13.420 m; other dimensions derived proportionally.", fill=(124, 45, 18), font=small_font)
    draw.text((margin + int(width_ft * scale) + 20, margin + int(height_ft * scale / 2)), "44.03 ft", fill=(220, 38, 38), font=get_font(15))
    img.save(OUT_DIR / "professional-office-floorplan.png")


def write_project_json() -> None:
    project = {
        "scale": {
            "reference": "Right exterior wall",
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
    (OUT_DIR / "professional-office-floorplan.project.json").write_text(json.dumps(project, indent=2), encoding="utf-8")


def main() -> None:
    write_dxf()
    write_svg()
    write_png()
    write_project_json()
    right_height = line_len(pt(SRC_RIGHT, SRC_TOP), pt(SRC_RIGHT, SRC_BOTTOM))
    print(f"Wrote professional-office-floorplan.dxf")
    print(f"Wrote professional-office-floorplan.svg")
    print(f"Wrote professional-office-floorplan.png")
    print(f"Wrote professional-office-floorplan.project.json")
    print(f"Scale check: right exterior wall = {right_height:.2f} ft / {right_height * M_PER_FT:.3f} m")


if __name__ == "__main__":
    main()
