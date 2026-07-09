import http from 'http';

function postJson(url, data) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const postData = JSON.stringify(data);
    
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          if (res.statusCode >= 400) {
            reject(new Error(`Status ${res.statusCode}: ${parsed.error || body}`));
          } else {
            resolve(parsed);
          }
        } catch (e) {
          reject(e);
        }
      });
    });
    
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

function getJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          if (res.statusCode >= 400) {
            reject(new Error(`Status ${res.statusCode}: ${parsed.error || body}`));
          } else {
            resolve(parsed);
          }
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function runTest() {
  try {
    console.log('1. Seeding demo database...');
    const seedResult = await postJson('http://127.0.0.1:8787/api/admin/demo-reset', { confirm: 'RESET DEMO' });
    console.log('Seed result:', seedResult);
    
    console.log('\n2. Fetching project list...');
    const projectsData = await getJson('http://127.0.0.1:8787/api/projects');
    const projects = projectsData.items || [];
    console.log(`Found ${projects.length} projects.`);
    
    if (projects.length === 0) {
      throw new Error('No projects found after seeding!');
    }
    
    const demoProject = projects[0];
    console.log(`Targeting project: ${demoProject.clientName} (ID: ${demoProject.id})`);
    
    console.log('\n3. Triggering cutlist generation...');
    const cutlistResult = await postJson(`http://127.0.0.1:8787/api/projects/${demoProject.id}/cutlists`, {});
    const cutlist = cutlistResult.cutlist;
    console.log('Cutlist summary:');
    console.log(`- ID: ${cutlist.id}`);
    console.log(`- Revision: ${cutlist.revision}`);
    console.log(`- Module count: ${cutlist.moduleCount}`);
    console.log(`- Part count: ${cutlist.partCount}`);
    console.log(`- Estimated Sheets: ${cutlist.totals?.estimatedSheets}`);
    console.log(`- Estimated Edge Banding: ${cutlist.totals?.estimatedEdgeBandM}m`);
    
    if (cutlist.moduleCount > 0 && cutlist.partCount > 0) {
      console.log('\nSUCCESS: Cutlist generated and transferred smoothly!');
    } else {
      throw new Error('Cutlist modules or parts are empty!');
    }
  } catch (err) {
    console.error('Test failed with error:', err);
    process.exit(1);
  }
}

runTest();
