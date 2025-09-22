#!/usr/bin/env node

/**
 * Backfill script to mark existing orders as test orders
 * 
 * This script scans orders from the last 90 days and applies the isTestOrder logic
 * to retroactively mark test orders with the appropriate flags and tags.
 * 
 * Safety measures:
 * - Gated behind NODE_ENV !== 'production' unless ALLOW_BACKFILL_TEST=true
 * - Dry run mode by default
 * - Batch processing with delays
 * - Comprehensive logging
 */

import { initializeApp, getApps } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { credential } from 'firebase-admin'
import { isTestOrder, markAsTestOrder } from '../src/lib/orders/isTestOrder'
import type { Order } from '../src/types/firestore'

// Initialize Firebase Admin if not already initialized
if (!getApps().length) {
  initializeApp({
    credential: credential.applicationDefault(),
  })
}

const db = getFirestore()
const ORDERS_COLLECTION = 'orders'
const BATCH_SIZE = 50
const DELAY_MS = 1000 // 1 second delay between batches

interface BackfillOptions {
  dryRun: boolean
  daysBack: number
  batchSize: number
}

interface BackfillStats {
  totalProcessed: number
  testOrdersFound: number
  testOrdersUpdated: number
  errors: number
}

/**
 * Safety check to prevent accidental execution in production
 */
function checkSafetyGates(): void {
  const isProduction = process.env.NODE_ENV === 'production'
  const allowBackfill = process.env.ALLOW_BACKFILL_TEST === 'true'
  
  if (isProduction && !allowBackfill) {
    console.error('❌ SAFETY GATE: Cannot run backfill in production environment')
    console.error('   Set ALLOW_BACKFILL_TEST=true to override (use with extreme caution)')
    process.exit(1)
  }
  
  if (isProduction && allowBackfill) {
    console.warn('⚠️  WARNING: Running backfill in PRODUCTION environment')
    console.warn('   This will modify live data. Proceed with caution.')
  }
}

/**
 * Convert Firestore document to Order type
 */
function firestoreDocToOrder(doc: any): Order {
  const data = doc.data()
  return {
    id: doc.id,
    ...data,
    createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
    updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
  } as Order
}

/**
 * Get orders from the last N days
 */
async function getOrdersFromLastDays(days: number): Promise<Order[]> {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - days)
  
  console.log(`📅 Fetching orders from ${cutoffDate.toISOString()} onwards...`)
  
  const snapshot = await db
    .collection(ORDERS_COLLECTION)
    .where('createdAt', '>=', cutoffDate)
    .orderBy('createdAt', 'desc')
    .get()
  
  const orders = snapshot.docs.map(firestoreDocToOrder)
  console.log(`📦 Found ${orders.length} orders in the last ${days} days`)
  
  return orders
}

/**
 * Process a batch of orders
 */
async function processBatch(
  orders: Order[], 
  options: BackfillOptions
): Promise<BackfillStats> {
  const stats: BackfillStats = {
    totalProcessed: 0,
    testOrdersFound: 0,
    testOrdersUpdated: 0,
    errors: 0
  }
  
  const batch = db.batch()
  let batchOperations = 0
  
  for (const order of orders) {
    try {
      stats.totalProcessed++
      
      // Check if this order should be marked as a test order
      const shouldBeTestOrder = isTestOrder(order)
      const isAlreadyMarked = order.isTest === true
      
      if (shouldBeTestOrder) {
        stats.testOrdersFound++
        
        if (!isAlreadyMarked) {
          console.log(`🧪 Found test order: ${order.id} (${order.items?.map(i => i.productId).join(', ')})`)
          
          if (!options.dryRun) {
            // Mark the order as a test order
            const updatedOrder = markAsTestOrder(order)
            const orderRef = db.collection(ORDERS_COLLECTION).doc(order.id)
            
            batch.update(orderRef, {
              isTest: updatedOrder.isTest,
              tags: updatedOrder.tags,
              metadata: updatedOrder.metadata,
              updatedAt: new Date()
            })
            
            batchOperations++
            stats.testOrdersUpdated++
          } else {
            console.log(`   [DRY RUN] Would mark order ${order.id} as test order`)
            stats.testOrdersUpdated++
          }
        } else {
          console.log(`✅ Order ${order.id} already marked as test order`)
        }
      }
      
      // Commit batch if it gets too large
      if (batchOperations >= options.batchSize) {
        if (!options.dryRun) {
          await batch.commit()
          console.log(`💾 Committed batch of ${batchOperations} updates`)
        }
        batchOperations = 0
      }
      
    } catch (error) {
      console.error(`❌ Error processing order ${order.id}:`, error)
      stats.errors++
    }
  }
  
  // Commit any remaining operations
  if (batchOperations > 0 && !options.dryRun) {
    await batch.commit()
    console.log(`💾 Committed final batch of ${batchOperations} updates`)
  }
  
  return stats
}

