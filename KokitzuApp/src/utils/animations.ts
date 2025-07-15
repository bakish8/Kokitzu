import {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  useAnimatedGestureHandler,
  withSpring,
  withTiming,
  withSequence,
  withDelay,
  withRepeat,
  interpolate,
  Extrapolate,
  runOnJS,
  useDerivedValue,
} from "react-native-reanimated";
import { Dimensions } from "react-native";
import {
  PanGestureHandlerGestureEvent,
  State,
} from "react-native-gesture-handler";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

// Enhanced Spring Configurations
export const springConfig = {
  damping: 15,
  stiffness: 150,
  mass: 1,
  overshootClamping: false,
  restDisplacementThreshold: 0.01,
  restSpeedThreshold: 0.01,
};

export const bouncySpringConfig = {
  damping: 8,
  stiffness: 200,
  mass: 0.8,
  overshootClamping: false,
  restDisplacementThreshold: 0.01,
  restSpeedThreshold: 0.01,
};

export const smoothSpringConfig = {
  damping: 20,
  stiffness: 100,
  mass: 1.2,
  overshootClamping: false,
  restDisplacementThreshold: 0.01,
  restSpeedThreshold: 0.01,
};

// Timing Configurations
export const timingConfig = {
  duration: 300,
};

export const fastTimingConfig = {
  duration: 150,
};

export const slowTimingConfig = {
  duration: 600,
};

// 1. Component Entry Animations
export const useFadeIn = (delay = 0, duration = 300) => {
  const opacity = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const startAnimation = () => {
    opacity.value = withDelay(delay, withTiming(1, { duration }));
  };

  return { animatedStyle, startAnimation, opacity };
};

export const useSlideUp = (delay = 0, distance = 50, duration = 300) => {
  const translateY = useSharedValue(distance);
  const opacity = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const startAnimation = () => {
    translateY.value = withDelay(delay, withSpring(0, springConfig));
    opacity.value = withDelay(delay, withTiming(1, { duration }));
  };

  return { animatedStyle, startAnimation };
};

export const useScaleIn = (delay = 0, initialScale = 0.8) => {
  const scale = useSharedValue(initialScale);
  const opacity = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const startAnimation = () => {
    scale.value = withDelay(delay, withSpring(1, springConfig));
    opacity.value = withDelay(delay, withTiming(1, timingConfig));
  };

  return { animatedStyle, startAnimation };
};

// 2. Interactive Animations
export const useButtonPress = () => {
  const scale = useSharedValue(1);
  const shadowOpacity = useSharedValue(0.1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    shadowOpacity: shadowOpacity.value,
  }));

  const onPressIn = () => {
    scale.value = withSpring(0.95, bouncySpringConfig);
    shadowOpacity.value = withTiming(0.3, fastTimingConfig);
  };

  const onPressOut = () => {
    scale.value = withSpring(1, bouncySpringConfig);
    shadowOpacity.value = withTiming(0.1, fastTimingConfig);
  };

  const onPress = () => {
    scale.value = withSequence(
      withSpring(0.9, bouncySpringConfig),
      withSpring(1, bouncySpringConfig)
    );
  };

  return { animatedStyle, onPressIn, onPressOut, onPress };
};

export const useCardHover = () => {
  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);
  const shadowOpacity = useSharedValue(0.1);
  const shadowRadius = useSharedValue(4);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
    shadowOpacity: shadowOpacity.value,
    shadowRadius: shadowRadius.value,
  }));

  const onHoverIn = () => {
    scale.value = withSpring(1.02, smoothSpringConfig);
    translateY.value = withSpring(-2, smoothSpringConfig);
    shadowOpacity.value = withTiming(0.3, timingConfig);
    shadowRadius.value = withTiming(8, timingConfig);
  };

  const onHoverOut = () => {
    scale.value = withSpring(1, smoothSpringConfig);
    translateY.value = withSpring(0, smoothSpringConfig);
    shadowOpacity.value = withTiming(0.1, timingConfig);
    shadowRadius.value = withTiming(4, timingConfig);
  };

  return { animatedStyle, onHoverIn, onHoverOut };
};

