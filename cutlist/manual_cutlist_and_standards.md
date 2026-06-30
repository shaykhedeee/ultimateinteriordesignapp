# Manual Cutlist Generation & Indian Modular Standards

This document establishes the structural standards, materials, and mathematical formulas used to generate cutlists for modular furniture in the Indian interior design space. It contains precise equations for joints, backing recesses, and edgebanding deductions, accompanied by concrete worked examples.

---

## 1. Indian Modular Furniture Standards

In India, modular kitchens and wardrobes are designed around specific ergonomic requirements, appliance dimensions, and hardware availability.

### A. Standard Carcass Dimensions (Millimeters)

| Cabinet Type | Height (Finished) | Depth (Without Shutter) | Standard Widths |
| :--- | :--- | :--- | :--- |
| **Base Cabinet** | 720 mm | 560 mm | 150, 200, 300, 450, 500, 600, 800, 900, 1050 mm |
| **Wall / Overhead**| 600, 720, 900 mm | 300 mm | 300, 450, 500, 600, 800, 900 mm |
| **Tall / Pantry** | 1950, 2100 mm | 560 mm | 450, 600 mm |
| **Wardrobe Carcass**| 2100, 2400 mm | 560 or 600 mm | 450, 600, 900, 1050, 1200 mm |

*   **The 720 mm Standard:** The 720 mm base height is standard because:
    *   **Plinth (Legs):** 100 mm or 150 mm PVC/Aluminum adjustable legs are added below.
    *   **Countertop:** 40 mm thick granite or engineered quartz slab is laid on top.
    *   **Total Counter Height:** $720 + 100 + 40 = 860\text{ mm}$ (approx. 34 inches) or $720 + 150 + 40 = 910\text{ mm}$ (approx. 36 inches), which fits the average height of Indian homeowners.
*   **The 560 mm Depth Standard:** A 560 mm carcass depth + 18 mm shutter = 578 mm. This fits perfectly under a standard 600 mm (24-inch) stone countertop, leaving a 22 mm overhang drip-edge.

---

## 2. Standard Materials & Sheet Sizes in India

Modular production in India heavily relies on panel products. Unlike Western countries where particle board is dominant, the Indian market prefers plywood due to high moisture levels and heavy usage.

### A. Core Materials
1.  **BWP/BWR Plywood (Boiling Water Proof/Resistant):** The premium standard for kitchen base cabinets (sink and hob zones). Generally made of Gurjan or Eucalyptus cores.
2.  **HDMR (High-Density Moisture Resistant):** Green panel boards (like Action TESA HDMR) are highly popular for wall cabinets and dry kitchen carcass because they are moisture-resistant and cost-effective.
3.  **PLPB (Pre-Laminated Particle Board):** Used in budget wardrobe interiors.
4.  **MDF (Medium Density Fiberboard):** Primarily used for shutters with membrane or PU lacquer finishes.

### B. Standard Sheet Dimensions
In India, the universal sheet size is **8 feet by 4 feet (2440 mm × 1220 mm)**.
*   **Carcass Thickness:** **18 mm** is the industry standard for all load-bearing panels (Sides, Bottom, Top Rails, Shelves).
*   **Backing Panel:** **6 mm** or **9 mm** plywood. 9 mm is preferred by high-end designers for structural rigidity.
*   **Shutter Thickness:** **18 mm** or **22 mm** (for acrylic or routed PU doors).

---

## 3. Structural Assembly & Joinery Math

To generate an automated cutlist, we must map the joinery logic. The standard Indian modular carcass uses the **Standard Butt-Joint (Sides sandwich bottom and top rails)**.

```
       +---------------------------------------------+   <-- Top Rail / Top Solid Panel
       |                                             |
  +----+                                             +----+
  |    |                                             |    |
  |    |                                             |    |
  | L  |                                             | R  |
  | I  |                                             | I  |
  | M  |                                             | M  |
  | I  |                                             | I  |
  | T  |                                             | T  |
  |    |                                             |    |
  |    |                                             |    |
  +----+                                             +----+
       |                                             |
       +---------------------------------------------+   <-- Bottom Panel
```

