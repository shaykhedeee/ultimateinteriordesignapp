// Premium Interior Design Data Options for Spacious Venture Studio
// NOTE: ALL PRICING METRICS HAVE BEEN COMPLETELY REMOVED

const DESIGN_DATA = {
  styles: [
    {
      id: 'modern-luxury',
      title: 'Modern Luxury',
      desc: 'Bold marble textures, metal trims, dramatic lighting, and sleek custom paneling.',
      icon: '✨'
    },
    {
      id: 'bohemian-chic',
      title: 'Bohemian Chic',
      desc: 'Warm textures, natural wicker/rattan elements, rich plants, and earthy palettes.',
      icon: '🌿'
    },
    {
      id: 'scandinavian-minimal',
      title: 'Scandinavian Minimal',
      desc: 'Clean geometric lines, light oak woods, matte finishes, and maximizing natural light.',
      icon: '📐'
    },
    {
      id: 'indian-contemporary',
      title: 'Indian Contemporary',
      desc: 'Rich hand-carved jali patterns, brass accents, warm teak wood, and vibrant block-colors.',
      icon: '🕉️'
    },
    {
      id: 'japandi-fusion',
      title: 'Japandi Fusion',
      desc: 'Japanese minimalism meets Scandinavian warmth—natural light oak, off-white sand textures, linen screens, and organic paper lighting.',
      icon: '🌸'
    },
    {
      id: 'industrial-rustic',
      title: 'Industrial Rustic',
      desc: 'Exposed dark brick textures, rugged matte black steel structural grids, distressed rough-hewn timbers, and warm Edison bulbs.',
      icon: '⚙️'
    }
  ],

  tvUnits: [
    {
      id: 'louvered-walnut',
      title: 'Louvered Walnut Media Wall & Lofts',
      style: 'modern-luxury',
      desc: 'Vertical charcoal louvers paired with a floating walnut console, integrated LED backlights, and push-to-open overhead storage lofts.',
      dimensions: 'W: 2400mm x H: 2700mm x D: 400mm',
      materials: ['Charcoal Louver Panels', 'Walnut Veneer', 'Warm LED COB Strip', 'Action TESA HDMR Core lofts'],
      image: 'images/louvered_walnut_tv_1779969578489.png',
      svg: `<svg viewBox="0 0 400 250" fill="none" xmlns="http://www.w3.org/2000/svg">
        <!-- Background panel -->
        <rect x="20" y="20" width="360" height="210" fill="#181B2B" rx="10" stroke="rgba(255,255,255,0.05)" />
        <rect x="20" y="20" width="120" height="210" fill="url(#louvers-pattern-2)" />
        <!-- Led Glow -->
        <rect x="145" y="45" width="220" height="135" fill="none" stroke="#D4AF37" stroke-width="4" stroke-opacity="0.3" rx="4" />
        <rect x="150" y="50" width="210" height="125" fill="#0C0E17" rx="2" stroke="rgba(255,255,255,0.1)" />
        <!-- Simulated TV screen -->
        <rect x="170" y="70" width="170" height="90" fill="#000" rx="3" stroke="#333" />
        <polygon points="245,160 265,160 260,172 250,172" fill="#222" />
        <line x1="230" y1="172" x2="280" y2="172" stroke="#333" stroke-width="2" />
        <!-- Floating Cabinet -->
        <rect x="40" y="185" width="320" height="30" fill="#2D2115" rx="3" stroke="#D4AF37" stroke-width="1" />
        <!-- Drawer divisions -->
        <line x1="146" y1="185" x2="146" y2="215" stroke="rgba(255,255,255,0.1)" />
        <line x1="254" y1="185" x2="254" y2="215" stroke="rgba(255,255,255,0.1)" />
        <!-- Gold strip inlays -->
        <line x1="40" y1="200" x2="360" y2="200" stroke="#D4AF37" stroke-dasharray="10 5" stroke-opacity="0.5" />
        <defs>
          <pattern id="louvers-pattern-2" x="0" y="0" width="8" height="210" patternUnits="userSpaceOnUse">
            <rect x="0" y="0" width="4" height="210" fill="#222" />
            <rect x="4" y="0" width="4" height="210" fill="#111" />
          </pattern>
        </defs>
      </svg>`,
      colorVariations: {
        'warm-walnut': {
          title: 'Louvered Walnut & Brass',
          desc: 'Vertical charcoal louvers paired with a floating walnut console, gold PVD metal profiles, and warm LED COB strip loops.'
        },
        'grey-concrete': {
          title: 'Monochromatic Slate & Concrete',
          desc: 'Vertical concrete-finish composite louvers with floating carbon black drawers and satin silver handles.'
        },
        'classic-teak': {
          title: 'Bespoke Vintage Teak & Gold',
          desc: 'Natural wire-brushed teak wood console paired with golden PVD panels and hand-polished brass handles.'
        }
      }
    },
    {
      id: 'statutario-marble',
      title: 'Statutario Marble TV Panel & Storage',
      style: 'modern-luxury',
      desc: 'Seamless book-matched marble backdrop panel flanked by smoked glass shelving, custom gold metal borders, and high storage cabinets.',
      dimensions: 'W: 2700mm x H: 2700mm x D: 450mm',
      materials: ['Statutario Quartz Slab', 'Smoked Glass Shelves', 'Gold PVD Finish Trim', 'Action TESA HDMR core'],
      image: 'images/statutario_marble_tv_1779969617129.png',
      svg: `<svg viewBox="0 0 400 250" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="20" y="20" width="360" height="210" fill="#111" rx="10" />
        <!-- Marble Texture Backing -->
        <rect x="30" y="30" width="340" height="150" fill="#F8FAFC" rx="5" />
        <!-- Marble Veins -->
        <path d="M50,30 Q70,70 120,90 T210,130 T320,180" stroke="#CBD5E1" stroke-width="4" fill="none" stroke-linecap="round" />
        <!-- Smoked Glass Rack -->
        <rect x="320" y="35" width="40" height="140" fill="rgba(6, 182, 212, 0.15)" stroke="rgba(6, 182, 212, 0.4)" rx="2" />
        <rect x="30" y="190" width="340" height="25" fill="#181B2B" rx="3" stroke="#D4AF37" />
        <!-- TV Screen -->
        <rect x="70" y="50" width="220" height="110" fill="#050505" rx="3" stroke="#333" />
        <rect x="80" y="60" width="200" height="90" fill="#111" />
      </svg>`,
      colorVariations: {
        'gold-marble': {
          title: 'Statutario Gold Marble Panel',
          desc: 'Premium book-matched gold vein marble panel with champagne gold borders and high-gloss black base drawers.'
        },
        'emerald-malachite': {
          title: 'Green Malachite & Brass Panel',
          desc: 'Rich green malachite stone-finish backdrop slab flanked by gold-tinted mirrors and emerald green lacquered cabinets.'
        },
        'classic-onyx': {
          title: 'Backlit Honey Onyx & Wood',
          desc: 'Translucent amber Honey Onyx slab with integrated warm LED backlights and premium mahogany floating consoles.'
        }
      }
    },
    {
      id: 'teak-jali-tv',
      title: 'Vastu Teak TV Wall & Pooja Loft',
      style: 'indian-contemporary',
      desc: 'Traditional wire-brushed teak paneling integrated with CNC carved jali sliding screens, floating low-profile set-top box cabinets, and continuous storage lofts.',
      dimensions: 'W: 2600mm x H: 2700mm x D: 420mm',
      materials: ['Natural Teak Wood Veneer', 'CNC Jali boards', 'Brass handle bars', 'Ebco Soft-Close hinges'],
      svg: `<svg viewBox="0 0 400 250" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="20" y="20" width="360" height="210" fill="#1b120c" rx="10" />
        <rect x="30" y="30" width="100" height="150" fill="#4d301b" stroke="#AA820A" stroke-width="1" rx="4" />
        <rect x="145" y="50" width="210" height="115" fill="#111" rx="4" />
        <rect x="165" y="65" width="170" height="85" fill="#000" rx="2" />
        <rect x="30" y="190" width="340" height="25" fill="#5c381f" rx="3" stroke="#AA820A" />
      </svg>`,
      colorVariations: {
        'natural-teak': {
          title: 'Natural Golden Teak wood',
          desc: 'Traditional golden teak timber wire-brushed paneling paired with polished brass trim and ivory jali lattices.'
        },
        'royal-rosewood': {
          title: 'Deep Royal Rosewood & Copper',
          desc: 'Dark reddish rosewood veneer with antique copper-plated divider strips and charcoal-tinted CNC screen backdrops.'
        }
      }
    },
    {
      id: 'japandi-light-oak-tv',
      title: 'Floating Light Oak & Washi Media Wall',
      style: 'japandi-fusion',
      desc: 'Minimalist Scandinavian light pine backing panels integrated with floating white oak drawers, concealed wire management, and soft Washi paper backlit sconces.',
      dimensions: 'W: 2400mm x H: 2700mm x D: 380mm',
      materials: ['Light Oak Veneer', 'Washi Paper Lanterns', 'Natural Pine Rafters', 'Push-to-open hinges'],
      svg: `<svg viewBox="0 0 400 250" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="20" y="20" width="360" height="210" fill="#1C1B19" rx="10" />
        <!-- Light wood louvers background -->
        <rect x="30" y="30" width="340" height="150" fill="#F5EBE0" rx="4" />
        <line x1="60" y1="30" x2="60" y2="180" stroke="#E3D5CA" stroke-width="2" />
        <line x1="90" y1="30" x2="90" y2="180" stroke="#E3D5CA" stroke-width="2" />
        <line x1="310" y1="30" x2="310" y2="180" stroke="#E3D5CA" stroke-width="2" />
        <line x1="340" y1="30" x2="340" y2="180" stroke="#E3D5CA" stroke-width="2" />
        <!-- Floating light Oak console -->
        <rect x="50" y="185" width="300" height="28" fill="#DDB892" rx="3" stroke="#B08968" stroke-width="1" />
        <!-- Lighter panels -->
        <rect x="55" y="189" width="90" height="20" fill="#EDE0D4" rx="2" />
        <rect x="155" y="189" width="90" height="20" fill="#EDE0D4" rx="2" />
        <rect x="255" y="189" width="90" height="20" fill="#EDE0D4" rx="2" />
        <!-- Paper lamps glow -->
        <circle cx="50" cy="80" r="12" fill="rgba(253,224,71,0.2)" />
        <circle cx="50" cy="80" r="6" fill="#FFF" stroke="#D4AF37" />
        <circle cx="350" cy="80" r="12" fill="rgba(253,224,71,0.2)" />
        <circle cx="350" cy="80" r="6" fill="#FFF" stroke="#D4AF37" />
        <!-- TV Screen -->
        <rect x="95" y="50" width="210" height="110" fill="#141414" rx="3" stroke="#444" />
      </svg>`,
      colorVariations: {
        'light-oak': {
          title: 'Natural Light Oak & Linen',
          desc: 'Light Scandinavian pine wire-brushed louvers paired with floating warm linen-textured drawers and white sand quartz backdrops.'
        },
        'charcoal-washi': {
          title: 'Charcoal Black & Warm Washi',
          desc: 'Black-stained oak wood backing flutes contrasted with pure white washi paper panels and glowing amber led strips.'
        }
      }
    },
    {
      id: 'industrial-brick-tv',
      title: 'Exposed Brick & Metal Rack Media Wall',
      style: 'industrial-rustic',
      desc: 'Rugged exposed dark brick cladding paneling framed by matte black iron pipe racks, distressed railway-sleeper console, and copper wire accents.',
      dimensions: 'W: 2500mm x H: 2700mm x D: 420mm',
      materials: ['Eldorado Clay Brick tiles', 'Matte Black Iron Framing', 'Reclaimed Distressed Pine', 'Antique Edison bulbs'],
      svg: `<svg viewBox="0 0 400 250" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="20" y="20" width="360" height="210" fill="#0f0f12" rx="10" />
        <!-- Brick backdrop texture -->
        <rect x="35" y="30" width="330" height="150" fill="#7C2D12" rx="4" />
        <!-- Brick lines -->
        <line x1="35" y1="60" x2="365" y2="60" stroke="#451A03" stroke-width="1.5" stroke-dasharray="10 4" />
        <line x1="35" y1="95" x2="365" y2="95" stroke="#451A03" stroke-width="1.5" stroke-dasharray="14 3" />
        <line x1="35" y1="130" x2="365" y2="130" stroke="#451A03" stroke-width="1.5" stroke-dasharray="8 5" />
        <!-- Matte black metal side columns -->
        <rect x="40" y="25" width="8" height="165" fill="#18181B" />
        <rect x="352" y="25" width="8" height="165" fill="#18181B" />
        <!-- Distressed console -->
        <rect x="30" y="190" width="340" height="28" fill="#451A03" rx="2" stroke="#18181B" stroke-width="2" />
        <!-- TV Screen -->
        <rect x="85" y="48" width="230" height="115" fill="#09090b" rx="2" stroke="#222" />
      </svg>`,
      colorVariations: {
        'red-brick': {
          title: 'Exposed Red Brick & Pipe Iron',
          desc: 'Weathered red clay brick siding tiles flanked by industrial black powder-coated steel piping and reclaimed railway-tie low drawers.'
        },
        'grey-loft': {
          title: 'Soot Grey Concrete & Carbon Steel',
          desc: 'Raw formwork concrete panels detailed with cold-rolled carbon steel columns, black mesh grilles, and vintage copper accents.'
        }
      }
    }
  ],

  wardrobes: [
    {
      id: 'tinted-glass-sliding',
      title: 'Smoked Glass Sliding Wardrobe & Lofts',
      style: 'modern-luxury',
      desc: 'Curated sliding shutters with high tensile black aluminum framing, dark tinted reflective glass, auto-sensing internal LED sensor rods, and spacious overhead storage lofts.',
      dimensions: 'W: 2400mm x H: 3000mm (10ft) x D: 650mm',
      materials: ['Aluminum Profile Framing', 'Grey Reflective Glass', 'Internal LED sensor rods', 'IS 303 BWR Carcass lofts'],
      image: 'images/smoked_glass_wardrobe_1779969938746.png',
      svg: `<svg viewBox="0 0 400 250" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="80" y="15" width="240" height="220" fill="#111" rx="6" stroke="rgba(255,255,255,0.05)" />
        <line x1="80" y1="60" x2="320" y2="60" stroke="#333" stroke-width="2" />
        <line x1="80" y1="110" x2="320" y2="110" stroke="#333" stroke-width="2" />
        <line x1="80" y1="160" x2="320" y2="160" stroke="#333" stroke-width="2" />
        <line x1="90" y1="75" x2="190" y2="75" stroke="#666" stroke-width="3" />
        <rect x="80" y="15" width="118" height="220" fill="rgba(6, 182, 212, 0.12)" stroke="#222" stroke-width="2" />
        <rect x="200" y="15" width="120" height="220" fill="rgba(6, 182, 212, 0.08)" stroke="#222" stroke-width="2" />
        <rect x="188" y="90" width="4" height="60" fill="#D4AF37" rx="2" />
        <rect x="204" y="90" width="4" height="60" fill="#D4AF37" rx="2" />
      </svg>`,
      colorVariations: {
        'grey-smoked': {
          title: 'Smoked Grey Glass & Black Gold',
          desc: 'Reflective smoked grey glass sliding shutters with a black anodized aluminum profile and brushed champagne gold edge-pull handles.'
        },
        'bronze-reflective': {
          title: 'Reflective Bronze Glass & Rose Gold',
          desc: 'Rich bronze reflective glass doors bordered by rose gold tinted profile frames and automated warm interior LED rods.'
        }
      }
    },
    {
      id: 'matte-pu-swing',
      title: 'Full Height Matte PU Swing Shutters & Lofts',
      style: 'modern-luxury',
      desc: 'Elegant floor-to-ceiling swing doors painted in premium matte PU paint, combined with custom 900mm designer gold edge-pull handles and integrated 2-tier overhead lofts.',
      dimensions: 'W: 2400mm x H: 3000mm (with lofts) x D: 600mm',
      materials: ['Matte PU Paint Finish', 'Action TESA HDMR carcass', 'Gold PVD Edge Handles', 'Hettich soft-close hinges'],
      svg: `<svg viewBox="0 0 400 250" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="90" y="15" width="220" height="220" fill="#141B2D" rx="4" />
        <line x1="90" y1="70" x2="310" y2="70" stroke="rgba(255,255,255,0.15)" stroke-width="2" />
        <line x1="145" y1="15" x2="145" y2="235" stroke="rgba(0,0,0,0.4)" stroke-width="2" />
        <line x1="200" y1="15" x2="200" y2="235" stroke="rgba(0,0,0,0.4)" stroke-width="2" />
        <rect x="142" y="100" width="2" height="70" fill="#D4AF37" />
      </svg>`,
      colorVariations: {
        'royal-emerald': {
          title: 'Luxe Emerald Green & Gold',
          desc: 'Premium deep royal emerald matte PU swing doors detailed with champagne gold vertical edge handles.'
        },
        'slate-grey': {
          title: 'Sleek Slate Grey & Black Steel',
          desc: 'Ultra-matte graphite slate grey finish shutters with black PVD custom edge pulls and push-to-open lofts.'
        },
        'classic-ivory': {
          title: 'Soft Warm Ivory & Teak Trim',
          desc: 'Eggshell ivory matte painted doors detailed with integrated solid teak wood grooved profile handles.'
        }
      }
    },
    {
      id: 'washi-oak-sliding',
      title: 'Washi Paper & Light Oak Sliding Wardrobe',
      style: 'japandi-fusion',
      desc: 'Elegant sliding wood panels detailed with horizontal timber grids and translucent paper-weave screens, integrated with warm LED sensor hangers and standard storage lofts.',
      dimensions: 'W: 2400mm x H: 3000mm (with lofts) x D: 650mm',
      materials: ['Solid White Oak', 'Washi Paper Grille', 'Warm Sensor Rods', 'Calibrated Action TESA HDMR'],
      svg: `<svg viewBox="0 0 400 250" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="80" y="15" width="240" height="220" fill="#1C1B19" rx="6" stroke="rgba(255,255,255,0.05)" />
        <line x1="80" y1="60" x2="320" y2="60" stroke="#3A3835" stroke-width="2" />
        <!-- Grid panel sliding door 1 -->
        <rect x="80" y="15" width="118" height="220" fill="#F5EBE0" stroke="#B08968" stroke-width="2" />
        <line x1="80" y1="125" x2="198" y2="125" stroke="#B08968" stroke-width="1.5" />
        <line x1="80" y1="170" x2="198" y2="170" stroke="#B08968" stroke-width="1.5" />
        <line x1="80" y1="80" x2="198" y2="80" stroke="#B08968" stroke-width="1.5" />
        <!-- Grid panel sliding door 2 -->
        <rect x="200" y="15" width="120" height="220" fill="#F5EBE0" stroke="#B08968" stroke-width="2" />
        <line x1="200" y1="125" x2="320" y2="125" stroke="#B08968" stroke-width="1.5" />
        <line x1="200" y1="170" x2="320" y2="170" stroke="#B08968" stroke-width="1.5" />
        <line x1="200" y1="80" x2="320" y2="80" stroke="#B08968" stroke-width="1.5" />
        <rect x="188" y="90" width="4" height="60" fill="#B08968" rx="2" />
        <rect x="204" y="90" width="4" height="60" fill="#B08968" rx="2" />
      </svg>`,
      colorVariations: {
        'light-washi': {
          title: 'Natural Oak & Cream Washi',
          desc: 'Cream-colored fiber-glass washi paper panels set inside natural white oak sliding tracks with bronze details.'
        },
        'grey-linum': {
          title: 'Stained Oak & Natural Linen',
          desc: 'Charcoal soot-stained oak wood tracks holding natural textured vertical linen laminate sliding screens.'
        }
      }
    },
    {
      id: 'charcoal-steel-mesh',
      title: 'Charcoal Steel & Wire Mesh Swing Wardrobe',
      style: 'industrial-rustic',
      desc: 'Raw industrial steel framed swing shutters backed by reinforced wire-mesh glass, fitted with heavy distressed walnut core cases and high storage lofts.',
      dimensions: 'W: 2400mm x H: 3000mm (with lofts) x D: 600mm',
      materials: ['Matte Black Carbon Steel', 'Wire Mesh Safety Glass', 'Distressed Walnut Core', 'Hettich hydraulic hinges'],
      svg: `<svg viewBox="0 0 400 250" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="90" y="15" width="220" height="220" fill="#0f0f12" rx="4" />
        <!-- Loft line -->
        <line x1="90" y1="70" x2="310" y2="70" stroke="#27272A" stroke-width="2" />
        <!-- Vertical divisions -->
        <line x1="145" y1="15" x2="145" y2="235" stroke="#18181B" stroke-width="2" />
        <line x1="200" y1="15" x2="200" y2="235" stroke="#18181B" stroke-width="2" />
        <!-- Steel Grille texture simulated -->
        <rect x="95" y="75" width="44" height="150" fill="rgba(255,255,255,0.03)" stroke="#27272A" stroke-dasharray="2 2" />
        <rect x="150" y="75" width="44" height="150" fill="rgba(255,255,255,0.03)" stroke="#27272A" stroke-dasharray="2 2" />
        <rect x="205" y="75" width="44" height="150" fill="rgba(255,255,255,0.03)" stroke="#27272A" stroke-dasharray="2 2" />
        <!-- Copper handles -->
        <rect x="142" y="100" width="2" height="70" fill="#B45309" />
        <rect x="198" y="100" width="2" height="70" fill="#B45309" />
      </svg>`,
      colorVariations: {
        'black-mesh': {
          title: 'Soiled Matte Black Steel & Mesh',
          desc: 'Black powder-coated carbon steel swing framing panels with heavy industrial safety mesh-glass panels and copper grip bar pullers.'
        },
        'rust-copper': {
          title: 'Distressed Rust Patina & Amber Glass',
          desc: 'Faux rust-patina lacquered iron profile shutters with amber reflective safety glass and oil-rubbed bronze fittings.'
        }
      }
    }
  ],

  kitchens: [
    {
      id: 'l-shaped-acrylic',
      title: 'L-Shaped Gloss Acrylic Kitchen & Lofts',
      style: 'modern-luxury',
      desc: 'Seamless L-shaped layout combining high gloss acrylic under-counter drawers and premium frosted glass overhead cabinets, fitted with soft-close tandem systems and full-height lofts up to the ceiling.',
      materials: ['1.5mm High-Gloss Acrylic', 'IS 710 BWP Plywood Core (Base)', 'Quartz Countertop', 'Tandem Box Drawers'],
      image: 'images/acrylic_lshape_kitchen_1779969662380.png',
      svg: `<svg viewBox="0 0 400 250" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="20" y="20" width="360" height="210" fill="#0C0D14" rx="10" />
        <rect x="40" y="100" width="320" height="40" fill="#1E293B" rx="1" />
        <rect x="40" y="40" width="100" height="50" fill="#D4AF37" opacity="0.8" rx="2" />
        <rect x="40" y="140" width="320" height="12" fill="#F1F5F9" rx="2" />
        <rect x="40" y="152" width="220" height="60" fill="#0D9488" rx="2" />
        <rect x="175" y="70" width="40" height="30" fill="#475569" />
      </svg>`,
      colorVariations: {
        'mint-teal': {
          title: 'Glossy Teal & Mint Dual',
          desc: 'High specular mint green acrylic wall lofts paired with deep glossy teal blue base drawer boxes and white quartz countertops.'
        },
        'champagne-charcoal': {
          title: 'Champagne Gold & Charcoal Slate',
          desc: 'Matte concrete slate laminate bottom drawers paired with luxurious metallic champagne gold top shutters.'
        }
      }
    },
    {
      id: 'parallel-veneer',
      title: 'Parallel Premium Veneer Kitchen & Tall Units',
      style: 'modern-luxury',
      desc: 'Dual counter parallel design. Base cabinets feature natural oak wood veneer with non-yellowing PU paint, contrasted with matte charcoal tall pantry units and double lofts.',
      materials: ['Oak Wood Veneer', 'Matte Charcoal Shutter', 'Jet Black Granite Counter', 'Built-in Pantry Pullout'],
      svg: `<svg viewBox="0 0 400 250" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="20" y="20" width="360" height="210" fill="#0C0D14" rx="10" />
        <rect x="30" y="155" width="130" height="55" fill="#78350F" />
        <rect x="240" y="155" width="130" height="55" fill="#78350F" />
        <rect x="310" y="40" width="60" height="170" fill="#1E293B" rx="2" />
      </svg>`,
      colorVariations: {
        'charcoal-walnut': {
          title: 'Dark Charcoal & Walnut Veneer',
          desc: 'Base cabinets in wire-brushed natural walnut wood veneer topped by jet black granite, paired with charcoal grey tall pantries.'
        },
        'alabaster-oak': {
          title: 'Soft Alabaster & Natural Oak',
          desc: 'Light natural oak wood grain carcasses paired with pristine warm white alabaster matte lacquered facings.'
        }
      }
    },
    {
      id: 'japandi-clay-kitchen',
      title: 'Japandi Minimalist Oak & Clay Matte Kitchen',
      style: 'japandi-fusion',
      desc: 'Seamless handleless layout combining sand-textured clay matte bottom cabinets with raw white oak overhead cabinets, natural beige quartz countertop, and integrated slide-out bottle storage.',
      materials: ['Solid White Oak Veneer', 'Sand-Textured Clay Matte Finish', 'Cream Beige Quartz counter', 'Soft-close larder units'],
      svg: `<svg viewBox="0 0 400 250" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="20" y="20" width="360" height="210" fill="#1C1B19" rx="10" />
        <!-- Beige Quartz top counter -->
        <rect x="40" y="140" width="320" height="12" fill="#E8D8C8" rx="2" />
        <!-- Clay matte drawers -->
        <rect x="40" y="152" width="100" height="60" fill="#CBB29D" rx="2" />
        <rect x="145" y="152" width="100" height="60" fill="#CBB29D" rx="2" />
        <rect x="250" y="152" width="110" height="60" fill="#CBB29D" rx="2" />
        <!-- White Oak top shutters -->
        <rect x="40" y="40" width="80" height="60" fill="#EAE2B7" opacity="0.9" rx="2" />
        <rect x="125" y="40" width="80" height="60" fill="#EAE2B7" opacity="0.9" rx="2" />
        <!-- Minimal paper pendant light -->
        <line x1="280" y1="20" x2="280" y2="70" stroke="#8A8A8A" />
        <path d="M260,70 L300,70 L280,100 Z" fill="#F5EBE0" stroke="#8A8A8A" />
      </svg>`,
      colorVariations: {
        'clay-beige': {
          title: 'Sand Clay & White Oak',
          desc: 'Sand-textured matte clay drawers paired with natural wire-brushed white oak cabinets and beige quartz countertops.'
        },
        'olive-linen': {
          title: 'Olive Green & Flaxen Linen',
          desc: 'Muted olive green matte cabinets paired with light flaxen linen-textured wall panels and solid white solid-surface countertops.'
        }
      }
    },
    {
      id: 'industrial-concrete-kitchen',
      title: 'Industrial Distressed Pine & Concrete Parallel Kitchen',
      style: 'industrial-rustic',
      desc: 'Dual counter parallel layout featuring rugged cast-concrete countertops, distressed pine wood grain base carcasses, matte black carbon steel pipe shelf framework, and raw brick accents.',
      materials: ['Distressed Reclaimed Timber', 'Cast Concrete counter', 'Powder-Coated Steel pipes', 'Black metal mesh doors'],
      svg: `<svg viewBox="0 0 400 250" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="20" y="20" width="360" height="210" fill="#0c0d10" rx="10" />
        <!-- Concrete counter 1 -->
        <rect x="30" y="155" width="130" height="10" fill="#64748B" />
        <rect x="30" y="165" width="130" height="45" fill="#451A03" />
        <!-- Concrete counter 2 -->
        <rect x="240" y="155" width="130" height="10" fill="#64748B" />
        <rect x="240" y="165" width="130" height="45" fill="#451A03" />
        <!-- Steel racks on wall -->
        <rect x="40" y="40" width="110" height="6" fill="#18181B" />
        <line x1="50" y1="40" x2="50" y2="155" stroke="#18181B" stroke-width="2" />
        <line x1="140" y1="40" x2="140" y2="155" stroke="#18181B" stroke-width="2" />
      </svg>`,
      colorVariations: {
        'distressed-pine': {
          title: 'Distressed Pine & Raw Concrete',
          desc: 'Weathered railway-pine wood cabinets contrasted with rugged slate-grey cast concrete countertops and black iron details.'
        },
        'copper-charcoal': {
          title: 'Brushed Copper & Charcoal Slate',
          desc: 'Base drawers finished in brushed copper metallic sheets topped by jet black granite, with carbon black mesh overhead shelves.'
        }
      }
    }
  ],

  foyers: [
    {
      id: 'foyer-classic-shoe',
      title: 'Louvered Teak Foyer & Shoe Console',
      style: 'indian-contemporary',
      desc: 'Bespoke floating shoe cabinet console in natural teak veneer with micro vertical flutes, custom key drawer, and decorative bronze hooks.',
      dimensions: 'W: 1500mm x H: 1200mm x D: 350mm',
      materials: ['Solid Teak Wood', 'Antique Bronze Hooks', 'Drawer Lock System'],
      svg: `<svg viewBox="0 0 400 250" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="20" y="20" width="360" height="210" fill="#1C1510" rx="10" />
        <rect x="60" y="60" width="280" height="120" fill="#5F3F28" rx="4" stroke="#D4AF37" />
        <line x1="60" y1="100" x2="340" y2="100" stroke="#1C1510" stroke-width="2" />
        <line x1="200" y1="100" x2="200" y2="180" stroke="#1C1510" stroke-width="2" />
      </svg>`
    },
    {
      id: 'foyer-mirror-luxe',
      title: 'Glassmorphic Mirror & Storage Console',
      style: 'modern-luxury',
      desc: 'Asymmetrical floating console console featuring integrated full-length copper-free mirror framing and touchless LED backlight operations.',
      dimensions: 'W: 1600mm x H: 2200mm x D: 380mm',
      materials: ['Grey Backlit Mirror', 'High SPEC Gloss Laminate', 'Gold Frame Inlays'],
      image: 'images/statutario_marble_tv_1779969617129.png', // Secondary console mockup
      svg: `<svg viewBox="0 0 400 250" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="20" y="20" width="360" height="210" fill="#0E111A" rx="10" />
        <circle cx="200" cy="100" r="60" fill="rgba(6, 182, 212, 0.15)" stroke="#06B6D4" stroke-width="2.5" />
        <rect x="80" y="160" width="240" height="35" fill="#1E293B" rx="3" stroke="#D4AF37" />
      </svg>`
    },
    {
      id: 'foyer-japandi-bench',
      title: 'Linen Seating & Light Oak Shoe console',
      style: 'japandi-fusion',
      desc: 'Floating light white oak shoe storage console integrated with a soft off-white linen cushioned seating ledge and asymmetrical backlit round mirror.',
      dimensions: 'W: 1500mm x H: 2000mm x D: 350mm',
      materials: ['White Oak veneer', 'Natural Linen cushion', 'Round Copper-free LED mirror'],
      svg: `<svg viewBox="0 0 400 250" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="20" y="20" width="360" height="210" fill="#1C1B19" rx="10" />
        <circle cx="150" cy="80" r="50" fill="rgba(253,224,71,0.12)" stroke="#B08968" stroke-width="2" />
        <rect x="60" y="150" width="160" height="40" fill="#DDB892" rx="4" />
        <rect x="230" y="150" width="110" height="40" fill="#F5EBE0" rx="4" stroke="#B08968" />
        <text x="250" y="174" fill="#665A4E" font-size="11" font-weight="600">SEATING</text>
      </svg>`
    },
    {
      id: 'foyer-industrial-rack',
      title: 'Distressed Timber & Steel Mesh Coat Rack Console',
      style: 'industrial-rustic',
      desc: 'Heavy industrial entry console featuring carbon steel structural grid frames, wire-mesh backdrops, reclaimed timber drawers, and solid copper utility hooks.',
      dimensions: 'W: 1400mm x H: 2200mm x D: 380mm',
      materials: ['Distressed Railway sleepers', 'Carbon Steel Grid', 'Antique copper hooks'],
      svg: `<svg viewBox="0 0 400 250" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="20" y="20" width="360" height="210" fill="#0C0D0F" rx="10" />
        <!-- Wire mesh grid lines -->
        <line x1="80" y1="30" x2="80" y2="220" stroke="#18181B" stroke-width="1.5" />
        <line x1="320" y1="30" x2="320" y2="220" stroke="#18181B" stroke-width="1.5" />
        <rect x="70" y="160" width="260" height="45" fill="#451A03" rx="2" stroke="#18181B" stroke-width="2" />
        <!-- hooks -->
        <circle cx="120" cy="60" r="3" fill="#B45309" />
        <path d="M120,60 Q125,75 120,80" stroke="#B45309" stroke-width="2" fill="none" />
        <circle cx="280" cy="60" r="3" fill="#B45309" />
        <path d="M280,60 Q285,75 280,80" stroke="#B45309" stroke-width="2" fill="none" />
      </svg>`
    }
  ],

  temples: [
    {
      id: 'pooja-traditional-jali',
      title: 'CNC Carved Teak Pooja Mandir',
      style: 'indian-contemporary',
      desc: 'Intricately carved CNC wood jali shutters, dedicated brass bell hanging loops, stepped internal white quartz pedestal steps, and dome crown detailing.',
      dimensions: 'W: 1200mm x H: 2100mm x D: 600mm',
      materials: ['Solid Teak Jali', 'Quartz Stepped Pedestal', 'Hanging Brass Bells'],
      image: 'images/cnc_teak_mandir_1779969965502.png',
      svg: `<svg viewBox="0 0 400 250" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="20" y="20" width="360" height="210" fill="#1C0E06" rx="10" />
        <rect x="80" y="40" width="20" height="150" fill="#854D0E" rx="2" />
        <rect x="300" y="40" width="20" height="150" fill="#854D0E" rx="2" />
        <path d="M100,40 C100,10 300,10 300,40 Z" fill="#854D0E" />
        <line x1="150" y1="40" x2="150" y2="90" stroke="#D4AF37" />
        <circle cx="150" cy="94" r="4" fill="#D4AF37" />
        <rect x="110" y="130" width="180" height="60" fill="#F8FAFC" rx="2" />
      </svg>`
    },
    {
      id: 'pooja-japandi-niche',
      title: 'Minimalist Light Pine Pooja Shrine',
      style: 'japandi-fusion',
      desc: 'Clean handleless light pine wood shrine featuring translucent sliding shoji lattice panels, floating steps pedestal, and hidden warm backlight accents.',
      dimensions: 'W: 1000mm x H: 1800mm x D: 500mm',
      materials: ['Light Pine Wood', 'Shoji paper lattices', 'Concealed warm LEDs'],
      svg: `<svg viewBox="0 0 400 250" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="20" y="20" width="360" height="210" fill="#1C1B19" rx="10" />
        <rect x="100" y="40" width="200" height="140" fill="#F5EBE0" rx="4" />
        <line x1="100" y1="110" x2="300" y2="110" stroke="#DDB892" stroke-width="2" />
        <rect x="150" y="125" width="100" height="40" fill="#FFF" rx="2" stroke="#E3D5CA" />
      </svg>`
    },
    {
      id: 'pooja-industrial-niche',
      title: 'Carbon Steel Frame & Distressed Wood Mandir',
      style: 'industrial-rustic',
      desc: 'Unique rustic contemporary mandir designed with carbon steel profile borders, open distressed timber shelves, stepped black slate pedestals, and industrial drop pendants.',
      dimensions: 'W: 1000mm x H: 1800mm x D: 500mm',
      materials: ['Distressed Walnut shelves', 'Carbon Steel grids', 'Black Slate base'],
      svg: `<svg viewBox="0 0 400 250" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="20" y="20" width="360" height="210" fill="#0C0D0F" rx="10" />
        <rect x="100" y="35" width="200" height="150" fill="none" stroke="#27272A" stroke-width="2" rx="4" />
        <rect x="110" y="130" width="180" height="45" fill="#1E293B" rx="1" />
        <circle cx="200" cy="70" r="10" fill="#D4AF37" opacity="0.3" />
        <line x1="200" y1="35" x2="200" y2="60" stroke="#27272A" />
      </svg>`
    }
  ],

  laminates: [
    {
      id: 'high-gloss-acrylic-mica',
      name: 'High-Gloss Metallic Acrylic',
      type: 'Acrylic Finish',
      desc: '1.5mm thickness, high specular reflection index, mirror-like depth, UV-stabilized, fully scratch-resistant.',
      color: '#0D9488'
    },
    {
      id: 'anti-fingerprint-matte',
      name: 'Soft-Touch Matte Velvet',
      type: 'Premium Laminate',
      desc: 'Super-matte finish with zero light reflectivity, premium warm feel, self-healing smart thermal microscopic properties.',
      color: '#1E293B'
    },
    {
      id: 'fluted-charcoal',
      name: 'Polystyrene Charcoal Fluted Panel',
      type: 'Accent Louvers',
      desc: 'Eco-friendly polystyrene vertical louvers, ideal for creating rich wood-paneling textured visual accents.',
      color: '#475569'
    },
    {
      id: 'gold-pvd-sheet',
      name: 'Brushed Champagne Gold Sheet',
      type: 'Metallic Trim',
      desc: 'Brushed PVD vacuum coated gold trim strips, providing elegant structural division borders on vertical panels.',
      color: '#D4AF37'
    },
    {
      id: 'fabric-textured-mica',
      name: 'Premium Linen-Weave Textured',
      type: 'Textured Shutter',
      desc: 'Tactile fabric textured laminate offering organic, cozy linen visual qualities to internal wardrobes.',
      color: '#64748B'
    },
    {
      id: 'veneer-wood-natural',
      name: 'Wire-Brushed Teak Wood Veneer',
      type: 'Natural Veneer',
      desc: '0.8mm natural wood teak veneer, wire-brushed for realistic timber ring textures, finished in matte PU.',
      color: '#78350F'
    },
    {
      id: 'stone-finish-mica',
      name: 'Slate Stone Mineral Laminate',
      type: 'Stone Finish',
      desc: 'Heavy textured mineral laminate that mimics real rough cleft slate rock splits, excellent for dark accent focal zones.',
      color: '#334155'
    },
    {
      id: 'fluted-pine',
      name: 'Warm Scandinavian Fluted Pine',
      type: 'Wood Louvers',
      desc: 'Natural light pine vertical louvers, providing cozy organic fluted lines ideal for Scandi minimalist backdrops.',
      color: '#FDBA74'
    },
    {
      id: 'calcutta-gold-quartz',
      name: 'Calcutta Gold Quartz Slab',
      type: 'Stone Countertop',
      desc: 'Premium 15mm heavy quartz with dramatic gold marble vein structures, ideal for modular kitchen countertops and focal TV walls.',
      color: '#F8FAFC'
    },
    {
      id: 'rose-gold-mirror',
      name: 'Rose Gold Tinted Glass',
      type: 'Reflective Inlay',
      desc: 'Highly reflective copper-infused tempered mirror panels, adding rich warm borders and depth to foyer entries.',
      color: '#C084FC'
    },
    {
      id: 'royal-ivory-suede',
      name: 'Royal Ivory Suede Mica',
      type: 'Textured Shutter',
      desc: 'Tactile suede finish laminate, warm ivory tone, highly fingerprint and dust resistant with a premium velvet microtexture.',
      color: '#FEF3C7'
    },
    {
      id: 'pu-gloss-oak',
      name: 'Oak PU High-Gloss Veneer',
      type: 'Gloss Veneer',
      desc: 'Polyurethane coated natural oak sheets with heavy mirror gloss finish, preserving structural ring textures and grains with high luxury.',
      color: '#F59E0B'
    }
  ],

  colors: [
    {
      id: 'emerald-gold',
      name: 'Royal Emerald & Gold',
      primary: '#0F766E',
      secondary: '#D4AF37',
      accent: '#F8FAFC',
      desc: 'Deep royal teal/emerald accented with luxurious gold metal and soft ivory backgrounds.'
    },
    {
      id: 'charcoal-walnut',
      name: 'Charcoal Slate & Warm Walnut',
      primary: '#1E293B',
      secondary: '#7C2D12',
      accent: '#E2E8F0',
      desc: 'Cozy, professional palette blending rich walnut wood grains with modern charcoal matte paneling.'
    },
    {
      id: 'terracotta-sand',
      name: 'Terracotta Blush & Desert Sand',
      primary: '#C2410C',
      secondary: '#F59E0B',
      accent: '#FEF3C7',
      desc: 'Inviting earth tones inspired by traditional Indian terracotta pottery, clay, and glowing sands.'
    },
    {
      id: 'midnight-sapphire',
      name: 'Midnight Sapphire & Antique Brass',
      primary: '#172554',
      secondary: '#B45309',
      accent: '#F8FAFC',
      desc: 'Elegant midnight blue contrasted by burnished copper/brass accents and bright marble flooring.'
    },
    {
      id: 'mint-sage-ivory',
      name: 'Mint Sage & Warm Alabaster',
      primary: '#A7F3D0',
      secondary: '#D1FAE5',
      accent: '#FFFBEB',
      desc: 'Calming, light pastel palette combining organic mint green accents with soft warm alabaster base tones.'
    },
    {
      id: 'ochre-clay',
      name: 'Indian Ochre & Muted Clay',
      primary: '#CA8A04',
      secondary: '#B45309',
      accent: '#FFFBEB',
      desc: 'Traditional warm palette of turmeric yellow, burnt clay bricks, and soft warm eggshell base finishes.'
    },
    {
      id: 'peacock-teak',
      name: 'Peacock Blue & Warm Teak',
      primary: '#0369a1',
      secondary: '#7c2d12',
      accent: '#fafaf9',
      desc: 'Sophisticated combination of royal Indian peacock blue accents with traditional teak wood finishes.'
    }
  ],

  materials: [
    {
      id: 'bwp-plywood',
      name: 'IS 710 BWP Marine Grade Plywood',
      grade: 'IS 710',
      type: 'Boiling Water Proof',
      bestUse: 'Modular Kitchen Base Cabinets & Bathrooms (Wet Zones)',
      desc: '100% waterproof plywood bonded with phenol-formaldehyde synthetic resin, fully termite-resistant and calibrated for zero gap thickness.',
      color: '#10B981'
    },
    {
      id: 'bwr-plywood',
      name: 'IS 303 BWR Moisture Resistant Plywood',
      grade: 'IS 303',
      type: 'Boiling Water Resistant',
      bestUse: 'Modular Kitchen Upper Wall & Dry Cabinets',
      desc: 'High moisture resistant ply suitable for regions of high humidity, steam-resistant carcass framing.',
      color: '#06B6D4'
    },
    {
      id: 'hdmr-board',
      name: 'Action TESA High-Density High-Moisture Resistant Board (HDMR)',
      grade: 'Premium HDMR',
      type: 'High Moisture Resistant Core',
      bestUse: 'Dry Zone Wardrobes, TV Panels, & Loft storage shutter boards',
      desc: 'Engineered wood with high density of 850 kg/m³, outstanding moisture resistance and excellent routing calibration.',
      color: '#AA820A'
    },
    {
      id: 'mr-plywood',
      name: 'IS 303 MR Commercial Grade Plywood',
      grade: 'IS 303 MR',
      type: 'Moisture Resistant',
      bestUse: 'Dry wardrobes, study tables, bedroom dressers',
      desc: 'Standard interior grade plywood bonded with urea-formaldehyde, suitable for dry furniture carcass framing.',
      color: '#F43F5E'
    }
  ],

  hardware: [
    {
      id: 'hettich-luxe',
      name: 'Hettich German Premium Fittings',
      brand: 'Hettich',
      tier: 'Luxury Gold',
      desc: 'Featuring Hettich Sensys soft-close silent-shut hinges, WingLine L folding track loft doors, and InnoTech Atira double-walled steel tandem boxes.',
      type: 'German Precision engineered hinges & slides'
    },
    {
      id: 'hafele-premium',
      name: 'Hafele Premium Functional Fittings',
      brand: 'Hafele',
      tier: 'Premium Silver',
      desc: 'Featuring Hafele Metalla soft-close cabinet hinges, Matrix Box drawer runner systems, and hydraulic stay-flaps for modular overhead lofts.',
      type: 'High-durability soft-close hinge series'
    },
    {
      id: 'ebco-classic',
      name: 'Ebco Functional Soft-Close Fittings',
      brand: 'Ebco',
      tier: 'Classic Bronze',
      desc: 'Featuring Ebco clip-on soft-close cabinet hinges, ProMotion drawer slides, and standard pneumatic gas lifters for lofts.',
      type: 'Value-oriented soft-close drawer slides'
    }
  ],

  pinterestInspirations: [
    {
      id: 'pin-tv-1',
      type: 'tv',
      title: 'Minimalist Teak Slats & Float Unit',
      desc: 'Floating teak console below organic plaster white textured walls, accented by single copper spotlights.',
      source: 'Spacious Venture Curated',
      image: `<svg viewBox="0 0 100 60" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#161925" rx="6"/><rect x="10" y="10" width="80" height="30" fill="#78350F" rx="2"/><rect x="20" y="45" width="60" height="8" fill="#D4AF37" rx="1"/></svg>`
    },
    {
      id: 'pin-tv-2',
      type: 'tv',
      title: 'Full Height Veneer paneling',
      desc: 'Wire-brushed walnut veneer paneling extending to a 10ft ceiling, fully integrated with magnetic cable slots.',
      source: 'Spacious Venture Luxury',
      image: `<svg viewBox="0 0 100 60" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#161925" rx="6"/><rect x="15" y="5" width="70" height="50" fill="#451A03" rx="2"/><line x1="30" y1="5" x2="30" y2="55" stroke="#1A1A1A" stroke-width="1.5"/><line x1="55" y1="5" x2="55" y2="55" stroke="#1A1A1A" stroke-width="1.5"/></svg>`
    },
    {
      id: 'pin-tv-3',
      type: 'tv',
      title: 'Japandi Light Pine Slats Backdrop',
      desc: 'Scandinavian pine vertical louvers paired with a minimalist floating white oak media box and washi paper lanterns.',
      source: 'Japandi Ideas',
      image: `<svg viewBox="0 0 100 60" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#161925" rx="6"/><rect x="15" y="10" width="70" height="40" fill="#F5EBE0" rx="3"/><line x1="30" y1="10" x2="30" y2="50" stroke="#B08968" stroke-width="1"/><line x1="45" y1="10" x2="45" y2="50" stroke="#B08968" stroke-width="1"/><line x1="60" y1="10" x2="60" y2="50" stroke="#B08968" stroke-width="1"/></svg>`
    },
    {
      id: 'pin-kitchen-1',
      type: 'kitchen',
      title: 'Parallel Premium Sage & Oak Kitchen',
      desc: 'Organic mint sage matte shutters paired with light white oak counter slabs and gold pull profile handles.',
      source: 'Livspace Inspiration Boards',
      image: `<svg viewBox="0 0 100 60" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#161925" rx="6"/><rect x="10" y="10" width="35" height="40" fill="#0D9488" rx="2"/><rect x="55" y="10" width="35" height="40" fill="#EAE2B7" rx="2"/><line x1="10" y1="30" x2="45" y2="30" stroke="#D4AF37" stroke-width="1.5"/></svg>`
    },
    {
      id: 'pin-kitchen-2',
      type: 'kitchen',
      title: 'High-suction Tadka-venting L-Shape',
      desc: 'Brilliant high-gloss white acrylic wall cabinets flanking a powerful 1500 suction Faber external pipe chimney.',
      source: 'HomeLane Standard Layouts',
      image: `<svg viewBox="0 0 100 60" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#161925" rx="6"/><rect x="10" y="35" width="80" height="15" fill="#E2E8F0" rx="1"/><rect x="40" y="10" width="20" height="20" fill="#475569" rx="1"/></svg>`
    },
    {
      id: 'pin-kitchen-3',
      type: 'kitchen',
      title: 'Industrial Charcoal Metal Open Racks',
      desc: 'Open steel pipe floating shelves holding cookware above a raw slate stone countertop with dark red brick splashbacks.',
      source: 'Industrial Kitchens',
      image: `<svg viewBox="0 0 100 60" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#161925" rx="6"/><rect x="10" y="40" width="80" height="10" fill="#64748B" rx="1"/><line x1="20" y1="10" x2="20" y2="40" stroke="#18181B" stroke-width="1.5"/><line x1="80" y1="10" x2="80" y2="40" stroke="#18181B" stroke-width="1.5"/></svg>`
    },
    {
      id: 'pin-wardrobe-1',
      type: 'wardrobe',
      title: 'Soft-touch Matte Navy Closet',
      desc: 'Anti-fingerprint navy velvet cabinets with sleek gold handles extending seamlessly to the slab lintel lofts.',
      source: 'Decorpot Spec Gallery',
      image: `<svg viewBox="0 0 100 60" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#161925" rx="6"/><rect x="25" y="10" width="50" height="40" fill="#1E3A8A" rx="2"/><line x1="50" y1="10" x2="50" y2="50" stroke="#D4AF37" stroke-width="1.5"/></svg>`
    },
    {
      id: 'pin-wardrobe-2',
      type: 'wardrobe',
      title: 'Smoked Glass Walk-In with gold profiles',
      desc: 'PVD brushed gold aluminum frame shutters with dark grey tinted glass backing and automated sensor rods.',
      source: 'Spacious Venture Luxury Series',
      image: `<svg viewBox="0 0 100 60" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#161925" rx="6"/><rect x="20" y="10" width="60" height="40" fill="rgba(6,182,212,0.15)" stroke="#D4AF37" stroke-width="1.5" rx="2"/><line x1="50" y1="10" x2="50" y2="50" stroke="#D4AF37" stroke-width="1.5"/></svg>`
    },
    {
      id: 'pin-wardrobe-3',
      type: 'wardrobe',
      title: 'Translucent Shoji Sliding Closet',
      desc: 'Latticed light pine frame holding semi-opaque textured washi paper doors with hidden ambient sensor strip lights.',
      source: 'Japandi Wardrobes',
      image: `<svg viewBox="0 0 100 60" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#161925" rx="6"/><rect x="25" y="10" width="50" height="40" fill="#F5EBE0" stroke="#B08968" stroke-width="1.5" rx="2"/><line x1="50" y1="10" x2="50" y2="50" stroke="#B08968" stroke-width="1.5"/></svg>`
    }
  ]
};