// 3. List and Card Animations
export const useStaggeredList = (index: number, staggerDelay = 100) => {
  const translateY = useSharedValue(50);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.9);
  const rotation = useSharedValue(5);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
    ],
    opacity: opacity.value,
  }));

  const startAnimation = () => {
    const delay = index * staggerDelay;
    translateY.value = withDelay(delay, withSpring(0, springConfig));
    opacity.value = withDelay(delay, withTiming(1, timingConfig));
    scale.value = withDelay(delay, withSpring(1, springConfig));
    rotation.value = withDelay(delay, withSpring(0, springConfig));
  };

  return { animatedStyle, startAnimation };
};

// 4. Modal Animations
export const useModalAnimation = () => {
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);
  const backgroundOpacity = useSharedValue(0);
  const translateY = useSharedValue(50);

  const modalStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const backgroundStyle = useAnimatedStyle(() => ({
    opacity: backgroundOpacity.value,
  }));

  const showModal = () => {
    // Background appears instantly
    backgroundOpacity.value = 0.5;
    // Modal animates in
    scale.value = withSpring(1, springConfig);
    opacity.value = withTiming(1, timingConfig);
    translateY.value = withSpring(0, springConfig);
  };

  const hideModal = (onComplete?: () => void) => {
    // Background disappears instantly
    backgroundOpacity.value = 0;
    // Modal animates out
    scale.value = withSpring(0.8, springConfig);
    opacity.value = withTiming(0, timingConfig);
    translateY.value = withSpring(50, springConfig);

    if (onComplete) {
      setTimeout(onComplete, 300);
    }
  };

  return { modalStyle, backgroundStyle, showModal, hideModal };
};

// Enhanced Modal Animation with instant background
export const useInstantBackgroundModal = () => {
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(50);

  const modalStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const showModal = () => {
    // Modal animates in with spring physics
    scale.value = withSpring(1, springConfig);
    opacity.value = withTiming(1, timingConfig);
    translateY.value = withSpring(0, springConfig);
  };

  const hideModal = (onComplete?: () => void) => {
    // Modal animates out
    scale.value = withSpring(0.8, springConfig);
    opacity.value = withTiming(0, timingConfig);
    translateY.value = withSpring(50, springConfig);

    if (onComplete) {
      setTimeout(onComplete, 300);
    }
  };

  return { modalStyle, showModal, hideModal };
};

// 5. Tab Navigation Animations
export const useTabIndicator = (activeIndex: number) => {
  const translateX = useSharedValue(0);
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }, { scale: scale.value }],
  }));

  const moveToIndex = (index: number, tabWidth: number) => {
    translateX.value = withSpring(index * tabWidth, springConfig);
    scale.value = withSequence(
      withSpring(1.1, bouncySpringConfig),
      withSpring(1, bouncySpringConfig)
    );
  };

  return { animatedStyle, moveToIndex };
};

// 6. Gesture-Based Animations
export const useSwipeToDismiss = (onDismiss: () => void) => {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  const gestureHandler =
    useAnimatedGestureHandler<PanGestureHandlerGestureEvent>({
      onStart: () => {},
      onActive: (event) => {
        translateX.value = event.translationX;
        translateY.value = event.translationY;
        scale.value = interpolate(
          Math.abs(event.translationX),
          [0, screenWidth / 2],
          [1, 0.8],
          Extrapolate.CLAMP
        );
        opacity.value = interpolate(
          Math.abs(event.translationX),
          [0, screenWidth / 2],
          [1, 0.5],
          Extrapolate.CLAMP
        );
      },
      onEnd: (event) => {
        if (Math.abs(event.translationX) > screenWidth / 3) {
          translateX.value = withTiming(screenWidth, timingConfig);
          opacity.value = withTiming(0, timingConfig);
          runOnJS(onDismiss)();
        } else {
          translateX.value = withSpring(0, springConfig);
          translateY.value = withSpring(0, springConfig);
          scale.value = withSpring(1, springConfig);
          opacity.value = withSpring(1, springConfig);
        }
      },
    });

  return { animatedStyle, gestureHandler };
};

