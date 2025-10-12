"use client"

import React from 'react'
import Image from 'next/image'
import { useEnhancedResponsive } from './MobileEnhancer'

interface ResponsiveLayoutProps {
  children: React.ReactNode
  className?: string
}

/**
 * Responsive layout wrapper that adapts to different screen sizes
 */
export function ResponsiveLayout({ children, className = '' }: ResponsiveLayoutProps) {
  const { isMobile, isTablet, breakpoint } = useEnhancedResponsive()

  const layoutClasses = `
    ${isMobile ? 'mobile-layout' : isTablet ? 'tablet-layout' : 'desktop-layout'}
    ${breakpoint === 'xs' ? 'layout-xs' : ''}
    ${breakpoint === 'sm' ? 'layout-sm' : ''}
    ${breakpoint === 'md' ? 'layout-md' : ''}
    ${breakpoint === 'lg' ? 'layout-lg' : ''}
    ${breakpoint === 'xl' ? 'layout-xl' : ''}
    ${className}
  `

  return (
    <div className={layoutClasses.trim()}>
      {children}
    </div>
  )
}

/**
 * Responsive grid component
 */
export function ResponsiveGrid({
  children,
  cols = { xs: 1, sm: 2, md: 3, lg: 4, xl: 5 },
  gap = 4,
  className = ''
}: {
  children: React.ReactNode
  cols?: { xs?: number; sm?: number; md?: number; lg?: number; xl?: number }
  gap?: number
  className?: string
}) {
  const { breakpoint } = useEnhancedResponsive()
  
  const currentCols = cols[breakpoint] || cols.md || 3
  
  const gridClasses = `
    grid gap-${gap}
    grid-cols-${currentCols}
    ${className}
  `

  return (
    <div className={gridClasses.trim()}>
      {children}
    </div>
  )
}

/**
 * Responsive container with proper padding and max-width
 */
export function ResponsiveContainer({
  children,
  size = 'default',
  className = ''
}: {
  children: React.ReactNode
  size?: 'sm' | 'default' | 'lg' | 'xl' | 'full'
  className?: string
}) {
  const { isMobile } = useEnhancedResponsive()
  
  const sizeClasses = {
    sm: 'max-w-2xl',
    default: 'max-w-6xl',
    lg: 'max-w-7xl',
    xl: 'max-w-8xl',
    full: 'max-w-full'
  }
  
  const containerClasses = `
    mx-auto
    ${sizeClasses[size]}
    ${isMobile ? 'px-4' : 'px-6 lg:px-8'}
    ${className}
  `

  return (
    <div className={containerClasses.trim()}>
      {children}
    </div>
  )
}

/**
 * Responsive section with proper spacing
 */
export function ResponsiveSection({
  children,
  spacing = 'default',
  background = 'transparent',
  className = ''
}: {
  children: React.ReactNode
  spacing?: 'sm' | 'default' | 'lg' | 'xl'
  background?: 'transparent' | 'dark' | 'darker' | 'gradient'
  className?: string
}) {
  const { isMobile } = useEnhancedResponsive()
  
  const spacingClasses = {
    sm: isMobile ? 'py-8' : 'py-12',
    default: isMobile ? 'py-12' : 'py-16',
    lg: isMobile ? 'py-16' : 'py-20',
    xl: isMobile ? 'py-20' : 'py-24'
  }
  
  const backgroundClasses = {
    transparent: '',
    dark: 'bg-gray-900',
    darker: 'bg-black',
    gradient: 'bg-gradient-to-r from-gray-900 to-black'
  }
  
  const sectionClasses = `
    ${spacingClasses[spacing]}
    ${backgroundClasses[background]}
    ${className}
  `

  return (
    <section className={sectionClasses.trim()}>
      {children}
    </section>
  )
}

/**
 * Responsive text component with proper sizing
 */
