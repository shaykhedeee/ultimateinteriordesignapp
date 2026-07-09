import sharp from 'sharp';

const imagePath = 'C:\\Users\\USER\\.gemini\\antigravity\\brain\\07864430-bd4d-457b-9d44-e64a25f91412\\media__1781091049588.jpg';

async function processLogo() {
  try {
    const { data, info } = await sharp(imagePath)
      .raw()
      .toBuffer({ resolveWithObject: true });

    console.log('Image Info:', info);
    
    // Sample some corners
    const corners = [
      { x: 0, y: 0 },
      { x: info.width - 1, y: 0 },
      { x: 0, y: info.height - 1 },
      { x: info.width - 1, y: info.height - 1 }
    ];
    
    corners.forEach((c) => {
      const idx = (c.y * info.width + c.x) * info.channels;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      console.log(`Corner at (${c.x}, ${c.y}): R=${r}, G=${g}, B=${b}`);
    });

    // We'll treat any pixel as background if it is very close to white or the corner color.
    // Let's use a threshold. Since corners seem to be white (we'll see), let's threshold it.
    // Standard threshold: r > 240 && g > 240 && b > 240
    const outBuffer = Buffer.alloc(info.width * info.height * 4);
    for (let i = 0; i < info.width * info.height; i++) {
      const r = data[i * 3];
      const g = data[i * 3 + 1];
      const b = data[i * 3 + 2];
      
      // Let's also check if it's close to white
      // If the average is above 240, make it transparent
      const isBg = (r > 240 && g > 240 && b > 240);
      
      outBuffer[i * 4] = r;
      outBuffer[i * 4 + 1] = g;
      outBuffer[i * 4 + 2] = b;
      outBuffer[i * 4 + 3] = isBg ? 0 : 255;
    }

    // Save as transparent PNG
    const logoDest = 'c:\\Users\\USER\\Documents\\Muskans autocad solution\\spacious-venture-onboarding\\frontend\\public\\logo_transparent.png';
    await sharp(outBuffer, {
      raw: {
        width: info.width,
        height: info.height,
        channels: 4
      }
    })
    .png()
    .toFile(logoDest);
    console.log('Saved transparent logo to', logoDest);

    // Let's also create a square favicon.png
    // We can crop the logo or resize it. Let's find the bounding box of non-transparent pixels!
    let minX = info.width, maxX = 0, minY = info.height, maxY = 0;
    for (let y = 0; y < info.height; y++) {
      for (let x = 0; x < info.width; x++) {
        const i = (y * info.width + x);
        const a = outBuffer[i * 4 + 3];
        if (a > 0) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
    
    console.log(`Bounding box: minX=${minX}, maxX=${maxX}, minY=${minY}, maxY=${maxY}`);
    
    // Extract bounding box and save
    const boxWidth = maxX - minX + 1;
    const boxHeight = maxY - minY + 1;
    console.log(`Box dimensions: ${boxWidth}x${boxHeight}`);
    
    const croppedBuffer = await sharp(logoDest)
      .extract({ left: minX, top: minY, width: boxWidth, height: boxHeight })
      .toBuffer();

    // Now make it square by adding padding or resizing
    const size = Math.max(boxWidth, boxHeight);
    const faviconDest = 'c:\\Users\\USER\\Documents\\Muskans autocad solution\\spacious-venture-onboarding\\frontend\\public\\favicon.png';
    
    await sharp(croppedBuffer)
      .resize(size, size, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .resize(64, 64) // standard favicon size
      .png()
      .toFile(faviconDest);
      
    console.log('Saved square favicon to', faviconDest);
  } catch (err) {
    console.error('Error processing logo:', err);
  }
}

processLogo();
