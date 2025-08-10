#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Configuration
const PUBLIC_DIR = path.join(__dirname, '..', 'public')
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png']
const WEBP_QUALITY = 85
const BACKUP_DIR = path.join(PUBLIC_DIR, 'images', 'originals')

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true })
}

/**
 * Check if sharp is available for image processing
 */
async function checkSharpAvailability() {
  try {
    await import('sharp')
    return true
  } catch (error) {
    console.log('Sharp not found. Installing...')
    try {
      execSync('npm install sharp', { stdio: 'inherit' })
      return true
    } catch (installError) {
      console.error('Failed to install sharp:', installError.message)
      return false
    }
  }
}

/**
 * Get all image files recursively
 */
function getImageFiles(dir, files = []) {
  const items = fs.readdirSync(dir)
  
  for (const item of items) {
    const fullPath = path.join(dir, item)
    const stat = fs.statSync(fullPath)
    
    if (stat.isDirectory() && item !== 'originals') {
      getImageFiles(fullPath, files)
    } else if (stat.isFile() && IMAGE_EXTENSIONS.includes(path.extname(item).toLowerCase())) {
      files.push(fullPath)
    }
  }
  
  return files
}

/**
 * Convert image to WebP format
 */
async function convertToWebP(inputPath, outputPath) {
  const { default: sharp } = await import('sharp')
  
  try {
    await sharp(inputPath)
      .webp({ quality: WEBP_QUALITY, effort: 6 })
      .toFile(outputPath)
    
    const inputStats = fs.statSync(inputPath)
    const outputStats = fs.statSync(outputPath)
    const savings = ((inputStats.size - outputStats.size) / inputStats.size * 100).toFixed(1)
    
    console.log(`✓ ${path.basename(inputPath)} → ${path.basename(outputPath)} (${savings}% smaller)`)
    return { success: true, savings: parseFloat(savings), originalSize: inputStats.size, newSize: outputStats.size }
  } catch (error) {
    console.error(`✗ Failed to convert ${path.basename(inputPath)}:`, error.message)
    return { success: false, error: error.message }
  }
}

/**
 * Optimize existing images (compress without format change)
 */
async function optimizeImage(inputPath) {
  const { default: sharp } = await import('sharp')
  const backupPath = path.join(BACKUP_DIR, path.basename(inputPath))
  
  try {
    // Create backup if it doesn't exist
    if (!fs.existsSync(backupPath)) {
      fs.copyFileSync(inputPath, backupPath)
    }
    
    const ext = path.extname(inputPath).toLowerCase()
    let pipeline = sharp(inputPath)
    
    if (ext === '.jpg' || ext === '.jpeg') {
      pipeline = pipeline.jpeg({ quality: WEBP_QUALITY, progressive: true })
    } else if (ext === '.png') {
      pipeline = pipeline.png({ quality: WEBP_QUALITY, compressionLevel: 9 })
    }
    
    await pipeline.toFile(inputPath + '.tmp')
    
    const originalStats = fs.statSync(inputPath)
    const optimizedStats = fs.statSync(inputPath + '.tmp')
    
    if (optimizedStats.size < originalStats.size) {
      fs.renameSync(inputPath + '.tmp', inputPath)
      const savings = ((originalStats.size - optimizedStats.size) / originalStats.size * 100).toFixed(1)
      console.log(`✓ Optimized ${path.basename(inputPath)} (${savings}% smaller)`)
      return { success: true, savings: parseFloat(savings), originalSize: originalStats.size, newSize: optimizedStats.size }
    } else {
      fs.unlinkSync(inputPath + '.tmp')
      console.log(`- ${path.basename(inputPath)} already optimized`)
      return { success: true, savings: 0, originalSize: originalStats.size, newSize: originalStats.size }
    }
  } catch (error) {
    // Clean up temp file if it exists
    if (fs.existsSync(inputPath + '.tmp')) {
      fs.unlinkSync(inputPath + '.tmp')
    }
    console.error(`✗ Failed to optimize ${path.basename(inputPath)}:`, error.message)
    return { success: false, error: error.message }
  }
}

