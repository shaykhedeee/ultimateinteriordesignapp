import { CompanyProfile, RateItem, PaymentMilestone, MaterialItem } from './types';

export const DEFAULT_BANK_DETAILS = {
  accountName: "SPACIOUS VENTURE INTERIOR DESIGN STUDIO",
  bankName: "HDFC Bank",
  accountNumber: "50200095385369",
  ifscCode: "HDFC0001953",
  branch: "Sarjapur Road, Bangalore",
  upiId: "spaciousventure@hdfcbank"
};

export const DEFAULT_COMPANY_PROFILE: CompanyProfile = {
  name: "SPACIOUS VENTURE",
  tagline: "Factory-Direct Interior Studio",
  address: "Sulikunte Road, Sarjapur, Bengaluru, Karnataka 560099",
  phone: "+91 95385 36950",
  email: "info@spaciousventure.com",
  website: "www.spaciousventure.com",
  gstNo: "29AAGCS9538Q1Z2",
  logo: "/assets/spacious-venture-logo.png", // Prefill Spacious Venture Logo
  signature: "", // Base64 placeholder or empty
  bankDetails: DEFAULT_BANK_DETAILS
};

export const DEFAULT_SPECS = [
  "Carcass/Core: 18mm BWP (Boiling Water Proof) Marine Plywood for all wet areas (Kitchen & Vanity) and 18mm BWR (Boiling Water Resistant) Plywood for wardrobes and dry storage cabinets.",
  "Cabinet Backings: 8mm BWP Plywood backing for all cabinets, mechanically fastened and silicone-sealed to prevent moisture seepage.",
  "Shutters/Finish: 1.2mm Scratch-Resistant Acrylic for Kitchen shutters and 1.0mm Glossy/Matte/Texture Premium Laminates (Century/Greenlam/Virgo) for wardrobes and living displays.",
  "Hardware & Hinges: 3-way adjustable heavy-duty German Soft-Close Hinges by HETTICH or HAFELE, tested for 80,000 opening/closing cycles.",
  "Drawer Systems: Double-walled steel HETTICH InnoTech Atira Soft-Close Tandem Runner systems for sleek kitchen drawers.",
  "Accessories: Stainless Steel 304 anti-corrosive wire baskets, cutlery trays, and heavy-duty corner accessories.",
  "Edge-Banding: 2.0mm thickness moisture-resistant PVC Edge Banding on all exposed edges, machine-applied using hot-melt adhesive at 200°C.",
  "Countertops: 18mm Premium Z-Black Granite slab with double-nose edge profiling, polished under-counter sink cutouts and leak-proof jointing.",
  "Warranty & Support: 10-Year structural warranty against wood manufacturing defects + 2 years of free post-handover service support."
];

export const DEFAULT_TERMS = [
  "Manufacturer Pricing: All prices are factory-direct from our Sarjapur unit. No third-party showrooms or reseller markups are included.",
  "Validity: This quotation is valid for 15 days from the date of issue, after which rates may be subject to revision.",
  "Basis of Quote: This estimate is based on the floor plan layout. The final pricing is subject to revision based on actual site measurements.",
  "GST & Taxes: Quoted prices are exclusive of GST. GST @ 18% will be added to the final invoice.",
  "Exclusions: The quote does not include statutory civil work, electrical point shifting, plumbing fixtures, or installation of electronic appliances (chimney, hob, oven) unless listed.",
  "Cancellations: Since goods are manufactured to custom measurements, orders cannot be cancelled or exchanged once sign-off is done.",
  "Ceiling scope: False ceiling pricing is for framing/board installation only and excludes wiring, spotlights, and final painting.",
  "Hardware Allowance: Sliding wardrobe handles up to ₹400, kitchen handles up to ₹150, and loft handles up to ₹110 are included. Upgrades are charged extra.",
  "Materials Choice: Mirrors, glass doors, profiles, and quartz/granite counter-tops will be charged separately based on client specifications.",
  "Site Readiness: Installation timeline is dependent on site clearance, power availability, and plaster curing."
];

export const DEFAULT_PAYMENT_SCHEDULE = [
  { milestone: "1. Booking Advance (To initiate design & drawings)", percentage: 10, amount: 0 },
  { milestone: "2. Design Finalized (Before initiating factory production)", percentage: 50, amount: 0 },
  { milestone: "3. Material Dispatch (Upon material dispatch from factory)", percentage: 35, amount: 0 },
  { milestone: "4. Final Handover & Sign-off (Post-installation checks)", percentage: 5, amount: 0 }
];

