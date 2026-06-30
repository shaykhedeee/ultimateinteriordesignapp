// SVG Icons and Architectural Symbols for the Commercial Office Floorplan Editor
const OfficeSymbols = {
  // UI Lucide Icons (in case Lucide CDN fails, we have robust inline fallbacks)
  ui: {
    select: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 12 3-3 3 3"/><path d="M12 2v20"/><path d="m15 15-3 3-3-3"/></svg>`,
    wall: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18"/><path d="M3 15h18"/><path d="M9 3v6"/><path d="M15 9v6"/><path d="M9 15v6"/></svg>`,
    door: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21h18"/><path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16"/><path d="M15 12h.01"/></svg>`,
    window: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 12h18"/><path d="M12 3v18"/></svg>`,
    room: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3h18v18H3z"/><path d="M14 3v18M3 10h18"/></svg>`,
    measure: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="2" y1="12" x2="22" y2="12"/><line x1="5" y1="8" x2="5" y2="16"/><line x1="19" y1="8" x2="19" y2="16"/><path d="M12 8l-3 4 3 4M8 12h8"/></svg>`,
    sketch: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m12 3-1.912 5.886H3.82l4.98 3.618-1.9 5.887L12 14.775l5.1 3.616-1.9-5.887 4.98-3.618h-6.268z"/></svg>`,
    delete: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>`,
    undo: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></svg>`,
    redo: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7"/></svg>`,
  },

  // 2D SVG Templates for Office Furniture (using dynamic styling parameters like width, height, stroke, fill)
  furniture: {
    single_desk: {
      name: "Standard Desk",
      width: 1.4, // standard dimensions in meters
      height: 0.8,
      category: "workstations",
      draw: (w, h, color) => `
        <g stroke="${color || '#4A5568'}" stroke-width="2" fill="#FFFFFF" stroke-linejoin="round">
          <!-- Main Desk Surface -->
          <rect x="0" y="0" width="${w}" height="${h}" rx="2" fill-opacity="0.9" />
          <!-- Bevel Edge line -->
          <line x1="2" y1="${h - 6}" x2="${w - 2}" y2="${h - 6}" stroke-width="1" stroke-dasharray="2,2" />
          <!-- Laptop / Monitor Area -->
          <rect x="${w / 2 - 25}" y="8" width="50" height="12" rx="1" fill="#2D3748" />
          <!-- Keyboard -->
          <rect x="${w / 2 - 20}" y="24" width="40" height="6" rx="0.5" fill="#E2E8F0" />
          <!-- Mouse pad -->
          <rect x="${w / 2 + 25}" y="25" width="8" height="5" rx="0.5" fill="#CBD5E0" />
          <!-- Ergonomic Chair behind desk -->
          <g transform="translate(${w / 2}, ${h + 10})">
            <!-- Seat Cushion -->
            <rect x="-18" y="-12" width="36" height="24" rx="4" fill="#1A202C" />
            <!-- Backrest -->
            <path d="M -16 -18 Q 0 -22 16 -18 C 18 -15 18 -14 16 -12 L -16 -12 C -18 -14 -18 -15 -16 -18 Z" fill="#2D3748" />
            <!-- Armrests -->
            <rect x="-22" y="-6" width="4" height="14" rx="1" fill="#4A5568" />
            <rect x="18" y="-6" width="4" height="14" rx="1" fill="#4A5568" />
          </g>
        </g>
      `
    },
    executive_desk: {
      name: "Executive L-Desk",
      width: 1.8,
      height: 1.6,
      category: "workstations",
      draw: (w, h, color) => `
        <g stroke="${color || '#4A5568'}" stroke-width="2" fill="#FFFFFF" stroke-linejoin="round">
          <!-- Main Desk Body -->
          <rect x="0" y="0" width="${w}" height="${h * 0.5}" rx="2" fill-opacity="0.9" />
          <!-- Return Desk (L-Shape on the right) -->
          <rect x="${w * 0.67}" y="${h * 0.5}" width="${w * 0.33}" height="${h * 0.5}" rx="2" fill-opacity="0.9" />
          <!-- Monitor -->
          <rect x="${w / 2 - w * 0.15}" y="${h * 0.1}" width="${w * 0.3}" height="${h * 0.1}" rx="1" fill="#1A202C" />
          <rect x="${w / 2 - w * 0.05}" y="${h * 0.2}" width="${w * 0.1}" height="${h * 0.05}" rx="1" fill="#718096" />
          <!-- Tablet / Notepad -->
          <rect x="${w * 0.1}" y="${h * 0.15}" width="${w * 0.1}" height="${h * 0.15}" rx="1" fill="#EDF2F7" stroke-width="1" />
          <!-- Pen holder / Cup -->
          <circle cx="${w * 0.12}" cy="${h * 0.4}" r="${Math.min(w, h) * 0.05}" fill="#A0AEC0" />
          <!-- Chair -->
          <g transform="translate(${w * 0.4}, ${h * 0.75}) scale(${Math.min(w, h) / 60})">
            <!-- Plush Seat Cushion -->
            <rect x="-18" y="-12" width="36" height="24" rx="4" fill="#1A202C" />
            <!-- Heavy Backrest -->
            <path d="M -16 -18 Q 0 -22 16 -18 C 18 -15 18 -14 16 -12 L -16 -12 Z" fill="#2D3748" />
            <!-- Padded Armrests -->
            <rect x="-22" y="-6" width="4" height="14" rx="1" fill="#1A202C" />
            <rect x="18" y="-6" width="4" height="14" rx="1" fill="#1A202C" />
          </g>
        </g>
      `
    },
    desk_cluster_4: {
      name: "4-Person Desk Pod",
      width: 2.8,
      height: 1.6,
      category: "workstations",
      draw: (w, h, color) => `
        <g stroke="${color || '#4A5568'}" stroke-width="1.5" fill="#FFFFFF" stroke-linejoin="round">
          <!-- Main Outer Boundary representing 4 desks side-by-side back-to-back -->
          <rect x="0" y="0" width="${w}" height="${h}" rx="4" fill-opacity="0.9" />
          <!-- Central Privacy Dividers -->
          <line x1="0" y1="${h / 2}" x2="${w}" y2="${h / 2}" stroke-width="3" stroke="#CBD5E0" />
          <line x1="${w / 2}" y1="0" x2="${w / 2}" y2="${h}" stroke-width="2" stroke="#E2E8F0" />
          
          <!-- Desk 1 (Top Left) Details -->
          <rect x="15" y="10" width="35" height="10" rx="1" fill="#4A5568" /> <!-- Monitor -->
          <rect x="${w / 4 - 20}" y="${h / 2 - 15}" width="40" height="10" rx="1" fill="#F7FAFC" /> <!-- Keyboard -->
          
          <!-- Desk 2 (Top Right) Details -->
          <rect x="${w - 50}" y="10" width="35" height="10" rx="1" fill="#4A5568" />
          <rect x="${3 * w / 4 - 20}" y="${h / 2 - 15}" width="40" height="10" rx="1" fill="#F7FAFC" />

          <!-- Desk 3 (Bottom Left) Details -->
          <rect x="15" y="${h - 20}" width="35" height="10" rx="1" fill="#4A5568" />
          <rect x="${w / 4 - 20}" y="${h / 2 + 5}" width="40" height="10" rx="1" fill="#F7FAFC" />

          <!-- Desk 4 (Bottom Right) Details -->
          <rect x="${w - 50}" y="${h - 20}" width="35" height="10" rx="1" fill="#4A5568" />
          <rect x="${3 * w / 4 - 20}" y="${h / 2 + 5}" width="40" height="10" rx="1" fill="#F7FAFC" />

          <!-- Chairs for all 4 slots -->
          <!-- Top Left Chair -->
          <circle cx="${w / 4}" cy="-15" r="14" fill="#1A202C" />
          <line x1="${w / 4 - 10}" y1="-15" x2="${w / 4 + 10}" y2="-15" stroke="#FFFFFF" />
          <!-- Top Right Chair -->
          <circle cx="${3 * w / 4}" cy="-15" r="14" fill="#1A202C" />
          <line x1="${3 * w / 4 - 10}" y1="-15" x2="${3 * w / 4 + 10}" y2="-15" stroke="#FFFFFF" />
          <!-- Bottom Left Chair -->
          <circle cx="${w / 4}" cy="${h + 15}" r="14" fill="#1A202C" />
          <line x1="${w / 4 - 10}" y1="${h + 15}" x2="${w / 4 + 10}" y2="${h + 15}" stroke="#FFFFFF" />
          <!-- Bottom Right Chair -->
          <circle cx="${3 * w / 4}" cy="${h + 15}" r="14" fill="#1A202C" />
          <line x1="${3 * w / 4 - 10}" y1="${h + 15}" x2="${3 * w / 4 + 10}" y2="${h + 15}" stroke="#FFFFFF" />
        </g>
      `
    },
    conference_table_large: {
      name: "Boardroom Table (10-12p)",
      width: 3.6,
      height: 1.4,
      category: "meeting",
      draw: (w, h, color) => {
        let chairs = '';
        // Calculate chair spacing
        const numChairsPerSide = 5;
        const sideSpacing = w / (numChairsPerSide + 1);
        
        // Chair size proportional to scale
        const chairW = Math.max(12, w * 0.08);
        const chairH = Math.max(6, h * 0.08);
        
        // Top side chairs
        for(let i = 1; i <= numChairsPerSide; i++) {
          chairs += `<rect x="${i * sideSpacing - chairW/2}" y="-${chairH + 5}" width="${chairW}" height="${chairH}" rx="2" fill="#2D3748" />`;
          chairs += `<path d="M ${i * sideSpacing - chairW*0.4} -${chairH + 5} Q ${i * sideSpacing} -${chairH + 10} ${i * sideSpacing + chairW*0.4} -${chairH + 5}" stroke="#1A202C" stroke-width="2" fill="none" />`;
        }
        // Bottom side chairs
        for(let i = 1; i <= numChairsPerSide; i++) {
          chairs += `<rect x="${i * sideSpacing - chairW/2}" y="${h + 5}" width="${chairW}" height="${chairH}" rx="2" fill="#2D3748" />`;
          chairs += `<path d="M ${i * sideSpacing - chairW*0.4} ${h + chairH + 5} Q ${i * sideSpacing} ${h + chairH + 10} ${i * sideSpacing + chairW*0.4} ${h + chairH + 5}" stroke="#1A202C" stroke-width="2" fill="none" />`;
        }
        // Head and foot chairs
        chairs += `<g transform="translate(-15, ${h / 2}) rotate(-90)"><rect x="-12" y="-5" width="24" height="10" rx="2" fill="#2D3748" /></g>`;
        chairs += `<g transform="translate(${w + 15}, ${h / 2}) rotate(90)"><rect x="-12" y="-5" width="24" height="10" rx="2" fill="#2D3748" /></g>`;

        const inlayInsetX = w * 0.12;
        const inlayInsetY = h * 0.15;
        const inlayW = Math.max(2, w - 2 * inlayInsetX);
        const inlayH = Math.max(2, h - 2 * inlayInsetY);
        const grommetW = w * 0.12;
        const grommetH = h * 0.12;

        return `
          <g stroke="${color || '#4A5568'}" stroke-width="2" fill="#FFFFFF" stroke-linejoin="round">
            <!-- Table top (elegantly pill-shaped) -->
            <rect x="0" y="0" width="${w}" height="${h}" rx="${h / 2}" fill-opacity="0.95" />
            <!-- Cable management grommets/boxes in middle -->
            <rect x="${w / 3 - grommetW / 2}" y="${h / 2 - grommetH / 2}" width="${grommetW}" height="${grommetH}" rx="2" fill="#E2E8F0" />
            <rect x="${2 * w / 3 - grommetW / 2}" y="${h / 2 - grommetH / 2}" width="${grommetW}" height="${grommetH}" rx="2" fill="#E2E8F0" />
            <!-- Table center inlay detailing -->
            <rect x="${inlayInsetX}" y="${inlayInsetY}" width="${inlayW}" height="${inlayH}" rx="${inlayH / 2}" fill="none" stroke="#EDF2F7" stroke-dasharray="4,4" />
            <!-- Render the chairs -->
            ${chairs}
          </g>
        `;
      }
    },
    conference_table_round: {
      name: "Collaboration Round (4-6p)",
      width: 1.5,
      height: 1.5,
      category: "meeting",
      draw: (w, h, color) => {
        const radius = w / 2;
        let chairs = '';
        const numChairs = 5;
        for (let i = 0; i < numChairs; i++) {
          const angle = (i * 2 * Math.PI) / numChairs;
          const cx = radius + (radius + 12) * Math.cos(angle);
          const cy = radius + (radius + 12) * Math.sin(angle);
          const rotDeg = (angle * 180) / Math.PI + 90;
          chairs += `
            <g transform="translate(${cx}, ${cy}) rotate(${rotDeg})">
              <rect x="-14" y="-8" width="28" height="14" rx="4" fill="#2D3748" />
              <path d="M-10 -8 Q0 -14 10 -8" stroke="#1A202C" stroke-width="2" fill="none" />
            </g>
          `;
        }
        return `
          <g stroke="${color || '#4A5568'}" stroke-width="2" fill="#FFFFFF" stroke-linejoin="round">
            <!-- Round Table Top -->
            <circle cx="${radius}" cy="${radius}" r="${radius}" fill-opacity="0.9" />
            <!-- Table center column marker -->
            <circle cx="${radius}" cy="${radius}" r="${radius * 0.25}" fill="none" stroke="#EDF2F7" stroke-dasharray="2,2" />
            <!-- Grommet -->
            <circle cx="${radius}" cy="${radius}" r="8" fill="#E2E8F0" />
            <!-- Render Chairs around round table -->
            ${chairs}
          </g>
        `;
      }
    },
    reception_desk: {
      name: "Reception Counter",
      width: 2.2,
      height: 1.2,
      category: "common",
      draw: (w, h, color) => `
        <g stroke="${color || '#4A5568'}" stroke-width="2" fill="#FFFFFF" stroke-linejoin="round">
          <!-- Outer Curved Shell -->
          <path d="M 0 0 C 0 50, 20 80, 70 90 L ${w - 50} 90 C ${w - 10} 90, ${w} 70, ${w} 0 L ${w - 30} 0 C ${w - 30} 50, ${w - 60} 60, ${w - 80} 60 L 80 60 C 40 60, 30 40, 30 0 Z" fill="#2D3748" fill-opacity="0.95" />
          <!-- Inner Desk Surface -->
          <path d="M 30 0 L ${w - 30} 0 L ${w - 40} 40 L 40 40 Z" fill="#FFFFFF" />
          <!-- Receptionist Chair -->
          <circle cx="${w / 2}" cy="15" r="14" fill="#1A202C" />
          <!-- Transaction Ledger -->
          <rect x="${w / 2 - 30}" y="70" width="60" height="15" rx="1" fill="#FFFFFF" stroke="#4A5568" />
          <!-- Guest Chairs in front -->
          <g transform="translate(${w / 4}, 130) rotate(180)">
            <rect x="-14" y="-10" width="28" height="20" rx="3" fill="#4A5568" />
          </g>
          <g transform="translate(${3 * w / 4}, 130) rotate(180)">
            <rect x="-14" y="-10" width="28" height="20" rx="3" fill="#4A5568" />
          </g>
        </g>
      `
    },
    lounge_sofa_3: {
      name: "3-Seater Executive Sofa",
      width: 2.2,
      height: 0.9,
      category: "common",
      draw: (w, h, color) => {
        const armW = w * 0.08;
        const backH = h * 0.2;
        const innerW = w - 2 * armW - w * 0.08;
        const cushionW = innerW / 3;
        const cushionH = h - backH - h * 0.12;
        
        return `
          <g stroke="${color || '#4A5568'}" stroke-width="2" fill="#FFFFFF" stroke-linejoin="round">
            <!-- Main Sofa Frame -->
            <rect x="0" y="0" width="${w}" height="${h}" rx="4" fill-opacity="0.9" />
            <!-- Backrest -->
            <rect x="${w * 0.03}" y="${h - backH - h * 0.05}" width="${w - w * 0.06}" height="${backH}" rx="2" fill="#E2E8F0" />
            <!-- Left Armrest -->
            <rect x="${w * 0.03}" y="${h * 0.05}" width="${armW}" height="${h - h * 0.1}" rx="2" fill="#E2E8F0" />
            <!-- Right Armrest -->
            <rect x="${w - armW - w * 0.03}" y="${h * 0.05}" width="${armW}" height="${h - h * 0.1}" rx="2" fill="#E2E8F0" />
            <!-- Seating Cushions (3 sections) -->
            <rect x="${armW + w * 0.05}" y="${h * 0.08}" width="${cushionW - 2}" height="${cushionH}" rx="2" fill="#F7FAFC" />
            <rect x="${armW + w * 0.05 + cushionW}" y="${h * 0.08}" width="${cushionW - 2}" height="${cushionH}" rx="2" fill="#F7FAFC" />
            <rect x="${armW + w * 0.05 + 2 * cushionW}" y="${h * 0.08}" width="${cushionW - 2}" height="${cushionH}" rx="2" fill="#F7FAFC" />
          </g>
        `;
      }
    },
    lounge_chair: {
      name: "Lounge Club Chair",
      width: 0.9,
      height: 0.85,
      category: "common",
      draw: (w, h, color) => `
        <g stroke="${color || '#4A5568'}" stroke-width="2" fill="#FFFFFF" stroke-linejoin="round">
          <!-- Chair Base Frame -->
          <rect x="0" y="0" width="${w}" height="${h}" rx="6" fill-opacity="0.9" />
          <!-- Padded Backrest -->
          <path d="M ${w * 0.08} ${h * 0.75} Q ${w / 2} ${h * 0.65} ${w - w * 0.08} ${h * 0.75} L ${w - w * 0.08} ${h * 0.95} L ${w * 0.08} ${h * 0.95} Z" fill="#2D3748" />
          <!-- Cushioned Armrests -->
          <rect x="${w * 0.05}" y="${h * 0.08}" width="${w * 0.15}" height="${h * 0.6}" rx="2" fill="#2D3748" />
          <rect x="${w * 0.8}" y="${h * 0.08}" width="${w * 0.15}" height="${h * 0.6}" rx="2" fill="#2D3748" />
          <!-- Seat Cushion -->
          <rect x="${w * 0.23}" y="${h * 0.12}" width="${w * 0.54}" height="${h * 0.52}" rx="4" fill="#E2E8F0" />
        </g>
      `
    },
    coffee_table: {
      name: "Coffee Table",
      width: 1.2,
      height: 0.6,
      category: "common",
      draw: (w, h, color) => {
        const borderInset = Math.min(w, h) * 0.15;
        const centerW = w * 0.3;
        const centerH = h * 0.4;
        return `
          <g stroke="${color || '#A0AEC0'}" stroke-width="1.5" fill="#FFFFFF" stroke-linejoin="round">
            <!-- Glass Panel Border -->
            <rect x="0" y="0" width="${w}" height="${h}" rx="2" fill="#EDF2F7" fill-opacity="0.5" />
            <rect x="${borderInset}" y="${borderInset}" width="${Math.max(2, w - 2 * borderInset)}" height="${Math.max(2, h - 2 * borderInset)}" rx="1" fill="none" stroke="${color || '#CBD5E0'}" stroke-dasharray="2,2" />
            <!-- Center decorative centerpiece (magazine / tray) -->
            <rect x="${w / 2 - centerW / 2}" y="${h / 2 - centerH / 2}" width="${centerW}" height="${centerH}" rx="1" fill="#FFFFFF" stroke-width="1" />
            <line x1="${w / 2 - centerW * 0.3}" y1="${h / 2 - centerH * 0.15}" x2="${w / 2 + centerW * 0.3}" y2="${h / 2 - centerH * 0.15}" stroke-width="1" />
            <line x1="${w / 2 - centerW * 0.3}" y1="${h / 2 + centerH * 0.15}" x2="${w / 2 + centerW * 0.15}" y2="${h / 2 + centerH * 0.15}" stroke-width="1" />
          </g>
        `;
      }
    },
    pantry_table_cluster: {
      name: "Pantry High-Top Bench",
      width: 2.0,
      height: 0.8,
      category: "facilities",
      draw: (w, h, color) => {
        let stools = '';
        const numStools = 4;
        const spacing = w / (numStools + 1);
        for(let i=1; i<=numStools; i++) {
          // Top Stools
          stools += `<circle cx="${i * spacing}" cy="-12" r="10" fill="#2D3748" stroke="#1A202C" stroke-width="1.5" />`;
          stools += `<circle cx="${i * spacing}" cy="-12" r="3" fill="#718096" />`;
          // Bottom Stools
          stools += `<circle cx="${i * spacing}" cy="${h + 12}" r="10" fill="#2D3748" stroke="#1A202C" stroke-width="1.5" />`;
          stools += `<circle cx="${i * spacing}" cy="${h + 12}" r="3" fill="#718096" />`;
        }
        return `
          <g stroke="${color || '#4A5568'}" stroke-width="2" fill="#FFFFFF" stroke-linejoin="round">
            <!-- Table top (heavy wood look) -->
            <rect x="0" y="0" width="${w}" height="${h}" rx="2" fill-opacity="0.9" />
            <!-- Woodgrain detail lines -->
            <line x1="8" y1="${h / 2 - 10}" x2="${w - 8}" y2="${h / 2 - 10}" stroke="#E2E8F0" stroke-width="1" />
            <line x1="12" y1="${h / 2}" x2="${w - 12}" y2="${h / 2}" stroke="#CBD5E0" stroke-width="1" />
            <line x1="8" y1="${h / 2 + 10}" x2="${w - 8}" y2="${h / 2 + 10}" stroke="#E2E8F0" stroke-width="1" />
            <!-- Render the bar stools -->
            ${stools}
          </g>
        `;
      }
    },
    potted_plant_large: {
      name: "Potted Ficus Plant",
      width: 0.65,
      height: 0.65,
      category: "facilities",
      draw: (w, h, color) => `
        <g stroke="${color || '#2F855A'}" stroke-width="1.5" fill="#48BB78" stroke-linejoin="round">
          <!-- Ceramic Pot -->
          <circle cx="${w / 2}" cy="${h / 2}" r="${w / 2 - 2}" fill="#EDF2F7" stroke="#4A5568" stroke-width="2" />
          <circle cx="${w / 2}" cy="${h / 2}" r="${w / 2 - 8}" fill="#A0AEC0" stroke="#718096" stroke-width="1" />
          <!-- Organic Leaf Layers (using smooth overlapping paths) -->
          <path d="M ${w / 2} ${h / 2} Q ${w / 2 - 30} ${h / 2 - 30} ${w / 2 - 45} ${h / 2 - 20} Q ${w / 2 - 35} ${h / 2 - 5} ${w / 2} ${h / 2}" fill="#2F855A" />
          <path d="M ${w / 2} ${h / 2} Q ${w / 2 + 30} ${h / 2 - 30} ${w / 2 + 45} ${h / 2 - 25} Q ${w / 2 + 35} ${h / 2 - 5} ${w / 2} ${h / 2}" fill="#38A169" />
          <path d="M ${w / 2} ${h / 2} Q ${w / 2 + 25} ${h / 2 + 25} ${w / 2 + 40} ${h / 2 + 35} Q ${w / 2 + 10} ${h / 2 + 30} ${w / 2} ${h / 2}" fill="#276749" />
          <path d="M ${w / 2} ${h / 2} Q ${w / 2 - 25} ${h / 2 + 25} ${w / 2 - 35} ${h / 2 + 40} Q ${w / 2 - 15} ${h / 2 + 30} ${w / 2} ${h / 2}" fill="#48BB78" />
          <path d="M ${w / 2} ${h / 2} Q ${w / 2} ${h / 2 - 35} ${w / 2 + 5} ${h / 2 - 55} Q ${w / 2 - 10} ${h / 2 - 35} ${w / 2} ${h / 2}" fill="#2F855A" />
          <path d="M ${w / 2} ${h / 2} Q ${w / 2 - 5} ${h / 2 + 35} ${w / 2 - 5} ${h / 2 + 55} Q ${w / 2 + 10} ${h / 2 + 35} ${w / 2} ${h / 2}" fill="#38A169" />
          <!-- Center potting soil -->
          <circle cx="${w / 2}" cy="${h / 2}" r="4" fill="#744210" stroke="none" />
        </g>
      `
    },
    printer_station: {
      name: "Copier / Printer Station",
      width: 0.9,
      height: 0.8,
      category: "facilities",
      draw: (w, h, color) => `
        <g stroke="${color || '#4A5568'}" stroke-width="2" fill="#FFFFFF" stroke-linejoin="round">
          <!-- Heavy Printer Body -->
          <rect x="0" y="0" width="${w}" height="${h}" rx="3" fill-opacity="0.9" />
          <!-- Paper Feed Tray Out (Left) -->
          <rect x="-${w * 0.08}" y="${h * 0.2}" width="${w * 0.08}" height="${h * 0.6}" rx="1" fill="#CBD5E0" />
          <!-- Document Glass Platen area -->
          <rect x="${w * 0.12}" y="${h * 0.12}" width="${w * 0.76}" height="${h * 0.65}" rx="1" fill="#E2E8F0" />
          <!-- Scanner Lid Handle -->
          <rect x="${w * 0.2}" y="${h * 0.8}" width="${w * 0.6}" height="${h * 0.08}" rx="0.5" fill="#1A202C" />
          <!-- Control Panel (Touchscreen & physical buttons) -->
          <rect x="${w * 0.8}" y="${h * 0.2}" width="${w * 0.12}" height="${h * 0.4}" rx="1" fill="#2D3748" />
          <circle cx="${w * 0.86}" cy="${h * 0.28}" r="${Math.min(w, h) * 0.05}" fill="#48BB78" />
          <rect x="${w * 0.82}" y="${h * 0.38}" width="${w * 0.08}" height="${h * 0.18}" fill="#A0AEC0" stroke-width="1" />
          <!-- Paper exit tray detail -->
          <path d="M ${w * 0.25} ${h * 0.4} L ${w * 0.75} ${h * 0.4} L ${w * 0.7} ${h * 0.55} L ${w * 0.3} ${h * 0.55} Z" fill="#EDF2F7" stroke="#A0AEC0" stroke-width="1" />
        </g>
      `
    },
    server_rack: {
      name: "IT Server Cabinet",
      width: 0.8,
      height: 0.8,
      category: "facilities",
      draw: (w, h, color) => `
        <g stroke="${color || '#2D3748'}" stroke-width="2" fill="#1A202C" stroke-linejoin="round">
          <!-- Main Cabinet Shell -->
          <rect x="0" y="0" width="${w}" height="${h}" rx="2" fill-opacity="0.95" />
          <!-- Glass Door overlay panel -->
          <rect x="${w * 0.08}" y="${h * 0.08}" width="${w * 0.84}" height="${h * 0.84}" rx="1" fill="#2B6CB0" fill-opacity="0.15" stroke="#4A5568" />
          <!-- Vent Grills -->
          <line x1="${w * 0.15}" y1="${h * 0.15}" x2="${w * 0.85}" y2="${h * 0.15}" stroke="#4A5568" stroke-dasharray="2,2" />
          <line x1="${w * 0.15}" y1="${h * 0.2}" x2="${w * 0.85}" y2="${h * 0.2}" stroke="#4A5568" stroke-dasharray="2,2" />
          <!-- Rack Unit Slots with glowing LEDs -->
          <rect x="${w * 0.2}" y="${h * 0.3}" width="${w * 0.6}" height="${h * 0.1}" rx="1" fill="#2D3748" />
          <circle cx="${w * 0.28}" cy="${h * 0.35}" r="${Math.min(w, h) * 0.03}" fill="#3182CE" />
          <circle cx="${w * 0.36}" cy="${h * 0.35}" r="${Math.min(w, h) * 0.025}" fill="#48BB78" />
          
          <rect x="${w * 0.2}" y="${h * 0.48}" width="${w * 0.6}" height="${h * 0.1}" rx="1" fill="#2D3748" />
          <circle cx="${w * 0.28}" cy="${h * 0.53}" r="${Math.min(w, h) * 0.03}" fill="#3182CE" />
          <circle cx="${w * 0.36}" cy="${h * 0.53}" r="${Math.min(w, h) * 0.025}" fill="#E53E3E" />
          
          <rect x="${w * 0.2}" y="${h * 0.66}" width="${w * 0.6}" height="${h * 0.1}" rx="1" fill="#2D3748" />
          <circle cx="${w * 0.28}" cy="${h * 0.71}" r="${Math.min(w, h) * 0.03}" fill="#3182CE" />
          <circle cx="${w * 0.36}" cy="${h * 0.71}" r="${Math.min(w, h) * 0.025}" fill="#48BB78" />
        </g>
      `
    },
    toilet_wc: {
      name: "Bathroom WC Toilet",
      width: 0.55,
      height: 0.75,
      category: "restrooms",
      draw: (w, h, color) => {
        const tankH = h * 0.25;
        const tankW = w * 0.85;
        const tankX = w * 0.075;
        const tankY = h * 0.7;
        
        return `
          <g stroke="${color || '#A0AEC0'}" stroke-width="2" fill="#FFFFFF" stroke-linejoin="round">
            <!-- Back Water Tank -->
            <rect x="${tankX}" y="${tankY}" width="${tankW}" height="${tankH}" rx="${Math.min(w, h) * 0.05}" fill-opacity="0.95" />
            <!-- Flush Button -->
            <circle cx="${w / 2}" cy="${tankY + tankH / 2}" r="${Math.min(w, h) * 0.08}" fill="#CBD5E0" stroke="#718096" stroke-width="1" />
            <!-- Front Ceramic Bowl -->
            <path d="M ${w * 0.2} ${h * 0.08} C ${w * 0.2} ${h * 0.45}, ${w * 0.25} ${h * 0.8}, ${w / 2} ${h * 0.85} C ${w * 0.75} ${h * 0.8}, ${w * 0.8} ${h * 0.45}, ${w * 0.8} ${h * 0.08} Z" fill-opacity="0.9" />
            <!-- Inner Bowl Line -->
            <path d="M ${w * 0.27} ${h * 0.15} C ${w * 0.27} ${h * 0.4}, ${w * 0.3} ${h * 0.65}, ${w / 2} ${h * 0.7} C ${w * 0.7} ${h * 0.65}, ${w * 0.73} ${h * 0.4}, ${w * 0.73} ${h * 0.15} Z" fill="#EDF2F7" stroke="#CBD5E0" stroke-width="1.5" />
            <!-- Water inside -->
            <ellipse cx="${w / 2}" cy="${h * 0.38}" rx="${w * 0.15}" ry="${h * 0.2}" fill="#EBF8FF" stroke="none" />
          </g>
        `;
      }
    },
    bathroom_sink: {
      name: "Bathroom Sink",
      width: 0.6,
      height: 0.55,
      category: "restrooms",
      draw: (w, h, color) => `
        <g stroke="${color || '#A0AEC0'}" stroke-width="2" fill="#FFFFFF" stroke-linejoin="round">
          <!-- Outer Basin Countertop -->
          <rect x="0" y="0" width="${w}" height="${h}" rx="3" fill-opacity="0.9" />
          <!-- Inner Sink Basin bowl -->
          <rect x="${w * 0.15}" y="${h * 0.15}" width="${w * 0.7}" height="${h * 0.7}" rx="${Math.min(w, h) * 0.1}" fill="#EDF2F7" stroke="#CBD5E0" stroke-width="1.5" />
          <ellipse cx="${w / 2}" cy="${h / 2 - 2}" rx="${w * 0.22}" ry="${h * 0.22}" fill="#FFFFFF" stroke="none" />
          <!-- Water drain -->
          <circle cx="${w / 2}" cy="${h / 2 - 2}" r="${Math.min(w, h) * 0.08}" fill="#CBD5E0" />
          <!-- Chrome Tap / Faucet -->
          <g transform="translate(${w / 2}, ${h - 10})">
            <!-- Main spout -->
            <rect x="-3" y="-12" width="6" height="12" rx="1.5" fill="#4A5568" stroke="#1A202C" />
            <!-- Hot handle -->
            <rect x="-12" y="-6" width="6" height="3" fill="#E53E3E" stroke="#E53E3E" />
            <!-- Cold handle -->
            <rect x="6" y="-6" width="6" height="3" fill="#3182CE" stroke="#3182CE" />
          </g>
        </g>
      `
    },
    staircase: {
      name: "Staircase Core",
      width: 4.8,
      height: 2.2,
      category: "common",
      draw: (w, h, color) => {
        let lines = '';
        const numSteps = 12;
        const stepW = w / numSteps;
        for (let i = 0; i <= numSteps; i++) {
          lines += `<line x1="${i * stepW}" y1="0" x2="${i * stepW}" y2="${h}" stroke="${color || '#CBD5E0'}" stroke-width="1" />`;
        }
        lines += `<line x1="0" y1="${h/2}" x2="${w}" y2="${h/2}" stroke="${color || '#718096'}" stroke-width="2" />`;
        lines += `
          <line x1="15" y1="${3*h/4}" x2="${w - 15}" y2="${3*h/4}" stroke="#E53E3E" stroke-width="1.5" stroke-dasharray="3,3" />
          <line x1="${w - 15}" y1="${3*h/4}" x2="${w - 15}" y2="${h/2}" stroke="#E53E3E" stroke-width="1.5" />
          <path d="M ${w - 15} ${h/2} L ${w - 20} ${h/2 + 7} M ${w - 15} ${h/2} L ${w - 10} ${h/2 + 7}" stroke="#E53E3E" stroke-width="1.5" fill="none" />
        `;
        return `
          <g stroke="${color || '#4A5568'}" stroke-width="2" fill="#FFFFFF" stroke-linejoin="round">
            <rect x="0" y="0" width="${w}" height="${h}" rx="1" fill-opacity="0.9" />
            ${lines}
          </g>
        `;
      }
    }
  },

  // Doors & Windows Symbols - dynamically aligned on walls
  openings: {
    single_door: {
      name: "Single Swing Door",
      width: 0.9,
      draw: (w, strokeColor) => `
        <g stroke="${strokeColor || '#2B6CB0'}" stroke-width="2.5" fill="none">
          <!-- Door Jam Lines -->
          <line x1="0" y1="-8" x2="0" y2="8" stroke-width="3" />
          <line x1="${w}" y1="-8" x2="${w}" y2="8" stroke-width="3" />
          <!-- Door Leaf (90 deg open) -->
          <line x1="0" y1="0" x2="0" y2="-${w}" stroke-width="3" />
          <!-- Swing Arc (quarter circle) -->
          <path d="M 0 -${w} A ${w} ${w} 0 0 1 ${w} 0" stroke-dasharray="3,3" stroke-width="1.5" />
        </g>
      `
    },
    double_door: {
      name: "Double Swing Door",
      width: 1.6,
      draw: (w, strokeColor) => {
        const half = w / 2;
        return `
          <g stroke="${strokeColor || '#2B6CB0'}" stroke-width="2.5" fill="none">
            <!-- Jam Lines -->
            <line x1="0" y1="-8" x2="0" y2="8" stroke-width="3" />
            <line x1="${w}" y1="-8" x2="${w}" y2="8" stroke-width="3" />
            <!-- Left Door Leaf -->
            <line x1="0" y1="0" x2="0" y2="-${half}" stroke-width="3" />
            <path d="M 0 -${half} A ${half} ${half} 0 0 1 ${half} 0" stroke-dasharray="3,3" stroke-width="1.5" />
            <!-- Right Door Leaf -->
            <line x1="${w}" y1="0" x2="${w}" y2="-${half}" stroke-width="3" />
            <path d="M ${w} -${half} A ${half} ${half} 0 0 0 ${half} 0" stroke-dasharray="3,3" stroke-width="1.5" />
          </g>
        `;
      }
    },
    sliding_door: {
      name: "Sliding Pocket Door",
      width: 1.4,
      draw: (w, strokeColor) => {
        const half = w / 2;
        return `
          <g stroke="${strokeColor || '#2B6CB0'}" stroke-width="2" fill="none">
            <!-- Jams -->
            <line x1="0" y1="-8" x2="0" y2="8" stroke-width="3.5" />
            <line x1="${w}" y1="-8" x2="${w}" y2="8" stroke-width="3.5" />
            <!-- Sliding tracks -->
            <line x1="0" y1="0" x2="${w}" y2="0" stroke="#CBD5E0" stroke-width="1" />
            <!-- Pocket boundaries -->
            <rect x="0" y="-4" width="${half}" height="8" rx="1" fill="#FFFFFF" fill-opacity="0.8" stroke-width="1.5" />
            <!-- Sliding panel -->
            <rect x="${half - 15}" y="-2" width="${half}" height="4" rx="0.5" fill="#2B6CB0" stroke="none" />
            <!-- Handle -->
            <line x1="${half - 5}" y1="-1" x2="${half - 5}" y2="1" stroke="#FFFFFF" stroke-width="1.5" />
          </g>
        `;
      }
    },
    window_std: {
      name: "Standard Window",
      width: 1.2,
      draw: (w, strokeColor) => `
        <g stroke="${strokeColor || '#4A5568'}" stroke-width="1.5" fill="#EBF8FF">
          <!-- Main window glass box -->
          <rect x="0" y="-6" width="${w}" height="12" rx="1" fill-opacity="0.9" />
          <!-- Double pane line effect -->
          <line x1="0" y1="-2" x2="${w}" y2="-2" stroke-width="1" />
          <line x1="0" y1="2" x2="${w}" y2="2" stroke-width="1" />
          <!-- Middle divider -->
          <line x1="${w / 2}" y1="-6" x2="${w / 2}" y2="6" stroke-width="2" />
          <!-- Window sill -->
          <line x1="-8" y1="6" x2="${w + 8}" y2="6" stroke-width="2.5" stroke="#718096" />
        </g>
      `
    },
    archway: {
      name: "Open Archway Entrance",
      width: 1.2,
      draw: (w, strokeColor) => `
        <g stroke="${strokeColor || '#718096'}" stroke-dasharray="3,3" stroke-width="1.5" fill="none">
          <!-- Outer entrance limits -->
          <line x1="0" y1="-8" x2="0" y2="8" stroke-width="3" stroke-dasharray="none" />
          <line x1="${w}" y1="-8" x2="${w}" y2="8" stroke-width="3" stroke-dasharray="none" />
          <!-- Flow indicators / Arch lines -->
          <path d="M 0 0 C ${w * 0.2} -6, ${w * 0.8} -6, ${w} 0" />
          <path d="M 0 0 C ${w * 0.2} 6, ${w * 0.8} 6, ${w} 0" />
        </g>
      `
    }
  }
};

// Add robust style aliases for absolute safety across CV detection, templates, and manual drawing tools
OfficeSymbols.openings.door_single = OfficeSymbols.openings.single_door;
OfficeSymbols.openings.door_double = OfficeSymbols.openings.double_door;
OfficeSymbols.openings.door_sliding = OfficeSymbols.openings.sliding_door;
OfficeSymbols.openings.window = OfficeSymbols.openings.window_std;

// Expose to window context
window.OfficeSymbols = OfficeSymbols;