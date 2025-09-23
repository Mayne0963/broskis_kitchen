# Mobile Navigation Drawer Implementation Notes

## Overview
This document explains the comprehensive fixes applied to the mobile navigation drawer to address duplication issues, scrolling problems, and mobile-specific UI concerns.

## Issues Identified and Fixed

### 1. Link Duplication Problem

**Root Cause:**
The mobile menu was receiving navigation items through props from the parent component, which was filtering and processing `NAV_ITEMS` from the config. This created a dependency chain that could lead to inconsistent link rendering and potential duplicates.

**Solution:**
- Created `src/components/nav/links.ts` as a single source of truth for navigation links
- Defined `MAIN_LINKS` array with consistent structure: `{ href: string, label: string }`
- Updated `MobileMenu` component to import and use `MAIN_LINKS` directly
- Removed the `items` prop dependency, eliminating the risk of duplicate or inconsistent link rendering
- Ensured each link appears exactly once in the correct order

### 2. Mobile Scrolling Issues

**Root Cause:**
The original implementation had several scrolling problems:
- No independent scrolling within the drawer on mobile devices
- iOS Safari's 100vh bug causing layout issues
- Missing touch scrolling optimization for iOS
- Body scroll not properly locked when drawer was open

**Solution:**
- Implemented proper CSS flexbox layout with three distinct sections:
  - `header`: Fixed title and close button
  - `nav.bk-scroll`: Scrollable navigation area with `flex: 1 1 auto`
  - `footer.bk-footer`: Fixed CTA and cart section
- Added iOS-specific fixes:
  - CSS custom property `--vh` to handle viewport height correctly
  - JavaScript calculation: `--vh = window.innerHeight * 0.01`
  - Used `calc(var(--vh, 1vh) * 100)` instead of `100vh`
- Enhanced touch scrolling with `-webkit-overflow-scrolling: touch`
- Implemented proper body scroll lock using direct DOM manipulation

### 3. Layout and Z-Index Management

**Root Cause:**
The CTA section was overlapping scrollable content, and z-index management was inconsistent.

**Solution:**
- Used `position: fixed; inset: 0` for full-screen drawer coverage
- Implemented sticky footer with gradient background for visual separation
- Set consistent z-index hierarchy: backdrop (z-40) < drawer (z-50)
- Added backdrop blur effect for better visual separation

### 4. Safe Area and Mobile-Specific Concerns

**Root Cause:**
The drawer didn't respect device safe areas (notches, status bars) and lacked proper mobile UX patterns.

**Solution:**
- Added safe area insets: `padding-top: env(safe-area-inset-top)`
- Included bottom safe area in footer: `padding-bottom: calc(12px + env(safe-area-inset-bottom))`
- Ensured minimum touch target sizes (44px) for accessibility
- Added proper focus management and keyboard navigation

## Technical Implementation Details

### CSS Classes Added
```css
.bk-drawer {
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  background: #000;
  color: #fff;
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
  height: calc(var(--vh, 1vh) * 100);
}

.bk-scroll {
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  flex: 1 1 auto;
  padding: 0 16px;
}

.bk-footer {
  flex: 0 0 auto;
  position: sticky;
  bottom: 0;
  background: linear-gradient(180deg, rgba(0,0,0,0) 0%, #000 20%);
  padding: 12px 16px calc(12px + env(safe-area-inset-bottom));
  border-top: 1px solid rgba(255,255,255,.08);
}
```

### JavaScript Enhancements
- Viewport height calculation for iOS compatibility
- Body scroll lock implementation with cleanup
- Focus management and keyboard event handling
- Proper portal rendering for z-index management

### Accessibility Improvements
- Added ARIA attributes: `role="dialog"`, `aria-modal="true"`, `aria-labelledby`
- Implemented focus trapping within the drawer
- ESC key handling for closing
- Proper semantic structure with `<aside>`, `<nav>`, `<header>`, `<footer>`

## Testing
- Updated unit tests to work with new implementation
- Removed dependency on `items` prop in test cases
- Added proper test selectors and accessibility-focused assertions
- All 13 test cases now pass successfully

## Browser Compatibility
- iOS Safari: Fixed 100vh bug and touch scrolling
- Android Chrome: Proper overflow handling and safe areas
- Desktop: Responsive design with appropriate width constraints

## Performance Considerations
- Reduced re-renders by eliminating prop dependencies
- Efficient DOM manipulation for scroll locking
- Optimized CSS with hardware acceleration hints
- Minimal JavaScript for viewport calculations

These fixes ensure a consistent, accessible, and performant mobile navigation experience across all devices and browsers.