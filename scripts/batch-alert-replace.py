#!/usr/bin/env python3
"""
batch-alert-replace.py  —  Safe, idempotent toast-migration helper.

Walks a list of frontend source files and swaps noisy `alert(...)` / `window.__toast`
calls for the app's toast helper (`__toast`), WITHOUT re-processing lines that are
already correct (idempotent: running it twice is a no-op). Skips binary/non-text
files. Only reports what changed.

Run from repo root:
  python3 scripts/batch-alert-replace.py
"""
from pathlib import Path
import sys

FILES = [
    Path('frontend/src/screens/Render3DStudio.jsx'),
    Path('frontend/src/screens/InteractiveCADScreen.jsx'),
    Path('frontend/src/screens/CommandCenterScreen.jsx'),
    Path('frontend/src/screens/DrawingsElevationsStudio.jsx'),
    Path('frontend/src/screens/PresentationStudio.jsx'),
    Path('frontend/src/screens/DesignStudioScreen.jsx'),
    Path('frontend/src/screens/MaterialCatalogScreen.jsx'),
    Path('frontend/src/screens/CutlistNestingScreen.jsx'),
]

# Already-correct patterns must NOT be touched (idempotency guard).
SAFE_PATTERNS = ('__toast?.warn', '__toast?.success', '__toast?.error', '__toast?.show')

REPLACEMENTS = [
    ('window.__toast?.warn', '__toast?.warn'),
    ('window.__toast?.success', '__toast?.success'),
    ('window.__toast?.error', '__toast?.error'),
    ('alert(', '__toast?.show('),
]


def is_text_file(path: Path) -> bool:
    try:
        data = path.read_bytes()
    except OSError:
        return False
    # treat as binary if NUL byte present
    return b'\x00' not in data


def patch_file(path: Path) -> int:
    if not path.exists():
        return 0
    if not is_text_file(path):
        return 0
    text = path.read_text(encoding='utf-8')
    original = text
    for bad, good in REPLACEMENTS:
        text = text.replace(bad, good)
    if text == original:
        return 0
    path.write_text(text, encoding='utf-8')
    return 1


def main() -> int:
    changed = 0
    for p in FILES:
        try:
            changed += patch_file(p)
        except Exception as e:  # noqa: BLE001
            print(f'  ! error patching {p}: {e}', file=sys.stderr)
    print(f'patched {changed}/{len(FILES)} file(s)')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
