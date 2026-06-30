# AI Training Guide: Component Recognition & Color Change

## What We're Training The AI To Do

1. **Recognize individual components** in a rendered image (sofa, TV unit, wardrobe, etc.)
2. **Isolate each component** with pixel-perfect masks
3. **Change the color/material** of a selected component without affecting anything else
4. **Maintain lighting, shadows, reflections** exactly as they were

---

## Training Data Requirements

### Dataset 1: Component Segmentation (10,000+ images)

**Purpose**: Train the AI to identify and mask individual furniture/components in interior renders.

| Data Type | Quantity | Source | Annotation Required |
|-----------|----------|--------|-------------------|
| Rendered interiors | 5,000 | Generated from our AI | Pixel masks for each component |
| Real interior photos | 3,000 | Stock photos, client projects | Pixel masks for each component |
| Floor plan annotated | 2,000 | Our app's own generations | Automatic (we know where things are) |

**Component Classes to Detect**:
```
sofa, tv_unit, dining_table, coffee_table, wardrobe, bed, 
nightstand, bookshelf, kitchen_cabinet, kitchen_counter,
sink, hob, chimney, shoe_rack, pooja_unit, study_desk,
dressing_table, mirror, rug, curtains, pendant_light,
chandelier, floor_lamp, accent_chair, ottoman, sideboard
```

### Dataset 2: Color Variation (5,000+ pairs)

**Purpose**: Train the AI to recolor components realistically.

Each pair consists of:
- Image A: Component with original color
- Image B: Same image, same lighting, same everything — except one component has a different color

| Color Family | Variants | Example Pairs |
|-------------|----------|---------------|
| Neutrals | Beige→Grey, White→Off-white, Grey→Charcoal | Sofa beige→charcoal |
| Jewel Tones | Navy, Emerald, Ruby, Amethyst | Sofa beige→navy velvet |
| Earth Tones | Terracotta, Ochre, Olive, Clay | Sofa beige→terracotta |
| Pastels | Sage, Blush, Powder Blue, Lavender | Sofa beige→sage green |
| Wood Tones | Walnut, Oak, Teak, Rosewood | TV unit white→walnut |
| Bold | Mustard, Burgundy, Teal, Coral | Sofa beige→mustard |

### Dataset 3: Material Variation (2,000+ pairs)

**Purpose**: Train the AI to change both color AND material simultaneously.

| Material Change | Example |
|----------------|---------|
| Fabric → Velvet | Beige fabric → Navy velvet |
| Fabric → Leather | Beige fabric → Brown leather |
| Laminate → PU Finish | White laminate → Glossy white PU |
| Wood → Painted | Walnut wood → White painted |
| Matte → Glossy | Matte black → Glossy black |

---

## Model Architecture: Component-Aware Image Editor