export function ResponsiveText({
  children,
  as: Component = 'p',
  size = 'base',
  weight = 'normal',
  color = 'white',
  className = ''
}: {
  children: React.ReactNode
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'div'
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl'
  weight?: 'light' | 'normal' | 'medium' | 'semibold' | 'bold' | 'extrabold'
  color?: 'white' | 'gray' | 'gold' | 'red' | 'green' | 'blue'
  className?: string
}) {
  const { isMobile } = useEnhancedResponsive()
  
  const sizeClasses = {
    xs: isMobile ? 'text-xs' : 'text-sm',
    sm: isMobile ? 'text-sm' : 'text-base',
    base: isMobile ? 'text-base' : 'text-lg',
    lg: isMobile ? 'text-lg' : 'text-xl',
    xl: isMobile ? 'text-xl' : 'text-2xl',
    '2xl': isMobile ? 'text-2xl' : 'text-3xl',
    '3xl': isMobile ? 'text-3xl' : 'text-4xl',
    '4xl': isMobile ? 'text-4xl' : 'text-5xl',
    '5xl': isMobile ? 'text-5xl' : 'text-6xl'
  }
  
  const weightClasses = {
    light: 'font-light',
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold',
    extrabold: 'font-extrabold'
  }
  
  const colorClasses = {
    white: 'text-white',
    gray: 'text-gray-300',
    gold: 'text-[#FFD700]',
    red: 'text-red-400',
    green: 'text-green-400',
    blue: 'text-blue-400'
  }
  
  const textClasses = `
    ${sizeClasses[size]}
    ${weightClasses[weight]}
    ${colorClasses[color]}
    ${isMobile ? 'leading-relaxed' : 'leading-normal'}
    ${className}
  `

  return (
    <Component className={textClasses.trim()}>
      {children}
    </Component>
  )
}

/**
 * Responsive image component
 */
export function ResponsiveImage({
  src,
  alt,
  width,
  height,
  className = '',
  priority = false,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
}: {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  priority?: boolean
  sizes?: string
}) {
  const { isMobile } = useEnhancedResponsive()
  
  const imageClasses = `
    ${isMobile ? 'rounded-lg' : 'rounded-xl'}
    transition-transform duration-300
    hover:scale-105
    ${className}
  `

  return (
    <Image
      src={src}
      alt={alt}
      width={width || 400}
      height={height || 300}
      className={imageClasses.trim()}
      priority={priority}
      sizes={sizes}
            unoptimized
    />
  )
}

/**
 * Responsive card component
 */
export function ResponsiveCard({
  children,
  padding = 'default',
  shadow = 'default',
  border = true,
  className = ''
}: {
  children: React.ReactNode
  padding?: 'sm' | 'default' | 'lg'
  shadow?: 'none' | 'sm' | 'default' | 'lg'
  border?: boolean
  className?: string
}) {
  const { isMobile } = useEnhancedResponsive()
  
  const paddingClasses = {
    sm: isMobile ? 'p-4' : 'p-6',
    default: isMobile ? 'p-6' : 'p-8',
    lg: isMobile ? 'p-8' : 'p-10'
  }
  
  const shadowClasses = {
    none: '',
    sm: 'shadow-sm',
    default: 'shadow-lg',
    lg: 'shadow-xl'
  }
  
  const cardClasses = `
    bg-gray-900
    ${isMobile ? 'rounded-lg' : 'rounded-xl'}
    ${paddingClasses[padding]}
    ${shadowClasses[shadow]}
    ${border ? 'border border-gray-700' : ''}
    transition-all duration-300
    hover:shadow-2xl
    ${isMobile ? 'active:scale-98' : 'hover:scale-102'}
    ${className}
  `

  return (
    <div className={cardClasses.trim()}>
      {children}
    </div>
  )
}

/**
 * Responsive flex component
 */
export function ResponsiveFlex({
  children,
  direction = 'row',
  align = 'center',
  justify = 'start',
  wrap = false,
  gap = 4,
  className = ''
}: {
  children: React.ReactNode
  direction?: 'row' | 'col' | 'row-reverse' | 'col-reverse' | 'responsive'
  align?: 'start' | 'center' | 'end' | 'stretch'
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly'
  wrap?: boolean
  gap?: number
  className?: string
}) {
  const { isMobile } = useEnhancedResponsive()
  
  const directionClass = direction === 'responsive' 
    ? (isMobile ? 'flex-col' : 'flex-row')
    : `flex-${direction}`
  
  const alignClasses = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch'
  }
  
  const justifyClasses = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
    around: 'justify-around',
    evenly: 'justify-evenly'
  }
  
  const flexClasses = `
    flex
    ${directionClass}
    ${alignClasses[align]}
    ${justifyClasses[justify]}
    ${wrap ? 'flex-wrap' : ''}
    gap-${gap}
    ${className}
  `

  return (
    <div className={flexClasses.trim()}>
      {children}
    </div>
  )
}