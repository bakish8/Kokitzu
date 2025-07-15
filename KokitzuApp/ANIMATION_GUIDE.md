# Kokitzu Animation System Guide

## Overview

The Kokitzu app features a comprehensive animation system built with React Native Reanimated 2, providing fluid, expressive, and performant animations throughout the user experience. This guide documents all implemented animations, their usage patterns, and best practices.

## Table of Contents

1. [Animation Utilities](#animation-utilities)
2. [Component Animations](#component-animations)
3. [Screen Transitions](#screen-transitions)
4. [Interactive Elements](#interactive-elements)
5. [Performance Optimizations](#performance-optimizations)
6. [Best Practices](#best-practices)
7. [Future Enhancements](#future-enhancements)

## Animation Utilities

### Core Animation Hooks

All animations are centralized in `src/utils/animations.ts` and provide consistent, reusable patterns:

#### 1. Component Entry Animations

```typescript
// Fade in with custom duration
const { animatedStyle, startAnimation } = useFadeIn(delay, duration);

// Slide up with custom distance
const { animatedStyle, startAnimation } = useSlideUp(delay, distance, duration);

// Scale in with custom initial scale
const { animatedStyle, startAnimation } = useScaleIn(delay, initialScale);

// Combined entrance animation
const { animatedStyle, startAnimation } = useEntranceAnimation(delay);
```

#### 2. Interactive Animations

```typescript
// Button press feedback
const { animatedStyle, onPressIn, onPressOut, onPress } = useButtonPress();

// Card hover effects
const { animatedStyle, onHoverIn, onHoverOut } = useCardHover();

// Swipe to dismiss
const { animatedStyle, gestureHandler } = useSwipeToDismiss(onDismiss);
```

#### 3. List and Card Animations

```typescript
// Staggered list entrance
const { animatedStyle, startAnimation } = useStaggeredList(index, staggerDelay);

// Parallax scroll effects
const { animatedStyle, onScroll } = useParallaxScroll();
```

#### 4. Modal Animations

```typescript
// Modal with background dim
const { modalStyle, backgroundStyle, showModal, hideModal } =
  useModalAnimation();
```

#### 5. Loading and State Animations

```typescript
// Loading spinner
const { animatedStyle, startSpinning, stopSpinning } = useLoadingSpinner();

// Pulse animation
const { animatedStyle, pulse, startPulsing } = usePulse();

// Success feedback
const { animatedStyle, showSuccess, hideSuccess } = useSuccessAnimation();
```

#### 6. Error and Feedback Animations

```typescript
// Shake animation for errors
const { animatedStyle, shake } = useShake();
```

## Component Animations

### AnimatedButton

A fully-featured button component with multiple variants and animations:

```typescript
<AnimatedButton
  title="Press Me"
  onPress={handlePress}
  variant="primary" // primary, secondary, success, danger
  size="medium" // small, medium, large
  disabled={false}
  loading={false}
  style={customStyle}
/>
```

**Features:**

- Press feedback with scale and shadow animations
- Multiple visual variants
- Loading state with spinner
- Disabled state styling
- Customizable sizes

### CryptoCard

Enhanced crypto cards with staggered entrance and hover effects:

```typescript
<CryptoCard
  crypto={cryptoData}
  onPress={handlePress}
  index={index} // For staggered animations
/>
```

**Animations:**

- Staggered entrance with fade, slide, scale, and rotation
- Hover effects with scale and shadow
- Press feedback
- Smooth transitions

### AuthModal

Modal with sophisticated entrance and error animations:

```typescript
<AuthModal visible={isVisible} onClose={handleClose} />
```

**Animations:**

- Background fade-in
- Modal scale and slide entrance
- Form slide-up animation
- Error shake feedback
- Smooth exit animations

## Screen Transitions

### LivePricesScreen

The main screen features comprehensive entrance animations:

```typescript
// Header animations
const headerAnimatedStyle = useAnimatedStyle(() => ({
  opacity: headerOpacity.value,
  transform: [{ translateY: headerTranslateY.value }],
}));

// Staggered entrance sequence
useEffect(() => {
  // Header: 100ms delay
  headerOpacity.value = withDelay(100, withTiming(1, { duration: 600 }));
  headerTranslateY.value = withDelay(100, withSpring(0, springConfig));

  // Search: 300ms delay
  searchOpacity.value = withDelay(300, withTiming(1, { duration: 600 }));
  searchTranslateY.value = withDelay(300, withSpring(0, springConfig));

  // Content: 500ms delay
  contentOpacity.value = withDelay(500, withTiming(1, { duration: 600 }));
  contentTranslateY.value = withDelay(500, withSpring(0, springConfig));
}, []);
```

## Interactive Elements

### Gesture-Based Animations

The app supports advanced gesture interactions:

```typescript
// Swipe to dismiss
const { animatedStyle, gestureHandler } = useSwipeToDismiss(() => {
  // Handle dismissal
});

// Use with PanGestureHandler
<PanGestureHandler onGestureEvent={gestureHandler}>
  <Animated.View style={animatedStyle}>{/* Content */}</Animated.View>
</PanGestureHandler>;
```

### Scroll-Based Animations

Parallax effects for enhanced scrolling experience:

```typescript
const { animatedStyle, onScroll } = useParallaxScroll();

<ScrollView onScroll={onScroll} scrollEventThrottle={16}>
  <Animated.View style={animatedStyle}>{/* Parallax content */}</Animated.View>
</ScrollView>;
```

## Performance Optimizations

### 1. Native Driver Usage

All animations use the native driver for optimal performance:

```typescript
// Transform and opacity animations run on the UI thread
const animatedStyle = useAnimatedStyle(() => ({
  transform: [{ scale: scale.value }],
  opacity: opacity.value,
}));
```

### 2. Optimized Animation Hooks

```typescript
// Single progress value for multiple animations
const { animatedStyle, startAnimation, progress } = useOptimizedAnimation();

// Derived values for complex animations
const derivedValue = useDerivedValue(() => {
  return interpolate(progress.value, [0, 1], [0, 100]);
});
```

### 3. Worklet Functions

All animation calculations run in worklets for better performance:

```typescript
const animatedStyle = useAnimatedStyle(() => {
  "worklet";
  return {
    transform: [{ scale: interpolate(progress.value, [0, 1], [0.8, 1]) }],
  };
});
```

## Best Practices

### 1. Animation Timing

- **Fast interactions**: 150-200ms for immediate feedback
- **Standard transitions**: 300ms for most animations
- **Complex animations**: 600ms for elaborate sequences
- **Loading states**: 1000ms+ for continuous animations

### 2. Spring Configurations

```typescript
// Responsive spring for interactions
const springConfig = {
  damping: 15,
  stiffness: 150,
  mass: 1,
};

// Bouncy spring for playful feedback
const bouncySpringConfig = {
  damping: 8,
  stiffness: 200,
  mass: 0.8,
};

// Smooth spring for elegant transitions
const smoothSpringConfig = {
  damping: 20,
  stiffness: 100,
  mass: 1.2,
};
```

### 3. Staggered Animations

```typescript
// Consistent stagger delays
const STAGGER_DELAY = 100; // 100ms between each item

// Use index for predictable timing
{
  items.map((item, index) => (
    <AnimatedItem
      key={item.id}
      item={item}
      index={index}
      staggerDelay={STAGGER_DELAY}
    />
  ));
}
```

### 4. Error Handling

```typescript
// Provide visual feedback for errors
const { animatedStyle, shake } = useShake();

useEffect(() => {
  if (error) {
    shake();
  }
}, [error]);
```

### 5. Accessibility

- Maintain minimum touch targets (44x44 points)
- Provide alternative feedback for users with motion sensitivity
- Ensure animations don't interfere with screen readers

## Future Enhancements

### 1. Shared Element Transitions

```typescript
// Planned implementation for smooth transitions between screens
const { animatedStyle, activate, deactivate } =
  useSharedElementTransition(isActive);
```

### 2. Advanced Gesture Recognition

- Pinch to zoom animations
- Long press feedback
- Multi-touch gestures

### 3. Micro-interactions

- Haptic feedback integration
- Sound effects for key interactions
- Particle effects for celebrations

### 4. Performance Monitoring

```typescript
// Planned performance monitoring
const { frameRate, memoryUsage } = usePerformanceMonitor();
```

### 5. Animation Presets

```typescript
// Planned preset system
const animations = {
  entrance: "slideUp",
  interaction: "bounce",
  exit: "fadeOut",
};
```

## Configuration

### Babel Configuration

Ensure Reanimated is properly configured in `babel.config.js`:

```javascript
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: ["react-native-reanimated/plugin"],
  };
};
```

### Entry Point Configuration

Import Reanimated at the top of your entry files:

```typescript
// App.tsx and index.ts
import "react-native-reanimated";
```

### Gesture Handler Setup

Wrap your app with GestureHandlerRootView:

```typescript
import { GestureHandlerRootView } from "react-native-gesture-handler";

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {/* Your app content */}
    </GestureHandlerRootView>
  );
}
```

## Troubleshooting

### Common Issues

1. **Animations not working**: Ensure Reanimated is imported at the top of entry files
2. **Performance issues**: Check that animations use the native driver
3. **Gesture conflicts**: Ensure proper gesture handler setup
4. **Memory leaks**: Clean up animation listeners in useEffect cleanup

### Debug Tools

```typescript
// Enable Reanimated debug mode
import { enableReanimatedDebug } from "react-native-reanimated";

if (__DEV__) {
  enableReanimatedDebug();
}
```

## Conclusion

The Kokitzu animation system provides a solid foundation for creating engaging, performant user experiences. By following the patterns and best practices outlined in this guide, developers can create consistent, accessible, and delightful animations throughout the app.

For questions or contributions to the animation system, please refer to the project documentation or create an issue in the repository.