```
┌─────────────────────────────────────────────────────────────┐
│  COMPONENT-AWARE IMAGE EDITOR (CAIE) Model                   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  INPUT:                                                      │
│  ├── Render Image (512×512 RGB)                             │
│  ├── Component Mask (512×512 binary)                        │
│  ├── Target Color (RGB triplet)                              │
│  └── Target Material (one-hot encoding)                     │
│                                                              │
│  │                                                           │
│  ▼                                                           │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  ENCODER: ResNet-50 + ViT                            │    │
│  │  - Extract multi-scale features from render         │    │
│  │  - Separate features into:                           │    │
│  │    a) Background features (outside mask → preserve)  │    │
│  │    b) Component features (inside mask → modify)      │    │
│  └─────────────────────────────────────────────────────┘    │
│                       │                                     │
│                       ▼                                     │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  COLOR TRANSFORM MODULE                              │    │
│  │  - Applies target color to component features        │    │
│  │  - Preserves texture details from original           │    │
│  │  - Adjusts for lighting conditions                   │    │
│  │  - Adds material-specific rendering (velvet fuzz,    │    │
│  │    leather grain, glossy highlights)                  │    │
│  └─────────────────────────────────────────────────────┘    │
│                       │                                     │
│                       ▼                                     │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  DECODER: U-Net with Spatial Attention               │    │
│  │  - Reconstruct full image                             │    │
│  │  - Outside mask: pixel-perfect copy of original      │    │
│  │  - Inside mask: new color/material applied            │    │
│  │  - Seamless boundary blending                         │    │
│  └─────────────────────────────────────────────────────┘    │
│                       │                                     │
│                       ▼                                     │
│  OUTPUT:                                                    │
│  └── Recolored Image (512×512 RGB)                         │
│      - Outside mask: IDENTICAL to input                    │
│      - Inside mask: New color, same texture/shading        │
│      - Boundary: Seamless blend (no visible seam)          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Training Process

### Step 1: Synthetic Data Generation

```javascript
async function generateTrainingPairs(count = 5000) {
  const pairs = [];
  
  for (let i = 0; i < count; i++) {
    // 1. Generate a random interior layout
    const layout = generateRandomLayout();
    
    // 2. Generate render with specific colors
    const originalRender = await renderEngine.render(layout, {
      sofa: "#d4c5b2",     // beige
      tvUnit: "#8b6f47",   // walnut
      // ... etc
    });
    
    // 3. Pick a random component to recolor
    const targetComponent = pickRandom(layout.components);
    const newColor = pickRandomColor(targetComponent.type);
    
    // 4. Generate render with ONLY that component changed
    const modifiedLayout = { ...layout };
    modifiedLayout.components = layout.components.map(c => 
      c.id === targetComponent.id 
        ? { ...c, color: newColor } 
        : c
    );
    
    const modifiedRender = await renderEngine.render(modifiedLayout);
    
    // 5. Generate the component mask
    const mask = await generateComponentMask(
      originalRender, targetComponent
    );
    
    // 6. Save the training pair
    pairs.push({
      originalImage: originalRender,
      modifiedImage: modifiedRender,
      componentMask: mask,
      componentType: targetComponent.type,
      oldColor: targetComponent.color,
      newColor: newColor,
      newMaterial: targetComponent.material
    });
  }
  
  return pairs;
}
```

### Step 2: Loss Functions

```python
class ColorChangeLoss(torch.nn.Module):
    def __init__(self):
        super().__init__()
        self.l1_loss = torch.nn.L1Loss()
        self.perceptual_loss = PerceptualLoss()  # VGG-based
        
    def forward(self, output, target, mask):
        # 1. Outside mask: pixels should be IDENTICAL
        outside_loss = self.l1_loss(
            output * (1 - mask), 
            target.original * (1 - mask)
        )
        
        # 2. Inside mask: perceptual quality matters
        # (color change + texture preservation)
        inside_loss = self.perceptual_loss(
            output * mask, 
            target.modified * mask
        )
        
        # 3. Boundary smoothness (no seam artifacts)
        boundary = extract_boundary(mask, width=5)
        boundary_loss = self.l1_loss(
            output * boundary,
            target.modified * boundary
        )
        
        return (
            10.0 * outside_loss +  # High weight on preservation
            1.0 * inside_loss +    # Perceptual quality
            2.0 * boundary_loss     # Seamless transition
        )
```

### Step 3: Training Schedule

```
Phase 1: Component Segmentation (Week 1)
- Train SAM/Detectron2 on our component dataset
- Goal: >95% mAP on component detection
- Data: 10,000 annotated interior images

Phase 2: Color Change Pretraining (Week 2)
- Train CAIE on synthetic pairs
- Goal: PSNR > 35dB on modified region
- Data: 5,000 synthetic pairs

Phase 3: Material Variation (Week 3)
- Fine-tune on material change pairs
- Goal: Realistic material appearance
- Data: 2,000 material variation pairs

