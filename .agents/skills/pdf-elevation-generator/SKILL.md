---
name: pdf-elevation-generator
description: Generate professional, high-precision A3 landscape 2D millwork elevations in PDF format from 3D room coordinates.
---

# High-Quality PDF Elevation Generation Standards

This skill documents the precise rules for converting 3D room coordinates and cabinetry blocks into clean, high-precision, A3 landscape PDF elevations.

---

## 1. 3D-to-2D Coordinate Projection

When projecting 3D cabinet modules `[x, y, z]` onto a 2D vertical wall sheet:
* **X-axis Offset**: Map the horizontal coordinate along the wall length `xOffsetMm` starting from the left wall corner (`x = 0`).
* **Z-axis Height**: Map the vertical coordinate `zOffsetMm` starting from the floor line (`z = 0`).
* **Skirting Datum**: Dedicate the first `100mm` from the floor to the plinth/skirting. Cabinets start at `zOffsetMm = 100` unless floating.
* **Overhead Datum**: Wall-mounted/overhead cabinets typically start at a baseline of `zOffsetMm = 1400`.

---

## 2. Drawing Quality & Clutter Prevention

To maintain a clean, readable layout without overlapping elements:
* **No Inline Callout Text**: Do NOT draw leader lines or text callouts directly on top of the drawing viewport. These lines collide when cabinets are adjacent.
* **Material Schedule Table**: Place all finishes, materials, and notes inside the designated **Material Schedule** table at the bottom-right of the sheet.
* **Centered Tags**: Center all tag labels (`SHUTTER`, `DRAWER`, `GLASS`) natively inside the cabinet boundary boxes:
  ```javascript
  doc.font('Helvetica-Bold').fontSize(7.5).text(tag, x, y + h / 2 - 5, { width: w, align: 'center' });
  doc.font('Helvetica').fontSize(5.5).text(`${wMm}x${hMm}`, x, y + h - 10, { width: w, align: 'center' });
  ```
* **Clean White Background**: Use a pure white background (`#ffffff`) for maximum contrast and readability when printed.

---

## 3. Dimension Line Standards

* **oblique tick marks**: All witness lines must terminate with a 45-degree oblique tick mark slanting up and to the right:
  ```javascript
  function drawObliqueTick(doc, x, y, size = 4) {
    doc.lineWidth(0.8).strokeColor(RED)
      .moveTo(x - size, y + size)
      .lineTo(x + size, y - size)
      .stroke();
  }
  ```
* **Double-Tier Dimensions**:
  - **Tier 1 (Chained)**: Individual cabinet widths drawn in a continuous chain.
  - **Tier 2 (Overall)**: Total run width centered below the chained run.
