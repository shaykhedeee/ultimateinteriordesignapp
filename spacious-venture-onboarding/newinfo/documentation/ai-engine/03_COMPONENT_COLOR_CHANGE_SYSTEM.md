# AI Component Color Change & Re-rendering System

## Core Problem

A designer generates a beautiful render — the client says "I love the layout, but can you show me the sofa in navy blue instead of beige?" 

**Without this system**: Regenerate the entire render, hope the AI keeps the layout identical, then show the client. 80% chance the layout changes.

**With this system**: Click "Sofa" → Select "Navy Blue" → Instantly see the exact same render with the sofa recolored, everything else PERFECTLY preserved.

---

## How It Works (Technical Architecture)

### Approach 1: Component-Aware Generation (Best Quality)

During initial render generation, the system tracks **exactly** where every component is in the image:

```javascript
class ComponentAwareRender {
  constructor(renderEngine) {
    this.renderEngine = renderEngine;
    this.componentRegistry = new Map();
  }

  async generateWithTracking(layout, style) {
    // 1. Generate the render normally
    const result = await this.renderEngine.generate(layout, style);
    
    // 2. Run SAM (Segment Anything Model) on the generated image
    //    to identify and mask every component
    const segments = await this.segmentImage(result.image);
    
    // 3. Map segments to known components from the layout
    for (const segment of segments) {
      const matchedComponent = this.matchToLayout(segment, layout);
      if (matchedComponent) {
        this.componentRegistry.set(matchedComponent.id, {
          id: matchedComponent.id,
          type: matchedComponent.type,
          name: matchedComponent.name,
          mask: segment.mask,      // Pixel-perfect mask of this component
          currentColor: segment.dominantColor,
          currentMaterial: matchedComponent.material,
          position: segment.bbox     // Bounding box in image coordinates
        });
      }
    }
    
    // 3b. If SAM fails to find a component, fall back to layout-based
    //     approximate bounding box
    
    // 4. Store the full result with component registry
    return {
      image: result.image,
      components: Array.from(this.componentRegistry.values()),
      layout: layout,
      style: style
    };
  }
  
  async recolorComponent(render, componentId, newColor, newMaterial) {
    const component = this.componentRegistry.get(componentId);
    if (!component) throw new Error("Component not found");
    
    // 1. Get the mask of the component
    const mask = component.mask;
    
    // 2. Create a constrained inpainting prompt:
    //    "Change the {material} of the {type} in the masked area
    //     to {newColor} {newMaterial}. Keep EXACTLY the same:
    //     - Lighting and shadows
    //     - Geometry and shape
    //     - Everything else in the image identical"
    
    const inpaintPrompt = `Change the ${component.currentMaterial} ` +
      `of the ${component.type} to ${newColor} ${newMaterial}. ` +
      `Keep the exact same lighting, shadows, geometry, and all ` +
      `other elements in the image completely unchanged.`;
    
    // 3. Run inpainting with the mask and prompt
    const recoloredImage = await this.renderEngine.inpaint(
      render.image, mask, inpaintPrompt
    );
    
    // 4. Update the registry
    component.currentColor = newColor;
    component.currentMaterial = newMaterial;
    
    return {
      image: recoloredImage,
      component: component
    };
  }
  
  async segmentImage(image) {
    // Use Meta's SAM (Segment Anything Model) to get all segments
    // SAM automatically finds every distinct object in the image
    const sam = new SegmentAnythingModel();
    const segments = await sam.segment(image);
    
    // Filter to only furniture/component-sized segments
    return segments.filter(s => 
      s.area > 5000 &&    // Minimum pixel area
      s.confidence > 0.7   // Confidence threshold
    );
  }
  
  matchToLayout(segment, layout) {
    // Check if this segment overlaps with a known layout component
    for (const wall of layout.walls) {
      for (const component of wall.components) {
        if (this.overlaps(segment.bbox, component.expectedBbox)) {
          return component;
        }
      }
    }
    return null;
  }
}
```

### Approach 2: Post-Generation Recoloring (Fallback)

If component-aware generation wasn't used, the system can still recolor via **CLIP-based segmentation**:

```javascript
class PostGenerationRecolor {
  async findAndRecolor(image, componentDescription, newColor) {
    // 1. Use CLIP (Contrastive Language-Image Pre-training)
    //    to find the described component in the image
    //    "Find the sofa in this living room image"
    
    const clip = new CLIPModel();
    const mask = await clip.findObject(image, 
      `the ${componentDescription} in the room`);
    
    if (!mask) {
      return {
        success: false,
        error: `Could not locate "${componentDescription}" in the image. ` +
               `Try drawing a rough mask on the image.`
      };
    }
    
    // 2. Use inpainting to recolor just that mask
    const inpainted = await this.inpaintWithColor(
      image, mask, componentDescription, newColor
    );
    
    return { success: true, image: inpainted };
  }
}
```

