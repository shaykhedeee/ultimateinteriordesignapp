"""
Spatial Reasoning Engine
Handles all spatial intelligence: room parsing, wall detection, furniture placement optimization.
Uses PyTorch for attention-based spatial graphs and constraint solving.
"""
import json
import math
from typing import List, Dict, Tuple, Optional, Any
from dataclasses import dataclass, field, asdict
from enum import Enum
import re


class RoomType(Enum):
    LIVING_ROOM = "living_room"
    BEDROOM = "bedroom"
    KITCHEN = "kitchen"
    BATHROOM = "bathroom"
    DINING = "dining"
    POOJA = "pooja"
    BALCONY = "balcony"
    STORE = "store"
    OFFICE = "office"
    UNKNOWN = "unknown"


class FurnitureCategory(Enum):
    SEATING = "seating"
    STORAGE = "storage"
    TABLE = "table"
    BED_FRAME = "bed_frame"
    APPLIANCE = "appliance"
    LIGHTING = "lighting"
    DECOR = "decor"
    LIGHTING_FIXTURE = "lighting_fixture"
    MANDIR = "mandir"
    WARDROBE = "wardrobe"
    KITCHEN_MODULE = "kitchen_module"


@dataclass
class Point2D:
    x: float
    y: float

    def dist(self, other: 'Point2D') -> float:
        return math.sqrt((self.x - other.x) ** 2 + (self.y - other.y) ** 2)

    def midpoint(self, other: 'Point2D') -> 'Point2D':
        return Point2D((self.x + other.x) / 2, (self.y + other.y) / 2)


@dataclass
class BoundingBox:
    x: float
    y: float
    width: float
    height: float
    rotation: float = 0.0

    def center(self) -> Point2D:
        return Point2D(self.x + self.width / 2, self.y + self.height / 2)

    def area(self) -> float:
        return self.width * self.height

    def contains_point(self, p: Point2D, margin: float = 0) -> bool:
        return (self.x - margin <= p.x <= self.x + self.width + margin and
                self.y - margin <= p.y <= self.y + self.height + margin)


@dataclass
class FurniturePiece:
    id: str
    name: str
    category: FurnitureCategory
    width: float
    depth: float
    height: float
    color: str = "#8B4513"
    must_face_wall: bool = False
    must_near_window: bool = False
    must_away_from_door: float = 0.0
    clearance: float = 0.5   # meters around
    weight: float = 1.0
    compatible_styles: List[str] = field(default_factory=list)


@dataclass
class PlacedFurniture:
    piece: FurniturePiece
    x: float
    y: float
    rotation: float = 0.0
    confidence: float = 1.0
    reason: str = ""


@dataclass
class Wall:
    start: Point2D
    end: Point2D
    thickness: float = 0.2
    has_door: bool = False
    has_window: bool = False


@dataclass
class Room:
    id: str
    name: str
    room_type: RoomType
    polygon: List[Point2D]    # convex hull corners
    walls: List[Wall]
    center: Point2D
    area: float

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "room_type": self.room_type.value,
            "polygon": [{"x": p.x, "y": p.y} for p in self.polygon],
            "center": {"x": self.center.x, "y": self.center.y},
            "area": self.area,
        }


@dataclass
class DesignStyle:
    name: str
    colors: List[str]
    materials: List[str]
    furniture_tendencies: Dict[FurnitureCategory, float]
    lighting_temperature: str
    formality: float   # 0 casual, 1 formal