// 7. Scroll-Based Animations
export const useParallaxScroll = () => {
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
  }));

  const onScroll = useAnimatedScrollHandler((event) => {
    const offsetY = event.contentOffset.y;
    translateY.value = interpolate(
      offsetY,
      [0, 200],
      [0, -50],
      Extrapolate.CLAMP
    );
    scale.value = interpolate(offsetY, [0, 200], [1, 0.95], Extrapolate.CLAMP);
  });

  return { animatedStyle, onScroll };
};

// 8. Loading and State Animations
export const useLoadingSpinner = () => {
  const rotation = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const startSpinning = () => {
    rotation.value = withRepeat(withTiming(360, { duration: 1000 }), -1, false);
  };

  const stopSpinning = () => {
    rotation.value = withTiming(0, { duration: 300 });
  };

  return { animatedStyle, startSpinning, stopSpinning };
};

export const usePulse = () => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const pulse = () => {
    scale.value = withSequence(
      withTiming(1.1, { duration: 200 }),
      withTiming(1, { duration: 200 })
    );
  };

  const startPulsing = () => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 200 }),
        withTiming(1, { duration: 200 })
      ),
      -1,
      false
    );
  };

  return { animatedStyle, pulse, startPulsing };
};

// 9. Error and Feedback Animations
export const useShake = () => {
  const translateX = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const shake = () => {
    translateX.value = withSequence(
      withTiming(-10, { duration: 100 }),
      withTiming(10, { duration: 100 }),
      withTiming(-10, { duration: 100 }),
      withTiming(10, { duration: 100 }),
      withTiming(0, { duration: 100 })
    );
  };

  return { animatedStyle, shake };
};

export const useSuccessAnimation = () => {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const showSuccess = () => {
    opacity.value = withTiming(1, { duration: 200 });
    scale.value = withSequence(
      withSpring(1.2, bouncySpringConfig),
      withSpring(1, bouncySpringConfig)
    );
  };

  const hideSuccess = () => {
    opacity.value = withTiming(0, { duration: 200 });
    scale.value = withTiming(0, { duration: 200 });
  };

  return { animatedStyle, showSuccess, hideSuccess };
};

// 10. Shared Element Transitions (Basic Implementation)
export const useSharedElementTransition = (isActive: boolean) => {
  const scale = useSharedValue(isActive ? 1 : 0.8);
  const opacity = useSharedValue(isActive ? 1 : 0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const activate = () => {
    scale.value = withSpring(1, springConfig);
    opacity.value = withTiming(1, timingConfig);
  };

  const deactivate = () => {
    scale.value = withSpring(0.8, springConfig);
    opacity.value = withTiming(0, timingConfig);
  };

  return { animatedStyle, activate, deactivate };
};

// 11. Advanced Combined Animations
export const useEntranceAnimation = (delay = 0) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(30);
  const scale = useSharedValue(0.9);
  const rotation = useSharedValue(5);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
    ],
  }));

  const startAnimation = () => {
    opacity.value = withDelay(delay, withTiming(1, timingConfig));
    translateY.value = withDelay(delay, withSpring(0, springConfig));
    scale.value = withDelay(delay, withSpring(1, springConfig));
    rotation.value = withDelay(delay, withSpring(0, springConfig));
  };

  return { animatedStyle, startAnimation };
};

// 12. Performance Optimized Animations
export const useOptimizedAnimation = () => {
  const progress = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(progress.value, [0, 1], [0, 1]);
    const scale = interpolate(progress.value, [0, 1], [0.8, 1]);
    const translateY = interpolate(progress.value, [0, 1], [50, 0]);

    return {
      opacity,
      transform: [{ scale }, { translateY }],
    };
  });

  const startAnimation = () => {
    progress.value = withSpring(1, springConfig);
  };

  return { animatedStyle, startAnimation, progress };
};
