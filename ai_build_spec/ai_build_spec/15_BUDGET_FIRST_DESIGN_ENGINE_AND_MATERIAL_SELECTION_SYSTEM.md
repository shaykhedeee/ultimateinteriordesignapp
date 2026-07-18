# 15 — Budget-First Design Engine and Material Selection System

## 1. Purpose

This document defines how the app should turn budget into design decisions.

The goal is to prevent a common failure in interior design workflows:
- building a beautiful design first
- discovering too late that the client cannot afford it

Instead, the app must guide the design based on:
- budget band
- room priorities
- client preferences
- maintenance expectations
- climate / durability needs
- scope type

---

## 2. Core Principle

> Budget is not a final check. Budget is an input to the design engine from day one.

This means:
- room/module suggestions must respect budget
- finish recommendations must respect budget
- upgrades and downgrades must be visible
- the client must see trade-offs early

---

## 3. Budget Inputs the App Must Capture

### Commercial Inputs
- target budget
- maximum budget
- financing needed?
- room priority ranking
- must-complete rooms vs deferable rooms
- preferred investment zones (kitchen, master bedroom, living room, etc.)

### Preference Inputs
- finish likes/dislikes
- maintenance preference
- premium highlight willingness
- brand sensitivity
- customization tolerance

---

## 4. Budget Bands

The app must support these normalized budget bands:

1. economy
2. standard
3. premium
4. luxury
5. ultra_luxury_bespoke

Each budget band must configure:
- allowed material tiers
- recommended hardware tiers
- recommended module complexity
- recommended amount of custom detailing
- expected project margin band

---

## 5. Material Tiering

Each material/product must be tagged with:
- category
- finish family
- cost tier
- maintenance score
- moisture suitability
- premium score
- room suitability

### Example tiers
#### Boards
- tier_1_budget
- tier_2_standard
- tier_3_premium
- tier_4_bespoke

#### Shutter Finishes
- laminate_budget
- laminate_premium
- acrylic_standard
- PU_premium
- veneer_premium
- glass_premium

#### Hardware
- standard
- mid_premium
- premium
- luxury

---

## 6. Budget Engine Behavior

## 6.1 Pre-Design Stage
Use client inputs to classify:
- viable budget band
- risk of over-design
- rooms that may need phased delivery

## 6.2 During Design
When user places modules or changes finishes:
- update room-wise estimate live
- show total budget consumption
- classify overages
- suggest cheaper/smarter alternatives

## 6.3 Pre-Quote Stage
Before final quote:
- show budget drift from original estimate
- show reasons for drift
- show downgrade paths and upgrade paths

---

## 7. Material Recommendation Logic

### Inputs
- room type
- budget band
- maintenance preference
- climate preference
- client likes/dislikes
- design style

### Output
A ranked list of materials/products.

### Example
For Hyderabad/Bengaluru humid or dust-prone conditions, HomeLane public pages repeatedly recommend moisture-resistant boards and durable laminates depending on context.[1](https://www.homelane.com/cities/interior-designers-hyderabad) [2](https://www.homelane.com/cities/interior-designers-bhubaneswar)

Your app should systematize this.

---

## 8. Scope Prioritization Logic

If budget is constrained, the app should support “scope optimization.”

### Example priority classes
- P1 essential: kitchen, wardrobes, basic storage
- P2 important: TV unit, crockery, study desk
- P3 optional: decor paneling, premium lights, specialty finishes
- P4 deferrable: loose styling, art, luxury upgrades

### Product behavior
If budget overrun happens:
- do not only show red number
- propose a revised scope path

---

## 9. Quote Presentation by Budget

The app should produce:
- **base quote** within budget target
- **recommended quote** balanced against preferences
- **premium stretch quote** if client wants highlights

This is far better than one flat quote.

---

## 10. Final Budget-First Requirement

> Every design decision that materially affects cost must be visible as a budget decision. The app must help the user design within budget, not merely calculate after the fact.