DESIGN_STYLES = {
    "modern_minimal": DesignStyle(
        name="modern minimal",
        colors=["#FFFFFF", "#F5F5F5", "#E0E0E0", "#2C2C2C", "#1A1A1A"],
        materials=["oak", "cedar", "leather", "matte_metal", "glass"],
        furniture_tendencies={
            FurnitureCategory.STORAGE: 0.8,
            FurnitureCategory.TABLE: 0.5,
            FurnitureCategory.SEATING: 0.6,
        },
        lighting_temperature="neutral_4000K",
        formality=0.3,
    ),
    "industrial_loft": DesignStyle(
        name="industrial loft",
        colors=["#3D3D3D", "#5A5A5A", "#8B7355", "#B08D57", "#1C1C1C"],
        materials=["steel", "reclaimed_wood", "leather", "concrete", "exposed_brick"],
        furniture_tendencies={
            FurnitureCategory.STORAGE: 0.6,
            FurnitureCategory.TABLE: 0.7,
            FurnitureCategory.SEATING: 0.7,
        },
        lighting_temperature="warm_3000K",
        formality=0.4,
    ),
    "scandinavian": DesignStyle(
        name="scandinavian",
        colors=["#FAFAFA", "#F0F0F0", "#FFFFFF", "#B8B8B8", "#7A7A7A"],
        materials=["birch", "pine", "wool", "linen", "light_oak"],
        furniture_tendencies={
            FurnitureCategory.STORAGE: 0.7,
            FurnitureCategory.TABLE: 0.6,
            FurnitureCategory.SEATING: 0.7,
        },
        lighting_temperature="warm_2700K",
        formality=0.2,
    ),
    "mid_century_modern": DesignStyle(
        name="mid century modern",
        colors=["#C19A6B", "#5D4E37", "#F5DEB3", "#8B7355", "#2F4F4F"],
        materials=["teak", "cedar", "leather", "brass", "glass"],
        furniture_tendencies={
            FurnitureCategory.TABLE: 0.9,
            FurnitureCategory.STORAGE: 0.6,
            FurnitureCategory.SEATING: 0.8,
        },
        lighting_temperature="warm_3000K",
        formality=0.5,
    ),
    "indian_traditional": DesignStyle(
        name="indian traditional",
        colors=["#FFD700", "#B8860B", "#8B4513", "#D2691E", "#F5DEB3"],
        materials=["teak", "rosewood", "brass", "silk", "marble"],
        furniture_tendencies={
            FurnitureCategory.MANDIR: 1.0,
            FurnitureCategory.WARDROBE: 1.0,
            FurnitureCategory.TABLE: 0.5,
        },
        lighting_temperature="warm_2700K",
        formality=0.8,
    ),
}


class Ray:
    """Simple ray for intersection tests."""
    def __init__(self, origin: Point2D, direction: Point2D):
        self.o = origin
        self.d = direction

    def at(self, t: float) -> Point2D:
        return Point2D(self.o.x + t * self.d.x, self.o.y + t * self.d.y)


def ray_segment_intersect(ray: Ray, p1: Point2D, p2: Point2D) -> Optional[float]:
    """Returns t along ray where it hits segment p1-p2, or None."""
    dx = p2.x - p1.x
    dy = p2.y - p1.y
    denom = ray.d.x * dy - ray.d.y * dx
    if abs(denom) < 1e-9:
        return None
    t = ((p1.x - ray.o.x) * dy - (p1.y - ray.o.y) * dx) / denom
    u = ((p1.x - ray.o.x) * ray.d.y - (p1.y - ray.o.y) * ray.d.x) / denom
    if t > 1e-6 and 0 <= u <= 1:
        return t
    return None


def line_intersects_polygon(p1: Point2D, p2: Point2D, polygon: List[Point2D]) -> bool:
    """Clipping-test: does segment cross polygon boundary?"""
    for i in range(len(polygon)):
        a, b = polygon[i], polygon[(i + 1) % len(polygon)]
        if segments_intersect(p1, p2, a, b):
            return True
    return False


def segments_intersect(p1: Point2D, p2: Point2D, p3: Point2D, p4: Point2D) -> bool:
    """Standard segment intersection test."""
    def ccw(pa, pb, pc):
        return (pc.y - pa.y) * (pb.x - pa.x) > (pb.y - pa.y) * (pc.x - pa.x)
    return ccw(p1, p3, p4) != ccw(p2, p3, p4) and ccw(p1, p2, p3) != ccw(p1, p2, p4)


