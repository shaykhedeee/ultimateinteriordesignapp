from pathlib import Path
p = Path('frontend/src/screens/Render3DStudio.jsx')
s = p.read_text(encoding='utf-8')
needle = '''          >Fast</button>\n          <button \n            onClick={() => setIsPlaying(false)} \n            aria-label="End walkthrough"\n            className="text-[9px] font-black uppercase tracking-wider bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200 px-2 py-1 rounded-lg transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]"\n          >End</button>\n        </div>\n'''
insert = '''          >Fast</button>\n          <button\n            onClick={async () => {\n              try {\n                setIsGenerating360(true)\n                setPanoramaUrl(null)\n                const endpoint=`http://127.0.0.1:5055/api/projects/${projectId}/walkthrough/360`\n                const res=await fetch(endpoint,{method:'POST'})\n                const data=await res.json()\n                if (data?.panoramaUrl) setPanoramaUrl(data.panoramaUrl)\n              } catch (e) { console.error(e) } finally { setIsGenerating360(false) }\n            }}\n            aria-label="Generate 360 panorama"\n            className="text-[9px] font-black uppercase tracking-wider bg-[#D4AF37]/10 border border-[#D4AF37]/40 text-[#D4AF37] hover:bg-[#D4AF37]/20 px-2 py-1 rounded-lg transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]"\n          >{isGenerating360?'Generating...':'360 View'}</button>\n          <button \n            onClick={() => { setIsPlaying(false); }} \n            aria-label="End walkthrough"\n            className="text-[9px] font-black uppercase tracking-wider bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200 px-2 py-1 rounded-lg transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]"\n          >End</button>\n        </div>\n'''
if needle in s and 'walkthrough/360' not in s:
    s = s.replace(needle, insert, 1)
    p.write_text(s, encoding='utf-8')
    print('inserted 360 button')
else:
    print('button pattern already present or not found')
