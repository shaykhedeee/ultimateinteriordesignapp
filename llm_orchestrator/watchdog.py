"""
Production Watchdog: quality gatekeeper for interior design outputs.
Enforces style constraints, spatial rules, and render brief sanity checks
before deliverables leave the pipeline.
"""
from __future__ import annotations
from dataclasses import dataclass, field
from typing import List, Dict, Any, Tuple


@dataclass
class WatchdogResult:
    passed: bool
    issues: List[str] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)
    score: float = 0.0


class ProductionWatchdog:
    """
    Hard gatekeeper. A design must clear all checks before it's marked production-ready.
    """

    MAX_OCCUPANCY_RATIO = 0.65
    MIN_WALKWAY = 0.8       # metres
    MAX_WALKWAY_RATIO = 0.35

    def validate_layout(self, *, room: Any, placed: List[Dict], room_area: float) -> WatchdogResult:
        issues: List[str] = []
        warnings: List[str] = []
        score = 100.0

        if not room:
            return WatchdogResult(passed=False, issues=["No room object supplied"], score=0)

        # 1) Walkway coverage
        if placed and room_area > 0:
            total_placed_area = sum(float(p.get("width", 0)) * float(p.get("depth", 0)) for p in placed)
            occupancy = total_placed_area / room_area
            if occupancy > self.MAX_OCCUPANCY_RATIO:
                msg = f"Room overcrowded ({occupancy*100:.0f}% floor occupied; max {self.MAX_OCCUPANCY_RATIO*100:.0f}%)"
                issues.append(msg)
                score -= 30
            elif occupancy > 0.5:
                warnings.append(f"Dense layout ({occupancy*100:.0f}% floor occupied)")
                score -= 10

        # 2) Piece-level walkway clearance
        too_close = self._clearance_violations(placed)
        if too_close:
            issues.append(f"Clearance violations between pieces: {too_close}")
            score -= 25

        passed = score >= 70 and not issues
        return WatchdogResult(passed=passed, issues=issues, warnings=warnings, score=round(score, 1))

    def validate_render_brief(self, brief: Dict[str, Any]) -> WatchdogResult:
        issues: List[str] = []
        warnings: List[str] = []
        score = 100.0
        pos = (brief.get("positive_prompt") or "").strip()
        neg = (brief.get("negative_prompt") or "").strip()
        if len(pos) < 20:
            issues.append("Render positive_prompt too short — likely to degrade quality")
            score -= 40
        if not neg:
            issues.append("Missing negative_prompt will produce artifacts")
            score -= 20
        if not brief.get("style"):
            warnings.append("style not set — default style will be used")
            score -= 5
        passed = score >= 60 and not issues
        return WatchdogResult(passed=passed, issues=issues, warnings=warnings, score=round(score, 1))

    def _clearance_violations(self, placed: List[Dict]) -> List[str]:
        violations = []
        n = len(placed)
        for i in range(n):
            for j in range(i + 1, n):
                # simplified AABB clearance check (no rotation)
                a, b = placed[i], placed[j]
                ax, ay, aw, ad = float(a["x"]), float(a["y"]), float(a["width"]), float(a["depth"])
                bx, by, bw, bd = float(b["x"]), float(b["y"]), float(b["width"]), float(b["depth"])
                # distance between centres
                cx1, cy1 = ax + aw / 2, ay + ad / 2
                cx2, cy2 = bx + bw / 2, by + bd / 2
                gap = max(abs(cx1 - cx2) - (aw + bw) / 2, abs(cy1 - cy2) - (ad + bd) / 2)
                if gap < self.MIN_WALKWAY:
                    violations.append(f"{a['name']} <-> {b['name']} gap={gap:.1f}m")
        return violations