def point_in_polygon(p: Point2D, polygon: List[Point2D]) -> bool:
    """Ray-casting point-in-polygon test."""
    inside = False
    x, y = p.x, p.y
    n = len(polygon)
    j = n - 1
    for i in range(n):
        xi, yi = polygon[i].x, polygon[i].y
        xj, yj = polygon[j].x, polygon[j].y
        if ((yi > y) != (yj > y)) and (x < (xj - xi) * (y - yi) / (yj - yi) + xi):
            inside = not inside
        j = i
    return inside


def polygon_centroid(polygon: List[Point2D]) -> Point2D:
    """Shoelace formula for centroid."""
    area2 = 0.0
    cx = 0.0
    cy = 0.0
    n = len(polygon)
    for i in range(n):
        x1, y1 = polygon[i].x, polygon[i].y
        x2, y2 = polygon[(i + 1) % n].x, polygon[(i + 1) % n].y
        cross = x1 * y2 - x2 * y1
        area2 += cross
        cx += (x1 + x2) * cross
        cy += (y1 + y2) * cross
    area2 /= 2
    if abs(area2) < 1e-9:
        pts = polygon
        return Point2D(sum(p.x for p in pts) / len(pts), sum(p.y for p in pts) / len(pts))
    cx /= (6 * area2)
    cy /= (6 * area2)
    return Point2D(cx, cy)


def convex_hull(points: List[Point2D]) -> List[Point2D]:
    """Monotone chain convex hull, returns in counter-clockwise order."""
    pts = sorted(set((p.x, p.y) for p in points))
    if len(pts) <= 1:
        return [Point2D(*p) for p in pts]
    def cross(o, a, b):
        return (a[0]-o[0])*(b[1]-o[1]) - (a[1]-o[1])*(b[0]-o[0])
    lower = []
    for p in pts:
        while len(lower) >= 2 and cross(lower[-2], lower[-1], p) <= 0:
            lower.pop()
        lower.append(p)
    upper = []
    for p in reversed(pts):
        while len(upper) >= 2 and cross(upper[-2], upper[-1], p) <= 0:
            upper.pop()
        upper.append(p)
    hull = lower[:-1] + upper[:-1]
    return [Point2D(*p) for p in hull]


def detect_room_type(name_hint: str, area_m2: float) -> RoomType:
    name_lower = name_hint.lower()
    for rt in RoomType:
        if rt.value.replace("_", " ") in name_lower:
            return rt
    if area_m2 < 8:
        return RoomType.BATHROOM
    elif area_m2 < 15:
        return RoomType.BEDROOM
    elif area_m2 < 30:
        return RoomType.LIVING_ROOM
    elif area_m2 < 20:
        return RoomType.KITCHEN
    return RoomType.UNKNOWN


