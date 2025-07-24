const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// List of image files that were converted to SVG
const convertedImages = [
  'chilled-vibes',
  'contact-hero',
  'event-past-2',
  'infused-menu-hero',
  'relaxing-piano',
  'shop/apron-2',
  'shop/apron',
  'shop/beanie-2',
  'shop/beanie',
  'shop/ceramic-mug-2',
  'shop/ceramic-mug',
  'shop/classic-logo-tee-2',
  'shop/classic-logo-tee',
  'shop/cutting-board-2',
  'shop/cutting-board',
  'shop/dad-hat-2',
  'shop/dad-hat',
  'shop/insulated-tumbler-2',
  'shop/insulated-tumbler',
  'shop/long-sleeve-tee-2',
  'shop/long-sleeve-tee',
  'shop/phone-case-2',
  'shop/phone-case',
  'shop/premium-hoodie-2',
  'shop/premium-hoodie',
  'shop/snapback-cap-2',
  'shop/snapback-cap',
  'shop/tote-bag-2',
  'shop/tote-bag',
  'testimonial-1',
  'testimonial-2',
  'testimonial-3',
  'volunteer-hero',
  'volunteer-testimonial-1',
  'volunteer-testimonial-2',
  'volunteer-testimonial-3',
  'volunteer-testimonial-4'
];

// Function to find and replace image references in files
function updateImageReferences() {
  console.log('Updating image references in code files...');
  
  // Find all TypeScript and JavaScript files in src directory
  const srcFiles = [];
  
  function findFiles(dir) {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stats = fs.statSync(fullPath);
      
      if (stats.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        findFiles(fullPath);
      } else if (/\.(tsx?|jsx?)$/.test(item)) {
        srcFiles.push(fullPath);
      }
    }
  }
  
  findFiles('src');
  
  let totalReplacements = 0;
  
  // Process each file
  for (const filePath of srcFiles) {
    let content = fs.readFileSync(filePath, 'utf8');
    let fileChanged = false;
    let fileReplacements = 0;
    
    // Replace each converted image reference
    for (const imageName of convertedImages) {
      const oldRef = `/images/${imageName}.jpg`;
      const newRef = `/images/${imageName}.svg`;
      
      if (content.includes(oldRef)) {
        content = content.replace(new RegExp(oldRef.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newRef);
        fileChanged = true;
        fileReplacements++;
        console.log(`  ${filePath}: ${oldRef} -> ${newRef}`);
      }
    }
    
    // Write back the file if it was changed
    if (fileChanged) {
      fs.writeFileSync(filePath, content);
      totalReplacements += fileReplacements;
    }
  }
  
  console.log(`\nUpdate complete! Made ${totalReplacements} replacements across ${srcFiles.length} files.`);
}

// Function to verify all SVG files exist
function verifySVGFiles() {
  console.log('\nVerifying SVG files exist...');
  
  let missingFiles = 0;
  
  for (const imageName of convertedImages) {
    const svgPath = path.join('public', 'images', `${imageName}.svg`);
    
    if (!fs.existsSync(svgPath)) {
      console.log(`  Missing: ${svgPath}`);
      missingFiles++;
    }
  }
  
  if (missingFiles === 0) {
    console.log('All SVG files verified!');
  } else {
    console.log(`Warning: ${missingFiles} SVG files are missing.`);
  }
}

// Main function
function main() {
  console.log('Starting image reference update process...');
  
  verifySVGFiles();
  updateImageReferences();
  
  console.log('\nImage reference update complete!');
  console.log('\nNext steps:');
  console.log('1. Test the application to ensure all images load correctly');
  console.log('2. Consider regenerating actual images to replace SVG placeholders');
}

// Run the script
main();