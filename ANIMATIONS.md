# Animation System Documentation

## Overview
The QuizGod website now includes a comprehensive animation system with 40+ animations and effects to enhance user experience and provide visual feedback.

## Animation Categories

### 1. Entrance Animations
Used when elements first appear on screen:
- `animate-fade-in` - Simple fade in
- `animate-fade-in-up` - Fade in while sliding up
- `animate-fade-in-down` - Fade in while sliding down
- `animate-fade-in-left` - Fade in while sliding from left
- `animate-fade-in-right` - Fade in while sliding from right
- `animate-scale-in` - Fade in with scale effect
- `animate-bounce-in` - Bounce entrance with overshoot
- `animate-slide-up` - Slide in from bottom
- `animate-slide-down` - Slide in from top
- `animate-slide-left` - Slide in from right
- `animate-slide-right` - Slide in from left
- `animate-rotate-in` - Rotate entrance with scale
- `animate-flip-in-x` - Flip entrance on X-axis
- `animate-flip-in-y` - Flip entrance on Y-axis

### 2. Continuous Animations
Loops indefinitely for attention or effect:
- `animate-spin` - Continuous 360° rotation
- `animate-pulse` - Subtle scale pulse
- `animate-bounce` - Vertical bounce effect
- `animate-float` - Smooth up/down floating
- `animate-wiggle` - Gentle rotation wiggle
- `animate-heartbeat` - Heartbeat pulse pattern
- `animate-glow` - Pulsing glow/shadow effect
- `animate-shimmer` - Sweeping shine effect
- `animate-gradient` - Animated gradient shift
- `animate-rainbow-border` - Rainbow border color cycle

### 3. Interaction Animations
Applied on hover or click:
- `hover-lift` - Lifts element up on hover
- `hover-grow` - Scales up on hover
- `hover-shrink` - Scales down on hover
- `hover-rotate` - Slight rotation on hover
- `hover-glow` - Adds glow effect on hover
- `active:scale-95` - Press down effect on click

### 4. Feedback Animations
Provides user feedback:
- `animate-shake` - Horizontal shake (for errors)
- `animate-shake-y` - Vertical shake
- `animate-checkmark` - SVG checkmark draw
- `animate-badge-pulse` - Notification badge pulse
- `animate-progress` - Progress bar fill

### 5. Loading Animations
Indicates loading states:
- `skeleton` - Shimmer loading placeholder
- `animate-spin` (with spinner) - Loading spinner
- `.typing-dot` - Typing indicator dots

### 6. Stagger Animations
For lists and sequential elements:
- `.stagger-item` - Delays animation by child index
- Automatically applies 0.1s delay increments

## Component Usage

### LoadingSpinner Component
```tsx
import LoadingSpinner from '@/components/LoadingSpinner';

// Basic spinner
<LoadingSpinner />

// Full screen loading
<LoadingSpinner 
  size="lg" 
  variant="gradient" 
  text="Loading..." 
  fullScreen 
/>

// Variants: spinner | dots | pulse | gradient
// Sizes: sm | md | lg | xl
```

### SkeletonLoader Component
```tsx
import SkeletonLoader, { SkeletonCard, SkeletonQuizCard } from '@/components/SkeletonLoader';

// Card skeleton
<SkeletonCard />

// Quiz card skeleton
<SkeletonQuizCard />

// Custom skeleton
<SkeletonLoader variant="list" count={3} />
```

### NotificationToast Component
```tsx
import { useToast } from '@/components/NotificationToast';

const { showToast, ToastContainer } = useToast();

// In component JSX
<ToastContainer />

// Show notifications
showToast('Success!', 'success');
showToast('Error occurred', 'error');
showToast('Warning message', 'warning');
showToast('Info message', 'info');
```

## Glass Card Effects

### Standard Glass Card
```tsx
<div className="glass-card rounded-3xl p-6">
  Content
</div>
```

### Animated Glass Card
```tsx
<div className="glass-card rounded-3xl p-6 animate-slide-up hover-lift">
  Content
</div>
```

## Best Practices

### 1. Performance
- Use `animate-*` classes sparingly on large lists
- Apply animations only to viewport-visible elements
- Respect `prefers-reduced-motion` (automatic)
- Avoid animating `width` or `height` (use `transform` instead)

