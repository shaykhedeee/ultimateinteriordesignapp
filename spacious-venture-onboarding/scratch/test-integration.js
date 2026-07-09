import path from 'node:path';
import fs from 'node:fs';

const API_BASE = 'http://127.0.0.1:8791';

async function testOnboardingAndGeneration() {
  console.log('Starting integration test...');
  
  // 1. Create a project
  const projectPayload = {
    clientName: 'Integration Test Client',
    city: 'Mumbai',
    homeType: '3bhk',
    budgetTier: 'premium',
    primaryStyle: 'modern',
    selectedSpaces: ['Living / TV Wall'],
    familyProfile: ['Couple'],
    notes: 'Create visual tests'
  };
  
  console.log('Creating project...');
  let res = await fetch(`${API_BASE}/api/projects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(projectPayload)
  });
  
  if (!res.ok) {
    console.error('Failed to create project:', res.status, await res.text());
    return;
  }
  
  const { project } = await res.json();
  console.log(`✅ Project created with ID: ${project.id}`);
  
  // 2. Generate package
  console.log('Generating package brief (onboarding Step 8 equivalent)...');
  res = await fetch(`${API_BASE}/api/projects/${project.id}/generate-package`, {
    method: 'POST'
  });
  
  if (!res.ok) {
    console.error('Failed to generate package:', res.status, await res.text());
    return;
  }
  
  const { designPackage } = await res.json();
  console.log(`✅ Package generated with ID: ${designPackage.id}`);
  
  // Verify files
  const moodboards = designPackage.moodboards || [];
  console.log(`Found ${moodboards.length} moodboards.`);
  for (const mb of moodboards) {
    console.log(`Room: ${mb.room}`);
    for (const asset of mb.assets) {
      console.log(`  Asset filePath: ${asset.filePath}`);
      const absPath = path.join(process.cwd(), asset.filePath.replace(/^\//, ''));
      if (fs.existsSync(absPath)) {
        console.log(`  ✅ File exists at: ${absPath}`);
      } else {
        console.error(`  ❌ File missing at: ${absPath}`);
      }
    }
  }
  
  // 3. Render Studio variant generation (Render Studio page equivalent)
  console.log('Generating Render Studio variants (with reuseFirst=false)...');
  const renderParams = {
    room: 'Living / TV Wall',
    style: 'modern',
    budgetTier: 'premium',
    qualityMode: 'balanced',
    reuseFirst: 'false',
    variantCount: '2'
  };
  
  const formData = new FormData();
  Object.entries(renderParams).forEach(([k, v]) => formData.append(k, v));
  
  res = await fetch(`${API_BASE}/api/projects/${project.id}/renders/generate`, {
    method: 'POST',
    body: formData
  });
  
  if (!res.ok) {
    console.error('Failed to generate studio renders:', res.status, await res.text());
    return;
  }
  
  const renderResult = await res.json();
  console.log(`✅ Studio renders generated!`);
  const variants = renderResult.variants || [];
  console.log(`Found ${variants.length} variants.`);
  for (const v of variants) {
    console.log(`  Variant ID: ${v.id}, sourceType: ${v.sourceType}, filePath: ${v.filePath}`);
    const absPath = path.join(process.cwd(), v.filePath.replace(/^\//, ''));
    if (fs.existsSync(absPath)) {
      console.log(`  ✅ File exists at: ${absPath}`);
    } else {
      console.error(`  ❌ File missing at: ${absPath}`);
    }
  }
  
  console.log('Integration test complete!');
}

testOnboardingAndGeneration();
