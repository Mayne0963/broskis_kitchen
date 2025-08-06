import { Playfair_Display, Montserrat } from 'next/font/google'

// Playfair Display font with comprehensive fallbacks
export const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
  fallback: ['Georgia', 'Times New Roman', 'serif'],
  preload: true,
  adjustFontFallback: false
})

// Montserrat font with comprehensive fallbacks
export const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-montserrat',
  display: 'swap',
  fallback: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
  preload: true,
  adjustFontFallback: false
})