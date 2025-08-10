'use client';

import { useEffect } from 'react';
import { setupChunkErrorHandler } from '@/lib/utils/dynamicImportRetry';

/**
 * Client-side component that sets up global chunk error handling
 * This should be included in the root layout to catch chunk loading errors
 */
export default function ChunkErrorHandler() {
  useEffect(() => {
    // Set up global chunk error handling
    setupChunkErrorHandler();
    
    // Log that the handler is active
    console.log('Chunk error handler initialized');
  }, []);

  // This component doesn't render anything
  return null;
}