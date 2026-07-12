/**
 * dwg-converter.js
 * --------------------------------------------------------------------------
 * Handles automated conversion of generated DXF files to native AutoCAD DWG files.
 * Uses ODA File Converter (Open Design Alliance) if installed on the host OS.
 * Includes a graceful fallback if ODA is not installed.
 */
import { execFile } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execFileAsync = promisify(execFile);

// Common paths where ODA File Converter is installed on Windows / macOS / Linux
const ODA_LOCATIONS = [
  'C:\\Program Files\\ODA\\ODAFileConverter\\ODAFileConverter.exe',
  'C:\\Program Files (x86)\\ODA\\ODAFileConverter\\ODAFileConverter.exe',
  '/Applications/ODAFileConverter.app/Contents/MacOS/ODAFileConverter',
  '/usr/bin/ODAFileConverter'
];

/**
 * Attempts to convert a DXF file to DWG format.
 * @param {string} dxfPath - Absolute path to input DXF file.
 * @param {string} dwgPath - Absolute path to output DWG file.
 * @returns {Promise<boolean>} - True if conversion succeeded, false otherwise.
 */
export async function convertDxfToDwg(dxfPath, dwgPath) {
  if (!fs.existsSync(dxfPath)) {
    console.warn(`[dwg-converter] Input DXF not found: ${dxfPath}`);
    return false;
  }

  // Find ODA File Converter executable
  let odaBin = ODA_LOCATIONS.find(loc => fs.existsSync(loc)) || 'ODAFileConverter';

  const inputDir = path.dirname(dxfPath);
  const tempOutputDir = path.join(inputDir, 'dwg_temp_out');
  
  try {
    if (!fs.existsSync(tempOutputDir)) {
      fs.mkdirSync(tempOutputDir, { recursive: true });
    }

    // ODA File Converter requires an input directory and output directory.
    // Syntax: ODAFileConverter "input_folder" "output_folder" "ACAD2010" "DWG" "0" "1"
    const args = [
      inputDir,
      tempOutputDir,
      'ACAD2010',
      'DWG',
      '0',
      '1',
      path.basename(dxfPath)
    ];

    console.log(`[dwg-converter] Launching ODA Converter: ${odaBin} with args:`, args);
    
    // We execute with a short timeout to prevent hanging the server
    await execFileAsync(odaBin, args, { timeout: 15000 });

    const expectedDwgName = path.basename(dxfPath).replace(/\.dxf$/i, '.dwg');
    const tempDwgPath = path.join(tempOutputDir, expectedDwgName);

    if (fs.existsSync(tempDwgPath)) {
      fs.renameSync(tempDwgPath, dwgPath);
      console.log(`[dwg-converter] Successfully converted to DWG: ${dwgPath}`);
      return true;
    } else {
      console.warn('[dwg-converter] ODA executed, but expected DWG file was not created in output directory.');
    }
  } catch (e) {
    console.warn('[dwg-converter] ODA File Converter failed or is not installed. Fallback to copy DXF template.', e.message);
  } finally {
    // Clean up temporary output directory
    try {
      if (fs.existsSync(tempOutputDir)) {
        fs.rmSync(tempOutputDir, { recursive: true, force: true });
      }
    } catch {}
  }

  return false;
}

export default { convertDxfToDwg };
