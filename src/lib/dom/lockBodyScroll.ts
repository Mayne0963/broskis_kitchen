// State to track scroll lock status and original scroll position
let isLocked = false;
let originalScrollY = 0;
let originalBodyStyle = {
  position: '',
  top: '',
  width: '',
  overflow: ''
};

/**
 * Locks body scroll by fixing the body position and preserving scroll position
 * Safe to call multiple times (idempotent)
 */
export function lockBodyScroll(): void {
  // If already locked, do nothing
  if (isLocked) {
    return;
  }

  // Record current scroll position
  originalScrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;

  // Store original body styles
  const body = document.body;
  originalBodyStyle = {
    position: body.style.position,
    top: body.style.top,
    width: body.style.width,
    overflow: body.style.overflow
  };

  // Apply fixed positioning to prevent scroll
  body.style.position = 'fixed';
  body.style.top = `-${originalScrollY}px`;
  body.style.width = '100%';
  body.style.overflow = 'hidden';

  isLocked = true;
}

/**
 * Unlocks body scroll by restoring original styles and scroll position
 * Safe to call multiple times (idempotent)
 */
export function unlockBodyScroll(): void {
  // If not locked, do nothing
  if (!isLocked) {
    return;
  }

  const body = document.body;

  // Restore original body styles
  body.style.position = originalBodyStyle.position;
  body.style.top = originalBodyStyle.top;
  body.style.width = originalBodyStyle.width;
  body.style.overflow = originalBodyStyle.overflow;

  // Restore scroll position
  window.scrollTo(0, originalScrollY);

  // Reset state
  isLocked = false;
  originalScrollY = 0;
}

/**
 * Check if body scroll is currently locked
 */
export function isBodyScrollLocked(): boolean {
  return isLocked;
}