### A. The Core Joint Formulas
Let:
*   $W = \text{Overall Cabinet Width}$
*   $H = \text{Overall Cabinet Height}$
*   $D = \text{Overall Cabinet Depth (excluding shutter)}$
*   $T = \text{Material Thickness (typically 18 mm)}$
*   $T_{back} = \text{Backing Material Thickness (typically 9 mm or 6 mm)}$
*   $D_{groove} = \text{Depth of the groove in side panels for recessed back (typically 6 mm to 8 mm depth)}$
*   $Offset_{back} = \text{Recess offset from the back edge (typically 12 mm to 16 mm)}$

#### 1. Side Panels (Left & Right Sides) - 2 Nos.
Side panels run full height and full depth.
$$\text{Height}_{side} = H$$
$$\text{Width}_{side} = D$$

#### 2. Bottom Panel - 1 No.
The bottom panel is sandwiched between the sides. Therefore, its width must be reduced by the thickness of both side panels.
$$\text{Width}_{bottom} = W - (2 \times T)$$
$$\text{Depth}_{bottom} = D$$
*(Note: If the backing panel is inserted into a groove, the bottom panel depth must be reduced as well. See backing detail below).*

#### 3. Top Rails (Stretcher Rails) - 2 Nos. (Front and Back)
Instead of a solid top panel, base cabinets use 100mm wide structural rails to save material and facilitate countertop installation.
$$\text{Length}_{rail} = W - (2 \times T)$$
$$\text{Width}_{rail} = 100\text{ mm}$$

#### 4. Adjustable Shelves - $N$ Nos.
Shelves must be slightly narrower than the internal carcass size to allow for easy insertion and adjustment, and shallower to clear the doors.
$$\text{Width}_{shelf} = W - (2 \times T) - 2\text{ mm (clearance)}$$
$$\text{Depth}_{shelf} = D - 20\text{ mm (door & hinge clearance)}$$

---

### B. Backing Panel Math (Recessed & Grooved)
Rather than screwing the backing panel directly onto the back edges (which exposes the raw ply edge), professional modular carcasses use a **groove** cut into the inner faces of the Left, Right, and Bottom panels.

```
Outer Back Edge 
   |
   |<-- Offset (16mm)
   |    |<-- Groove Width = Backing Thickness (9mm)
   v    v
+-------+-----+---------------------------------------+
| Recess| Ply |            Interior of Carcass        |  (Inside view of Left Side Panel)
+-------+-----+---------------------------------------+
```

*   **Groove Depth ($D_{groove}$):** Usually 8 mm deep, carved into the 18 mm side panels.
*   **Groove Position:** Located 16 mm away from the back edge.
*   **Backing Panel Height:**
    $$\text{Height}_{back} = H - T + D_{groove}$$
    *(Assuming it slots into a groove in the bottom panel and runs all the way out the top rail).*
*   **Backing Panel Width:**
    $$\text{Width}_{back} = W - (2 \times T) + (2 \times D_{groove})$$
    *(Since it extends into the grooves of both side panels).*

---

### C. Shutter / Door Calculations
Shutters must not touch each other or scrape against adjacent cabinets. We must apply **Shutter Allowances** (usually a 2.5 mm or 3 mm gap around the perimeter).

*   **Single Door Cabinet:**
    $$\text{Height}_{shutter} = H - 3\text{ mm}$$
    $$\text{Width}_{shutter} = W - 3\text{ mm}$$
*   **Double Door Cabinet:**
    $$\text{Height}_{shutter} = H - 3\text{ mm}$$
    $$\text{Width}_{shutter} = \frac{W - 6\text{ mm}}{2}$$
    *(This provides a 3 mm gap on the outer left/right edges and a 3 mm gap between the two doors in the center).*

---

### D. Edgebanding Deductions (Crucial for Factory Accuracy)
Edgebanding adds thickness. If you apply a **2 mm PVC edge band** to a shutter, the raw panel must be cut smaller so that when the edgeband is applied, the finished shutter is exactly the planned size.

$$\text{Raw Dimension} = \text{Finished Dimension} - \sum(\text{Edgebanding Thicknesses applied to that edge})$$

