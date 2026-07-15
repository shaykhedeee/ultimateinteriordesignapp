import json
plan = json.load(open('output/c009_plan.json', encoding='utf-8'))
rooms = plan['rooms']; walls = plan['walls']; doors = plan['doors']
windows = plan['windows']; dims = plan['dimensions']
T = plan['wallThickness']
W = max(r['x']+r['w'] for r in rooms); H = max(r['y']+r['h'] for r in rooms)
SC = 1500 / W
MX = 300*SC   # left/right margin for north arrow + side dims
MB = 760     # bottom margin for title
A = W*SC + 2*MX; B = H*SC
parts = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{int(A)}" height="{int(B)+MB}" viewBox="0 0 {int(A)} {int(B)+MB}"><rect width="100%" height="100%" fill="#f6f3ec"/>']
def sx(x): return x*SC + MX
def sy(y): return (H - y)*SC
parts = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{int(A)}" height="{int(B)+700}" viewBox="0 0 {int(A)} {int(B)+700}"><rect width="100%" height="100%" fill="#f6f3ec"/>']
# filled walls (solid bars)
for wl in walls:
    x1,y1,x2,y2 = wl['x1'],wl['y1'],wl['x2'],wl['y2']
    if abs(x1-x2) < 1e-6:
        x0 = sx(x1)-T/2*SC
        parts.append(f'<rect x="{x0:.1f}" y="{sy(max(y1,y2)):.1f}" width="{T*SC:.1f}" height="{abs(sy(y1)-sy(y2)):.1f}" fill="#222"/>')
    else:
        y0 = sy(y1)-T/2*SC
        parts.append(f'<rect x="{sx(min(x1,x2)):.1f}" y="{y0:.1f}" width="{abs(sx(x1)-sx(x2)):.1f}" height="{T*SC:.1f}" fill="#222"/>')
# doors
for d in doors:
    hx,hy,w = d['hx'],d['hy'],d.get('width',900)
    parts.append(f'<line x1="{sx(hx):.1f}" y1="{sy(hy):.1f}" x2="{sx(hx+w):.1f}" y2="{sy(hy):.1f}" stroke="#c0392b" stroke-width="3"/>')
    cx,cy = sx(hx), sy(hy); r=w*SC
    parts.append(f'<path d="M {cx:.1f} {cy:.1f} A {r:.1f} {r:.1f} 0 0 1 {cx:.1f} {cy-r:.1f}" fill="none" stroke="#c0392b" stroke-width="2"/>')
# windows
for win in windows:
    x1,y1,x2,y2 = win['x1'],win['y1'],win['x2'],win['y2']
    parts.append(f'<line x1="{sx(x1):.1f}" y1="{sy(y1):.1f}" x2="{sx(x2):.1f}" y2="{sy(y2):.1f}" stroke="#16a085" stroke-width="5"/>')
# rooms
for r in rooms:
    cx = sx(r['x']+r['w']/2); cy = sy(r['y']+r['h']/2)
    parts.append(f'<text x="{cx:.1f}" y="{cy-r.get("h",1)*SC*0.11:.1f}" font-size="20" fill="#1a1a1a" text-anchor="middle" font-weight="bold" font-family="sans-serif">{r["label"]}</text>')
    parts.append(f'<text x="{cx:.1f}" y="{cy+r.get("h",1)*SC*0.11:.1f}" font-size="14" fill="#0e6b5e" text-anchor="middle" font-family="sans-serif">{(r.get("ftLabel","")+"  |  " if r.get("ftLabel") else "")}{int(r["w"])} x {int(r["h"])} mm</text>')
# dimensions
for dm in dims:
    x1,y1,x2,y2,lab,dr = dm['x1'],dm['y1'],dm['x2'],dm['y2'],dm['label'],dm['dir']
    off = dm.get('offset',-600)
    if dr=='h':
        yd = sy(y1)+off*SC
        parts.append(f'<line x1="{sx(x1):.1f}" y1="{yd:.1f}" x2="{sx(x2):.1f}" y2="{yd:.1f}" stroke="#7f8c8d" stroke-width="1.4"/>')
        parts.append(f'<line x1="{sx(x1):.1f}" y1="{sy(y1):.1f}" x2="{sx(x1):.1f}" y2="{yd:.1f}" stroke="#7f8c8d" stroke-width="1.4"/>')
        parts.append(f'<line x1="{sx(x2):.1f}" y1="{sy(y2):.1f}" x2="{sx(x2):.1f}" y2="{yd:.1f}" stroke="#7f8c8d" stroke-width="1.4"/>')
        parts.append(f'<text x="{(sx(x1)+sx(x2))/2:.1f}" y="{yd-8:.1f}" font-size="14" fill="#555" text-anchor="middle" font-family="sans-serif">{lab}</text>')
    else:
        xd = sx(x1)+off*SC
        parts.append(f'<line x1="{xd:.1f}" y1="{sy(y1):.1f}" x2="{xd:.1f}" y2="{sy(y2):.1f}" stroke="#7f8c8d" stroke-width="1.4"/>')
        parts.append(f'<line x1="{sx(x1):.1f}" y1="{sy(y1):.1f}" x2="{xd:.1f}" y2="{sy(y1):.1f}" stroke="#7f8c8d" stroke-width="1.4"/>')
        parts.append(f'<line x1="{sx(x2):.1f}" y1="{sy(y2):.1f}" x2="{xd:.1f}" y2="{sy(y2):.1f}" stroke="#7f8c8d" stroke-width="1.4"/>')
        parts.append(f'<text x="{xd-6:.1f}" y="{(sy(y1)+sy(y2))/2:.1f}" font-size="14" fill="#555" text-anchor="middle" transform="rotate(-90 {xd-6:.1f} {(sy(y1)+sy(y2))/2:.1f})" font-family="sans-serif">{lab}</text>')
# north arrow
nx, ny = sx(W)+120, sy(H)-120; ns=40
parts.append(f'<line x1="{nx}" y1="{ny}" x2="{nx-ns*0.6:.0f}" y2="{ny+ns*0.7:.0f}" stroke="#2980b9" stroke-width="2"/>')
parts.append(f'<line x1="{nx}" y1="{ny}" x2="{nx+ns*0.6:.0f}" y2="{ny+ns*0.7:.0f}" stroke="#2980b9" stroke-width="2"/>')
parts.append(f'<text x="{nx}" y="{ny-10:.0f}" font-size="20" fill="#2980b9" text-anchor="middle" font-family="sans-serif">N</text>')
# title
ty = B + 40
parts.append(f'<text x="20" y="{ty+24:.0f}" font-size="22" fill="#222" font-family="sans-serif" font-weight="bold">RECONSTRUCTED FLOOR PLAN C009</text>')
parts.append(f'<text x="20" y="{ty+50:.0f}" font-size="13" fill="#555" font-family="sans-serif">ALL DIMENSIONS IN MM | DRAWN TO SCALE (1 UNIT = 1 MM) | AC1009 / R12</text>')
parts.append('</svg>')
open('output/C009_premium_preview.svg','w',encoding='utf-8').write('\n'.join(parts))
print('preview svg written')
