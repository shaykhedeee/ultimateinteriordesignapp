"""Render an SVG preview of the plan using the SAME geometry as gen_dxf.py, then convert to PNG via sharp."""
import os
T = 230
W = 9292; TOP_H=4470; LIV_H=3353; BOT_H=3048; H = TOP_H+LIV_H+BOT_H
Y_LIV0, Y_LIV1 = BOT_H, BOT_H+LIV_H
Y_TOP0 = BOT_H+LIV_H

# We'll build SVG in a flipped Y (svg y down). scale to fit ~1400px wide.
SCALE = 1400 / W
def sx(x): return x*SCALE
def sy(y): return (H - y)*SCALE   # flip

parts = []
parts.append(f'<svg xmlns="http://www.w3.org/2000/svg" width="{int(W*SCALE)}" height="{int(H*SCALE)}" viewBox="0 0 {int(W*SCALE)} {int(H*SCALE)}">')
parts.append('<rect width="100%" height="100%" fill="#f4f1ea"/>')

def wall(x1,y1,x2,y2):
    if x1==x2:
        dx=T/2*SCALE
        return f'<rect x="{sx(x1)-dx:.1f}" y="{min(sy(y1),sy(y2)):.1f}" width="{2*dx:.1f}" height="{abs(sy(y1)-sy(y2)):.1f}" fill="#222"/>'
    else:
        dy=T/2*SCALE
        return f'<rect x="{min(sx(x1),sx(x2)):.1f}" y="{sy(y1)-dy:.1f}" width="{abs(sx(x1)-sx(x2)):.1f}" height="{2*dy:.1f}" fill="#222"/>'

def door_arc(x1,y1,x2,y2,t0,t1,gap):
    ax,ay=x1+(x2-x1)*t0, y1+(y2-y1)*t0
    bx,by=x1+(x2-x1)*t1, y1+(y2-y1)*t1
    s=f'{wall(x1,y1,ax,ay)}{wall(bx,by,x2,y2)}'
    # arc
    cx,cy=sx(ax),sy(ay); r=gap*SCALE
    s+=f'<path d="M {cx:.1f} {cy:.1f} A {r:.1f} {r:.1f} 0 0 1 {cx:.1f} {cy-r:.1f}" fill="none" stroke="#c0392b" stroke-width="2"/>'
    s+=f'<line x1="{cx:.1f}" y1="{cy:.1f}" x2="{sx(bx):.1f}" y2="{sy(by):.1f}" stroke="#c0392b" stroke-width="2"/>'
    return s

def window(x1,y1,x2,y2,t0,t1):
    ax,ay=x1+(x2-x1)*t0, y1+(y2-y1)*t0
    bx,by=x1+(x2-x1)*t1, y1+(y2-y1)*t1
    s=f'{wall(x1,y1,ax,ay)}{wall(bx,by,x2,y2)}'
    # 3-line window symbol (glass + two jambs)
    s+=f'<line x1="{sx(ax):.1f}" y1="{sy(ay):.1f}" x2="{sx(bx):.1f}" y2="{sy(by):.1f}" stroke="#16a085" stroke-width="3.5"/>'
    ox=(y2-y1); oy=-(x2-x1); L=((ox**2+oy**2)**0.5) or 1; ox,oy=ox/L*22,oy/L*22
    s+=f'<line x1="{sx(ax)+ox:.1f}" y1="{sy(ay)+oy:.1f}" x2="{sx(bx)+ox:.1f}" y2="{sy(by)+oy:.1f}" stroke="#16a085" stroke-width="1.4"/>'
    s+=f'<line x1="{sx(ax)-ox:.1f}" y1="{sy(ay)-oy:.1f}" x2="{sx(bx)-ox:.1f}" y2="{sy(by)-oy:.1f}" stroke="#16a085" stroke-width="1.4"/>'
    return s

def dim_h(x1,y,x2,off=600):
    yd=sy(y)-off*SCALE
    cx1,cy1=sx(x1),sy(y); cx2,cy2=sx(x2),sy(y)
    s=f'<line x1="{cx1:.1f}" y1="{yd:.1f}" x2="{cx2:.1f}" y2="{yd:.1f}" stroke="#7f8c8d" stroke-width="1.2"/>'
    s+=f'<line x1="{cx1:.1f}" y1="{cy1:.1f}" x2="{cx1:.1f}" y2="{yd:.1f}" stroke="#7f8c8d" stroke-width="1.2"/>'
    s+=f'<line x1="{cx2:.1f}" y1="{cy2:.1f}" x2="{cx2:.1f}" y2="{yd:.1f}" stroke="#7f8c8d" stroke-width="1.2"/>'
    s+=f'<text x="{(cx1+cx2)/2:.1f}" y="{yd-6:.1f}" font-size="11" fill="#555" text-anchor="middle">{int(abs(x2-x1))}</text>'
    return s

