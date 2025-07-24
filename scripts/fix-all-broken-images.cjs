const fs = require('fs');
const path = require('path');

// Function to create SVG placeholder
function createSVGPlaceholder(name, width = 400, height = 400) {
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

// Function to check if file is broken (contains authentication error or is too small)
function isFileBroken(filePath) {
  try {
    const stats = fs.statSync(filePath);
    if (stats.size < 100) { // Files smaller than 100 bytes are likely broken
      return true;
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    return content.includes('Authentication failed') || content.includes('"code":1001');
  } catch (error) {
    return true; // File doesn't exist or can't be read
  }
}

// Function to get appropriate name from filename
function getNameFromFilename(filename) {
  return filename
    .replace(/\.(jpg|jpeg|png|webp|svg)$/i, '')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
}

// Function to get appropriate dimensions based on filename
function getDimensions(filename) {
  const name = filename.toLowerCase();
  
  if (name.includes('hero') || name.includes('background')) {
    return { width: 1200, height: 600 };
  } else if (name.includes('testimonial') || name.includes('volunteer')) {
    return { width: 300, height: 400 }; // Portrait
  } else if (name.includes('shop') || name.includes('merch')) {
    return { width: 400, height: 400 }; // Square
  } else {
    return { width: 400, height: 300 }; // Default landscape
  }
}

// Function to scan directory for broken images
function scanDirectory(dirPath) {
  const brokenImages = [];
  
  function scanRecursive(currentPath) {
    const items = fs.readdirSync(currentPath);
    
    for (const item of items) {
      const fullPath = path.join(currentPath, item);
      const stats = fs.statSync(fullPath);
      
      if (stats.isDirectory()) {
        scanRecursive(fullPath);
      } else if (/\.(jpg|jpeg|png|webp)$/i.test(item)) {
        if (isFileBroken(fullPath)) {
          const relativePath = path.relative(process.cwd(), fullPath);
          const name = getNameFromFilename(item);
          const dimensions = getDimensions(item);
          
          brokenImages.push({
            path: relativePath,
            name: name,
            ...dimensions
          });
        }
      }
    }
  }
  
  scanRecursive(dirPath);
  return brokenImages;
}

// Function to replace broken image with SVG
function replaceBrokenImage(imageInfo) {
  const { path: imagePath, name, width, height } = imageInfo;
  
  console.log(`Replacing broken image: ${imagePath}`);
  
  // Create SVG content
  const svgContent = createSVGPlaceholder(name, width, height);
  
  // Write SVG file (change extension to .svg)
  const svgPath = imagePath.replace(/\.(jpg|jpeg|png|webp)$/i, '.svg');
  fs.writeFileSync(svgPath, svgContent);
  
  console.log(`Created SVG placeholder: ${svgPath}`);
  
  // Remove the broken file
  try {
    fs.unlinkSync(imagePath);
    console.log(`Removed broken file: ${imagePath}`);
  } catch (error) {
    console.log(`Could not remove broken file: ${imagePath}`);
  }
}

// Main function
function fixAllBrokenImages() {
  console.log('Scanning for broken images...');
  
  const imagesDir = path.join(process.cwd(), 'public', 'images');
  const brokenImages = scanDirectory(imagesDir);
  
  console.log(`Found ${brokenImages.length} broken images`);
  
  if (brokenImages.length === 0) {
    console.log('No broken images found!');
    return;
  }
  
  console.log('\nFixing broken images...');
  brokenImages.forEach(imageInfo => {
    replaceBrokenImage(imageInfo);
  });
  
  console.log('\nBroken image fix complete!');
  console.log('\nNote: The following files were replaced with SVG placeholders:');
  brokenImages.forEach(img => {
    const svgPath = img.path.replace(/\.(jpg|jpeg|png|webp)$/i, '.svg');
    console.log(`  ${img.path} -> ${svgPath}`);
  });
  console.log('\nYou may need to update image references in your code to use .svg extensions.');
}

// Run the script
fixAllBrokenImages();