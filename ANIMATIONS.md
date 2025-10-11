# VATEFS Animation System

## Overview

VATEFS includes smooth animations to provide visual feedback when strips are moved or updated by other clients. This enhances the user experience and makes it clear when changes are happening in real-time.

## Animation Types

### 1. **Strip Movement Animation**

When a strip is moved by another client (or when the order changes), it smoothly transitions to its new position.

**Implementation:**
- Uses Vue's `<TransitionGroup>` component
- CSS transition: `transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)`
- Easing: Cubic bezier for smooth acceleration/deceleration

**Visual Effect:**
- Strip slides smoothly from old position to new position
- No jarring jumps or instant repositioning
- Maintains user's visual tracking of the strip

**CSS Classes:**
```css
.strip-move-move {
  transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}
```

### 2. **Strip Entry Animation**

When a new strip is created by another client, it fades in and slides from the left.

**Visual Effect:**
- Fades from 0 to 100% opacity
- Slides in from -50px (left)
- Scales from 0.9 to 1.0 (subtle zoom)
- Duration: 0.5 seconds

**CSS Classes:**
```css
.strip-move-enter-active {
  transition: all 0.5s ease-out;
}

.strip-move-enter-from {
  opacity: 0;
  transform: translateX(-50px) scale(0.9);
}
```

### 3. **Strip Exit Animation**

When a strip is deleted by another client, it fades out and slides to the right.

**Visual Effect:**
- Fades from 100% to 0 opacity
- Slides out to +50px (right)
- Scales from 1.0 to 0.9 (subtle zoom out)
- Duration: 0.4 seconds

**CSS Classes:**
```css
.strip-move-leave-active {
  transition: all 0.4s ease-in;
  position: absolute;
  width: calc(100% - 16px);
}

.strip-move-leave-to {
  opacity: 0;
  transform: translateX(50px) scale(0.9);
}
```

### 4. **Strip Update Pulse**

When a strip's data is updated by another client (e.g., field changes), it briefly pulses with a blue glow.

**Visual Effect:**
- Scales to 102% and back to 100%
- Blue glowing shadow (rgba(33, 150, 243, 0.8))
- Duration: 0.6 seconds
- Only triggers on actual data changes (not position/timestamp changes)

**Implementation:**
```javascript
watch(() => props.strip, (newStrip, oldStrip) => {
  if (oldStrip && !isEditing.value) {
    const hasChanged = Object.keys(newStrip).some(key => {
      if (key === 'updatedAt' || key === 'position') return false
      return newStrip[key] !== oldStrip[key]
    })
    
    if (hasChanged) {
      justUpdated.value = true
      setTimeout(() => {
        justUpdated.value = false
      }, 1000)
    }
  }
})
```

**CSS Animation:**
```css
.flight-strip.strip-updated {
  animation: stripPulse 0.6s ease-in-out;
  box-shadow: 0 0 20px rgba(33, 150, 243, 0.6);
}

@keyframes stripPulse {
  0% {
    transform: scale(1);
    box-shadow: 0 0 0 rgba(33, 150, 243, 0.6);
  }
  50% {
    transform: scale(1.02);
    box-shadow: 0 0 20px rgba(33, 150, 243, 0.8);
  }
  100% {
    transform: scale(1);
    box-shadow: 0 0 20px rgba(33, 150, 243, 0.6);
  }
}
```

## User Experience Benefits

### 1. **Visual Feedback**
- Users immediately see when other clients make changes
- Clear indication of what changed and where
- Reduces confusion in multi-user environments

### 2. **Smooth Transitions**
- No jarring movements or instant changes
- Natural, predictable motion
- Easier to track strips as they move

### 3. **Change Awareness**
- Blue pulse clearly indicates an update
- Helps users notice important changes
- Distinguishes between moves and edits

### 4. **Professional Feel**
- Modern, polished user interface
- Matches expectations from professional ATC software
- Enhances credibility of the application

## Technical Details

### TransitionGroup Integration

The Vue `<TransitionGroup>` component wraps the `VueDraggable` component:

```vue
<TransitionGroup
  name="strip-move"
  tag="div"
  class="transition-wrapper"
>
  <VueDraggable
    v-model="allStrips"
    :animation="150"
    handle=".drag-handle"
    @end="onDragEnd"
  >
    <!-- Strip items -->
  </VueDraggable>
</TransitionGroup>
```

### Animation Timing

- **Move**: 600ms (smooth, noticeable)
- **Enter**: 500ms (quick but visible)
- **Exit**: 400ms (faster exit)
- **Pulse**: 600ms (attention-grabbing)

These timings are optimized for:
- Fast enough to not slow down operations
- Slow enough to be clearly visible
- Different durations for different actions (variety)

### Performance Considerations

1. **CSS Transforms**: Uses `transform` instead of `top/left` for better performance
2. **Hardware Acceleration**: Transform triggers GPU acceleration
3. **Minimal Repaints**: Animations don't trigger layout recalculations
4. **Debounced Updates**: Update pulse is debounced to prevent animation spam

### Browser Compatibility

- Works on all modern browsers (Chrome, Firefox, Safari, Edge)
- Uses standard CSS3 animations and transitions
- Graceful degradation on older browsers (no animation, but functional)

## Customization

### Adjusting Animation Speed

To make animations faster or slower, modify the duration values:

```css
/* Faster movements (400ms instead of 600ms) */
.strip-move-move {
  transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Slower pulse (1000ms instead of 600ms) */
.flight-strip.strip-updated {
  animation: stripPulse 1s ease-in-out;
}
```

### Changing Animation Style

To modify the easing function:

```css
/* More dramatic acceleration/deceleration */
.strip-move-move {
  transition: transform 0.6s cubic-bezier(0.68, -0.55, 0.27, 1.55);
}

/* Linear (constant speed) */
.strip-move-move {
  transition: transform 0.6s linear;
}

/* Ease-in-out (gentle start and end) */
.strip-move-move {
  transition: transform 0.6s ease-in-out;
}
```

### Disabling Animations

To disable animations for accessibility or performance reasons:

```css
/* Add to global CSS or user preference */
@media (prefers-reduced-motion: reduce) {
  .strip-move-move,
  .strip-move-enter-active,
  .strip-move-leave-active {
    transition: none !important;
    animation: none !important;
  }
}
```

## Future Enhancements

### Planned Features:
- **Drag preview**: Ghost image while dragging
- **Drop indicator**: Show where strip will be placed
- **Conflict animation**: Shake when two users edit simultaneously
- **Connection status**: Pulse when connection is lost/restored
- **Batch updates**: Special animation for multiple strips at once
- **Sound effects**: Optional audio feedback for changes

### Potential Improvements:
- **Stagger animations**: Sequential animation for multiple strips
- **Physics-based motion**: Spring physics for more natural movement
- **Gesture animations**: Swipe-based interactions on touch devices
- **3D transforms**: Flip or rotate effects for certain actions

## Summary

The animation system in VATEFS provides crucial visual feedback for multi-user collaboration. By smoothly animating strip movements and highlighting updates, users can easily track changes made by other controllers in real-time, creating a more intuitive and professional ATC strip management experience.

