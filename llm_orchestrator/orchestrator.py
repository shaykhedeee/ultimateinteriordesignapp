"""
Enhanced AI Interior Design Orchestrator
========================================
- Full PDA (Parser → Deriver → Authoring) shell
- Integrated self-improving LLM trainer
- Render stage integration
- Furniture catalog integration
- Production watchdog gatekeeper
- Full multi-room batch support
"""

from __future__ import annotations

import sys
import os
import json
import time
import math
from dataclasses import dataclass, field, asdict
from typing import Any, Dict, List, Optional

try:
    from llm_orchestrator.spatial_reasoning import (
        Point2D, Room, RoomType, DESIGN_STYLES, SpatialReasoner, FurnitureCategory, FurniturePiece,
        polygon_centroid,
    )
    from llm_orchestrator.style_classifier import StyleClassifier
    from llm_orchestrator.watchdog import ProductionWatchdog
    from llm_orchestrator.tiny_llm_trainer import InteriorDesignLLMTrainer, TrainingExample
except ImportError:
    from spatial_reasoning import (  # type: ignore
        Point2D, Room, RoomType, DESIGN_STYLES, SpatialReasoner, FurnitureCategory, FurniturePiece,
        polygon_centroid,
    )
    from style_classifier import StyleClassifier  # type: ignore
    from watchdog import ProductionWatchdog  # type: ignore
    from tiny_llm_trainer import InteriorDesignLLMTrainer, TrainingExample  # type: ignore


@dataclass
class ProjectState:
    project_id: str
    client_name: str
    style: str = "modern_minimal"
    floor_plan: Optional[Dict] = None
    rooms: Dict[str, Dict] = field(default_factory=dict)
    placed_furniture: Dict[str, List[Dict]] = field(default_factory=dict)
    renders: List[Dict] = field(default_factory=list)
    deliverables: List[Dict] = field(default_factory=list)
    status: str = "created"


class HermesOllamaLLM:
    def __init__(self, model: str = "deepseek-r1:8b", host: str = "127.0.0.1:11434"):
        self.model = model
        self.host = host

    def generate(self, prompt: str, system_prompt: str = "", temperature: float = 0.7) -> str:
        try:
            import requests
            r = requests.post(
                f"http://{self.host}/api/generate",
                json={
                    "model": self.model,
                    "prompt": prompt,
                    "system": system_prompt or "",
                    "options": {"temperature": temperature},
                },
                timeout=120,
            )
            r.raise_for_status()
            return r.json().get("response", "")
        except Exception:
            return ""


