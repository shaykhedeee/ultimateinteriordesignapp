# Indian Interior Design Expert Knowledge Base
# AURA training context — used for prompt injection, self-learning, and recommendations.

__toc__
- indian_context
- room_standards
- material_library
- laminate_bible
- hardware_bible
- vastu_principles
- budget_tiers
- vendor_contexts
- visual_style_lexicon
- self_learning_signals
- measurement_conventions

indian_context:
  climate_zones:
    - tropical_wet:
      states: [Kerala, coastal Karnataka, Konkan, coastal Maharashtra, Andaman]
      laminate_preferences:
        - moisture-resistant anti-fungal finishes
        - marine ply beds
      materials:
        - teak, iroko, jackfruit wood
        - rattan, cane
        - breathable cottons and linen
      lighting:
        - maximize daylight
        - UV-filtered glazing
        - recessed LED with diffusers
      layout:
        - cross-ventilation prioritized
        - raised platforms
        - lightweight furniture
    - tropical_dry:
      states: [Central India, interior Tamil Nadu, Telangana, Andhra, Rayalseema, parts of Karnataka]
      laminate_preferences:
        - thermal-stable low-gloss
        - earthy tones
      materials:
        - kota stone, Jodhpur sandstone
        - terracotta
        - lime plaster
        - kota stone tiles
      lighting:
        - warm ambient
        - limited direct sun glare
      layout:
        - deep overhangs
        - courtyard light wells
        - jharokha-inspired shaded openings
    - subtropical:
      states: [North India plains, Delhi NCR, Punjab, Haryana, Western UP, Bihar]
      laminate_preferences:
        - durable high-traffic finishes
        - laminate-backed shutters
      materials:
        - engineered wood
        - marble, brass
        - silk, brocade textiles
      lighting:
        - layered warm+cool
        - accent spotlights
      layout:
        - large wardrobes
        - pooja rooms NE oriented
        - double-height foyers in premium homes
    - alpine:
      states: [Himachal, Uttarakhand, Kashmir, Ladakh, hill stations]
      laminate_preferences:
        - thermal-compatible woodgrains
        - matte dark finishes
      materials:
        - walnut, oak
        - brass, wool
        - thick cottons and fur
      lighting:
        - warm ambient
        - fireplace focal points
      layout:
        - compact storage
        - heated platforms

room_standards:
  kitchen:
    min_counter_height_mm: 900
    min_corridor_width_mm: 900
    ideal_hob_clearance_mm: 600
    tall_unit_depth_mm: 600
    wall_unit_depth_mm: 300
    bottle_pullout: recommended
    corner_solution: le_carousel or magic_corner
    backsplash_height_mm: 600-750
    popular_layouts:
      - l_shape
      - parallel
      - u_shape
      - island_with_breakfast_bar
    laminate_preferences:
      carcass: moisture-resistant matte or anti-fingerprint
      shutter: high-gloss acrylic or textured matte
      brand_defaults:
        carcass: CenturyPly SF-9120, Greenlam MT-1001
        shutter: Merino MR-1101, Royale Touche W-4211
    vastu:
      hob: SE corner, face East while cooking
      sink: NE or NW wet zone
      fridge: NW or SE
      avoid: NE for hob, SW for sink
  pooja_room:
    min_width_mm: 900
    min_height_mm: 2100
    min_depth_mm: 450
    platform_height_mm: 150-200
    shelf_count_min: 3
    lighting: warm recessed + LED strip under teak/laminate shelf
    materials: teak, iroko, brass handles, glass shutters optional
    vastu: NE or East, avoid under staircase or toilet above
    door: sliding or folding, outward opening preferred
  wardrobe:
    min_width_mm: 1500
    min_height_mm: 2100
    min_depth_mm: 550
    internal_shelf_gap_mm: 400-450
    hanging_rod_height_mm:
      long: 1800
      short: 1000
    shutter_types:
      - hinged
      - sliding
      - open_with_loft
    accessories:
      - pantaloons rack
      - tie rack
      - jewelry drawer with mirror
      - pull-out mirror
      - shoe drawer at bottom
      - laundry hamper drawer
    laminate_usage:
      carcass: MR grade ply / CenturyPly
      shutter: Merino / Greenlam / Royale Touche
      favorite_brands: Merino, CenturyPly, Royale Touche, Greenlam
  living_room:
    tv_backdrop_width_mm: 2400-3000
    tv_backdrop_height_mm: 450-600
    sofa_depth_mm: 950-1700
    coffee_table_height_mm: 450
    clear_walkway_mm: 900-1200
    rug_size_rule: at least front legs of sofa on rug
    tv_unit_types:
      - wall-mounted floating
      - backlit led
      - open shelf
      - floor-standing cabinet
    materials:
      - teak frames
      - brass inlay panels
      - marble-top coffee table
  bedroom:
    bed_clearance_mm:
      sides: 600
      foot: 500
      circulation: 800
    bedside_table_height_mm: 450-600
    wardrobe_depth_mm: 550-600
  study_office:
    desk_depth_mm: 600
    desk_height_mm: 750
    monitor_distance_mm: 500-700
    shelving_depth_mm: 300-350

