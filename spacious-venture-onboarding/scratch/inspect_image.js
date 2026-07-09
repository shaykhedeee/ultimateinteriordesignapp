import sharp from 'sharp';
import path from 'path';

const imagePath = 'C:\\Users\\USER\\.gemini\\antigravity\\brain\\07864430-bd4d-457b-9d44-e64a25f91412\\media__1781091049588.jpg';

async function inspect() {
  try {
    const metadata = await sharp(imagePath).metadata();
    console.log('Image Metadata:', metadata);
  } catch (err) {
    console.error('Error inspecting image:', err);
  }
}

inspect();
