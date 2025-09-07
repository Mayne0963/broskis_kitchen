"use client"

import React from 'react'
import { motion } from 'framer-motion'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  color?: string
  className?: string
  text?: string
}

export default function LoadingSpinner({ 
  size = 'md', 
  color = '#FFD700', 
  className = '',
  text 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  }

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <motion.div
        className={`${sizeClasses[size]} border-2 border-t-transparent rounded-full`}
        style={{ borderColor: `${color}40`, borderTopColor: color }}
        animate={{ rotate: 360 }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: 'linear'
        }}
      />
      {text && (
        <motion.p 
          className="mt-2 text-sm text-gray-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {text}
        </motion.p>
      )}
    </div>
  )
}

/**
 * Skeleton loader for content placeholders
 */
export function SkeletonLoader({ 
  width = '100%', 
  height = '20px', 
  className = '',
  rounded = true 
}: {
  width?: string
  height?: string
  className?: string
  rounded?: boolean
}) {
  return (
    <motion.div
      className={`bg-gray-800 ${rounded ? 'rounded' : ''} ${className}`}
      style={{ width, height }}
      animate={{
        opacity: [0.5, 0.8, 0.5]
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut'
      }}
    />
  )
}

/**
 * Page loading overlay
 */
export function PageLoader({ message = 'Loading...' }: { message?: string }) {
  return (
    <motion.div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="text-center">
        <LoadingSpinner size="lg" text={message} />
      </div>
    </motion.div>
  )
}

/**
 * Component loading fallback
 */
export function ComponentLoader({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center p-4 ${className}`}>
      <LoadingSpinner size="md" />
    </div>
  )
}