/**
 * Generate responsive image sizes
 */
async function generateResponsiveSizes(inputPath, sizes = [640, 828, 1200, 1920]) {
  const { default: sharp } = await import('sharp')
  const dir = path.dirname(inputPath)
  const name = path.basename(inputPath, path.extname(inputPath))
  const results = []
  
  for (const size of sizes) {
    try {
      const outputPath = path.join(dir, `${name}-${size}w.webp`)
      
      await sharp(inputPath)
        .resize(size, null, { withoutEnlargement: true })
        .webp({ quality: WEBP_QUALITY, effort: 6 })
        .toFile(outputPath)
      
      results.push(outputPath)
      console.log(`✓ Generated ${path.basename(outputPath)}`)
    } catch (error) {
      console.error(`✗ Failed to generate ${size}w version:`, error.message)
    }
  }
  
  return results
}

/**
 * Main optimization function
 */
async function optimizeImages() {
  console.log('🖼️  Starting image optimization...\n')
  
  if (!(await checkSharpAvailability())) {
    console.error('Cannot proceed without Sharp library')
    process.exit(1)
  }
  
  const imageFiles = getImageFiles(PUBLIC_DIR)
  console.log(`Found ${imageFiles.length} images to process\n`)
  
  let totalOriginalSize = 0
  let totalNewSize = 0
  let processedCount = 0
  let errorCount = 0
  
  for (const imagePath of imageFiles) {
    const relativePath = path.relative(PUBLIC_DIR, imagePath)
    console.log(`Processing: ${relativePath}`)
    
    // Skip if already WebP
    if (path.extname(imagePath).toLowerCase() === '.webp') {
      console.log(`- Skipping WebP file: ${path.basename(imagePath)}`)
      continue
    }
    
    // Optimize original image
    const optimizeResult = await optimizeImage(imagePath)
    if (optimizeResult.success) {
      totalOriginalSize += optimizeResult.originalSize
      totalNewSize += optimizeResult.newSize
      processedCount++
    } else {
      errorCount++
    }
    
    // Generate WebP version
    const webpPath = imagePath.replace(/\.(jpg|jpeg|png)$/i, '.webp')
    const webpResult = await convertToWebP(imagePath, webpPath)
    
    if (webpResult.success) {
      // Generate responsive sizes for hero images and large assets
      if (imagePath.includes('hero') || imagePath.includes('Hero') || 
          path.basename(imagePath).startsWith('Broskis-New-Hero')) {
        console.log(`Generating responsive sizes for ${path.basename(imagePath)}...`)
        await generateResponsiveSizes(imagePath)
      }
    }
    
    console.log('') // Empty line for readability
  }
  
  // Summary
  console.log('\n📊 Optimization Summary:')
  console.log(`✓ Processed: ${processedCount} images`)
  console.log(`✗ Errors: ${errorCount} images`)
  
  if (totalOriginalSize > 0) {
    const totalSavings = ((totalOriginalSize - totalNewSize) / totalOriginalSize * 100).toFixed(1)
    const savedMB = ((totalOriginalSize - totalNewSize) / 1024 / 1024).toFixed(2)
    console.log(`💾 Total savings: ${totalSavings}% (${savedMB} MB)`)
    console.log(`📦 Original size: ${(totalOriginalSize / 1024 / 1024).toFixed(2)} MB`)
    console.log(`📦 New size: ${(totalNewSize / 1024 / 1024).toFixed(2)} MB`)
  }
  
  console.log('\n✨ Image optimization complete!')
}

// Run if called directly
if (import.meta.url === new URL(process.argv[1], 'file:').href) {
  optimizeImages().catch(console.error)
}

export { optimizeImages, convertToWebP, optimizeImage, generateResponsiveSizes }