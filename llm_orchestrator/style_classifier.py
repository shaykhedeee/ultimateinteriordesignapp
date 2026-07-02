"""
Style classifier: maps room context + client references to an interior style
and material palette, plus renders a structured 'style brief' usable by the
authoring / render pipeline.
"""
from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import Dict, List, Optional

try:
    from llm_orchestrator.spatial_reasoning import DESIGN_STYLES, RoomType
except ImportError:
    from spatial_reasoning import DESIGN_STYLES, RoomType  # type: ignore


@dataclass
class StyleSuggestion:
    style_id: str
    name: str
    confidence: float
    reasons: List[str]
    palette: Dict[str, List[str]]
    materials: List[str]
    lighting_temperature: str
    formality: float


class StyleClassifier:
    def __init__(self):
        self.styles = DESIGN_STYLES

    def classify(self, *, room_type: Optional[RoomType] = None,
                 budget_level: str = "medium",
                 reference_text: Optional[str] = None,
                 org_type: str = "residential") -> List[StyleSuggestion]:
        tokens = re.findall(r"[A-Za-z]+", (reference_text or "").lower())
        scores: Dict[str, float] = {k: 0.0 for k in self.styles}
        mapping = {
            "modern": "modern_minimal",
            "minimal": "modern_minimal",
            "loft": "industrial_loft",
            "industrial": "industrial_loft",
            "scandi": "scandinavian",
            "scandinavian": "scandinavian",
            "mid_century": "mid_century_modern",
            "midcentury": "mid_century_modern",
            "mcm": "mid_century_modern",
            "traditional": "indian_traditional",
            "classic": "indian_traditional",
            "indian": "indian_traditional",
            "temple": "indian_traditional",
            "mandir": "indian_traditional",
            "teak": "mid_century_modern",
            "brass": "indian_traditional",
            "granite": "indian_traditional",
            "marble": "indian_traditional",
        }
        for tok in tokens:
            if tok in mapping:
                scores[mapping[tok]] += 2.0
            for sid, style in self.styles.items():
                for kw in style.materials + style.colors:
                    if kw.replace("_", " ") == tok or kw == tok:
                        scores[sid] += 0.5

        # room-type priors
        if room_type == RoomType.POOJA:
            scores["indian_traditional"] += 3.0
        if room_type in (RoomType.LIVING_ROOM, RoomType.DINING):
            scores["mid_century_modern"] += 0.5
        if room_type == RoomType.OFFICE:
            scores["industrial_loft"] += 0.5

        ranked = sorted(scores.items(), key=lambda x: (-x[1], x[0]))[:5]
        out: List[StyleSuggestion] = []
        for sid, sc in ranked:
            s = self.styles[sid]
            out.append(StyleSuggestion(
                style_id=sid,
                name=s.name,
                confidence=round(min(sc / 6.0, 1.0), 2),
                reasons=[f"matched keywords in references"] if sc > 0 else ["fallback"],
                palette={"primary": s.colors[:3], "accent": s.colors[3:6]},
                materials=s.materials,
                lighting_temperature=s.lighting_temperature,
                formality=s.formality,
            ))
        return out or [self._fallback()]

    def _fallback(self) -> StyleSuggestion:
        s = self.styles["modern_minimal"]
        return StyleSuggestion(style_id="modern_minimal", name=s.name, confidence=0.0,
                               reasons=["fallback"], palette={"primary": s.colors[:3], "accent": s.colors[3:]},
                               materials=s.materials, lighting_temperature=s.lighting_temperature,
                               formality=s.formality)