class InteriorDesignOrchestrator:
    """
    P: Parse raw inputs (floor plan, images, prompts)
    D: Derive factual layout from rules + spatial reasoning
    A: Author render briefs, deliverables, proposals
    + loop: learn from verdicts via self-training
    """

    def __init__(
        self,
        llm: Optional[HermesOllamaLLM] = None,
        trainer: Optional[InteriorDesignLLMTrainer] = None,
    ):
        self.llm = llm or HermesOllamaLLM()
        self.spatial = SpatialReasoner()
        self.style = StyleClassifier()
        self.watchdog = ProductionWatchdog()
        self.trainer = trainer or InteriorDesignLLMTrainer()
        self.projects: Dict[str, ProjectState] = {}

    # ------------------------------------------------------------------
    # Project lifecycle
    # ------------------------------------------------------------------
    def create_project(self, client_name: str, style: str = "modern_minimal") -> ProjectState:
        pid = f"proj_{int(time.time())}_{client_name.replace(' ','_').lower()}"
        proj = ProjectState(project_id=pid, client_name=client_name, style=style)
        self.projects[pid] = proj
        return proj

    # ------------------------------------------------------------------
    # P: Parser
    # ------------------------------------------------------------------
    def ingest_floor_plan(self, project_id: str, src: Dict[str, Any]) -> Dict[str, Any]:
        proj = self.projects[project_id]
        proj.status = "ingesting"
        proj.floor_plan = src
        out: List[Room] = []
        for raw in src.get("rooms", []):
            poly = [Point2D(float(p["x"]), float(p["y"])) for p in raw["corners"]]
            n = len(poly)
            area = 0.0
            for i in range(n):
                area += poly[i].x * poly[(i + 1) % n].y - poly[(i + 1) % n].x * poly[i].y
            area = abs(area) / 2.0
            cx = sum(p.x for p in poly) / n
            cy = sum(p.y for p in poly) / n
            rt = raw.get("room_type", "unknown")
            room_type = RoomType(rt) if rt in [e.value for e in RoomType] else RoomType.UNKNOWN
            room = Room(
                id=str(raw["id"]),
                name=str(raw.get("name", rt)),
                room_type=room_type,
                polygon=poly,
                walls=[],
                center=Point2D(cx, cy),
                area=area,
            )
            out.append(room)
        proj.rooms = {
            room.id: {
                "id": room.id,
                "name": room.name,
                "room_type": room.room_type.value,
                "area": round(room.area, 2),
                "polygon": [{"x": p.x, "y": p.y} for p in room.polygon],
                "center": {"x": room.center.x, "y": room.center.y},
            }
            for room in out
        }
        proj.status = "floor_plan_ready"
        return {"project_id": project_id, "rooms": proj.rooms}

    # ------------------------------------------------------------------
    # D: Deriver (layout + QA)
    # ------------------------------------------------------------------
    def generate_layout(self, project_id: str, room_id: str, style_override: Optional[str] = None) -> Dict[str, Any]:
        proj = self.projects[project_id]
        room_dict = proj.rooms[room_id]
        polygon = [Point2D(float(p["x"]), float(p["y"])) for p in room_dict["polygon"]]
        cx = float(room_dict["center"]["x"])
        cy = float(room_dict["center"]["y"])
        try:
            rt = RoomType(room_dict["room_type"])
        except Exception:
            rt = RoomType.UNKNOWN
        room = Room(
            id=room_dict["id"],
            name=room_dict["name"],
            room_type=rt,
            polygon=polygon,
            walls=[],
            center=Point2D(cx, cy),
            area=float(room_dict["area"]),
        )
        style = style_override or proj.style
        recs = self.spatial.recommend_furniture_for_room(room, style)
        placed = self.spatial.optimize_placement(room, recs)
        serialized = [
            {
                "id": p.piece.id,
                "name": p.piece.name,
                "x": round(p.x, 2),
                "y": round(p.y, 2),
                "rotation": round(p.rotation, 2),
                "width": p.piece.width,
                "depth": p.piece.depth,
                "confidence": round(p.confidence, 2),
                "reason": p.reason,
            }
            for p in placed
        ]
        proj.placed_furniture.setdefault(room_id, []).extend(serialized)
        # record for LLM training
        self.trainer.record_layout_decision(
            room_type=room.room_type.value,
            style=style,
            placed=serialized,
            verdict="pending",
        )
        return {
            "project_id": project_id,
            "room_id": room_id,
            "style": style,
            "placed_furniture": serialized,
        }

    def run_qa(self, project_id: str, room_id: str) -> Dict[str, Any]:
        proj = self.projects[project_id]
        room_dict = proj.rooms[room_id]
        polygon = [Point2D(float(p["x"]), float(p["y"])) for p in room_dict["polygon"]]
        try:
            rt = RoomType(room_dict["room_type"])
        except Exception:
            rt = RoomType.UNKNOWN
        room = Room(
            id=room_dict["id"],
            name=room_dict["name"],
            room_type=rt,
            polygon=polygon,
            walls=[],
            center=Point2D(
                float(room_dict["center"]["x"]),
                float(room_dict["center"]["y"]),
            ),
            area=float(room_dict["area"]),
        )
        # Rebuild furniture objects from serialized placement
        placed_objs: List[Any] = []
        for p in proj.placed_furniture.get(room_id, []):
            piece = self.spatial.furniture_library.get(p["id"]) or FurniturePiece(
                id=p["id"],
                name=p["name"],
                category=FurnitureCategory.TABLE,
                width=p["width"],
                depth=p["depth"],
                height=0.5,
            )
            placed_objs.append(
                type("PlacedObj", (), {
                    "piece": piece,
                    "x": p["x"],
                    "y": p["y"],
                    "rotation": p.get("rotation", 0.0),
                })()
            )
        warnings = self.spatial.validate_design(room, [])
        room_watch = self.watchdog.validate_layout(
            room=room,
            placed=proj.placed_furniture.get(room_id, []),
            room_area=room.area,
        )
        verdict = "warn" if (warnings or room_watch.warnings) else "pass"
        if room_watch.issues:
            verdict = "fail"
        # remember verdict for training
        self.trainer.record_layout_decision(
            room_type=room.room_type.value,
            style=proj.style,
            placed=proj.placed_furniture.get(room_id, []),
            verdict=verdict,
        )
        return {
            "project_id": project_id,
            "room_id": room_id,
            "room_type": room.room_type.value,
            "area_m2": round(room.area, 1),
            "spatial_warnings": warnings,
            "watchdog_warnings": room_watch.warnings,
            "watchdog_issues": room_watch.issues,
            "watchdog_score": room_watch.score,
            "final_verdict": verdict,
            "qa_passed": verdict == "pass",
        }

    # ------------------------------------------------------------------
    # A: Author (render briefs, deliverables)
    # ------------------------------------------------------------------
    def _author_render_brief(self, project: ProjectState, room_id: str, room_dict: Dict) -> Dict[str, Any]:
        style_obj = DESIGN_STYLES.get(project.style, DESIGN_STYLES["modern_minimal"])
        rt = room_dict.get("room_type", "room")
        area = room_dict.get("area", 0)
        placed = project.placed_furniture.get(room_id, [])
        positives = (
            f"Photorealistic interior photo of a {rt} ({area:.1f} sqm). "
            f"Style: {style_obj.name}. "
            f"Palette: {', '.join(style_obj.colors)}. "
            f"Materials: {', '.join(style_obj.materials)}. "
            f"Lighting: {style_obj.lighting_temperature}. "
            "Architectural Digest style, 8k, f/2.8, 50mm prime lens, shot on pro camera. "
            f"Furniture: {', '.join(item['name'] for item in placed) if placed else 'professionally staged'}."
        )
        brief = {
            "kind": "RenderBrief",
            "project_id": project.project_id,
            "room_id": room_id,
            "style": project.style,
            "positive_prompt": positives,
            "negative_prompt": (
                "blurry, distorted furniture, impossible walls, floating objects, "
                "cropped, cartoonish, watermark, text, logo, extra limbs, deformed"
            ),
            "aspect_ratio": "16:9" if rt in ("living_room", "dining") else "4:3",
            "resolution": "1024x576" if rt in ("living_room", "dining") else "1024x768",
            "placed_furniture": placed,
        }
        project.renders.append(brief)
        return brief

    def add_render_briefs(self, project_id: str) -> Dict[str, Any]:
        proj = self.projects[project_id]
        briefs = []
        for room_id, room_dict in proj.rooms.items():
            brief = self._author_render_brief(proj, room_id, room_dict)
            briefs.append(brief)
        return {"project_id": project_id, "render_briefs": briefs}

    # ------------------------------------------------------------------
    # Export / training status
    # ------------------------------------------------------------------
    def export(self, project_id: str) -> Dict[str, Any]:
        proj = self.projects[project_id]
        return {
            "project_id": project_id,
            "client_name": proj.client_name,
            "style": proj.style,
            "rooms": proj.rooms,
            "placed_furniture": proj.placed_furniture,
            "renders": proj.renders,
            "deliverables": proj.deliverables,
            "status": proj.status,
        }

    def get_training_status(self) -> Dict[str, Any]:
        return self.trainer.get_status()

    def start_background_training(self, interval_seconds: int = 600) -> Dict[str, Any]:
        return self.trainer.start_daemon(interval_seconds=interval_seconds)

    def stop_background_training(self) -> Dict[str, Any]:
        return self.trainer.stop_daemon()