def dim_v(x,y1,y2,off=600):
    xd=sx(x)-off*SCALE
    cx,cy1=sx(x),sy(y1); cx2,cy2=sx(x),sy(y2)
    s=f'<line x1="{xd:.1f}" y1="{cy1:.1f}" x2="{xd:.1f}" y2="{cy2:.1f}" stroke="#7f8c8d" stroke-width="1.2"/>'
    s+=f'<line x1="{cx:.1f}" y1="{cy1:.1f}" x2="{xd:.1f}" y2="{cy1:.1f}" stroke="#7f8c8d" stroke-width="1.2"/>'
    s+=f'<line x1="{cx2:.1f}" y1="{cy2:.1f}" x2="{xd:.1f}" y2="{cy2:.1f}" stroke="#7f8c8d" stroke-width="1.2"/>'
    s+=f'<text x="{xd-5:.1f}" y="{(cy1+cy2)/2:.1f}" font-size="11" fill="#555" text-anchor="middle" transform="rotate(-90 {xd-5:.1f} {(cy1+cy2)/2:.1f})">{int(abs(y2-y1))}</text>'
    return s

def label(cx,cy,name,size):
    s=f'<text x="{sx(cx):.1f}" y="{sy(cy)-4:.1f}" font-size="14" fill="#1a1a1a" text-anchor="middle" font-family="sans-serif" font-weight="bold">{name}</text>'
    s+=f'<text x="{sx(cx):.1f}" y="{sy(cy)+16:.1f}" font-size="11" fill="#0e6b5e" text-anchor="middle" font-family="sans-serif">{size}</text>'
    return s

# Outer walls
parts.append(wall(0,0,W,0)); parts.append(wall(0,H,W,H)); parts.append(wall(0,0,0,H)); parts.append(wall(W,0,W,H))
# Top zone
parts.append(wall(3353,Y_TOP0,3353,H)); parts.append(wall(4877,Y_TOP0,4877,H)); parts.append(wall(0,Y_TOP0,7925,Y_TOP0))
# Living divider
parts.append(wall(0,Y_LIV0,W,Y_LIV0))
# Bottom zone
parts.append(wall(3353,0,3353,BOT_H)); parts.append(wall(4877,0,4877,BOT_H)); parts.append(wall(7315,0,7315,BOT_H))
# Balcony partition
parts.append(wall(1575,Y_LIV0,1575,Y_LIV1))

# Doors
parts.append(door_arc(3353,Y_TOP0,3353,H,0.55,0.80,900))
parts.append(door_arc(4877,Y_TOP0,4877,H,0.55,0.80,900))
parts.append(door_arc(4877,Y_TOP0,7925,Y_TOP0,0.10,0.30,900))
parts.append(door_arc(1575,Y_LIV0,1575,Y_LIV1,0.40,0.65,900))
parts.append(door_arc(3353,0,3353,BOT_H,0.55,0.80,900))
parts.append(door_arc(4877,0,4877,BOT_H,0.55,0.80,800))
parts.append(door_arc(7315,0,7315,BOT_H,0.50,0.75,900))
parts.append(door_arc(W,Y_LIV0,W,Y_LIV1,0.40,0.65,1000))
# Windows
parts.append(window(0,H,W,H,0.62,0.82))
parts.append(window(0,Y_TOP0,0,H,0.30,0.50))
parts.append(window(0,0,0,BOT_H,0.30,0.50))
parts.append(window(7315,0,W,0,0.20,0.45))

# Labels
parts.append(label(3353/2,(Y_TOP0+H)/2,'BEDROOM - 03',"11'0\" x 10'0\""))
parts.append(label((3353+4877)/2,(Y_TOP0+H)/2,'TOILET',"5'0\" x 7'6\""))
parts.append(label((4877+W)/2,(Y_TOP0+H)/2,'M. BEDROOM - 01',"10'0\" x 14'8\""))
parts.append(label(W/2,(Y_LIV0+Y_LIV1)/2,'LIVING / DINING',"26'0\" x 11'0\""))
parts.append(label(3353/2,BOT_H/2,'BEDROOM - 02',"11'0\" x 10'0\""))
parts.append(label((3353+4877)/2,BOT_H/2,'TOILET',"4'6\" x 7'6\""))
parts.append(label((4877+7315)/2,BOT_H/2,'KITCHEN',"8'0\" x 10'0\""))
parts.append(label((7315+W)/2,BOT_H/2,'UTILITY',"5'11\" x 4'11\""))
parts.append(label(1575/2,(Y_LIV0+Y_LIV1)/2,'BALCONY',"5'2\" x 10'8\""))

# Dims
parts.append(dim_h(0,H,W,900)); parts.append(dim_v(0,0,H,900))
parts.append(dim_h(0,Y_TOP0,3353,500)); parts.append(dim_h(3353,Y_TOP0,4877,500)); parts.append(dim_h(4877,Y_TOP0,7925,500)); parts.append(dim_h(7925,Y_TOP0,W,500))
parts.append(dim_v(0,Y_LIV0,Y_LIV1,500))
parts.append(dim_h(0,BOT_H,3353,500)); parts.append(dim_h(3353,BOT_H,4877,500)); parts.append(dim_h(4877,BOT_H,7315,500)); parts.append(dim_h(7315,BOT_H,W,500))

# Title
parts.append(f'<text x="{sx(W/2):.1f}" y="{sy(H)+22:.1f}" font-size="18" fill="#222" text-anchor="middle" font-weight="bold" font-family="sans-serif">UNIT PLAN C 009</text>')

parts.append('</svg>')
os.makedirs('output',exist_ok=True)
open('output/C009_preview.svg','w',encoding='utf-8').write('\n'.join(parts))
print('SVG written')