*   **Shutters (Typically 2 mm PVC Banding on all 4 sides):**
    $$\text{Raw Width} = \text{Finished Width} - 4\text{ mm (2mm left + 2mm right)}$$
    $$\text{Raw Height} = \text{Finished Height} - 4\text{ mm (2mm top + 2mm bottom)}$$
*   **Carcass Side Panels (Typically 0.8 mm PVC Banding on the visible front edge only):**
    $$\text{Raw Depth} = \text{Finished Depth} - 0.8\text{ mm}$$
    $$\text{Raw Height} = \text{Finished Height (No deduction on top/bottom as they are unexposed)}$$

---

## 4. Comprehensive Worked Examples

### Example 1: Standard 2-Door Kitchen Base Cabinet
*   **Input Specifications:**
    *   **Finished Dimensions:** Width $W = 600\text{ mm}$, Height $H = 720\text{ mm}$, Depth $D = 560\text{ mm}$.
    *   **Carcass Material:** 18 mm BWR Plywood.
    *   **Backing Material:** 9 mm BWR Plywood, recessed in an 8 mm deep groove, placed 16 mm from the back edge.
    *   **Carcass Edgeband:** 0.8 mm PVC edge banding on front exposed edges.
    *   **Shutter Edgeband:** 2.0 mm PVC edge banding on all 4 sides.

#### Step 1: Carcass Panel Math (Finished Sizes)
1.  **Left & Right Sides (2 Nos.):**
    *   Finished Height = $720\text{ mm}$
    *   Finished Depth = $560\text{ mm}$
