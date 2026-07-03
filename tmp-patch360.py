from pathlib import Path
p = Path('frontend/src/screens/Render3DStudio.jsx')
s = p.read_text(encoding='utf-8')

if 'isGenerating360' not in s:
    s = s.replace(
        'function ThreeDWalkthrough({ projectId, cadDrawing, selectedLaminates, onLaminateChange, selectedRoomId, onSelectRoom }) {\n  const mountRef = React.useRef(null);\n',
        'function ThreeDWalkthrough({ projectId, cadDrawing, selectedLaminates, onLaminateChange, selectedRoomId, onSelectRoom }) {\n  const mountRef = React.useRef(null);\n  const [isGenerating360, setIsGenerating360] = React.useState(false);\n  const [panoramaUrl, setPanoramaUrl] = React.useState(null);\n',
        1
    )
    needle = '''          <button \n            onClick={() => setIsPlaying(false)} \n            aria-label="End walkthrough"\n            className="text-[9px] font-black uppercase tracking-wider bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200 px-2 py-1 rounded-lg transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]"\n          >End</button>\n        </div>\n'''
    insert = '''          <button \n            onClick={() => setIsPlaying(false)} \n            aria-label="End walkthrough"\n            className="text-[9px] font-black uppercase tracking-wider bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200 px-2 py-1 rounded-lg transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]"\n          >End</button>\n          <button\n            onClick={async () => {\n              try {\n                setIsGenerating360(true);\n                setPanoramaUrl(null);\n                const res = await fetch(`http://127.0.0.1:5055/api/projects/${projectId}/walkthrough/360`, { method: 'POST' });\n                const data = await res.json();\n                if (data?.panoramaUrl) setPanoramaUrl(data.panoramaUrl);\n              } catch (e) { console.error(e); } finally { setIsGenerating360(false); }\n            }}\n            aria-label="Generate 360 panorama"\n            className="text-[9px] font-black uppercase tracking-wider bg-[#D4AF37]/10 border border-[#D4AF37]/40 text-[#D4AF37] hover:bg-[#D4AF37]/20 px-2 py-1 rounded-lg transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]"\n          >{isGenerating360 ? 'Generating...' : '360 View'}</button>\n        </div>\n'''
    s = s.replace(needle, insert, 1)

    overlay = '''      </div>\n    </div>\n  );\n}\n\nexport default function Render3DStudio({ projectId, onComplete }) {'''
    overlay_new = '''      </div>\n      {panoramaUrl && (\n        <div className="absolute inset-0 z-30 bg-black/90">\n          <Viewer360 equirectImage={panoramaUrl} onClose={() => setPanoramaUrl(null)} />\n        </div>\n      )}\n    </div>\n  );\n}\n\nexport default function Render3DStudio({ projectId, onComplete }) {'''
    s = s.replace(overlay, overlay_new, 1)
    p.write_text(s, encoding='utf-8')
    print('patched')
else:
    print('already patched')
