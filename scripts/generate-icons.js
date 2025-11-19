import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// SVG content for the icon
const svgIcon = `
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#6366f1;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#8b5cf6;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Rounded rectangle background -->
  <rect width="512" height="512" rx="100" fill="url(#gradient)"/>
  
  <!-- Star icon -->
  <g transform="translate(256, 180)">
    <path d="M 0,-80 L 20,-20 L 80,-10 L 40,30 L 50,90 L 0,60 L -50,90 L -40,30 L -80,-10 L -20,-20 Z" 
          fill="white" opacity="0.9"/>
  </g>
  
  <!-- Letter K -->
  <text x="256" y="400" 
        font-family="Arial, sans-serif" 
        font-size="200" 
        font-weight="bold" 
        fill="white" 
        text-anchor="middle" 
        dominant-baseline="middle">K</text>
</svg>
`;

async function generateIcons() {
  const publicDir = path.join(__dirname, '..', 'public');
  
  // Ensure public directory exists
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  
  // Save SVG
  const svgPath = path.join(publicDir, 'icon.svg');
  fs.writeFileSync(svgPath, svgIcon.trim());
  console.log('✅ Created icon.svg');
  
  // Generate PNG icons
  const sizes = [192, 512];
  
  for (const size of sizes) {
    const outputPath = path.join(publicDir, `pwa-${size}x${size}.png`);
    
    await sharp(Buffer.from(svgIcon))
      .resize(size, size)
      .png()
      .toFile(outputPath);
    
    console.log(`✅ Created pwa-${size}x${size}.png`);
  }
  
  // Generate apple-touch-icon
  const appleTouchIconPath = path.join(publicDir, 'apple-touch-icon.png');
  await sharp(Buffer.from(svgIcon))
    .resize(180, 180)
    .png()
    .toFile(appleTouchIconPath);
  
  console.log('✅ Created apple-touch-icon.png');
  
  console.log('\n🎉 All PWA icons generated successfully!');
}

generateIcons().catch(console.error);