2.  **Bottom Panel (1 No.):**
    *   Finished Width = $W - (2 \times T) = 600 - 36 = 564\text{ mm}$
    *   Finished Depth = $D - \text{Back Recess Offset} = 560 - 16 - 9 = 535\text{ mm}$ (Since the back panel fits into the groove and doesn't run all the way to the absolute back boundary of the side panels).
3.  **Top Rails (2 Nos.):**
    *   Finished Length = $W - (2 \times T) = 600 - 36 = 564\text{ mm}$
    *   Width = $100\text{ mm}$
4.  **Backing Panel (1 No.):**
    *   Finished Width = $W - 2T + 2D_{groove} = 600 - 36 + (2 \times 8) = 580\text{ mm}$
    *   Finished Height = $H - T + D_{groove} = 720 - 18 + 8 = 710\text{ mm}$ (Rises from the bottom groove up through the top).

#### Step 2: Shutter Math (Finished Sizes)
*   Two doors, so we apply double-door clearances:
    *   Finished Height = $H - 3\text{ mm} = 720 - 3 = 717\text{ mm}$
    *   Finished Width = $\frac{W - 6\text{ mm}}{2} = \frac{600 - 6}{2} = 297\text{ mm}$

#### Step 3: Raw Cutting Size List (Applying Edgeband Deductions)

| Part ID | Part Name | Qty | Material | Finished Size (H × W) | Edgebanding Pattern | Raw Cut Size (H × W) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **C01** | Left Side | 1 | 18mm Ply | $720 \times 560$ | Front (1 Long) - 0.8mm | **$720 \times 559.2$** |
| **C02** | Right Side | 1 | 18mm Ply | $720 \times 560$ | Front (1 Long) - 0.8mm | **$720 \times 559.2$** |
| **C03** | Bottom Panel| 1 | 18mm Ply | $564 \times 535$ | Front (1 Long) - 0.8mm | **$564 \times 534.2$** |
| **C04** | Top Rail Front| 1| 18mm Ply | $564 \times 100$ | Front (1 Long) - 0.8mm | **$564 \times 99.2$** |
| **C05** | Top Rail Back | 1| 18mm Ply | $564 \times 100$ | None | **$564 \times 100$** |
| **B01** | Backing Panel| 1 | 9mm Ply | $710 \times 580$ | None (Grooved inside) | **$710 \times 580$** |
| **S01** | Shutter Left | 1 | 18mm MDF | $717 \times 297$ | All 4 edges - 2.0mm | **$713 \times 293$** |
| **S02** | Shutter Right| 1 | 18mm MDF | $717 \times 297$ | All 4 edges - 2.0mm | **$713 \times 293$** |

---

### Example 2: Standard 1-Door Overhead Wall Cabinet
*   **Input Specifications:**
    *   **Finished Dimensions:** Width $W = 450\text{ mm}$, Height $H = 600\text{ mm}$, Depth $D = 300\text{ mm}$.
    *   **Carcass Material:** 18 mm HDMR.
    *   **Backing Material:** 6 mm HDMR, recessed in a 6 mm deep groove, placed 12 mm from the back edge.
    *   **Carcass Edgeband:** 0.8 mm PVC edge banding.
    *   **Shutter Edgeband:** 2.0 mm PVC edge banding.

#### Step 1: Carcass Panel Math (Finished Sizes)
1.  **Left & Right Sides (2 Nos.):**
    *   Finished Height = $600\text{ mm}$, Finished Depth = $300\text{ mm}$
2.  **Bottom Panel & Top Panel (2 Nos. - Overhead has solid top panels, unlike base units):**
    *   Finished Width = $W - (2 \times T) = 450 - 36 = 414\text{ mm}$
    *   Finished Depth = $D - \text{Back Recess} = 300 - 12 - 6 = 282\text{ mm}$
3.  **Backing Panel (1 No.):**
    *   Finished Width = $W - 2T + 2D_{groove} = 450 - 36 + 12 = 426\text{ mm}$
    *   Finished Height = $H - 2T + 2D_{groove} = 600 - 36 + 12 = 576\text{ mm}$ (Since the back panel is fully grooved on all 4 sides inside the wall unit).

#### Step 2: Shutter Math (Finished Sizes)
*   Single door carcass:
    *   Finished Height = $H - 3\text{ mm} = 600 - 3 = 597\text{ mm}$
    *   Finished Width = $W - 3\text{ mm} = 450 - 3 = 447\text{ mm}$

#### Step 3: Raw Cutting Size List (Applying Edgeband Deductions)

| Part ID | Part Name | Qty | Material | Finished Size (H × W) | Edgebanding Pattern | Raw Cut Size (H × W) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **W01** | Left Side | 1 | 18mm HDMR| $600 \times 300$ | Front (1 Long) - 0.8mm | **$600 \times 299.2$** |
| **W02** | Right Side | 1 | 18mm HDMR| $600 \times 300$ | Front (1 Long) - 0.8mm | **$600 \times 299.2$** |
| **W03** | Top Panel | 1 | 18mm HDMR| $414 \times 282$ | Front (1 Long) - 0.8mm | **$414 \times 281.2$** |
| **W04** | Bottom Panel| 1 | 18mm HDMR| $414 \times 282$ | Front (1 Long) - 0.8mm | **$414 \times 281.2$** |
| **WB01**| Backing Panel| 1 | 6mm HDMR | $576 \times 426$ | None | **$576 \times 426$** |
| **WS01**| Shutter | 1 | 18mm Acrylic| $597 \times 447$ | All 4 edges - 2.0mm | **$593 \times 443$** |

---

## 5. Summary of Common Manual Mistakes

When carpenters or designers perform this math manually, errors creep in due to cognitive fatigue. The five most common failure points are:
1.  **Double-Banding Blind Spots:** Forgetting that applying a 2mm edge band to both sides of a cabinet shutter requires a 4mm total deduction from the raw width, leading to doors scraping each other.
2.  **Backing Groove Math Neglect:** Forgetting that if a backing sheet sits in a groove, the backing panel must be *wider* than the internal width, but the top/bottom panels must be *shallower* to clear the recess space.
3.  **Tandem Box Discrepancies:** Different manufacturers (Hettich, Blum, Ebco) require completely different bottom-panel widths for drawer boxes. E.g., Hettich InnoTech requires an internal cabinet width minus 75 mm, while Blum Tandembox requires a different deduction. Carpenters often cut a standard size, rendering expensive runners useless.
4.  **Grain Direction Misalignment:** Woodgrain must run vertically on cabinet shutters and cabinet sides. Inexperienced drafters list dimensions in the wrong order ($W \times H$ instead of $H \times W$), causing the cutting crew to cut across the grain, ruining the aesthetic.
5.  **Blade Kerf Neglect:** Assuming they can extract exactly four 600mm panels from a 2440mm sheet. Once the blade kerf (typically 3mm or 4mm per cut) is factored in, the fourth panel is always too small, leading to project delays.
