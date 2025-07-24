const fs = require('fs');
const path = require('path');

// Function to create SVG placeholder
function createSVGPlaceholder(name, width = 800, height = 600) {
  return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1a1a1a;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#333333;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#grad1)"/>
  <rect x="${width * 0.1}" y="${height * 0.4}" width="${width * 0.8}" height="${height * 0.2}" rx="10" fill="#d4af37" opacity="0.8"/>
  <text x="${width / 2}" y="${height * 0.5}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${Math.min(width, height) * 0.04}" fill="#ffffff" font-weight="bold">${name}</text>
  <text x="${width / 2}" y="${height * 0.6}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${Math.min(width, height) * 0.025}" fill="#d4af37">Broski's Kitchen</text>
</svg>`;
}

// List of broken images that need to be fixed
const brokenImages = [
  { path: 'public/images/menu-hero.jpg', name: 'Menu Hero', width: 1200, height: 600 },
  { path: 'public/images/infused-menu-hero.jpg', name: 'Infused Menu Hero', width: 1200, height: 600 },
  { path: 'public/images/rewards-hero.jpg', name: 'Rewards Hero', width: 1200, height: 600 },
  { path: 'public/images/loyalty-exclusive-menu.jpg', name: 'Loyalty Exclusive Menu', width: 800, height: 600 },
  { path: 'public/images/hero-bg.jpg', name: 'Hero Background', width: 1920, height: 1080 },
  { path: 'public/images/shopHero.jpg', name: 'Shop Hero', width: 1200, height: 600 },
  { path: 'public/images/menu-1.jpg', name: 'Menu Item 1', width: 400, height: 300 },
  { path: 'public/images/menu-2.jpg', name: 'Menu Item 2', width: 400, height: 300 },
  { path: 'public/images/menu-3.jpg', name: 'Menu Item 3', width: 400, height: 300 },
  { path: 'public/images/auth-background.jpg', name: 'Auth Background', width: 1200, height: 800 }
];

// Function to check if file is broken (contains authentication error)
function isFileBroken(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return content.includes('Authentication failed') || content.includes('"code":1001');
  } catch (error) {
    return true; // File doesn't exist or can't be read
  }
}

// Function to replace broken image with SVG
function replaceBrokenImage(imageInfo) {
  const { path: imagePath, name, width, height } = imageInfo;
  const fullPath = path.join(__dirname, '..', imagePath);
  
  if (isFileBroken(fullPath)) {
    console.log(`Replacing broken image: ${imagePath}`);
    
    // Create SVG content
    const svgContent = createSVGPlaceholder(name, width, height);
    
    // Write SVG file (change extension to .svg)
    const svgPath = fullPath.replace(/\.(jpg|jpeg|png|webp)$/i, '.svg');
    fs.writeFileSync(svgPath, svgContent);
    
    console.log(`Created SVG placeholder: ${svgPath}`);
    
    // Remove the broken file
    try {
      fs.unlinkSync(fullPath);
      console.log(`Removed broken file: ${fullPath}`);
    } catch (error) {
      console.log(`Could not remove broken file: ${fullPath}`);
    }
  } else {
    console.log(`Image is valid: ${imagePath}`);
  }
}

// Main function
function fixBrokenImages() {
  console.log('Checking and fixing broken images...');
  
  brokenImages.forEach(imageInfo => {
    replaceBrokenImage(imageInfo);
  });
  
  console.log('\nBroken image fix complete!');
  console.log('Note: You may need to update image references in your code to use .svg extensions.');
}

// Run the script
fixBrokenImages();