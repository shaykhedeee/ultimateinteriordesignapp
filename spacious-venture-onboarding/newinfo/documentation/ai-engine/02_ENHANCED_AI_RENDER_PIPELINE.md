# Enhanced AI Render Pipeline: Floor Plan → Photorealistic Image

## The Problem Today

Most AI interior render tools:
1. Ignore the floor plan entirely (text-to-image only)
2. Place furniture randomly with no spatial logic
3. Use Western-style defaults (wrong for Indian homes)
4. Cannot maintain consistency across multiple renders of the same space
5. Cannot change colors of specific components post-generation

## The Spacious Venture Solution

A **deterministic render pipeline** that guarantees the generated image matches the floor plan layout, room dimensions, component placements, and user-chosen materials.

---

## Pipeline Architecture

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ FLOOR PLAN   │───▶│ LAYOUT       │───▶│ STRUCTURED   │
│ ANALYZER     │    │ COMPILER     │    │ PROMPT       │
└──────────────┘    └──────────────┘    └──────┬───────┘
                                               │
                                    ┌──────────▼──────────┐
                                    │  IMAGE GENERATOR     │
                                    │  (OpenAI / Freepik   │
                                    │   / Flux / Custom)   │
                                    └──────────┬──────────┘
                                               │
                                    ┌──────────▼──────────┐
                                    │  SPATIAL            │
                                    │  VALIDATOR          │
                                    └──────────┬──────────┘
                                               │
                                    ┌──────────▼──────────┐
                                    │  COMPONENT COLOR    │
                                    │  POST-PROCESSOR     │
                                    └─────────────────────┘
