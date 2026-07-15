import sys, os
sys.path.insert(0, 'C:/Users/USER/Documents/Muskans autocad solution/THE ULTIMATE INTERIOR DESIGN APPLICATION/server')
# We can't import the ESM module in python; instead we generate the plan JSON here and
# produce the DXF via a Node script. This file just defines the geometry (single source of truth).

# ---- Geometry: UNIT PLAN C 009 (mm) ----
# Envelope uses the reconciled printed dims; top row 3353+1524+3048 = 7925 = 26'0" living length.
T = 150  # wall thickness (cleaner than 230 for a redraw)
W_TOP = 7925
STRIP = 1367            # right service strip (utility) width
W = 9118                # 3353+1524+3048 (top) and 3353+1524+2438+1803 (bottom) tile exactly
TOP_H = 4470             # M. Bedroom 01 height (10'0" x 14'8")
LIV_H = 3353             # Living/Dining height (26'0" x 11'0")
BOT_H = 3048             # bottom zone height (10'0")
H = TOP_H + LIV_H + BOT_H
Y_LIV0, Y_LIV1 = BOT_H, BOT_H + LIV_H
Y_TOP0 = BOT_H + LIV_H

plan = {"wallThickness": T, "walls": [], "rooms": [], "doors": [], "windows": [], "dimensions": [], "titleBlock": {}}

def hwall(x1, x2, y):
    plan["walls"].append({"x1": x1, "y1": y, "x2": x2, "y2": y})
def vwall(x, y1, y2):
    plan["walls"].append({"x1": x, "y1": y1, "x2": x, "y2": y2})

# Outer envelope
hwall(0, W, 0); hwall(0, W, H); vwall(0, 0, H); vwall(W, 0, H)
# Top zone partitions (full-width split so M.Bedroom-01 is enclosed)
vwall(3353, Y_TOP0, H); vwall(4877, Y_TOP0, H); hwall(0, W, Y_TOP0)
# Living divider
hwall(0, W, Y_LIV0)
# Bottom zone partitions
vwall(3353, 0, BOT_H); vwall(4877, 0, BOT_H); vwall(7315, 0, BOT_H)
# Balcony partition (left of living)
vwall(1575, Y_LIV0, Y_LIV1)

# Rooms (cx, cy, w, h, label, ftLabel)
def room(x, y, w, h, label, ft):
    plan["rooms"].append({"x": x, "y": y, "w": w, "h": h,
                           "cx": x + w/2, "cy": y + h/2, "label": label, "ftLabel": ft})

room(0, Y_TOP0, 3353, 3048, "BEDROOM - 03", "11'0\" x 10'0\"")
room(3353, Y_TOP0, 1524, 2286, "TOILET", "5'0\" x 7'6\"")
room(4877, Y_TOP0, W_TOP-4877, TOP_H, "M. BEDROOM - 01", "10'0\" x 14'8\"")
room(0, Y_LIV0, W_TOP, LIV_H, "LIVING / DINING", "26'0\" x 11'0\"")
room(0, 0, 3353, BOT_H, "BEDROOM - 02", "11'0\" x 10'0\"")
room(3353, 0, 1524, 2286, "TOILET", "4'6\" x 7'6\"")
room(4877, 0, 7315-4877, BOT_H, "KITCHEN", "8'0\" x 10'0\"")
room(7315, 0, 1803, 1499, "UTILITY", "5'11\" x 4'11\"")
room(0, Y_LIV0, 1575, 3251, "BALCONY", "5'2\" x 10'8\"")

# Doors (hx, hy = hinge point on wall, width = leaf)
plan["doors"] += [
    {"hx": 3353, "hy": Y_TOP0+800, "width": 900},   # B03
    {"hx": 4877, "hy": Y_TOP0+800, "width": 900},   # Toilet(top)
    {"hx": 6000, "hy": Y_TOP0, "width": 900},       # MB01 into living
    {"hx": 1575, "hy": Y_LIV0+1500, "width": 900},  # Balcony into living
    {"hx": 3353, "hy": 800, "width": 900},          # B02
    {"hx": 4877, "hy": 800, "width": 900},          # Toilet(bottom)
    {"hx": 7315, "hy": 1500, "width": 900},         # Kitchen
    {"hx": W, "hy": Y_LIV0+1500, "width": 1000},    # West entry
]
# Windows (x1,y1)-(x2,y2) along wall
plan["windows"] += [
    {"x1": 6000, "y1": H, "x2": 7500, "y2": H},     # MB01 top wall
    {"x1": 0, "y1": Y_TOP0+1200, "x2": 0, "y2": Y_TOP0+2400},  # B03 left
    {"x1": 0, "y1": 1200, "x2": 0, "y2": 2400},     # B02 left
    {"x1": W, "y1": 800, "x2": W, "y2": 2000},      # Utility right
]
# Dimensions
plan["dimensions"] += [
    {"x1": 0, "y1": H, "x2": W, "y2": H, "label": str(W), "dir": "h", "offset": -700},
    {"x1": 0, "y1": 0, "x2": 0, "y2": H, "label": str(H), "dir": "v", "offset": -700},
    {"x1": 0, "y1": Y_TOP0, "x2": 3353, "y2": Y_TOP0, "label": "3353", "dir": "h", "offset": -420},
    {"x1": 3353, "y1": Y_TOP0, "x2": 4877, "y2": Y_TOP0, "label": "1524", "dir": "h", "offset": -420},
    {"x1": 4877, "y1": Y_TOP0, "x2": W_TOP, "y2": Y_TOP0, "label": str(W_TOP-4877), "dir": "h", "offset": -420},
    {"x1": W_TOP, "y1": Y_TOP0, "x2": W, "y2": Y_TOP0, "label": str(W-W_TOP), "dir": "h", "offset": -420},
    {"x1": 0, "y1": Y_LIV0, "x2": W, "y2": Y_LIV0, "label": str(W), "dir": "h", "offset": 420},
    {"x1": 0, "y1": 0, "x2": 3353, "y2": 0, "label": "3353", "dir": "h", "offset": -420},
    {"x1": 3353, "y1": 0, "x2": 4877, "y2": 0, "label": "1524", "dir": "h", "offset": -420},
    {"x1": 4877, "y1": 0, "x2": 7315, "y2": 0, "label": str(7315-4877), "dir": "h", "offset": -420},
    {"x1": 7315, "y1": 0, "x2": W, "y2": 0, "label": str(W-7315), "dir": "h", "offset": -420},
]
plan["titleBlock"] = {"x": -200, "y": -400, "w": W+400, "h": H+800, "_extW": W, "_extH": H}

import json
with open("output/c009_plan.json", "w", encoding="utf-8") as f:
    json.dump(plan, f, indent=0)
print("plan json written, envelope", W, "x", H, "rooms", len(plan["rooms"]), "doors", len(plan["doors"]), "windows", len(plan["windows"]))
