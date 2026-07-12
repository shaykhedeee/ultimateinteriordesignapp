class LeadScorer {
  /**
   * Calculates a lead priority/feasibility score between 0 and 100
   * @param {object} leadData 
   * @returns {number} score
   */
  calculateScore(leadData) {
    let score = 50; // Base score
    
    // 1. Budget Scorer
    const budget = parseFloat(leadData.budget) || 0;
    if (budget >= 1200000) {
      score += 25; // Premium budget
    } else if (budget >= 800000) {
      score += 15; // Moderate budget
    } else if (budget >= 500000) {
      score += 5;
    } else if (budget > 0 && budget < 400000) {
      score -= 15; // Low budget modular kitchen only
    }

    // 2. Area Sq Ft Scorer
    const area = parseFloat(leadData.area) || 0;
    if (area >= 2000) {
      score += 15; // Large villas
    } else if (area >= 1200) {
      score += 10; // 3 BHK flat
    } else if (area > 0 && area < 900) {
      score -= 5;  // 1 BHK or small repairs
    }

    // 3. Location / Posh Areas Scorer (Bangalore specific example)
    const location = (leadData.location || '').toLowerCase();
    const premiumLocations = ['hsr layout', 'whitefield', 'indiranagar', 'koramangala', 'jayanagar', 'sadashivanagar', 'sarjapur'];
    const hasPremiumLocation = premiumLocations.some(loc => location.includes(loc));
    if (hasPremiumLocation) {
      score += 10;
    }

    // 4. Requirements Keyword Analysis
    const reqText = (leadData.requirements || '').toLowerCase();
    
    // Positive Urgency Keywords
    const positiveKeywords = ['immediate', 'next month', 'possession soon', 'ready to move', 'full flat', '3 bhk', '4 bhk', 'villa'];
    positiveKeywords.forEach(kw => {
      if (reqText.includes(kw)) score += 3;
    });

    // Negative Delay Keywords
    const negativeKeywords = ['just checking', 'next year', 'renovation only', 'repair', 'only kitchen cabinet', '6 months'];
    negativeKeywords.forEach(kw => {
      if (reqText.includes(kw)) score -= 5;
    });

    // Constrain score between 1 and 100 (per documented contract)
    return Math.max(1, Math.min(100, score));
  }
}

export default new LeadScorer();