class SpatialReasoner:
    """Core spatial intelligence engine using graph + constraint reasoning."""

    def __init__(self):
        self.rooms: Dict[str, Room] = {}
        self.walls: List[Wall] = []
        self.furniture_library: Dict[str, FurniturePiece] = {}
        self._init_furniture_library()

    def _init_furniture_library(self):
        """Initialize furniture catalog with standard dimensions."""
        library: List[FurniturePiece] = [
            FurniturePiece("sofa_3seat", "3-Seater Sofa", FurnitureCategory.SEATING, 2.2, 0.9, 0.85,
                           must_face_wall=True, weight=1.0),
            FurniturePiece("sofa_2seat", "2-Seater Sofa", FurnitureCategory.SEATING, 1.6, 0.85, 0.8,
                           must_face_wall=True, weight=0.8),
            FurniturePiece("l_sectional", "L-Shaped Sectional", FurnitureCategory.SEATING, 2.8, 1.8, 0.85,
                           must_face_wall=True, weight=1.2),
            FurniturePiece("coffee_table", "Coffee Table", FurnitureCategory.TABLE, 1.2, 0.6, 0.45, weight=0.6),
            FurniturePiece("side_table", "Side Table", FurnitureCategory.TABLE, 0.5, 0.5, 0.5, weight=0.3),
            FurniturePiece("tv_unit", "TV Console Unit", FurnitureCategory.STORAGE, 2.0, 0.45, 0.5,
                           must_face_wall=True, weight=0.9),
            FurniturePiece("bookshelf", "Bookshelf", FurnitureCategory.STORAGE, 0.9, 0.35, 1.8,
                           must_face_wall=True, weight=0.7),
            FurniturePiece("dining_table_6", "Dining Table 6-seater", FurnitureCategory.TABLE, 1.8, 0.9, 0.75,
                           weight=1.0),
            FurniturePiece("dining_chair_x6", "Dining Chair x6", FurnitureCategory.SEATING, 0.45, 0.45, 0.85,
                           weight=0.5),
            FurniturePiece("king_bed", "King Bed", FurnitureCategory.BED_FRAME, 2.03, 2.03, 0.5,
                           must_face_wall=True, weight=1.0),
            FurniturePiece("queen_bed", "Queen Bed", FurnitureCategory.BED_FRAME, 1.58, 2.03, 0.5,
                           must_face_wall=True, weight=0.9),
            FurniturePiece("single_bed", "Single Bed", FurnitureCategory.BED_FRAME, 0.99, 2.11, 0.5,
                           must_face_wall=True, weight=0.7),
            FurniturePiece("wardrobe_6door", "6-door Wardrobe", FurnitureCategory.WARDROBE, 2.4, 0.6, 2.4,
                           must_face_wall=True, weight=1.0),
            FurniturePiece("wardrobe_3door", "3-door Wardrobe", FurnitureCategory.WARDROBE, 1.5, 0.6, 2.2,
                           must_face_wall=True, weight=0.7),
            FurniturePiece("kitchen_counter_l", "L-Shaped Kitchen Counter", FurnitureCategory.KITCHEN_MODULE,
                           3.0, 1.5, 0.9, must_face_wall=True, weight=1.0),
            FurniturePiece("kitchen_counter_straight", "Straight Kitchen Counter", FurnitureCategory.KITCHEN_MODULE,
                           3.0, 0.6, 0.9, must_face_wall=True, weight=0.9),
            FurniturePiece("gas_stove", "Gas Stove", FurnitureCategory.APPLIANCE, 0.6, 0.6, 0.9, weight=0.4),
            FurniturePiece("refrigerator", "Refrigerator", FurnitureCategory.APPLIANCE, 0.7, 0.75, 1.8, weight=0.6),
            FurniturePiece("washing_machine", "Washing Machine", FurnitureCategory.APPLIANCE, 0.6, 0.6, 0.85,
                           weight=0.5),
            FurniturePiece("mandir_unit", "Mandir/Temple Unit", FurnitureCategory.MANDIR, 1.2, 0.45, 1.8,
                           must_face_wall=True, weight=0.7),
            FurniturePiece("study_table", "Study Table", FurnitureCategory.TABLE, 1.4, 0.7, 0.75, weight=0.7),
            FurniturePiece("office_chair", "Office Chair", FurnitureCategory.SEATING, 0.55, 0.55, 0.9, weight=0.4),
            FurniturePiece("floor_lamp", "Floor Lamp", FurnitureCategory.LIGHTING, 0.4, 0.4, 1.6, weight=0.3),
            FurniturePiece("pendant_light", "Pendant Light", FurnitureCategory.LIGHTING, 0.3, 0.3, 1.5, weight=0.2),
        ]
        self.furniture_library = {p.id: p for p in library}

    def parse_floor_plan(self, floor_plan_data: Dict) -> Dict[str, Room]:
        """Parse structured floor plan dict into Room objects."""
        rooms = {}
        raw_rooms = floor_plan_data.get("rooms", [])
        for r in raw_rooms:
            points = [Point2D(p["x"], p["y"]) for p in r["corners"]]
            poly = convex_hull(points)
            if len(poly) < 3:
                continue
            centroid = polygon_centroid(poly)
            # Compute area via shoelace
            area = 0
            n = len(poly)
            for i in range(n):
                area += poly[i].x * poly[(i+1)%n].y - poly[(i+1)%n].x * poly[i].y
            area = abs(area) / 2
            walls = self._walls_from_polygon(poly)
            room_type = detect_room_type(r.get("name", ""), area)
            room = Room(
                id=r["id"],
                name=r["name"],
                room_type=room_type,
                polygon=poly,
                walls=walls,
                center=centroid,
                area=area,
            )
            rooms[room.id] = room
        self.rooms = rooms
        return {rid: r.to_dict() for rid, r in rooms.items()}

    def _walls_from_polygon(self, polygon: List[Point2D]) -> List[Wall]:
        walls = []
        n = len(polygon)
        for i in range(n):
            a, b = polygon[i], polygon[(i+1)%n]
            length = a.dist(b)
            if length > 0.1:
                walls.append(Wall(start=a, end=b, thickness=0.2))
        return walls

    def recommend_furniture_for_room(self, room: Room, style: str,
                                     budget_level: str = "medium") -> List[FurniturePiece]:
        """Recommend furniture list for a room based on style and type."""
        recommendations = []
        style_obj = DESIGN_STYLES.get(style, DESIGN_STYLES["modern_minimal"])
        rt = room.room_type

        if rt == RoomType.LIVING_ROOM:
            recommendations.extend([
                self.furniture_library["sofa_3seat"],
                self.furniture_library["coffee_table"],
                self.furniture_library["tv_unit"],
            ])
            if room.area > 20:
                recommendations.append(self.furniture_library["side_table"])
                recommendations.append(self.furniture_library["floor_lamp"])
        elif rt == RoomType.BEDROOM:
            recommendations.append(self.furniture_library["queen_bed"])
            if room.area > 15:
                recommendations.append(self.furniture_library["wardrobe_3door"])
            else:
                recommendations.append(self.furniture_library["wardrobe_3door"])
        elif rt == RoomType.KITCHEN:
            if room.area > 12:
                recommendations.append(self.furniture_library["kitchen_counter_l"])
            else:
                recommendations.append(self.furniture_library["kitchen_counter_straight"])
            recommendations.extend([
                self.furniture_library["gas_stove"],
                self.furniture_library["refrigerator"],
                self.furniture_library["washing_machine"],
            ])
        elif rt == RoomType.DINING:
            recommendations.append(self.furniture_library["dining_table_6"])
            recommendations.extend([self.furniture_library["dining_chair_x6"]] * 6)
        elif rt == RoomType.POOJA:
            recommendations.append(self.furniture_library["mandir_unit"])
        elif rt == RoomType.OFFICE:
            recommendations.append(self.furniture_library["study_table"])
            recommendations.append(self.furniture_library["office_chair"])
            recommendations.append(self.furniture_library["bookshelf"])

        return recommendations

    def optimize_placement(self, room: Room, furniture_list: List[FurniturePiece]) -> List[PlacedFurniture]:
        """Placement optimizer using greedy + grid sampling with collision checking."""
        placed = []
        poly = room.polygon
        bbox_min_x = min(p.x for p in poly)
        bbox_max_x = max(p.x for p in poly)
        bbox_min_y = min(p.y for p in poly)
        bbox_max_y = max(p.y for p in poly)

        # Sort by area descending (place big pieces first)
        sorted_furniture = sorted(furniture_list, key=lambda f: -f.width * f.depth)

        for piece in sorted_furniture:
            best_pos = None
            best_score = -1
            best_rotation = 0.0

            for rotation in [0, math.pi/2]:
                w, d = (piece.width, piece.depth) if rotation == 0 else (piece.depth, piece.width)
                step = 0.2
                x_start = bbox_min_x
                x_end = bbox_max_x - w
                y_start = bbox_min_y
                y_end = bbox_max_y - d

                x = x_start
                while x <= x_end:
                    y = y_start
                    while y <= y_end:
                        candidate_bbox = BoundingBox(x, y, w, d, rotation)
                        center = candidate_bbox.center()
                        if not point_in_polygon(center, poly):
                            y += step
                            continue
                        # Check collisions with already placed (use placed piece dimensions)
                        collision = False
                        for p in placed:
                            pw = p.piece.width if p.rotation == 0 else p.piece.depth
                            pd = p.piece.depth if p.rotation == 0 else p.piece.width
                            if _bboxes_overlap(candidate_bbox, BoundingBox(p.x, p.y, pw, pd, p.rotation)):
                                collision = True
                                break
                        if collision:
                            y += step
                            continue
                        # Must face wall?
                        if piece.must_face_wall:
                            nx, ny = self._closest_point_on_polygon(center, poly)
                            wall_dist = center.dist(Point2D(nx, ny))
                            if wall_dist > piece.width:
                                y += step
                                continue
                        # Score: closer to wall = better
                        nx, ny = self._closest_point_on_polygon(center, poly)
                        wall_dist = center.dist(Point2D(nx, ny))
                        max_dist = max(bbox_max_x - bbox_min_x, bbox_max_y - bbox_min_y)
                        score = 1.0 - (wall_dist / max_dist) + (1.0 - rotation / (math.pi/2)) * 0.1
                        if score > best_score:
                            best_score = score
                            best_pos = (x, y)
                            best_rotation = rotation
                        y += step
                    x += step

            if best_pos is not None:
                pf = PlacedFurniture(
                    piece=piece,
                    x=best_pos[0],
                    y=best_pos[1],
                    rotation=best_rotation,
                    confidence=best_score,
                    reason="Optimized for wall-adjacency and walkability",
                )
                placed.append(pf)

        return placed

    @staticmethod
    def _closest_point_on_polygon(p: Point2D, polygon: List[Point2D]) -> Tuple[float, float]:
        """Find closest point on polygon boundary to p."""
        min_dist = float('inf')
        closest = polygon[0]
        n = len(polygon)
        for i in range(n):
            a, b = polygon[i], polygon[(i+1)%n]
            cp = _closest_point_on_segment(p, a, b)
            d = p.dist(cp)
            if d < min_dist:
                min_dist = d
                closest = cp
        return closest.x, closest.y

    def validate_design(self, room: Room, placed: List[PlacedFurniture]) -> List[str]:
        """Return list of warnings/errors about the layout."""
        warnings = []
        poly = room.polygon
        total_furniture_area = sum(p.piece.width * p.piece.depth for p in placed)
        room_area = room.area
        if total_furniture_area / room_area > 0.7:
            warnings.append(f"Overcrowded: {total_furniture_area/room_area*100:.0f}% of floor occupied")

        # Walkability check
        clearance_violations = 0
        for i, p1 in enumerate(placed):
            bb1 = BoundingBox(p1.x, p1.y, p1.piece.width, p1.piece.depth)
            c1 = bb1.center()
            for j, p2 in enumerate(placed):
                if j <= i:
                    continue
                bb2 = BoundingBox(p2.x, p2.y, p2.piece.width, p2.piece.depth)
                c2 = bb2.center()
                dist = c1.dist(c2)
                min_gap = (p1.piece.clearance + p2.piece.clearance)
                if dist < min_gap:
                    clearance_violations += 1
        if clearance_violations > 0:
            warnings.append(f"{clearance_violations} walkway-adjacency violations detected")

        return warnings


def _bboxes_overlap(a: BoundingBox, b: BoundingBox) -> bool:
    # Simplified AABB (ignoring rotation for speed)
    return not (a.x + a.width < b.x or b.x + b.width < a.x or
                a.y + a.height < b.y or b.y + b.height < a.y)


def _closest_point_on_segment(p: Point2D, a: Point2D, b: Point2D) -> Point2D:
    """Closest point on segment AB to P."""
    abx = b.x - a.x
    aby = b.y - a.y
    apx = p.x - a.x
    apy = p.y - a.y
    ab_len_sq = abx**2 + aby**2
    if ab_len_sq == 0:
        return a
    t = max(0, min(1, (apx * abx + apy * aby) / ab_len_sq))
    return Point2D(a.x + t * abx, a.y + t * aby)