Phase 4: Real-World Fine-Tuning (Week 4)
- Fine-tune on real designer color changes
- Goal: Match designer preferences
- Data: 500 human-approved color changes
```

---

## Evaluation Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| PSNR (outside mask) | > 45 dB | Pixels outside mask unchanged |
| PSNR (inside mask) | > 35 dB | Modified region quality |
| SSIM | > 0.95 | Structural similarity maintained |
| LPIPS | < 0.05 | Perceptual distance low |
| FID | < 10 | Distribution match with real recolored images |
| User Acceptance | > 90% | Designers accept AI recolored images |
| Speed | < 5 seconds | Time to recolor a component |

---

## Inference Pipeline (Production)

```javascript
class ColorChangeInference {
  async recolorComponent(renderImage, componentDescription, newColor, newMaterial) {
    // 1. STEP 1: Find the component in the render
    // Use CLIP + SAM to locate the described component
    
    const clip = new CLIPModel();
    const textEmbedding = await clip.embedText(
      `the ${componentDescription} in this room`
    );
    const imageEmbedding = await clip.embedImage(renderImage);
    
    // Find the segmentation mask that best matches the description
    const sam = new SAMModel();
    const masks = await sam.segment(renderImage);
    
    let bestMask = null;
    let bestScore = -1;
    
    for (const mask of masks) {
      const maskEmbedding = await clip.embedMaskedRegion(renderImage, mask);
      const similarity = cosineSimilarity(textEmbedding, maskEmbedding);
      if (similarity > bestScore) {
        bestScore = similarity;
        bestMask = mask;
      }
    }
    
    if (bestScore < 0.6) {
      // Confidence too low — ask user to manually mask
      return {
        success: false,
        error: "Could not find the component automatically",
        alternative: "Please tap/draw on the component in the image"
      };
    }
    
    // 2. STEP 2: Apply the color change using CAIE model
    
    const caie = new ComponentAwareImageEditor();
    const result = await caie.edit({
      image: renderImage,
      mask: bestMask,
      targetColor: newColor,
      targetMaterial: newMaterial
    });
    
    // 3. STEP 3: Post-processing
    // - Ensure color fidelity
    // - Check boundary quality
    // - Apply any gamma/contrast adjustments
    
    const postProcessed = await postProcess(result);
    
    return {
      success: true,
      image: postProcessed,
      mask: bestMask,
      processingTime: result.processingTime
    };
  }
}
```

---

## Training Progress Monitoring

```
┌──────────────────────────────────────────────────────────────┐
│  AI TRAINING DASHBOARD                                       │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Model: Component-Aware Image Editor V2                      │
│  Status: TRAINING — Phase 2 (Color Change Pretraining)      │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  LOSS CURVE                                          │   │
│  │                                                       │   │
│  │  Loss  ██                                            │   │
│  │  0.8   ██  ██                                        │   │
│  │  0.6   ██  ██  ██  ██                                │   │
│  │  0.4   ██  ██  ██  ██  ██  ██                       │   │
│  │  0.2   ██  ██  ██  ██  ██  ██  ██  ██  ██          │   │
│  │  0.0   ████████████████████████████████████████████   │   │
│  │        └─── Epoch ──▶                              │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌─────┬─────────────────────────────┬────────┬─────────┐  │
│  │ EPOCH│ METRIC                      │ VALUE  │ TARGET  │  │
│  ├─────┼─────────────────────────────┼────────┼─────────┤  │
│  │ 42  │ PSNR (outside mask)         │ 44.2   │ > 45     │  │
│  │ 42  │ PSNR (inside mask)          │ 33.8   │ > 35     │  │
│  │ 42  │ SSIM                        │ 0.93   │ > 0.95   │  │
│  │ 42  │ LPIPS                       │ 0.07   │ < 0.05   │  │
│  │ 42  │ User Acceptance (prelim)    │ 82%    │ > 90%    │  │
│  └─────┴─────────────────────────────┴────────┴─────────┘  │
│                                                              │
│  Estimated completion: 8 epochs remaining (~2 hours)         │
│  [Pause Training] [Save Checkpoint]                          │
└──────────────────────────────────────────────────────────────┘
```