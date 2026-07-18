export function evaluateVastu(spaces) {
  const preferred = {
    living: ['N', 'E', 'NE'],
    kitchen: ['SE', 'NW'],
    master: ['SW'],
    kids: ['W', 'NW'],
    pooja: ['NE', 'E'],
    foyer: ['N', 'E']
  };
  const assumed = {
    living: 'E',
    kitchen: 'SE',
    master: 'SW',
    kids: 'NW',
    pooja: 'NE',
    foyer: 'N'
  };
  const reports = spaces.map((room) => {
    const direction = assumed[room] || 'E';
    const ok = (preferred[room] || ['E']).includes(direction);
    return {
      room,
      direction,
      status: ok ? 'perfect' : 'warning',
      message: ok
        ? `${room} is aligned with common Vastu expectations for ${direction}.`
        : `${room} should be reviewed; preferred directions are ${(preferred[room] || []).join(', ')}.`
    };
  });
  const score = Math.max(65, 100 - reports.filter((item) => item.status === 'warning').length * 12);
  return { score, reports };
}

export function ergonomicChecks(project) {
  const checks = [
    {
      title: 'Kitchen carcass',
      status: project.budgetTier === 'value' ? 'review' : 'approved',
      message:
        project.budgetTier === 'value'
          ? 'Value tier can use BWP for wet sink/hob base and BWR/HDMR in dry areas.'
          : 'Premium/luxury tier should specify IS 710 BWP plywood in wet kitchen bases.'
    },
    {
      title: 'Indian cooking chimney',
      status: project.cookingStyle === 'heavy-indian' ? 'approved' : 'info',
      message:
        project.cookingStyle === 'heavy-indian'
          ? 'Specify external ducted high-suction chimney and easy-clean baffle filters.'
          : 'Balanced cooking can use standard ducted chimney, subject to site duct path.'
    },
    {
      title: 'Wardrobe hanging',
      status: 'approved',
      message: 'Reserve 1600mm vertical hanging clearance for sarees/long garments and 1100-1200mm for kurtas/shirts.'
    },
    {
      title: 'Family safety',
      status: project.familyProfile?.includes('Kids') ? 'approved' : 'info',
      message: project.familyProfile?.includes('Kids')
        ? 'Use washable paint, rounded edges, anti-fingerprint shutters, and secured loose furniture.'
        : 'Standard durability checks apply.'
    }
  ];
  return checks;
}
