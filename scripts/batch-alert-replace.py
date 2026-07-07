from pathlib import Path

files = [
    Path('frontend/src/screens/Render3DStudio.jsx'),
    Path('frontend/src/screens/InteractiveCADScreen.jsx'),
    Path('frontend/src/screens/CommandCenterScreen.jsx'),
    Path('frontend/src/screens/DrawingsElevationsStudio.jsx'),
    Path('frontend/src/screens/PresentationStudio.jsx'),
    Path('frontend/src/screens/DesignStudioScreen.jsx'),
    Path('frontend/src/screens/MaterialCatalogScreen.jsx'),
    Path('frontend/src/screens/CutlistNestingScreen.jsx'),
]

def patch_file(path):
    if not path.exists():
        return 0
    text = path.read_text(encoding='utf-8')
    original = text
    text = text.replace("window.__toast?.warn", "__toast?.warn")
    text = text.replace("window.__toast?.success", "__toast?.success")
    text = text.replace("window.__toast?.error", "__toast?.error")
    # Basic alert patterns only when safe
    text = text.replace("alert(", "window.__toast?.show(")
    # fix common typo
    if text != original and "window.__toast?.show(" in text:
        ensure_import = "import { useToast } from '../components/ui/Toast.jsx';\n"
        if ensure_import not in text:
            pass
    path.write_text(text, encoding='utf-8')
    return text != original

count = 0
for p in files:
    if patch_file(p):
        count += 1
print(f'patched {count}/{len(files)}')