/**
 * Main backfill function
 */
async function backfillTestOrders(options: BackfillOptions): Promise<void> {
  console.log('🚀 Starting test order backfill...')
  console.log(`   Mode: ${options.dryRun ? 'DRY RUN' : 'LIVE UPDATE'}`)
  console.log(`   Days back: ${options.daysBack}`)
  console.log(`   Batch size: ${options.batchSize}`)
  console.log('')
  
  try {
    // Get orders from the specified time period
    const orders = await getOrdersFromLastDays(options.daysBack)
    
    if (orders.length === 0) {
      console.log('✅ No orders found to process')
      return
    }
    
    // Process orders in batches
    const totalStats: BackfillStats = {
      totalProcessed: 0,
      testOrdersFound: 0,
      testOrdersUpdated: 0,
      errors: 0
    }
    
    for (let i = 0; i < orders.length; i += options.batchSize) {
      const batch = orders.slice(i, i + options.batchSize)
      console.log(`\n📦 Processing batch ${Math.floor(i / options.batchSize) + 1}/${Math.ceil(orders.length / options.batchSize)} (${batch.length} orders)...`)
      
      const batchStats = await processBatch(batch, options)
      
      // Accumulate stats
      totalStats.totalProcessed += batchStats.totalProcessed
      totalStats.testOrdersFound += batchStats.testOrdersFound
      totalStats.testOrdersUpdated += batchStats.testOrdersUpdated
      totalStats.errors += batchStats.errors
      
      // Delay between batches to avoid overwhelming the database
      if (i + options.batchSize < orders.length) {
        console.log(`⏳ Waiting ${DELAY_MS}ms before next batch...`)
        await new Promise(resolve => setTimeout(resolve, DELAY_MS))
      }
    }
    
    // Print final summary
    console.log('\n📊 BACKFILL SUMMARY:')
    console.log(`   Total orders processed: ${totalStats.totalProcessed}`)
    console.log(`   Test orders found: ${totalStats.testOrdersFound}`)
    console.log(`   Test orders updated: ${totalStats.testOrdersUpdated}`)
    console.log(`   Errors: ${totalStats.errors}`)
    
    if (options.dryRun) {
      console.log('\n💡 This was a dry run. No data was modified.')
      console.log('   Run with --live to apply changes.')
    } else {
      console.log('\n✅ Backfill completed successfully!')
    }
    
  } catch (error) {
    console.error('❌ Backfill failed:', error)
    process.exit(1)
  }
}

/**
 * Parse command line arguments
 */
function parseArgs(): BackfillOptions {
  const args = process.argv.slice(2)
  
  const options: BackfillOptions = {
    dryRun: true,
    daysBack: 90,
    batchSize: BATCH_SIZE
  }
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    
    switch (arg) {
      case '--live':
        options.dryRun = false
        break
      case '--days':
        const days = parseInt(args[++i])
        if (isNaN(days) || days <= 0) {
          console.error('❌ Invalid --days value. Must be a positive number.')
          process.exit(1)
        }
        options.daysBack = days
        break
      case '--batch-size':
        const batchSize = parseInt(args[++i])
        if (isNaN(batchSize) || batchSize <= 0) {
          console.error('❌ Invalid --batch-size value. Must be a positive number.')
          process.exit(1)
        }
        options.batchSize = batchSize
        break
      case '--help':
      case '-h':
        console.log('Test Order Backfill Script')
        console.log('')
        console.log('Usage: npm run backfill-test-orders [options]')
        console.log('')
        console.log('Options:')
        console.log('  --live              Run in live mode (default: dry run)')
        console.log('  --days <number>     Number of days to look back (default: 90)')
        console.log('  --batch-size <num>  Batch size for processing (default: 50)')
        console.log('  --help, -h          Show this help message')
        console.log('')
        console.log('Examples:')
        console.log('  npm run backfill-test-orders                    # Dry run for last 90 days')
        console.log('  npm run backfill-test-orders --live             # Live run for last 90 days')
        console.log('  npm run backfill-test-orders --days 30 --live   # Live run for last 30 days')
        process.exit(0)
      default:
        console.error(`❌ Unknown argument: ${arg}`)
        console.error('Use --help for usage information.')
        process.exit(1)
    }
  }
  
  return options
}

/**
 * Main execution
 */
async function main(): Promise<void> {
  try {
    // Parse command line arguments
    const options = parseArgs()
    
    // Safety checks
    checkSafetyGates()
    
    // Run the backfill
    await backfillTestOrders(options)
    
  } catch (error) {
    console.error('❌ Script failed:', error)
    process.exit(1)
  }
}

// Run the script if called directly
if (require.main === module) {
  main()
}

export { backfillTestOrders, parseArgs, checkSafetyGates }