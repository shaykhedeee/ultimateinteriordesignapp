import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import db from '../database/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const storageDir = path.resolve(__dirname, '../../storage');

// Common installation directories for Blender on Windows
const DEFAULT_BLENDER_PATHS = [
  process.env.BLENDER_PATH,
  'C:\\Program Files\\Blender Foundation\\Blender 4.2\\blender.exe',
  'C:\\Program Files\\Blender Foundation\\Blender 4.1\\blender.exe',
  'C:\\Program Files\\Blender Foundation\\Blender 4.0\\blender.exe',
  'C:\\Program Files\\Blender Foundation\\Blender 3.6\\blender.exe',
  'blender' // In system PATH
].filter(Boolean);

function findBlenderExecutable() {
  if (process.env.NODE_ENV === 'test') {
    return process.env.BLENDER_PATH || 'non_existent_blender_binary_mock';
  }
  for (const p of DEFAULT_BLENDER_PATHS) {
    if (fs.existsSync(p)) return p;
  }
  return 'blender'; // Fallback to PATH
}

/**
 * Executes Blender headlessly to render a scene graph
 * @param {string} projectId 
 * @param {object} sceneJson The canonical scene graph representation
 * @param {string} cameraPreset 'elevation_wall_a', 'elevation_wall_b', 'perspective_main', etc.
 * @param {object} options { quality: 'draft'|'final', jobId: string }
 * @returns {Promise<string>} Path to the rendered base image
 */
export async function renderSceneWithBlender(projectId, sceneJson, cameraPreset = 'perspective_main', options = {}) {
  const blenderBin = findBlenderExecutable();
  const projectDir = path.join(storageDir, 'projects', projectId);
  if (!fs.existsSync(projectDir)) {
    fs.mkdirSync(projectDir, { recursive: true });
  }

  // Persist the immutable package while Blender reads a short-lived scene file.
  const renderPackage = options.renderPackage || null;
  const packageDir = path.join(projectDir, 'render-packages');
  if (renderPackage) {
    fs.mkdirSync(packageDir, { recursive: true });
    fs.writeFileSync(path.join(packageDir, `${renderPackage.renderPackageHash}.json`), JSON.stringify(renderPackage, null, 2), 'utf8');
  }
  const tempJsonPath = path.join(projectDir, `scene_temp${renderPackage ? `-${renderPackage.renderPackageHash.slice(-12)}` : ''}.json`);
  fs.writeFileSync(tempJsonPath, JSON.stringify(sceneJson, null, 2), 'utf8');

  // Output render image path
  const renderDir = path.join(storageDir, 'render');
  if (!fs.existsSync(renderDir)) {
    fs.mkdirSync(renderDir, { recursive: true });
  }
  const safeCamera = String(cameraPreset).replace(/[^a-z0-9_-]/gi, '_');
  const fingerprint = renderPackage ? renderPackage.renderPackageHash.slice(-12) : Date.now();
  const outputImgPath = path.join(renderDir, `blender-${projectId}-${fingerprint}-${safeCamera}${options.mode ? `-${options.mode}` : ''}.png`);

  const pythonScript = path.join(__dirname, '../scripts/render_scene.py');
  
  // Build arguments
  const args = [
    '-b', // Headless mode
    '-P', pythonScript,
    '--', // Arguments pass-through separator
    '--scene', tempJsonPath,
    '--output', outputImgPath,
    '--camera', cameraPreset,
    '--quality', options.quality || 'draft'
  ];
  if (Number.isInteger(options.seed)) args.push('--seed', String(options.seed));
  if (options.mode) {
    args.push('--mode', options.mode);
  }

  console.log(`[blender-renderer] Spawning: ${blenderBin} ${args.join(' ')}`);

  return new Promise((resolve, reject) => {
    const proc = spawn(blenderBin, args);
    let stdout = '';
    let stderr = '';

    proc.on('error', (err) => {
      reject(err);
    });

    proc.stdout.on('data', (data) => {
      const chunk = data.toString();
      stdout += chunk;
      // Parse progress if printed by the script
      const match = chunk.match(/Rendering\s+(\d+)%/);
      if (match && options.jobId) {
        const progress = parseInt(match[1], 10);
        try {
          db.prepare('UPDATE jobs SET progress = ? WHERE id = ?').run(progress, options.jobId);
        } catch (_) {}
      }
    });

    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    proc.on('close', (code) => {
      // Clean up temp JSON
      try { fs.rmSync(tempJsonPath, { force: true }); } catch (_) {}

      if (code === 0) {
        console.log(`[blender-renderer] Completed rendering successfully. Image saved to ${outputImgPath}`);
        if (fs.existsSync(outputImgPath)) {
          resolve(options.returnMetadata ? {
            imagePath: outputImgPath,
            renderPackagePath: renderPackage ? path.join(packageDir, `${renderPackage.renderPackageHash}.json`) : null
          } : outputImgPath);
        } else {
          reject(new Error(`Blender exited with 0 but output file was not found at ${outputImgPath}`));
        }
      } else {
        console.error(`[blender-renderer] Blender exited with error code ${code}`);
        console.error(`Stdout: ${stdout.slice(-1000)}`);
        console.error(`Stderr: ${stderr.slice(-1000)}`);

        let detailMsg = 'Headless Blender process crashed.';
        if (stderr.includes('ModuleNotFoundError')) {
          const m = stderr.match(/ModuleNotFoundError: No module named '([^']+)'/);
          detailMsg = `Missing python dependency: "${m ? m[1] : 'unknown'}". Run pip/conda install inside Blender's python runtime.`;
        } else if (stderr.includes('Traceback')) {
          const traceback = stderr.split(/\r?\n/).filter(line => line.trim().startsWith('File') || line.includes('Error:') || line.includes('Exception:')).slice(-3).join('\n ');
          detailMsg = `Python exception inside Blender script:\n ${traceback}`;
        } else if (stdout.includes('Error:') || stderr.includes('Error:')) {
          const errorMsg = (stderr + '\n' + stdout).split(/\r?\n/).find(line => line.includes('Error:'));
          detailMsg = `Blender execution error: ${errorMsg ? errorMsg.trim() : 'check stderr logs'}`;
        }

        reject(new Error(`Blender render failed (code ${code}): ${detailMsg}`));
      }
    });
  });
}
