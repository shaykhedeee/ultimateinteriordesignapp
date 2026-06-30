// Indian Standards of Interior Design & Vastu Shastra Intelligence
// NOTE: ALL PRICING METRICS HAVE BEEN COMPLETELY REMOVED

const INTERIOR_STANDARDS = {
  // Ergonomic Standards in Millimeters (mm)
  ergonomics: {
    kitchen: {
      counterHeight: {
        value: '820mm - 850mm',
        rationale: 'Optimized for average Indian heights (5\'2" - 5\'6") to reduce lumbar strain. Western standard (900mm) causes shoulder fatigue for Indian cooking heights.'
      },
      counterDepth: {
        value: '600mm',
        rationale: 'Standard depth accommodating built-in hobs, sinks, and offering 120mm rear clearance for gas piping.'
      },
      wallCabinetDepth: {
        value: '300mm - 350mm',
        rationale: 'Prevents head-collision when bending over the primary counter.'
      },
      backsplashHeight: {
        value: '600mm',
        rationale: 'Clearance between counter quartz and bottom of wall loft shutters.'
      },
      passageWidth: {
        value: '1050mm - 1200mm',
        rationale: 'Ensures two persons can pass comfortably; minimum 900mm for single-user kitchens.'
      },
      workTriangle: {
        value: 'Sum of 3 sides: 4.0m to 7.9m',
        rationale: 'Ensures efficient movement between Sink (Water), Hob (Fire), and Refrigerator (Storage).'
      }
    },
    wardrobe: {
      depthSwing: {
        value: '600mm',
        rationale: 'Ensures hangers with standard shoulder width (450mm) do not rub against the doors.'
      },
      depthSliding: {
        value: '650mm',
        rationale: 'Requires additional 50mm channel clearance to house the heavy sliding track mechanisms.'
      },
      loftHeight: {
        value: '2100mm (7 ft) lintel level and above',
        rationale: 'Under-loft is for daily access; overhead loft handles seasonal items (luggage, heavy quilts).'
      },
      hangingRodClearance: {
        value: '1000mm - 1200mm',
        rationale: 'Clearance under rod for kurtas, shirts; 1600mm for sarees/long coats.'
      }
    },
    livingRoom: {
      tvCenterLine: {
        value: '1050mm - 1150mm from finished floor level',
        rationale: 'Places the screen center exactly at eye-level when sitting on a standard 450mm height sofa.'
      },
      viewingDistance: {
        value: '55" TV: 2.2m - 2.8m distance',
        rationale: 'Avoids eye strain and ensures optimal field of view (approx 30 degrees angle).'
      },
      coffeeTableClearance: {
        value: '450mm from sofa edge',
        rationale: 'Sufficient legroom to stretch while maintaining reach for beverages.'
      },
      mainPathway: {
        value: '900mm - 1200mm width',
        rationale: 'Enables unhindered walkthrough traffic without bumping into furniture corners.'
      }
    },
    foyer: {
      shoeRackDepth: {
        value: '350mm - 380mm',
        rationale: 'Keeps entryways unrestrictive while holding size 12 footwear comfortably.'
      },
      foyerPassage: {
        value: '1200mm minimum',
        rationale: 'Main entryway bottleneck zone; requires wider clearance for multiple people entering simultaneously.'
      }
    },
    temple: {
      pedestalHeight: {
        value: '450mm from finished floor',
        rationale: 'Ensures idols are placed above navel level when standing, which is structurally respectful.'
      },
      ventilationLoop: {
        value: 'Minimum 300mm overhead dome gap',
        rationale: 'Enables soot and heat from diyas or incense to disperse safely without staining overhead woodwork.'
      }
    }
  },

  // Vastu Shastra Orientation Analysis Rules
  vastu: {
    rooms: {
      kitchen: {
        ideal: ['SE', 'NW'],
        names: ['South-East (Agni - Fire Zone)', 'North-West (Vayu - Air Zone)'],
        rule: 'Stove should face East. Avoid placing Kitchen in North-East (Ishanya) which is a water element zone, or South-West which can disrupt financial stability.'
      },
      masterBedroom: {
        ideal: ['SW'],
        names: ['South-West (Nairutya - Earth/Stability Zone)'],
        rule: 'Master Bed headboard must face South or East to align with the Earth\'s geomagnetic fields. Avoid North-East beds which induce sleep disturbances.'
      },
      livingRoom: {
        ideal: ['N', 'E', 'NE'],
        names: ['North (Kubera - Wealth)', 'East (Indra - Social)', 'North-East (Spiritual)'],
        rule: 'Heavier furniture (sofas, consoles) should occupy the South/West zones. Maintain the North/East center area light, airy and open.'
      },
      temple: {
        ideal: ['NE'],
        names: ['North-East (Ishanya - Pure Spiritual energy)'],
        rule: 'Pooja room should ideally occupy the pure North-East corner. Deities must face East or West. Do not construct adjacent to toilet walls.'
      },
      foyer: {
        ideal: ['N', 'E'],
        names: ['North (Wealth entry)', 'East (Prosperity entry)'],
        rule: 'Entry foyers should be completely clean, well-lit, and clutter-free to welcome positive pranic energy streams.'
      }
    },

    // Evaluates a set of room positions and returns a report with strictness weightings
    evaluate: function(layout, strictness = 'general') {
      let score = 100;
      let totalAssessed = 0;
      const reports = [];
      
      let deduction = 15;
      if (strictness === 'strict') deduction = 25;
      if (strictness === 'minimal') deduction = 5;

      for (const [roomType, direction] of Object.entries(layout)) {
        const rule = this.rooms[roomType];
        if (!rule) continue;

        totalAssessed++;
        const isIdeal = rule.ideal.includes(direction.toUpperCase());
        
        if (isIdeal) {
          reports.push({
            room: roomType,
            status: 'perfect',
            direction: direction,
            title: `Ideal placement in ${direction}`,
            message: `Compliant: ${rule.rule}`
          });
        } else {
          score -= deduction;
          const primaryIdealName = rule.names[0];
          let status = 'warning';
          if (strictness === 'strict') status = 'critical';
          if (strictness === 'minimal') status = 'info';

          reports.push({
            room: roomType,
            status: status,
            direction: direction,
            title: strictness === 'strict' ? `🚨 CRITICAL Vastu Infraction in ${direction}` : `Sub-optimal placement in ${direction}`,
            message: `Vastu Tip: Relocate to ${primaryIdealName} if possible. Remedial correction: Place copper helix/pyramids in the corner to neutralize doshas.`
          });
        }
      }

      // bound score between 0 and 100
      score = Math.max(0, score);

      return {
        score: score,
        reports: reports
      };
    }
  },

  // New Validation Logic for Materials & Indian Kitchen Clearences
  verifyCarcassMaterial: function(room, materialTier) {
    if (room === 'kitchen' || room === 'bathroom') {
      if (materialTier === 'bronze-hdmr') {
        return {
          compliant: false,
          status: 'warning',
          title: '🚨 Wet Zone Carcass Risk',
          message: 'Bronze Tier (HDMR) selected. Traditional Indian wet kitchens require IS 710 BWP Plywood for base sink carcasses to prevent water swelling.'
        };
      }
      if (materialTier === 'silver-bwr') {
        return {
          compliant: true,
          status: 'info',
          title: '👍 Optimized Plywood Tier',
          message: 'Silver Tier active. Sink cabinets use IS 710 BWP Marine Grade, dry upper cabinets use BWR plywood. Perfect cost-to-utility ratio.'
        };
      }
      return {
        compliant: true,
        status: 'perfect',
        title: '🌟 Maximum Durability',
        message: 'Gold Tier active: Entire modular carcass fabricated with high-precision IS 710 BWP Marine Grade Waterproof Plywood.'
      };
    }
    return {
      compliant: true,
      status: 'perfect',
      title: '✅ Core Material Matched',
      message: 'Dry zone carcass utilizes BWR Plywood or HDMR board, bonded with moisture resistant adhesive.'
    };
  },

  verifyChimneyHeight: function(cookingStyle, chimneyVentRoute) {
    if (cookingStyle === 'heavy-masala') {
      if (chimneyVentRoute === 'recirculating') {
        return {
          compliant: false,
          status: 'warning',
          title: '💨 Ventilation Suction Risk',
          message: 'Traditional Indian spices (tadka tempering) will saturate charcoal carbon filters in 3-4 weeks. Direct external venting with a 6-inch pipe is highly recommended.'
        };
      }
      return {
        compliant: true,
        status: 'perfect',
        title: '✅ High-Suction Ventilation',
        message: 'External ducting routing verified. Bottom of chimney must align strictly at 26–28 inches (660mm - 710mm) above the gas hob.'
      };
    }
    return {
      compliant: true,
      status: 'perfect',
      title: '✅ Ventilation Approved',
      message: 'Venting setup matches light continental baking or warming cooking styles.'
    };
  },

  verifyWorkTriangle: function(sinkDist, hobDist, fridgeDist) {
    const sum = parseFloat(sinkDist || 2.0) + parseFloat(hobDist || 1.8) + parseFloat(fridgeDist || 2.2);
    if (sum < 4.0 || sum > 7.9) {
      return {
        compliant: false,
        status: 'warning',
        title: '📐 Kitchen Work Triangle Alert',
        message: `Total work triangle distance is ${sum.toFixed(2)}m. Ideal is between 4.0m and 7.9m. Adjust layout to avoid excessive steps or cramped operations.`
      };
    }
    return {
      compliant: true,
      status: 'perfect',
      title: '✅ Perfect Work Triangle',
      message: `Excellent spatial workflow. Total distance is ${sum.toFixed(2)}m (sink, hob, fridge), optimizing chef movement efficiency.`
    };
  },

  verifyPoojaPlacement: function(poojaLocation, nearbyToiletWall) {
    if (poojaLocation !== 'NE' && poojaLocation !== 'E') {
      return {
        compliant: false,
        status: 'warning',
        title: '🧭 Pooja Cardinal Alignment',
        message: `Mandir positioned in sub-optimal ${poojaLocation} quadrant. North-East (Ishanya) is the pure spiritual energy sector. If unalterable, place a copper trishul/helix to neutralize.`
      };
    }
    if (nearbyToiletWall) {
      return {
        compliant: false,
        status: 'warning',
        title: '🚨 Pooja Wall Sharing Alert',
        message: `Mandir should never share a common structural wall with a toilet/bathroom. If unalterable, install double-ply cladding with acoustic insulation.`
      };
    }
    return {
      compliant: true,
      status: 'perfect',
      title: '✅ Spiritual Sanctum Compliant',
      message: `Mandir perfectly aligned to positive energy axes (North-East/East) and isolated from wet zones.`
    };
  },

  verifyWardrobeHanging: function(garmentType, clearHeightValue) {
    const clearHeight = parseFloat(clearHeightValue || 1200);
    if (garmentType === 'sarees' && clearHeight < 1550) {
      return {
        compliant: false,
        status: 'warning',
        title: '👗 Hanging Clearance Mismatch',
        message: `Sarees/long garments require a minimum vertical clearance of 1600mm. Currently configured at ${clearHeight}mm, which may cause structural hems to bundle or drag.`
      };
    }
    if (garmentType === 'kurtas' && clearHeight < 1050) {
      return {
        compliant: false,
        status: 'warning',
        title: '👔 Hanging Clearance Mismatch',
        message: `Kurtas and formal shirts require 1100mm to 1200mm clear height. Currently configured at ${clearHeight}mm, which may squeeze collars.`
      };
    }
    return {
      compliant: true,
      status: 'perfect',
      title: '✅ Ergonomic hanging height verified',
      message: `Hanging rod clearance of ${clearHeight}mm is fully compliant with modular standards.`
    };
  },

  verifyLPGVentilation: function(gasSetup, hasVentilationSlot = true) {
    if (gasSetup === 'hob-cylinder' || gasSetup === 'stove-cylinder') {
      if (!hasVentilationSlot) {
        return {
          compliant: false,
          status: 'warning',
          title: '🚨 LPG Cylinder Ventilation Hazard',
          message: 'LPG cylinder stored in modular base cabinet without ventilation. Piped gas setup is ideal; otherwise, modular cabinets require gas cylinder base vents or mesh shutters (min 450mm width) to prevent volatile gas traps.'
        };
      }
      return {
        compliant: true,
        status: 'perfect',
        title: '✅ Safety Ventilation Compliant',
        message: 'LPG Cylinder stored in a specialized 450mm modular base cabinet configured with circular ventilation slots and safety rear piping clearance.'
      };
    }
    return {
      compliant: true,
      status: 'perfect',
      title: '✅ Gas Setup Approved',
      message: 'Direct gas hob piping utilizing utility line GAIL connection. No gas cylinder hazard present.'
    };
  },

  verifyPartitionScreen: function(partitionStyle, screenWidth = 1200, screenDepth = 150) {
    if (partitionStyle !== 'none') {
      if (screenWidth < 1200 || screenDepth < 150) {
        return {
          compliant: false,
          status: 'warning',
          title: '📐 Divider Stability Warning',
          message: `Partition divider (${partitionStyle}) width is configured at ${screenWidth}mm and depth at ${screenDepth}mm. Indian contemporary jali or timber partitions require a minimum width of 1200-1500mm and a stable floor base depth of at least 150mm for structural rigidity.`
        };
      }
      return {
        compliant: true,
        status: 'perfect',
        title: '✅ Divider Structure Verified',
        message: `Partition divider screen (${partitionStyle}) is highly stable with a robust ${screenWidth}mm width and a rigid ${screenDepth}mm base footing.`
      };
    }
    return {
      compliant: true,
      status: 'perfect',
      title: '✅ Partition Unnecessary',
      message: 'Open floor plan concept active. No divider jali screen required.'
    };
  }
};
