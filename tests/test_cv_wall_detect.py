#!/usr/bin/env python3
"""Regression tests for server/services/cv-wall-detect.py pure geometry.

These run WITHOUT numpy/fitz/PIL present (the module lazy-imports deps and falls
back to a pure-Python path), proving the wall/opening detection logic works even
on a minimal box and emits clean JSON instead of crashing.

Run:  python3 tests/test_cv_wall_detect.py
"""
import importlib.util
import json
import subprocess
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
SCRIPT = REPO / "server" / "services" / "cv-wall-detect.py"


def load_module():
    spec = importlib.util.spec_from_file_location("cvwd", SCRIPT)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def test_runs_and_merge():
    m = load_module()
    assert m._runs([0, 1, 1, 0, 1, 1, 1, 0]) == [(1, 2), (4, 6)]
    assert m._merge([(1, 2), (3, 4)], 1) == [(1, 4)]
    assert m._merge([(1, 2), (5, 6)], 1) == [(1, 2), (5, 6)]


def test_detect_pure_wall_and_opening():
    m = load_module()
    H = W = 40
    edge = [[0] * W for _ in range(H)]
    for y in range(H):
        for x in range(19, 23):  # 4px-thick full-height vertical wall
            edge[y][x] = 1
    # 2-row gap near the middle -> an opening (door)
    for x in range(19, 23):
        edge[18][x] = 0
        edge[19][x] = 0
    seg, openings = m._detect_pure(edge, min_wall=5, open_gap=2)
    assert any(w["axis"] == "v" and abs(w["x1"] - 20) < 3 for w in seg), seg
    assert len(openings) >= 1, openings


def test_arg_parse_handles_space_and_equals_form():
    # --minwall 5 (space form) must not crash with IndexError
    res = subprocess.run(
        [sys.executable, str(SCRIPT), "nonexistent.png", "--minwall", "5", "--opengap", "20"],
        capture_output=True, text=True,
    )
    assert res.returncode == 3, (res.returncode, res.stderr)
    payload = json.loads(res.stdout)
    assert payload.get("success") is False
    assert payload.get("source") == "local-cv"

    # missing-file path still yields clean JSON (not a traceback)
    res2 = subprocess.run(
        [sys.executable, str(SCRIPT), "does-not-exist.png"],
        capture_output=True, text=True,
    )
    assert res2.returncode == 3
    assert json.loads(res2.stdout).get("success") is False


if __name__ == "__main__":
    test_runs_and_merge()
    test_detect_pure_wall_and_opening()
    test_arg_parse_handles_space_and_equals_form()
    print("cv-wall-detect tests PASS")