### Approach 3: Manual Mask Drawing (User Controls)

When AI fails to find the component, the user can draw a rough mask:

```
User: "TV unit is not detected because it's in shadow"
System: "Please draw a rough rectangle around the TV unit"

User draws a rectangle on the render image
System uses this as the mask area
Runs inpainting only within that area
```

---

## Frontend UI: Component Color Editor

```
┌──────────────────────────────────────────────────────────────┐
│  COMPONENT COLOR EDITOR                                      │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  SELECT COMPONENT TO MODIFY:                                 │
│                                                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │ 🛋 SOFA  │ │ 📺 TV    │ │ 🪑 DINING │ │ 🗄 WARD- │       │
│  │          │ │   UNIT   │ │  TABLE   │ │   ROBE   │       │
│  │ beige→   │ │ walnut→  │ │ oak→     │ │ white→   │       │
│  │ ● ACTIVE │ │          │ │          │ │          │       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
│                                                              │
│  CURRENT: Sofa — Beige Fabric                                │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                                                       │   │
│  │  COLOR PALETTE                                        │   │
│  │                                                       │   │
│  │  ⬤ Navy Blue  ○ Charcoal  ○ Teal Green  ○ Dusty Rose│   │
│  │  ○ Mustard    ○ Forest    ○ Burgundy    ○ Blush Pink │   │
│  │  ○ Stone Grey ○ Cream     ○ Sapphire    ○ Terracotta │   │
│  │                                                       │   │
│  │  ── CUSTOM ──                                         │   │
│  │  [#1e4d6e]  [▼ Picker]                               │   │
│  │                                                       │   │
│  │  ── MATERIAL ──                                       │   │
│  │  [Fabric: Velvet ▼]  [Satin]  [Linen]  [Leather]     │   │
│  │                                                       │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  PREVIEW                                              │   │
│  │                                                       │   │
│  │  ┌──────────┐   ┌──────────┐                          │   │
│  │  │ BEFORE   │   │ AFTER    │                          │   │
│  │  │ beige    │   │ navy     │                          │   │
│  │  │ sofa     │   │ blue     │                          │   │
│  │  └──────────┘   │ velvet   │                          │   │
│  │                 └──────────┘                          │   │
│  │                                                       │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  [Cancel]  [Apply to This Variant]  [Apply to All Variants] │
└──────────────────────────────────────────────────────────────┘
```

---

## Color Palette System

The system understands **Indian interior color palettes** and suggests harmonious combinations:

```javascript
const INDIAN_COLOR_PALETTES = {
  warmNeutral: {
    name: "Warm Neutrals",
    colors: ["#e8ddd0", "#d4c5b2", "#c4b49d", "#b8a99a", "#a0907d"],
    description: "Beige, cream, warm grey — timeless Indian home base"
  },
  jewelTones: {
    name: "Jewel Tones (2025 Trend)",
    colors: ["#1e4d6e", "#2d5a27", "#8b1a1a", "#6b3a6b", "#c17e3a"],
    description: "Navy, emerald, ruby, amethyst, amber — rich accents"
  },
  earthy: {
    name: "Earthy Indian",
    colors: ["#c17e3a", "#a07040", "#8b6f47", "#6b5b3a", "#5c4a2a"],
    description: "Terracotta, ochre, clay, mud — rooted Indian aesthetic"
  },
  pastelModern: {
    name: "Modern Pastels",
    colors: ["#e8d5c4", "#d4e8c4", "#c4d4e8", "#e8c4d4", "#d4c4e8"],
    description: "Sage, blush, powder blue, lavender — soft contemporary"
  },
  boldContemporary: {
    name: "Bold Contemporary",
    colors: ["#1a1a2e", "#16213e", "#0f3460", "#e94560", "#533483"],
    description: "Deep navy, royal blue, magenta, purple — dramatic impact"
  },
  goldAccent: {
    name: "Gold Accent (Spacious Signature)",
    colors: ["#c89b45", "#e1bf72", "#d4a017", "#b8860b", "#a0782c"],
    description: "Signature golds — for hardware, trims, accent pieces"
  }
};
```

---

## Component Library with Color Variants

Each component type in the system has **pre-defined color/material variants**:

```json
{
  "componentType": "sofa",
  "default": { "color": "#d4c5b2", "material": "fabric", "finish": "textured" },
  "variants": [
    { "color": "#1e4d6e", "material": "velvet", "finish": "matte",
      "name": "Navy Blue Velvet" },
    { "color": "#2d2d2d", "material": "fabric", "finish": "matte",
      "name": "Charcoal Grey" },
    { "color": "#c17e3a", "material": "leather", "finish": "semi-gloss",
      "name": "Terracotta Leather" },
    { "color": "#008080", "material": "velvet", "finish": "matte",
      "name": "Teal Green Velvet" },
    { "color": "#d4a017", "material": "fabric", "finish": "textured",
      "name": "Mustard Yellow" },
    { "color": "#8b4513", "material": "leather", "finish": "matte",
      "name": "Saddle Brown Leather" },
    { "color": "#e8d5c4", "material": "linen", "finish": "natural",
      "name": "Natural Linen" },
    { "color": "#6b3a6b", "material": "velvet", "finish": "matte",
      "name": "Amethyst Velvet" }
  ]
}
```