### 2. Timing
- Entrance animations: 0.3-0.6s
- Hover effects: 0.2-0.3s
- Continuous animations: 1-3s
- Stagger delays: 0.1-0.2s per item

### 3. Accessibility
- All animations respect `prefers-reduced-motion`
- Animations don't flash more than 3 times per second
- Interactive elements have clear focus states
- Loading states announced to screen readers

### 4. Mobile Considerations
- Reduce animation complexity on mobile
- Avoid hover-only interactions (use click/tap)
- Keep animations under 0.5s on mobile
- Test on lower-end devices

## Animation Implementation Examples

### Page Header with Animation
```tsx
<div className="glass-card rounded-3xl p-12 animate-fade-in-down">
  <h1 className="text-6xl font-black gradient-text">
    Welcome
  </h1>
</div>
```

### Stat Cards with Stagger
```tsx
<div className="grid grid-cols-3 gap-4">
  {stats.map((stat, i) => (
    <div 
      key={i}
      className="glass-card rounded-xl p-4 animate-fade-in-up stagger-item"
    >
      <div className="text-3xl font-black gradient-text">
        {stat.value}
      </div>
    </div>
  ))}
</div>
```

### Interactive Button
```tsx
<button className="
  px-6 py-3 rounded-xl
  bg-gradient-to-r from-cyan-500 to-violet-500
  text-white font-bold
  hover-lift hover-glow
  active:scale-95
  transition-all duration-300
">
  Click Me
</button>
```

### Loading State
```tsx
{loading ? (
  <SkeletonCard />
) : (
  <div className="glass-card rounded-xl p-6 animate-scale-in">
    {content}
  </div>
)}
```

### Success Notification
```tsx
// On success
showToast('Quiz created successfully!', 'success');
```

### Floating Background Elements
```tsx
<div className="absolute inset-0 pointer-events-none">
  <div className="absolute top-20 right-20 w-96 h-96 bg-cyan-500/5 rounded-full filter blur-3xl animate-float" />
  <div className="absolute bottom-20 left-20 w-96 h-96 bg-violet-500/5 rounded-full filter blur-3xl animate-float" style={{animationDelay: '1.5s'}} />
</div>
```

## Current Implementation Status

### ✅ Completed
- [x] Comprehensive animation keyframes (40+)
- [x] Utility animation classes
- [x] LoadingSpinner component
- [x] SkeletonLoader component
- [x] NotificationToast component
- [x] Reduced motion support
- [x] Preload animation prevention
- [x] SideNav animations
- [x] AuthModal animations
- [x] Home page animations
- [x] Quiz creator animations
- [x] Friends page animations

### 📝 Files Modified
1. `src/app/globals.css` - Animation keyframes and utilities
2. `src/app/layout.tsx` - Preload script
3. `src/components/SideNav.tsx` - Navigation animations
4. `src/components/AuthModal.tsx` - Modal animations
5. `src/app/page.tsx` - Home page animations (existing)
6. `src/app/quiz-creator/page.tsx` - Creator animations (existing)
7. `src/app/friends/page.tsx` - Friends animations (existing)

### 🆕 New Components
1. `src/components/LoadingSpinner.tsx` - Reusable loading indicators
2. `src/components/SkeletonLoader.tsx` - Loading placeholders
3. `src/components/NotificationToast.tsx` - Toast notifications

## Future Enhancements

### Potential Additions
- [ ] Page transition animations (Next.js App Router)
- [ ] Confetti effect for achievements
- [ ] Particle effects for special events
- [ ] Micro-interactions for form validation
- [ ] Custom cursor animations
- [ ] Scroll-triggered animations
- [ ] Parallax effects
- [ ] 3D transforms for cards

## Browser Support
- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support (14+)
- Mobile browsers: Full support with optimizations

## Testing Checklist
- [x] Animations smooth at 60fps
- [x] No animation jank on page load
- [x] Reduced motion preference respected
- [x] Mobile performance acceptable
- [x] Animations don't block interactions
- [x] Loading states provide clear feedback
- [x] Transitions feel natural and polished
