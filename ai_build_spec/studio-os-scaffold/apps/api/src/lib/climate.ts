export type ClimateProfile = 'humid' | 'dry' | 'coastal' | 'temperate' | 'mixed';

const cityClimateMap: Record<string, ClimateProfile> = {
  bengaluru: 'temperate',
  bangalore: 'temperate',
  hyderabad: 'dry',
  chennai: 'coastal',
  mumbai: 'coastal',
  pune: 'temperate',
  kolkata: 'humid',
  surat: 'humid',
  bhubaneswar: 'humid',
  visakhapatnam: 'coastal',
  vizag: 'coastal',
  ahmedabad: 'dry',
  nagpur: 'dry',
  mysore: 'temperate',
  coimbatore: 'temperate',
};

export function getClimateProfile(city?: string): ClimateProfile {
  if (!city) return 'mixed';
  return cityClimateMap[city.trim().toLowerCase()] ?? 'mixed';
}
