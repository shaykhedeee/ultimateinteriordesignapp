import fs from 'fs';
const content = fs.readFileSync('c:/Users/USER/Documents/Muskans autocad solution/spacious-venture-onboarding/frontend/src/screens/ManagementScreens.jsx', 'utf8');

console.log('Includes OnboardingPanel:', content.includes('OnboardingPanel'));
console.log('Includes MoodboardCanvas:', content.includes('MoodboardCanvas'));
console.log('Includes Review & Brief Notes:', content.includes('Review & Brief Notes'));
