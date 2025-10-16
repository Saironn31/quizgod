/**
 * Animation Utilities
 * Helper functions for managing animations throughout the app
 */

/**
 * Delays execution for stagger effects
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Stagger animation delays for array items
 * @param index - Current item index
 * @param delayMs - Delay between items in milliseconds (default: 100)
 * @returns Style object with animation delay
 */
export function getStaggerDelay(index: number, delayMs: number = 100) {
  return {
    animationDelay: `${index * delayMs}ms`,
    style: { animationDelay: `${index * delayMs}ms` }
  };
}

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Conditional animation class
 * Returns animation class only if reduced motion is not preferred
 */
export function animateClass(animationClass: string, fallbackClass: string = ''): string {
  if (prefersReducedMotion()) {
    return fallbackClass;
  }
  return animationClass;
}

/**
 * Add entrance animation to element
 * @param element - DOM element
 * @param animationClass - Animation class to add
 * @param removeAfter - Remove class after animation (default: true)
 */
export function animateElement(
  element: HTMLElement | null,
  animationClass: string,
  removeAfter: boolean = true
): void {
  if (!element || prefersReducedMotion()) return;

  element.classList.add(animationClass);

  if (removeAfter) {
    element.addEventListener('animationend', () => {
      element.classList.remove(animationClass);
    }, { once: true });
  }
}

/**
 * Animate list items with stagger effect
 * @param elements - Array of elements or NodeList
 * @param animationClass - Animation class to apply
 * @param staggerMs - Delay between items (default: 100)
 */
export async function animateListStagger(
  elements: HTMLElement[] | NodeListOf<HTMLElement>,
  animationClass: string,
  staggerMs: number = 100
): Promise<void> {
  if (prefersReducedMotion()) return;

  const elementsArray = Array.from(elements);
  
  for (let i = 0; i < elementsArray.length; i++) {
    const element = elementsArray[i];
    element.classList.add(animationClass);
    
    if (i < elementsArray.length - 1) {
      await delay(staggerMs);
    }
  }
}

/**
 * Sequence multiple animations
 * @param animations - Array of animation functions
 */
export async function sequenceAnimations(
  animations: Array<() => Promise<void> | void>
): Promise<void> {
  for (const animation of animations) {
    await animation();
  }
}

/**
 * Pulse animation on element
 * @param element - DOM element
 * @param duration - Duration in ms (default: 500)
 */
export function pulseElement(element: HTMLElement | null, duration: number = 500): void {
  if (!element || prefersReducedMotion()) return;

  element.classList.add('animate-pulse');
  
  setTimeout(() => {
    element.classList.remove('animate-pulse');
  }, duration);
}

/**
 * Shake animation for error feedback
 * @param element - DOM element
 */
export function shakeElement(element: HTMLElement | null): void {
  if (!element || prefersReducedMotion()) return;

  element.classList.add('animate-shake');
  
  setTimeout(() => {
    element.classList.remove('animate-shake');
  }, 500);
}

/**
 * Smooth scroll to element with animation
 * @param element - Target element or selector
 * @param offset - Offset from top (default: 0)
 */
export function scrollToElement(
  element: HTMLElement | string,
  offset: number = 0
): void {
  const targetElement = typeof element === 'string' 
    ? document.querySelector<HTMLElement>(element)
    : element;

  if (!targetElement) return;

  const top = targetElement.getBoundingClientRect().top + window.scrollY - offset;

  window.scrollTo({
    top,
    behavior: prefersReducedMotion() ? 'auto' : 'smooth'
  });
}

/**
 * Intersection Observer for scroll-triggered animations
 * @param selector - Element selector
 * @param animationClass - Animation class to apply
 * @param options - IntersectionObserver options
 */
export function observeScrollAnimation(
  selector: string,
  animationClass: string,
  options: IntersectionObserverInit = { threshold: 0.1 }
): IntersectionObserver | null {
  if (typeof window === 'undefined' || prefersReducedMotion()) return null;

  const elements = document.querySelectorAll<HTMLElement>(selector);
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add(animationClass);
        observer.unobserve(entry.target);
      }
    });
  }, options);

  elements.forEach(element => observer.observe(element));

  return observer;
}

/**
 * Loading state animation
 * Returns appropriate animation class based on loading state
 */
export function getLoadingAnimation(isLoading: boolean): string {
  if (isLoading) {
    return prefersReducedMotion() ? '' : 'animate-pulse';
  }
  return prefersReducedMotion() ? '' : 'animate-fade-in';
}

/**
 * Create ripple effect on click
 * @param event - Click event
 * @param color - Ripple color (default: rgba(255, 255, 255, 0.5))
 */
export function createRipple(
  event: React.MouseEvent<HTMLElement>,
  color: string = 'rgba(255, 255, 255, 0.5)'
): void {
  if (prefersReducedMotion()) return;

  const button = event.currentTarget;
  const ripple = document.createElement('span');
  const diameter = Math.max(button.clientWidth, button.clientHeight);
  const radius = diameter / 2;

  const rect = button.getBoundingClientRect();
  ripple.style.width = ripple.style.height = `${diameter}px`;
  ripple.style.left = `${event.clientX - rect.left - radius}px`;
  ripple.style.top = `${event.clientY - rect.top - radius}px`;
  ripple.style.position = 'absolute';
  ripple.style.borderRadius = '50%';
  ripple.style.backgroundColor = color;
  ripple.style.transform = 'scale(0)';
  ripple.style.animation = 'ripple 0.6s ease-out';
  ripple.style.pointerEvents = 'none';

  button.style.position = 'relative';
  button.style.overflow = 'hidden';

  button.appendChild(ripple);

  setTimeout(() => {
    ripple.remove();
  }, 600);
}

/**
 * Animation timing functions
 */
export const easings = {
  linear: 'linear',
  easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
  easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
  easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  elastic: 'cubic-bezier(0.68, -0.6, 0.32, 1.6)',
};

/**
 * Duration presets (in milliseconds)
 */
export const durations = {
  fast: 150,
  normal: 300,
  slow: 500,
  verySlow: 1000,
};

// Add ripple animation to CSS if not exists
if (typeof document !== 'undefined') {
  const styleId = 'animation-utils-styles';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.innerHTML = `
      @keyframes ripple {
        to {
          transform: scale(4);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
  }
}