indian_furniture_modules:
  most_common:
    - kitchen_parallel_layout
    - tv_unit_wall_mounted
    - wardrobe_hinged_door
    - sofa_three_seater_linear
    - bed_queen_upholstered
  premium:
    - tv_unit_backlit_led
    - wardrobe_aristo_glass
    - kitchen_island_unit
    - pooja_unit_floor_standing
    - pooja_unit_glass_door
  budget_standard:
    - tv_unit_open_shelf
    - wardrobe_open_loft
    - kitchen_parallel_layout

laminate_bible:
  brands:
    Merino:
      strengths:
        - premium acrylic shutters
        - anti-fingerprint
        - suitable for wardrobes and kitchen shutters
        - wide designer color palette
      recommended_for:
        - wardrobe shutters
        - pooja unit shutters
        - TV unit backdrops
      notes: widely used by carpenters in Ahmedabad, Bangalore, Mumbai
    CenturyPly:
      strengths:
        - reliable carcass grade
        - moisture-resistant variants
        - broad availability
      recommended_for:
        - kitchen carcass
        - wardrobe carcass
        - interior carcass
      notes: SF-9120 is workhorse for interiors
    Royale Touche:
      strengths:
        - woodgrains
        - textured finishes
        - heavy-duty shutters
      recommended_for:
        - shutter facades
        - wardrobes
        - TV units
    Greenlam:
      strengths:
        - acrylic and stones
        - premium feel
      recommended_for:
        - feature walls
        - TV backdrops
    Egger:
      strengths:
        - European-grade laminates
        - consistent thickness
      recommended_for:
        - office and premium partitions
  finish_rules:
    carcass_interior: matte or texture matt, non-reflective
    shutter_facade: high-gloss acrylic for premium, anti-fingerprint matte for high use
    pooja_unit: warm woodgrain or teak veneer, soft lighting behind shutters
    tv_backdrop: black textured matte to hide smudges and reduce glare
  pooja_room_laminate_guidance:
    - warm woodgrains preferred
    - teak veneer
    - brass overlay with backlit LED
    - use anti-fingerprint matte for shutters touching deity area

hardware_bible:
  brands:
    Hettich:
      runners: InnoTech Atira, Sensys
      soft_close: standard for premium projects
    Blum:
      hinges: ClipTop, Blumotion
      lifts: AVENTOS
      favoured_for: premium overhead cabinets
    Ebco:
      baskets: wire pullout
      favoured_for: pantry and kitchen corner units
    Hafele:
      favoured_for: wardrobe accessories and pull-out systems
    handles:
      - profile handle aluminium long pull
      - knob brass antique
      - back knob for shutters
  placement_rules:
    drawer_runner_length_mm: depth_minus_10
    hinge_count_per_door: 2-3 depending height
    handle_height_mm: 50-100 from top
    soft_close: recommended for all shutters above 300mm height

measurement_conventions:
  units:
    primary: mm in drawings
    speaking: feet_and_inches in client conversation
    area: sqft in quotes, sqm in technical docs
  conversion:
    1_mm: 0.001_m
    1_ft: 304.8_mm
    approx_1ft: 300_mm
  note: Always keep exact mm in DB and DXF; convert for client proposals.