```

---

## Phase 1: Layout Compiler

Takes the floor plan analysis output and builds the **exact 3D scene description**:

```javascript
class LayoutCompiler {
  compile(floorPlanAnalysis, stylePreferences, budgetTier) {
    return {
      // Exact room dimensions
      room: {
        name: "Living Room",
        width: 6000,     // mm
        depth: 4500,     // mm  
        height: 3000,    // mm
      },
      
      // Camera position (calculated from room geometry)
      camera: {
        position: { x: 500, y: 1600, z: 5700 }, // 500mm from east wall
        target: { x: 3000, y: 1600, z: 2500 },  // center of room
        fieldOfView: 75,                         // degrees
      },
      
      // Wall-by-wall description
      walls: [
        {
          name: "West Wall (TV Wall)",
          width: 4500, height: 3000,
          features: [
            { type: "window", x: 200, width: 1800, height: 2100 },
            { type: "window", x: 2500, width: 1800, height: 2100 },
          ],
          wallMaterial: "off-white textured limewash paint",
          components: [
            {
              type: "TV_Unit",
              x: 400, y: 1200, // centered between windows
              width: 2400, height: 450, depth: 400,
              material: "walnut veneer",
              finish: "matte",
              shutters: "white high-gloss",
              tvSize: "65-inch",
              notes: "1200mm from floor to bottom of unit"
            }
          ]
        },
        {
          name: "North Wall (Sofa Wall)",
          width: 6000, height: 3000,
          features: [
            { type: "door", x: 4500, width: 900, height: 2100 }
          ],
          wallMaterial: "off-white textured limewash paint",
          components: [
            {
              type: "Sofa",
              x: 1500, y: 200, // 200mm from wall
              width: 2400, depth: 800, height: 900,
              material: "fabric",
              color: "#d4c5b2", // beige
              style: "L-shaped sectional",
              cushions: [
                { color: "#008080", material: "velvet" },  // teal
                { color: "#d4a017", material: "velvet" }   // mustard
              ]
            }
          ]
        },
        {
          name: "East Wall (Kitchen Arch)",
          width: 4500, height: 3000,
          features: [
            { type: "arch", x: 1000, width: 2400, height: 2400,
              adjacentRoom: "Kitchen" }
          ]
        },
        {
          name: "South Wall (Dining)",
          width: 6000, height: 3000,
          components: [
            {
              type: "Dining_Table",
              x: 2000, z: 2500, // x along wall, z depth into room
              width: 1500, depth: 800, height: 750,
              seats: 6,
              style: "wooden dining table"
            }
          ]
        }
      ],
      
      // Floor
      floor: {
        material: "vitrified tiles",
        size: "600x600mm",
        color: "#e8ddd0", // warm beige
        finish: "matte"
      },
      
      // Ceiling
      ceiling: {
        type: "false ceiling with cove lighting",
        dropMm: 150,
        material: "12mm gypsum board",
        lighting: "LED warm white 2700K"
      },
      
      // Light sources from windows
      lightSources: [
        {
          type: "natural",
          source: "west windows",
          direction: { x: -1, y: 0.5, z: 0 }, // from west, slightly from above
          intensity: "afternoon sunlight - warm",
          color: "3000K"
        }
      ],
      
      // Style & quality
      style: "Modern Indian Minimalist",
      budget: "Premium",
      renderQuality: "photorealistic 4K"
    };
  }
}
```

---

## Phase 2: Structured Prompt Compiler

The prompt is compiled deterministically from the layout, ensuring **every render is consistent with the floor plan**:

```javascript
class StructuredPromptCompiler {
  compile(layout) {
    // Deterministic prompt construction
    // Uses a template system that maintains spatial accuracy
    
    let prompt = `A photorealistic interior render of a ${layout.style} ` +
      `${layout.room.name}, ${layout.room.width}mm × ${layout.room.depth}mm × ${layout.room.height}mm. ` +
      `Camera positioned at eye level looking towards the TV wall.\n\n`;
    
    // Add wall-by-wall description
    for (const wall of layout.walls) {
      prompt += `${wall.name}: `;
      
      if (wall.features.length > 0) {
        for (const feature of wall.features) {
          if (feature.type === "window") {
            prompt += `A ${feature.width}mm × ${feature.height}mm window. `;
          } else if (feature.type === "arch") {
            prompt += `A ${feature.width}mm wide archway opening into the ${feature.adjacentRoom}, visible beyond. `;
          } else if (feature.type === "door") {
            prompt += `A ${feature.width}mm door. `;
          }
        }
      }
      
      for (const component of wall.components) {
        prompt += `A ${component.width}mm ${component.type} in ${component.material} `;
        if (component.color) prompt += `(${component.color}) `;
        if (component.finish) prompt += `with ${component.finish} finish. `;
        prompt += `${component.notes ? component.notes : ''} `;
      }
      
      prompt += `Wall finish: ${wall.wallMaterial}.\n\n`;
    }
    
    // Add floor, ceiling, lighting
    prompt += `Floor: ${layout.floor.material}, ${layout.floor.size}, ` +
      `${layout.floor.color}, ${layout.floor.finish} finish.\n`;
    prompt += `Ceiling: ${layout.ceiling.type}, ${layout.ceiling.dropMm}mm drop, ` +
      `${layout.ceiling.lighting}.\n`;
    prompt += `Lighting: ${layout.lightSources[0].intensity} ` +
      `streaming through the west-facing windows.\n\n`;
    
    // Quality instruction
    prompt += `Style: ${layout.style}, ${layout.budget} tier.\n`;
    prompt += `Quality: Photorealistic, 4K resolution, natural lighting, ` +
      `professional interior photography, warm inviting atmosphere, ` +
      `Indian home decor context, precisely matching the described layout.`;
    
    return { prompt, layout };
  }
}
```

---

## Phase 3: Multi-Variant Generation with Variation Control

Instead of random variations, each variant explores a **controlled design decision**:

```
Variant 1: "Base layout, beige sofa, walnut TV unit, warm lighting"
Variant 2: "Same layout, charcoal sofa, white TV unit, cool lighting"
Variant 3: "Same layout, blue velvet sofa, oak TV unit, warm lighting"
Variant 4: "Same layout, beige sofa, walnut TV unit, evening mood lighting"
```

Key: The **floor plan layout is identical** across all variants. Only materials/colors change.

```javascript
class VariantGenerator {
  generateVariants(layout, count = 4) {
    const basePrompt = this.compilePrompt(layout);
    
    const variants = [];
    
    // Variant 1: Default (as designed)
    variants.push({ ...basePrompt, variant: "Designer's Choice" });
    
    // Variant 2: Alternative palette
    if (count >= 2) {
      variants.push({
        ...basePrompt,
        colorOverrides: {
          sofa: "#2d2d2d",         // charcoal
          tvUnit: "#f5f5f0",       // white
          accent: "#c89b45"        // gold
        },
        variant: "Contemporary Dark"
      });
    }
    
    // Variant 3: Bold colors
    if (count >= 3) {
      variants.push({
        ...basePrompt,
        colorOverrides: {
          sofa: "#1e4d6e",         // navy blue velvet
          tvUnit: "#8b6f47",       // warm oak
          accent: "#d4a017"        // mustard
        },
        variant: "Bold & Blue"
      });
    }
    
    // Variant 4: Evening mood
    if (count >= 4) {
      variants.push({
        ...basePrompt,
        lightingOverride: {
          natural: "dusk lighting, warm glow",
          artificial: "warm 2700K ambient, accent lighting on TV wall"
        },
        variant: "Evening Ambiance"
      });
    }
    
    return variants;
  }
}
```

---

## Phase 4: Spatial Validator (Render Quality Gate)

After generation, the system **validates the render against the floor plan** to catch AI hallucinations:

```javascript
class SpatialValidator {
  validate(renderImage, expectedLayout) {
    // Uses computer vision to check:
    const checks = [
      {
        name: "Room proportions",
        test: "Is the width-to-depth ratio approximately correct?",
        weight: 0.3
      },
      {
        name: "Window positions",
        test: "Are windows on the correct wall with correct count?",
        weight: 0.2
      },
      {
        name: "Furniture placement",
        test: "Is the TV unit on the TV wall? Is the sofa opposite?",
        weight: 0.3
      },
      {
        name: "Component presence",
        test: "Are all required furniture pieces visible?",
        weight: 0.2
      }
    ];
    
    // Score each check (0-100)
    let totalScore = 0;
    for (const check of checks) {
      const score = this.runCheck(renderImage, expectedLayout, check.name);
      totalScore += score * check.weight;
    }
    
    return {
      passed: totalScore >= 70,
      score: totalScore,
      failures: this.getFailures(renderImage, expectedLayout)
    };
  }
}
```

If validation fails (score < 70%), the system:
1. Logs specific failures ("TV unit not detected on west wall")
2. Reinforces the missing constraint in the prompt
3. Re-generates with the strengthened prompt
4. Retries up to 3 times
5. If still failing, shows warning to designer: "AI could not match floor plan exactly. Some components may be misplaced."

---

## Phase 5: Component Color Post-Processor

**This is the key innovation for color changing.** After the render is generated, individual components can be color-modified without regenerating the entire image:

```javascript
class ComponentColorProcessor {
  // Uses inpainting / masked diffusion to recolor specific components
  