export const DEFAULT_RATE_ITEMS: RateItem[] = [
  // Foyer
  {
    id: "r-foyer-shoerack",
    category: "Foyer",
    name: "Foyer Shoe Rack (With cushioned seating)",
    defaultDimensions: "4 x 3",
    defaultRate: 1450,
    rateType: "SQFT",
    defaultUnit: "Sqft",
    defaultMaterial: "BWR Plywood (Grade IS:303)",
    defaultFinish: "1.0mm Matte Laminate (Virgo/Century)",
    defaultHardware: "Hettich soft-close hinges & magnetic catchers"
  },
  {
    id: "r-foyer-partition",
    category: "Foyer",
    name: "CNC Jali Partition & Decorative Panel",
    defaultDimensions: "4 x 8",
    defaultRate: 1650,
    rateType: "SQFT",
    defaultUnit: "Sqft",
    defaultMaterial: "18mm MDF / Teak Wood frame",
    defaultFinish: "Duco Paint / Teak Veneer Polish",
    defaultHardware: "Stainless Steel L-clamps & anchor fasteners"
  },
  {
    id: "r-foyer-paneling",
    category: "Foyer",
    name: "Foyer Wall Rafter Paneling",
    defaultDimensions: "3 x 9",
    defaultRate: 1100,
    rateType: "SQFT",
    defaultUnit: "Sqft",
    defaultMaterial: "Charcoal Louver panels / BWR Plywood",
    defaultFinish: "Laminated / Textured Finish",
    defaultHardware: "Silicone sealant & heavy-duty adhesive tape"
  },
  {
    id: "r-foyer-cushionbench",
    category: "Foyer",
    name: "Cushioned Seating Bench with Shoe Drawers",
    defaultDimensions: "3 x 1.5",
    defaultRate: 1550,
    rateType: "SQFT",
    defaultUnit: "Sqft",
    defaultMaterial: "BWR Plywood (IS:303) with high-density foam padding",
    defaultFinish: "1.0mm Suede Laminate & Premium fabric upholstery",
    defaultHardware: "Hettich soft-close drawer runners"
  },

  // Living Room
  {
    id: "r-tv-console",
    category: "Living Room",
    name: "TV Entertainment Floating Console",
    defaultDimensions: "7 x 1.5",
    defaultRate: 1550,
    rateType: "SQFT",
    defaultUnit: "Sqft",
    defaultMaterial: "BWR Plywood (Grade IS:303)",
    defaultFinish: "1.0mm Glossy Laminate / Acrylic",
    defaultHardware: "Hettich soft-close drawer runners (Telescopic)"
  },
  {
    id: "r-tv-paneling",
    category: "Living Room",
    name: "TV Backing Wall Paneling (Marble / Wood sheet)",
    defaultDimensions: "8 x 9",
    defaultRate: 1200,
    rateType: "SQFT",
    defaultUnit: "Sqft",
    defaultMaterial: "PVC Marble Sheet / BWR Plywood framing",
    defaultFinish: "Polished Marble / Premium Teak Veneer",
    defaultHardware: "Heavy-duty L-clips & adhesive"
  },
  {
    id: "r-living-puja",
    category: "Living Room",
    name: "Puja Mandir (With CNC backlit panel)",
    defaultDimensions: "3 x 7",
    defaultRate: 1750,
    rateType: "SQFT",
    defaultUnit: "Sqft",
    defaultMaterial: "BWR Plywood / Teak Wood framing",
    defaultFinish: "Teak Veneer Polish & LED CNC backlit board",
    defaultHardware: "Hettich soft-close hinges & brass handles"
  },
  {
    id: "r-living-bookshelf",
    category: "Living Room",
    name: "Premium Full-height Bookshelf / Display Unit",
    defaultDimensions: "4 x 7",
    defaultRate: 1450,
    rateType: "SQFT",
    defaultUnit: "Sqft",
    defaultMaterial: "BWR Plywood carcass with Glass partition panels",
    defaultFinish: "1.0mm Matte Laminate & LED strip profiles",
    defaultHardware: "Hettich soft-close hinges & glass door locks"
  },
  {
    id: "r-living-sofa",
    category: "Living Room",
    name: "Custom 3-Seater Fabric Sofa (Premium foam)",
    defaultDimensions: "1 Unit",
    defaultRate: 32000,
    rateType: "LUMPSUM",
    defaultUnit: "Nos",
    defaultMaterial: "Solid Sal wood frame & 40-density Sleepwell foam",
    defaultFinish: "Premium stain-resistant fabric (allowance ₹600/mtr)",
    defaultHardware: "N/A"
  },

  // Dining Area
  {
    id: "r-dining-crockery",
    category: "Dining Area",
    name: "Dining Crockery Cabinet (Glass Profile Shutters)",
    defaultDimensions: "5 x 7",
    defaultRate: 1650,
    rateType: "SQFT",
    defaultUnit: "Sqft",
    defaultMaterial: "BWR Plywood carcass & Aluminium frame profile",
    defaultFinish: "Fluted/Clear Glass with inside LED strip lighting",
    defaultHardware: "Hettich Profile hinges & magnetic touch latches"
  },
  {
    id: "r-dining-bar",
    category: "Dining Area",
    name: "Breakfast Counter / Bar Unit",
    defaultDimensions: "5 x 3.5",
    defaultRate: 1850,
    rateType: "SQFT",
    defaultUnit: "Sqft",
    defaultMaterial: "BWR Plywood carcass & 18mm Quartz Top",
    defaultFinish: "Premium Glossy Laminate / Quartz edge-moulded",
    defaultHardware: "Hettich corner brackets & steel support legs"
  },
  {
    id: "r-dining-chair",
    category: "Dining Area",
    name: "Upholstered Dining Chair (Sal wood frame)",
    defaultDimensions: "1 Unit",
    defaultRate: 6500,
    rateType: "LUMPSUM",
    defaultUnit: "Nos",
    defaultMaterial: "Solid Sal wood frame with cushioned seat and backrest",
    defaultFinish: "Polished wood legs & premium fabric finish",
    defaultHardware: "N/A"
  },
  {
    id: "r-dining-barcabinet",
    category: "Dining Area",
    name: "Executive Bar Cabinet (With Wine rack & Mirror)",
    defaultDimensions: "4 x 6",
    defaultRate: 1750,
    rateType: "SQFT",
    defaultUnit: "Sqft",
    defaultMaterial: "BWR Plywood with diamond-cut mirror backing",
    defaultFinish: "Teak Veneer Polish with gold metal profile inserts",
    defaultHardware: "Hettich soft-close hinges & brass wine-glass holders"
  },

  // Kitchen
  {
    id: "r-k-base",
    category: "Kitchen",
    name: "Modular Kitchen Counter Base Unit (BWP Plywood)",
    defaultDimensions: "10 x 2.75",
    defaultRate: 1850,
    rateType: "SQFT",
    defaultUnit: "Sqft",
    defaultMaterial: "BWP Marine Plywood (Grade IS:710)",
    defaultFinish: "1.2mm Scratch-resistant Acrylic (Anti-scratch)",
    defaultHardware: "Hettich soft-close hinges & Hettich tandem runners"
  },
  {
    id: "r-k-wall",
    category: "Kitchen",
    name: "Overhead Storage Wall Unit (BWR Plywood)",
    defaultDimensions: "10 x 2",
    defaultRate: 1650,
    rateType: "SQFT",
    defaultUnit: "Sqft",
    defaultMaterial: "BWR Plywood (Grade IS:303)",
    defaultFinish: "1.0mm Glossy Laminate / Frosted glass profile",
    defaultHardware: "Hettich soft-close hinges & hydraulic gas-lifts"
  },
  {
    id: "r-k-tall",
    category: "Kitchen",
    name: "Tall Pantry Unit (Microwave/Oven cavity)",
    defaultDimensions: "2 x 7",
    defaultRate: 1950,
    rateType: "SQFT",
    defaultUnit: "Sqft",
    defaultMaterial: "BWP Marine Plywood (Grade IS:710)",
    defaultFinish: "1.2mm Acrylic Shutter / Laminate interior",
    defaultHardware: "Hettich pantry pull-out basket system & hinges"
  },
  {
    id: "r-k-loft",
    category: "Kitchen",
    name: "Kitchen Loft Framing & Shutters",
    defaultDimensions: "10 x 2",
    defaultRate: 850,
    rateType: "SQFT",
    defaultUnit: "Sqft",
    defaultMaterial: "BWR Plywood framing & doors",
    defaultFinish: "1.0mm Glossy Laminate (Matching wall cabinets)",
    defaultHardware: "Hettich soft-close hinges & magnetic catches"
  },
  {
    id: "r-k-granite",
    category: "Kitchen",
    name: "Z-Black Granite Countertop & Profiling",
    defaultDimensions: "1 Unit",
    defaultRate: 18000,
    rateType: "LUMPSUM",
    defaultUnit: "Nos",
    defaultMaterial: "18mm Premium Z-Black Granite slab",
    defaultFinish: "Mirror-polished & double-nose edge profiled",
    defaultHardware: "Epoxy adhesive & steel reinforcement rods"
  },
  {
    id: "r-k-cutlery",
    category: "Kitchen",
    name: "Cutlery+Cup+Thali (CCT) Basket set",
    defaultDimensions: "1 Set",
    defaultRate: 9600,
    rateType: "LUMPSUM",
    defaultUnit: "Nos",
    defaultMaterial: "Stainless Steel 304 wire baskets",
    defaultFinish: "Chrome plated / SS brush finish",
    defaultHardware: "Ebco Telescopic slide runners (Soft-close)"
  },
  {
    id: "r-k-pullout",
    category: "Kitchen",
    name: "Bottle Pull Out (2 Tier SS)",
    defaultDimensions: "1 unit",
    defaultRate: 5600,
    rateType: "LUMPSUM",
    defaultUnit: "Nos",
    defaultMaterial: "Stainless Steel 304 wire frame",
    defaultFinish: "SS Polished Finish",
    defaultHardware: "Hettich soft-close bottom-mount runners"
  },
  {
    id: "r-k-gola",
    category: "Kitchen",
    name: "Gola Profile Handles (L-Section)",
    defaultDimensions: "1 Unit",
    defaultRate: 9600,
    rateType: "LUMPSUM",
    defaultUnit: "LS",
    defaultMaterial: "Extruded Aluminium profile channel",
    defaultFinish: "Anodized Black / Champagne Gold Finish",
    defaultHardware: "Aluminium fixing brackets & end-caps"
  },
  {
    id: "r-k-tandem",
    category: "Kitchen",
    name: "Tandem Drawer Boxes (Hettich / Ebco)",
    defaultDimensions: "4 Drawer set",
    defaultRate: 20800,
    rateType: "LUMPSUM",
    defaultUnit: "Nos",
    defaultMaterial: "Double-walled steel drawer sides",
    defaultFinish: "Powder-coated Slate Grey / White",
    defaultHardware: "Hettich InnoTech Atira soft-close runners"
  },
  {
    id: "r-k-appliances",
    category: "Kitchen",
    name: "Appliance Garage with Rolling Shutter (Hafele)",
    defaultDimensions: "2 x 2.5",
    defaultRate: 16500,
    rateType: "LUMPSUM",
    defaultUnit: "Nos",
    defaultMaterial: "BWR Plywood box enclosure",
    defaultFinish: "Hafele PVC metallic silver rolling shutter",
    defaultHardware: "Hafele spring-assisted roller mechanism"
  },

  // Master Bedroom
  {
    id: "r-w-mbr-sliding",
    category: "Master Bedroom",
    name: "MBR Wardrobe (Sliding Shutter Premium)",
    defaultDimensions: "7 x 7",
    defaultRate: 1650,
    rateType: "SQFT",
    defaultUnit: "Sqft",
    defaultMaterial: "BWR Plywood (Century/Greenply) carcass",
    defaultFinish: "1.0mm Matte/Suede Laminate / Acrylic",
    defaultHardware: "Ebco/Hettich Top-running sliding system with soft-close"
  },
  {
    id: "r-w-mbr-hinged",
    category: "Master Bedroom",
    name: "MBR Wardrobe (Hinged Shutters)",
    defaultDimensions: "7 x 7",
    defaultRate: 1450,
    rateType: "SQFT",
    defaultUnit: "Sqft",
    defaultMaterial: "BWR Plywood carcass & doors",
    defaultFinish: "1.0mm Glossy/Matte Laminate",
    defaultHardware: "Hettich soft-close hinges & 12-inch profile handles"
  },
  {
    id: "r-w-mbr-dressing",
    category: "Master Bedroom",
    name: "MBR Dressing Unit (Mirror & Storage)",
    defaultDimensions: "3 x 7",
    defaultRate: 1450,
    rateType: "SQFT",
    defaultUnit: "Sqft",
    defaultMaterial: "BWR Plywood carcass & 5mm Saint Gobain Mirror",
    defaultFinish: "Premium laminate & edge-profile mirror trim",
    defaultHardware: "Hettich soft-close hinges & soft-close drawers"
  },
  {
    id: "r-mbr-hydraulicbed",
    category: "Master Bedroom",
    name: "King-size Hydraulic Storage Bed (Premium)",
    defaultDimensions: "1 Unit",
    defaultRate: 48000,
    rateType: "LUMPSUM",
    defaultUnit: "Nos",
    defaultMaterial: "BWR Plywood framing & 12mm backing board",
    defaultFinish: "1.0mm Suede Laminate on all exposed surfaces",
    defaultHardware: "Heavy-duty 150kg hydraulic lift-up gas struts (Ebco)"
  },
  {
    id: "r-mbr-headboard",
    category: "Master Bedroom",
    name: "Wall-mounted Tufted Cushioned Headboard",
    defaultDimensions: "6.5 x 3",
    defaultRate: 1200,
    rateType: "SQFT",
    defaultUnit: "Sqft",
    defaultMaterial: "12mm BWR Plywood backing with 3-inch foam cushion",
    defaultFinish: "Tufted Velvet / Leatherette upholstery",
    defaultHardware: "Heavy-duty Z-clips & wall mounting anchors"
  },
  {
    id: "r-mbr-studydesk",
    category: "Master Bedroom",
    name: "Wall-hung Study / Office Desk (Dual Drawer)",
    defaultDimensions: "4 x 1.5",
    defaultRate: 1350,
    rateType: "SQFT",
    defaultUnit: "Sqft",
    defaultMaterial: "BWR Plywood carcass and top",
    defaultFinish: "1.0mm Scratch-resistant Matte Laminate",
    defaultHardware: "Hettich telescopic slides & key lock"
  },

  // Kids Bedroom
  {
    id: "r-w-kbr-hinged",
    category: "Kids Bedroom",
    name: "KBR Wardrobe (Hinged - Playful Dual Tone)",
    defaultDimensions: "6 x 7",
    defaultRate: 1450,
    rateType: "SQFT",
    defaultUnit: "Sqft",
    defaultMaterial: "BWR Plywood carcass & shutters",
    defaultFinish: "1.0mm Dual-tone Matte Laminate (Century/Virgo)",
    defaultHardware: "Hettich soft-close hinges & child-safe soft handles"
  },
  {
    id: "r-w-kbr-study",
    category: "Kids Bedroom",
    name: "Kids Study Desk & Bookshelf Combo",
    defaultDimensions: "4 x 6",
    defaultRate: 1350,
    rateType: "SQFT",
    defaultUnit: "Sqft",
    defaultMaterial: "BWR Plywood carcass & shelves",
    defaultFinish: "1.0mm Matte Laminate (Scratch-resistant)",
    defaultHardware: "Ebco telescopic runners & wire-grommet caps"
  },
  {
    id: "r-kbr-trundlebed",
    category: "Kids Bedroom",
    name: "Kids Single Bed with Pullout Trundle Bed",
    defaultDimensions: "1 Unit",
    defaultRate: 38000,
    rateType: "LUMPSUM",
    defaultUnit: "Nos",
    defaultMaterial: "BWR Plywood heavy-duty structure",
    defaultFinish: "1.0mm Dual-tone Suede Laminate",
    defaultHardware: "Ebco heavy-duty bottom castors & corner brackets"
  },

  // Guest Bedroom
  {
    id: "r-w-gbr-hinged",
    category: "Guest Bedroom",
    name: "GBR Wardrobe (Hinged Shutters)",
    defaultDimensions: "6 x 7",
    defaultRate: 1450,
    rateType: "SQFT",
    defaultUnit: "Sqft",
    defaultMaterial: "BWR Plywood carcass & doors",
    defaultFinish: "1.0mm Matte/Suede Laminate",
    defaultHardware: "Hettich soft-close hinges & sleek steel handles"
  },

  // Wardrobe Loft
  {
    id: "r-w-loft-standard",
    category: "Wardrobe Loft",
    name: "Wardrobe Loft Framing & Panels",
    defaultDimensions: "7 x 2",
    defaultRate: 850,
    rateType: "SQFT",
    defaultUnit: "Sqft",
    defaultMaterial: "BWR Plywood framing & shutters",
    defaultFinish: "1.0mm Matte Laminate (Matching wardrobe below)",
    defaultHardware: "Hettich soft-close hinges & magnetic catches"
  },

  // Bathrooms
  {
    id: "r-bath-vanity",
    category: "Bathrooms",
    name: "Bathroom Vanity Counter Cabinet",
    defaultDimensions: "3 x 2.5",
    defaultRate: 1850,
    rateType: "SQFT",
    defaultUnit: "Sqft",
    defaultMaterial: "BWP Marine Plywood (Grade IS:710)",
    defaultFinish: "1.2mm Acrylic / Premium laminate inside",
    defaultHardware: "Stainless Steel 304 soft-close hinges (Anti-rust)"
  },
  {
    id: "r-bath-mirror",
    category: "Bathrooms",
    name: "Led Backlit Mirror & Wall Cabinet",
    defaultDimensions: "2.5 x 3",
    defaultRate: 6500,
    rateType: "LUMPSUM",
    defaultUnit: "Nos",
    defaultMaterial: "5mm Saint Gobain copper-free mirror & WPC board",
    defaultFinish: "LED strip backing & touch sensor switch",
    defaultHardware: "Wall mount bracket hooks & WPC casing"
  },

  // Utility
  {
    id: "r-utility-storage",
    category: "Utility",
    name: "Washing Machine Cabinet & Utility Storage",
    defaultDimensions: "4 x 6",
    defaultRate: 1550,
    rateType: "SQFT",
    defaultUnit: "Sqft",
    defaultMaterial: "BWP Marine Plywood (Grade IS:710)",
    defaultFinish: "1.0mm Exterior grade laminate (Century)",
    defaultHardware: "Stainless Steel 304 rust-proof hinges & locks"
  },

  // False Ceiling
  {
    id: "r-ceiling-peripheral",
    category: "False Ceiling",
    name: "False Ceiling (Gypsum Peripheral with COB cutouts)",
    defaultDimensions: "150 sqft",
    defaultRate: 115,
    rateType: "SQFT",
    defaultUnit: "Sqft",
    defaultMaterial: "G.I. metal framework sections & Saint Gobain boards",
    defaultFinish: "Putty finish and 2 coats of Asian Paints Premium emulsion",
    defaultHardware: "Self-tapping drywall screws & jointing tape"
  },
  {
    id: "r-ceiling-grid",
    category: "False Ceiling",
    name: "Grid Ceiling (PVC/Moisture-proof for Bathrooms)",
    defaultDimensions: "35 sqft",
    defaultRate: 140,
    rateType: "SQFT",
    defaultUnit: "Sqft",
    defaultMaterial: "Powder coated T-Grid framework & PVC tiles",
    defaultFinish: "PVC Matte finish (Water-resistant)",
    defaultHardware: "G.I. suspension wire rods & wall angles"
  },

  // General Works / Painting / Services
  {
    id: "r-service-painting",
    category: "General Works",
    name: "Asian Paints Royale Emulsion Interior Painting",
    defaultDimensions: "Full home",
    defaultRate: 45000,
    rateType: "LUMPSUM",
    defaultUnit: "LS",
    defaultMaterial: "Asian Paints Royale Luxury Emulsion, Putty & Primer",
    defaultFinish: "Smooth eggshell sheen finish",
    defaultHardware: "N/A"
  },
  {
    id: "r-service-electrical",
    category: "General Works",
    name: "Electrical Point Shifting & Wiring (Kitchen / Living)",
    defaultDimensions: "1 Unit",
    defaultRate: 7500,
    rateType: "LUMPSUM",
    defaultUnit: "Nos",
    defaultMaterial: "Finolex/Havells FR copper wires & Anchor Roma conduits",
    defaultFinish: "Recessed wall routing, plastering & safety checking",
    defaultHardware: "N/A"
  },
  {
    id: "r-service-plumbing",
    category: "General Works",
    name: "Plumbing Point Shifting & Sink Installation",
    defaultDimensions: "1 Unit",
    defaultRate: 6000,
    rateType: "LUMPSUM",
    defaultUnit: "Nos",
    defaultMaterial: "Supreme CPVC pipes, fittings & solvent cement",
    defaultFinish: "Under-counter leakage-proof pressure testing",
    defaultHardware: "Stainless Steel 304 waste coupler & connection pipes"
  },
  {
    id: "r-service-cleaning",
    category: "General Works",
    name: "Post-Installation Deep Cleaning Service",
    defaultDimensions: "1 Unit",
    defaultRate: 8500,
    rateType: "LUMPSUM",
    defaultUnit: "LS",
    defaultMaterial: "Eco-friendly cleaning solvents & sanitizers",
    defaultFinish: "Sawdust removal, window pane cleaning & laminate buffing",
    defaultHardware: "N/A"
  },
  {
    id: "r-service-demolition",
    category: "General Works",
    name: "Civil Kitchen Slab Demolition & Debris Shifting",
    defaultDimensions: "1 Unit",
    defaultRate: 9500,
    rateType: "LUMPSUM",
    defaultUnit: "LS",
    defaultMaterial: "Demolition machinery and labor safety gear",
    defaultFinish: "Slab removal, wall chiseling & site leveling",
    defaultHardware: "N/A"
  },
  {
    id: "r-service-cladding",
    category: "General Works",
    name: "Kitchen Wall Dado Tiling / Quartz Cladding",
    defaultDimensions: "45 sqft",
    defaultRate: 180,
    rateType: "SQFT",
    defaultUnit: "Sqft",
    defaultMaterial: "Premium ceramics / Quartz slab & epoxy tile grout",
    defaultFinish: "Flush spacer alignment, grouting & dry clean",
    defaultHardware: "N/A"
  },
  {
    id: "r-service-wallpaper",
    category: "General Works",
    name: "Premium Wallpaper Installation (Living/Bedrooms)",
    defaultDimensions: "100 sqft",
    defaultRate: 95,
    rateType: "SQFT",
    defaultUnit: "Sqft",
    defaultMaterial: "Premium non-woven wallpaper roll & organic starch adhesive",
    defaultFinish: "Seamless joint matching & bubble removal",
    defaultHardware: "N/A"
  },
  {
    id: "r-service-profilelight",
    category: "General Works",
    name: "LED Profile Light Groove Cutting & Driver Installation",
    defaultDimensions: "1 Unit",
    defaultRate: 4800,
    rateType: "LUMPSUM",
    defaultUnit: "LS",
    defaultMaterial: "16mm Aluminium profiles, diffuser & 120-LED strip",
    defaultFinish: "Flush ceiling/plywood integration & driver connection",
    defaultHardware: "DC 12V constant-voltage driver power supply"
  },
  {
    id: "r-office-receptiondesk",
    category: "General Works",
    name: "Commercial Reception Desk / Console",
    defaultDimensions: "6 x 3.5",
    defaultRate: 2200,
    rateType: "SQFT",
    defaultUnit: "Sqft",
    defaultMaterial: "18mm BWP Marine Plywood",
    defaultFinish: "Acrylic & Warm LED strip highlights",
    defaultHardware: "Hettich soft-close drawer runners & locks"
  },
  {
    id: "r-office-conftable",
    category: "General Works",
    name: "Premium Conference Room Table (With cable manager)",
    defaultDimensions: "1 Unit",
    defaultRate: 25000,
    rateType: "LUMPSUM",
    defaultUnit: "Nos",
    defaultMaterial: "18mm BWR Plywood with solid wood lipping",
    defaultFinish: "Teak Veneer Polish & Leatherette inlay",
    defaultHardware: "Pop-up cable managers & wire pathways"
  },
  {
    id: "r-office-cabinets",
    category: "General Works",
    name: "Office Executive Storage Cabinets / File Storage",
    defaultDimensions: "8 x 7",
    defaultRate: 1350,
    rateType: "SQFT",
    defaultUnit: "Sqft",
    defaultMaterial: "18mm BWR Plywood carcass & doors",
    defaultFinish: "1.0mm Matte Laminate (Virgo/Century)",
    defaultHardware: "Hettich soft-close hinges & central key-locks"
  },
  {
    id: "r-service-electrical",
    category: "General Works",
    name: "Electrical Point Shifting & Internal Wiring",
    defaultDimensions: "1 Point",
    defaultRate: 450,
    rateType: "LUMPSUM",
    defaultUnit: "Point",
    defaultMaterial: "Finolex FR PVC conduit & 1.5 sqmm copper wires",
    defaultFinish: "Concealed wall chasing & plaster finishing",
    defaultHardware: "Anchor/Roma modular switch box fitting"
  },
  {
    id: "r-service-demolition",
    category: "General Works",
    name: "Site Demolition & Debris Disposal / Clearance",
    defaultDimensions: "1 Unit",
    defaultRate: 15000,
    rateType: "LUMPSUM",
    defaultUnit: "LS",
    defaultMaterial: "Safety tarps & packing sacks",
    defaultFinish: "Clear site handover to installers",
    defaultHardware: "N/A"
  },
  {
    id: "r-service-extrafan",
    category: "General Works",
    name: "Premium Ceiling / Exhaust Fan Installation & Wiring",
    defaultDimensions: "1 Unit",
    defaultRate: 600,
    rateType: "LUMPSUM",
    defaultUnit: "Nos",
    defaultMaterial: "Ceiling anchor fastener & safety wires",
    defaultFinish: "Balancing check & switch connection",
    defaultHardware: "Heavy-duty drop-rod & canopy"
  },
  {
    id: "r-service-extraprofile",
    category: "General Works",
    name: "Extra LED Profile Light groove & installation",
    defaultDimensions: "1 Rft",
    defaultRate: 350,
    rateType: "LUMPSUM",
    defaultUnit: "Rft",
    defaultMaterial: "Aluminum groove channel & frosted diffuser clip",
    defaultFinish: "Flush joint matching and clean corners",
    defaultHardware: "12V constant-voltage driver power supply"
  },
  {
    id: "r-service-extraspotlight",
    category: "General Works",
    name: "Extra LED Spot Light / COB fixture & wiring",
    defaultDimensions: "1 Unit",
    defaultRate: 450,
    rateType: "LUMPSUM",
    defaultUnit: "Nos",
    defaultMaterial: "LED spot fitting with thermal heat-sink",
    defaultFinish: "Perfect ceiling spring clamping & alignment",
    defaultHardware: "Compact constant-current LED driver"
  },
  {
    id: "r-service-extralabor",
    category: "General Works",
    name: "Extra Site Cleaning & General Labour Charge",
    defaultDimensions: "1 Day",
    defaultRate: 850,
    rateType: "LUMPSUM",
    defaultUnit: "Day",
    defaultMaterial: "Cleaning solvents & garbage bags",
    defaultFinish: "Vacuuming & stain removal",
    defaultHardware: "N/A"
  }
];