---

## Workflow: Designer Changes Component Color

```
STEP 1: Designer sees the render
┌──────────────────────────────────┐
│ Render looks great but client    │
│ wants the sofa in navy blue      │
└──────────────────────────────────┘
         │
         ▼
STEP 2: Click on the sofa in the render
┌──────────────────────────────────┐
│ Sofa selected!                    │
│ Component: Sofa (Living Room)    │
│ Current: Beige Fabric             │
│                                   │
│ [Change Color] [Change Material]  │
└──────────────────────────────────┘
         │
         ▼
STEP 3: Select Navy Blue Velvet
┌──────────────────────────────────┐
│ Sofa Color Preview                │
│ ┌────────┐ ┌──────────────────┐ │
│ │ BEFORE │ │ AFTER (preview)  │ │
│ │ beige  │ │ navy blue velvet │ │
│ └────────┘ └──────────────────┘ │
│                                   │
│ [Looks good - apply!]             │
└──────────────────────────────────┘
         │
         ▼
STEP 4: AI processes (3-5 seconds)
┌──────────────────────────────────┐
│ ✨ Recoloring sofa...             │
│                                   │
│ Keeping everything else identical │
│ ████████████████░░ 80% complete   │
└──────────────────────────────────┘
         │
         ▼
STEP 5: Updated render shown
┌──────────────────────────────────┐
│ ✅ Complete!                      │
│                                   │
│ Side-by-side comparison:          │
│ ┌────────────┐ ┌────────────┐    │
│ │ BEF: beige │ │ NOW: navy   │    │
│ │ sofa       │ │ blue velvet │    │
│ └────────────┘ └────────────┘    │
│                                   │
│ [Apply to all 4 variants]         │
│ [Save as revision 2]              │
│ [Export updated PDF brief]        │
└──────────────────────────────────┘
```

---

## Training Data for the Recoloring Model

To make the AI good at recoloring without degrading image quality, train on:

### Dataset Requirements
- 10,000+ images of Indian interiors with:
  - Component masks (pixel-perfect segmentation)
  - Multiple color variants of the same component
  - Consistent lighting/scene across variants

### Synthetic Training Data Generation
```javascript
async function generateTrainingData() {
  // 1. Take 1,000 base renders
  // 2. For each render, generate 10 color variants:
  //    - Same layout, same camera, same lighting
  //    - Only the target component's color changes
  // 3. For each variant, save:
  //    - Full render image
  //    - Component mask (pixel-perfect)
  //    - Old color → New color mapping
  //    - Material change (if applicable)
  
  return 10,000 training pairs;
}
```

### Model Architecture for Recoloring
```
Input: Render image + Component mask + Target color
  │
  ▼
Encoder: ResNet-50 / ViT (feature extraction)
  │
  ▼
Masked Feature Modulation:
  - Apply color transformation ONLY within masked region
  - Preserve texture, lighting, shadows from original
  │
  ▼
Decoder: U-Net with skip connections
  - Reconstruct full image
  - Only modified region changes
  │
  ▼
Output: Recolored image (seamless blend)
```

**Training objective**: Minimize L1 loss outside the mask (pixels must stay identical) + Perceptual loss inside the mask (color must change realistically).

---

## UI Component for Color Training

The app can **learn from designer corrections**:

```
┌──────────────────────────────────────────────────────────────┐
│  COLOR CORRECTION MEMORY                                     │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  The AI learns from every color change you make:             │
│                                                              │
│  Recent Corrections:                                         │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ Iyer Project — Sofa: Beige → Navy Blue (23 min ago)   │  │
│  │ ✓ Applied to all variants                              │  │
│  ├────────────────────────────────────────────────────────┤  │
│  │ Sharma Project — TV Unit: White → Walnut (2 hours ago)│  │
│  │ ✓ Saved as "Preferred TV Unit Finish"                  │  │
│  ├────────────────────────────────────────────────────────┤  │
│  │ Patel Project — Kitchen: Laminate→Acrylic (yesterday)  │  │
│  │ ✓ Added to Studio Standards                            │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  Learned Preferences:                                        │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ In 80% of Premium projects → Sofa is in blue/green     │  │
│  │ In 70% of Modern projects → TV Unit is in walnut       │  │
│  │ In 90% of projects → Wardrobe finish = laminate        │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  [Apply Learned Defaults to New Projects]                    │
└──────────────────────────────────────────────────────────────┘
```