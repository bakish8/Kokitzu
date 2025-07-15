import React, { useEffect } from "react";
import { View, StyleSheet, ViewStyle, TouchableOpacity } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  interpolate,
  Extrapolate,
} from "react-native-reanimated";
import { springConfig, timingConfig } from "../utils/animations";

interface AnimatedCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  delay?: number;
  index?: number;
  disabled?: boolean;
}

const AnimatedCard: React.FC<AnimatedCardProps> = ({
  children,
  style,
  onPress,
  delay = 0,
  index = 0,
  disabled = false,
}) => {
  const scale = useSharedValue(0.9);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(50);
  const shadowOpacity = useSharedValue(0.1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
    opacity: opacity.value,
    shadowOpacity: shadowOpacity.value,
  }));

  useEffect(() => {
    // Entrance animation with staggered delay
    const entranceDelay = delay + index * 100;

    scale.value = withDelay(entranceDelay, withSpring(1, springConfig));
    opacity.value = withDelay(entranceDelay, withTiming(1, timingConfig));
    translateY.value = withDelay(entranceDelay, withSpring(0, springConfig));
  }, []);

  const handlePressIn = () => {
    if (!disabled && onPress) {
      scale.value = withSpring(0.98, springConfig);
      shadowOpacity.value = withTiming(0.3, timingConfig);
    }
  };

  const handlePressOut = () => {
    if (!disabled && onPress) {
      scale.value = withSpring(1, springConfig);
      shadowOpacity.value = withTiming(0.1, timingConfig);
    }
  };

  const CardComponent = onPress ? TouchableOpacity : View;

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <CardComponent
        style={[styles.card, style]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        disabled={disabled}
      >
        {children}
      </CardComponent>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowRadius: 8,
    elevation: 8,
  },
  card: {
    backgroundColor: "#1a1a2e",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#2a2a3e",
  },
});

export default AnimatedCard;
