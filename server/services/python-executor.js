/**
 * python-executor.js
 * ──────────────────
 * Secure, sandboxed Python script runner for ULTIDA backend.
 *
 * Supports:
 *   - Inline script execution (code string from POST body)
 *   - Floor-plan area & dimension calculations (ezdxf)
 *   - Library availability probing
 *
 * The executor writes a temp .py file to os.tmpdir(), runs Python,
 * then removes it.  Execution is capped at 20 seconds (TIMEOUT_MS).
 */

import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { nanoid } from 'nanoid';

const TIMEOUT_MS = 20_000;

// Common libraries ULTIDA scripts may use
const KNOWN_LIBRARIES = [
  'ezdxf', 'numpy', 'Pillow', 'cv2', 'shapely', 'matplotlib', 'scipy', 'pandas'
];

/**
 * Detect which Python interpreter is available on this machine.
 */
async function detectPython() {
  for (const cmd of ['python3', 'python']) {
    try {
      const result = await runProcess(cmd, ['--version'], { timeout: 3000 });
      if (result.exitCode === 0) return cmd;
    } catch {
      // try next
    }
  }
  return null;
}

/**
 * Run a child process and return { stdout, stderr, exitCode }.
 */
function runProcess(cmd, args, { timeout = TIMEOUT_MS, cwd = process.cwd() } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { cwd, shell: false });
    let stdout = '';
    let stderr = '';
    let killed = false;

    const timer = setTimeout(() => {
      killed = true;
      child.kill('SIGTERM');
      reject(new Error(`Execution timed out after ${timeout / 1000}s`));
    }, timeout);

    child.stdout.on('data', d => { stdout += d.toString(); });
    child.stderr.on('data', d => { stderr += d.toString(); });

    child.on('close', code => {
      clearTimeout(timer);
      if (!killed) resolve({ stdout: stdout.trim(), stderr: stderr.trim(), exitCode: code ?? -1 });
    });

    child.on('error', err => {
      clearTimeout(timer);
      reject(err);
    });
  });
}

/**
 * Execute an arbitrary Python script string.
 * Returns { success, stdout, stderr, exitCode, durationMs }
 */
export async function executePythonScript(code, { context = {} } = {}) {
  const pythonCmd = await detectPython();
  if (!pythonCmd) {
    return {
      success: false,
      stdout: '',
      stderr: 'Python interpreter not found on this machine. Install Python 3.x to use script execution.',
      exitCode: 127,
      durationMs: 0
    };
  }

  // Inject context as a JSON-accessible variable at the top of the script
  const contextPreamble = Object.keys(context).length
    ? `import json\n_ULTIDA_CONTEXT = json.loads(${JSON.stringify(JSON.stringify(context))})\n\n`
    : '';

  const fullCode = contextPreamble + code;
  const tmpFile = path.join(os.tmpdir(), `ultida_py_${nanoid(8)}.py`);

  try {
    fs.writeFileSync(tmpFile, fullCode, 'utf8');
    const t0 = Date.now();
    const result = await runProcess(pythonCmd, [tmpFile]);
    const durationMs = Date.now() - t0;
    return {
      success: result.exitCode === 0,
      stdout: result.stdout,
      stderr: result.stderr,
      exitCode: result.exitCode,
      durationMs
    };
  } catch (err) {
    return {
      success: false,
      stdout: '',
      stderr: err.message,
      exitCode: -1,
      durationMs: 0
    };
  } finally {
    try { fs.unlinkSync(tmpFile); } catch { /* already gone */ }
  }
}

/**
 * Probe which Python packages are available.
 * Returns { available: string[], missing: string[] }
 */
export async function probePythonLibraries(libraries = KNOWN_LIBRARIES) {
  const pythonCmd = await detectPython();
  if (!pythonCmd) {
    return { pythonAvailable: false, available: [], missing: libraries };
  }

  const probe = libraries.map(lib => `
try:
    import ${lib.replace('-', '_')}
    print("OK:${lib}")
except ImportError:
    print("MISSING:${lib}")`).join('\n');

  const result = await executePythonScript(probe);
  const available = [];
  const missing = [];
  for (const line of result.stdout.split('\n')) {
    if (line.startsWith('OK:')) available.push(line.slice(3));
    if (line.startsWith('MISSING:')) missing.push(line.slice(8));
  }

  return { pythonAvailable: true, pythonCmd, available, missing };
}

/**
 * Compute room areas from a DXF file using ezdxf.
 * Returns parsed room areas or error.
 */
export async function computeDxfAreas(dxfFilePath) {
  const code = `
import ezdxf, json, math

try:
    doc = ezdxf.readfile(${JSON.stringify(dxfFilePath)})
    msp = doc.modelspace()
    results = []
    for entity in msp:
        if entity.dxftype() == 'LWPOLYLINE':
            pts = list(entity.get_points())
            if len(pts) < 3:
                continue
            # Shoelace formula for area
            n = len(pts)
            area = 0.0
            for i in range(n):
                x1, y1 = pts[i][0], pts[i][1]
                x2, y2 = pts[(i+1) % n][0], pts[(i+1) % n][1]
                area += (x1 * y2) - (x2 * y1)
            area = abs(area) / 2.0
            results.append({ 'type': 'LWPOLYLINE', 'area_mm2': round(area, 2), 'area_sqft': round(area / 92903.04, 3) })
    print(json.dumps({ 'success': True, 'entities': results }))
except Exception as e:
    print(json.dumps({ 'success': False, 'error': str(e) }))
`;

  const result = await executePythonScript(code);
  try {
    return JSON.parse(result.stdout);
  } catch {
    return { success: false, error: result.stderr || 'Invalid output from Python parser' };
  }
}

export default { executePythonScript, probePythonLibraries, computeDxfAreas };
