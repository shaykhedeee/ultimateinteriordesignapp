# 43 — AI Brain Track Adaptation and Agent Prompt Strategy

## Purpose

This document scans the supplied AURA AI Brain material and adapts it to StudioOS without derailing the current product architecture.

The key rule remains:

> StudioOS is a geometry-first interior operating system. AI agents assist interpretation, layout, design, rendering, documentation, and budgeting — but the canonical truth remains the reviewed spatial model and versioned scene graph.

---

## 1. High-Level Verdict

The supplied AI Brain material is directionally strong in these areas:
- role-specialized agents
- explicit delegation logic
- conflict resolution hierarchy
- structured outputs
- budget and design separation
- layout as a constraint-satisfaction problem, not only a style problem

However, it becomes dangerous if interpreted as:
- “LLM first, geometry second”
- “multi-agent orchestration before core workflow reliability”
- “custom AI training before enough real operating data exists”

### StudioOS decision
Adopt the AI Brain content as:
- **prompt and orchestration strategy**
- **future service contract guidance**
- **agent responsibility boundaries**

Do not adopt it as a reason to:
- replace the scene graph with prompt outputs
- build a giant AI platform before the design workflow is production-credible

---

## 2. Correct Agent Structure for StudioOS

## 2.1 Master Orchestrator

The supplied MasterAgent concept is valid.

### StudioOS adaptation
The master orchestrator should:
- interpret the user’s intent
- understand current project stage
- read the active floor plan version, spatial model, scene version, materials, budget profile, and prior approvals
- route work to specialized subsystems
- reconcile conflicts using product policy

### Required StudioOS conflict order
A better hierarchy for this product is:

1. safety / physical feasibility
2. reviewed geometry truth
3. production feasibility
4. budget constraints
5. client brief / function
6. style / trend

This is stronger than pure “budget > style > trend” because interiors must survive actual execution.

---

## 2.2 Designer Agent

The supplied DesignerAgent prompt is strong for:
- color palette strategy
- style consistency
- lighting layering
- material compatibility
- room mood translation

### StudioOS adaptation
The Designer Agent should **not** directly invent final design truth.
It should generate:
- palette proposals
- material candidate sets
- room styling guidelines
- decor and lighting suggestions
- furniture type recommendations

Then those suggestions must be translated into:
- scene modules
- furniture/object placements
- material assignments
- lighting presets

So the Designer Agent becomes a **design recommender**, not the source of geometry truth.

---

## 2.3 Budget Agent

The supplied BudgetAgent content is useful and practical.

### StudioOS adaptation
Budget intelligence should become a first-class engine that can:
- score material swaps
- identify where visual savings are low-risk
- separate must-have vs buy-later items
- estimate cost drift when modules or finishes change

### Important StudioOS rule
The budget agent must be linked to:
- actual module quantities
- material takeoff assumptions
- hardware assumptions
- labor assumptions
- procurement categories

Otherwise it becomes generic advice instead of usable commercial intelligence.

---

## 3. GNN / Layout Model Material

The supplied PyTorch GNN layout architecture is a good **research direction**, especially because it treats layout as:
- room graph encoding
- furniture type encoding
- autoregressive placement
- overlap/accessibility penalties

### StudioOS decision
Use it as a **future ML architecture reference**, not as an immediate build dependency.

### Why not immediate
StudioOS still needs first:
- reliable reviewed geometry
- stable room/wall/opening entities
- robust catalog metadata
- enough accepted/rejected layouts for training data

### Correct near-term substitute
Before custom GNN training, StudioOS should use:
- deterministic layout heuristics
- rule-based clearance checks
- template-guided layout families
- memory-guided ranking
- constrained LLM recommendations

Then, once enough high-quality accepted designs exist, the GNN path becomes economically justified.

---

## 4. Immediate Product Use of the AI Brain Track

The most useful immediate application is not giant model training.
It is **better orchestration contracts**.

### Recommended near-term agent stack

#### A. Floor Plan Review Agent
Inputs:
- uploaded plan image/PDF
- one-dimension calibration
- overlay markers
- room/module intent annotations

Outputs:
- reviewed plan interpretation suggestions
- missing data prompts
- recommended room typing

#### B. Layout Assist Agent
Inputs:
- reviewed room geometry
- selected catalog items/modules
- room function
- clearance rules

Outputs:
- ranked placement options
- warnings
- alternative layouts

#### C. Materials + Style Agent
Inputs:
- room type
- client brief
- references
- budget band
- style preferences

Outputs:
- palette
- material shortlist
- finish combinations

#### D. Budget Optimization Agent
Inputs:
- active scene
- selected materials
- cost engine
- target budget

Outputs:
- savings opportunities
- upgrade opportunities
- impact explanations

#### E. Documentation Agent
Inputs:
- approved scene version
- elevation generator
- BOM preview

Outputs:
- sheet pack instructions
- missing wall/module drawing warnings
- production handoff readiness notes

---

## 5. Hard Rules for AI Prompting in StudioOS

### Rule 1
Every agent must read scene/project state, not hallucinate context.

### Rule 2
Every agent must return structured output, not only prose.

### Rule 3
No agent may modify canonical geometry directly without producing explicit patch operations or structured recommendations.

### Rule 4
Any agent suggestion that conflicts with geometry, safety, budget, or production rules must be surfaced as a warning rather than silently applied.

### Rule 5
Agent memory should learn from:
- approvals
- rejections
- selected materials
- preferred camera views
- accepted layout families

---

## 6. Final Decision

> The AURA AI Brain material should shape StudioOS’s orchestration and prompt strategy, but the product must continue to place reviewed geometry and scene data above agent prose. The strongest next use of this material is better delegation, better structured outputs, and better learning loops — not premature custom AI training infrastructure.