indian_budget_tiers:
  economy:
    laminate: CenturyPly SF series, Royale basic
    hardware: Ebco basic, local fittings
    expected_price_per_sqft: 1200-1600 INR
  standard:
    laminate: Royale Touche, Greenlam, Merino standard
    hardware: Hettich InnoTech, Blum ClipTop
    expected_price_per_sqft: 1600-2200 INR
  premium:
    laminate: Merino MR series, Greenlam Acrylic
    hardware: Hettich Sensys, Blum AVENTOS
    expected_price_per_sqft: 2200-3200 INR
  luxury:
    laminate: imported acrylic, mirror shutters, brass inlay
    hardware: full Blum/Hettich premium suite
    expected_price_per_sqft: 3200-5000 INR

vendor_contexts:
  common_vendors:
    - CenturyPly
    - Greenlam
    - Royale Touche
    - Merino
    - Hettich
    - Blum
    - Ebco
    - Hafele
  sourcing:
    local_dealers: preferred for fast replacement
    brand_authorized: required for warranty claims
    bulk_discounts: usually above 5000 sqft laminate or 100 hardware sets
  notes:
    - Merino and CenturyPly widely available in tier-2 cities
    - Hettich and Blum premium segments require authorized dealer

common_user_requests:
  high_frequency:
    - make this pooja unit bigger
    - add more pooja units
    - add more tv units
    - wardrobe with loft
    - parallel kitchen
    - vastu-compliant kitchen
    - vastu-compliant bedroom
    - budget optimization
    - laminate change for wardrobe
    - add brass handles
    - change pooja to sliding shutter
    - pooja unit in living room wall
  response_style:
    prefer_simple_actions: true
    suggest_catalog_items_first: true
    fallback_to_vendor_alternatives: true
    always_show_price_impact_when_possible: true
    default_budget_band_aware: true
    accepted_corrections_should_resurface: true

visual_style_lexicon:
  common_terms:
    - fluted panel
    - backlit LED
    - bookmatched marble
    - dado line
    - dado tile
    - pelmet
    - cornice
    - dado border
    - skirting
    - handleless
    - push-to-open
    - sliding shutters
    - glass shutters
    - brass inlay
    - jali
    - chhajja
    - jharokha
    - otla
    - chabutro
  image_prompt_rules:
    show_shadow_gaps: true
    show_push_to_open: true
    show_soft_close_motion: optional
    ledger_lines_on_drawings: true
    material_labels_on_drawings: true

self_learning_signals:
  user_feedback:
    accepted_recommendations:
      - istg_replace_laminate_with_merino
      - istg_move_pooja_to_ne_corner
      - istg_switch_to_sliding_wardrobe
      - istg_add_pantry_unit
      - istg_prefer_hettich_soft_close_over_ebco
      - istg_use_glass_shutters_for_pooja
      - istg_add_bottle_pullout
      - istg_avoid_mirror_wardrobe_in_master_bedroom
      - istg_prefer_parallel_kitchen_for_small_house
      - istg_use_rgb_led_for_tv_backdrop
    corrections_to_ignore:
      - istg_never_use_glass_for_wardrobe
      - istg_do_not_put_toilet_near_pooja
      - istg_avoid_open_loft_in_high_moisture_area
  storage_keys:
    preference_table: aura_preferences
    scope_org: organization
    scope_project: project
    scope_global: organization

vastu_principles:
  primary_orientation_rules:
    - kitchen_hob: SE corner, face East while cooking
    - sink: NE or NW wet zone, separate from fire zone
    - pooja_room: NE corner, elevated platform, clean, calm
    - master_bedroom: SW, bed head South or East
    - kids_bedroom: NW or W
    - living_room: NE or N for prosperity
    - toilet: NW or SE, not NE or SW
    - staircase: SW or W ideal, avoid NE
    - overhead_tank: SW or W, not N or NE
    - dining: NW or W, avoid SE
  material_implications:
    - NE: water elements, purity, light colors
    - SE: fire elements, warm colors, stainless/stone
    - SW: earth elements, heavy storage, stability
    - NW: air elements, flexibility, lighter storage
  notes:
    - Vastu is a preference signal, not a hard constraint
    - Always allow manual override by designer/user
    - Surface recommendations should never break structural feasibility