export const PROJECT_TYPES = [
  "1 BHK Apartment",
  "2 BHK Apartment",
  "3 BHK Apartment",
  "4 BHK Apartment",
  "Villa / Row House",
  "Commercial / Office",
  "Other"
];

export const CATEGORY_SUGGESTIONS = [
  "Foyer",
  "Living Room",
  "Dining Area",
  "Kitchen",
  "Master Bedroom",
  "Kids Bedroom",
  "Guest Bedroom",
  "Wardrobe Loft",
  "Bathrooms",
  "Utility",
  "False Ceiling",
  "General Works"
];

export const DEFAULT_MATERIALS: MaterialItem[] = [
  // Carcass
  { id: 'c-bwr', name: 'BWR Plywood (Grade IS:303)', type: 'carcass', markupPercentage: 0, description: 'Water resistant plywood for wardrobes & dry storage' },
  { id: 'c-bwp', name: 'BWP Marine Plywood (Grade IS:710)', type: 'carcass', markupPercentage: 0.15, description: 'Boiling water proof marine plywood for kitchen & vanities' },
  { id: 'c-mdf', name: '18mm Premium MDF', type: 'carcass', markupPercentage: -0.10, description: 'Medium density fiberboard for decorative panelings' },
  { id: 'c-wpc', name: 'WPC (Wood Plastic Composite)', type: 'carcass', markupPercentage: 0.20, description: 'Highly waterproof board for bathroom cabinets' },
  
  // Finishes
  { id: 'f-lam-matte', name: '1.0mm Matte Laminate (Virgo/Century)', type: 'finish', markupPercentage: 0, description: 'Sleek matte laminate finish' },
  { id: 'f-lam-glossy', name: '1.0mm Glossy Laminate (Century/Greenlam)', type: 'finish', markupPercentage: 0.05, description: 'Premium glossy laminate finish' },
  { id: 'f-acrylic', name: '1.2mm Scratch-Resistant Acrylic', type: 'finish', markupPercentage: 0.25, description: 'High-density mirror-like scratch resistant acrylic' },
  { id: 'f-veneer', name: 'Premium Teak Veneer (Polished)', type: 'finish', markupPercentage: 0.35, description: 'Natural teak veneer with high-gloss PU polish' },
  { id: 'f-duco', name: 'Duco Paint Finish', type: 'finish', markupPercentage: 0.30, description: 'Premium seamless polyurethane paint coating' },
  { id: 'f-glass', name: 'Fluted Glass with Aluminium Profile', type: 'finish', markupPercentage: 0.20, description: 'Modern tinted/clear fluted glass with frame profile' },
  
  // Hardware
  { id: 'h-hettich-std', name: 'Hettich Soft-Close Standard', type: 'hardware', markupPercentage: 0, description: 'German Hettich hinges & basic runners' },
  { id: 'h-hettich-premium', name: 'Hettich InnoTech Atira Tandem', type: 'hardware', markupPercentage: 0.12, description: 'Double-walled steel tandem runners and silent hinges' },
  { id: 'h-blum-premium', name: 'Blumotion Premium (Blum)', type: 'hardware', markupPercentage: 0.25, description: 'Austrian Blum premium soft-close drawer and lift systems' },
  { id: 'h-hafele-std', name: 'Hafele Heavy-Duty hinges', type: 'hardware', markupPercentage: 0.05, description: 'Hafele certified hinges and dampers' },
  { id: 'h-ebco-std', name: 'Ebco Soft-Close Runners', type: 'hardware', markupPercentage: -0.05, description: 'Affordable ebco standard drawer channels' }
];