  async recolorComponent(renderImage, componentMask, newColor) {
    // 1. Identify the component region from the render
    //    (using segmentation mask saved during generation OR 
    //     running SAM - Segment Anything Model)
    
    // 2. Create a mask of just that component
    
    // 3. Run inpainting with the new color constraint:
    //    "Replace the fabric of the sofa shown in the masked area
    //     with color #1e4d6e (navy blue velvet), keeping the exact
    //     same geometry, lighting, shadows, and everything else identical"
    
    // 4. Blend the inpainted region back into the original render
    
    return recoloredImage;
  }
}
```

---

## Image Generation Provider Pipeline

The system supports multiple providers with automatic fallback:

```
1. OpenAI DALL-E 3
   Best for: Photorealism, style adherence
   Prompt: Structured compiled prompt (2500+ chars)
   
2. Freepik (Pikaso / Flux)
   Best for: Indian context, furniture detail
   Prompt: Same compiled prompt
   
3. Custom Stable Diffusion (Future)
   Best for: Floor-plan-grounded generation
   Using: ControlNet + Canny edge from floor plan
   
4. Mock SVG (Fallback)
   Best for: Offline demos, quick layout preview
   Generates: Annotated SVG showing room layout
```

---

## UI: AI Render Studio (Enhanced)

The enhanced render studio shows **exactly** what the AI understood from the floor plan:

```
┌──────────────────────────────────────────────────────────────┐
│  AI RENDER STUDIO  ───  Project: Iyer Residence             │
├────────────────┬─────────────────────────────┬───────────────┤
│ FLOOR PLAN     │  RENDER PREVIEW              │ DESIGN       │
│ UNDERSTANDING  │                              │ CONTROLS     │
│                │  ┌───────────────────────┐   │              │
│ Room: LR       │  │                       │   │ Room:        │
│ ┌──────────┐   │  │   [RENDER IMAGE]      │   │ [Living ▼]   │
│ │  West    │   │  │                       │   │              │
│ │  Wall    │   │  │                       │   │ Style:       │
│ │ TV Unit  │   │  └───────────────────────┘   │ [Modern ▼]   │
│ │ ████████ │   │                              │              │
│ │ W:2400   │   │  Variants:                    │ Budget:      │
│ │ H:450    │   │  ┌──┐ ┌──┐ ┌──┐ ┌──┐        │ [Premium ▼]  │
│ └──────────┘   │  │V1│ │V2│ │V3│ │V4│        │              │
│                │  └──┘ └──┘ └──┘ └──┘        │ Quality:     │
│ ┌──────────┐   │  ★ V1 selected               │ [Balanced ▼] │
│ │  North   │   │                              │              │
│ │  Wall    │   └──────────────────────────────┘   │
│ │  Sofa    │                              │ ─────────── │
│ │ ████████ │   COMPONENT COLOR EDITOR      │            │
│ │ W:2400   │   ┌─────────────────────────┐ │ TV Unit:   │
│ │ D:800    │   │ Select component:        │ │ [Walnut ▼] │
│ └──────────┘   │ [TV Unit ▼] [Sofa ▼]    │ │            │
│                │                           │ │ Sofa:      │
│ ┌──────────┐   │ Current: Walnut Veneer   │ │ [Beige ▼]  │
│ │  East    │   │  ⬤ Walnut    ○ White     │ │            │
│ │  Wall    │   │  ○ Oak       ○ Dark      │ │ Floor:     │
│ │  Arch    │   │                           │ │ [Tiles ▼]  │
│ │ →Kitchen │   │ [Preview Color]           │ │            │
│ └──────────┘   │ ┌──────────────────────┐ │ │ Accent:    │
│                │ │ [PREVIEW OF NEW      │ │ │ [Teal ▼]   │
│ WALL BY WALL   │ │  COLOR ON COMPONENT] │ │ │            │
│ ANALYSIS       │ └──────────────────────┘ │ │ Lighting:  │
│ ✓ 6 components │                           │ │ [Warm ▼]   │
│ ✓ 5 detected   │ [Apply to All Variants]   │ │            │
│ ⚠ 1 uncertain  │ [Regenerate this variant]  │ │            │
│                │                           │ │            │
│ [Confirm All]  │ [Generate Variants]        │ │            │
└────────────────┴───────────────────────────┴──────────────┘
```

---

## Spatial Accuracy Metrics

The system reports how accurately the render matches the floor plan:

```
┌──────────────────────────────────────────────────────────────┐
│  SPATIAL ACCURACY REPORT                                     │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Overall Score: 86% (PASS)                                   │
│                                                              │
│  ✓ Room Dimensions:    92%  (6.0×4.5m matches floor plan)   │
│  ✓ Window Positions:   95%  (2 windows on west wall)         │
│  ✓ TV Unit Placement:  90%  (On west wall, centered)         │
│  ✓ Sofa Placement:     85%  (On north wall, facing TV)      │
│  ✓ Kitchen Arch:       80%  (Visible on east side)           │
│  ✓ Dining Area:        78%  (South-east corner)              │
│  ⚠ Color Accuracy:     75%  (TV unit slightly different)     │
│                                                              │
│  Flagged Issues (can be fixed with color editor):            │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ TV unit appears as white laminate, but design shows  │   │
│  │ walnut veneer. Use Color Editor → TV Unit → Walnut.  │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  [Accept Render]  [Request Regeneration]  [Manual Edit]      │
└──────────────────────────────────────────────────────────────┘
```