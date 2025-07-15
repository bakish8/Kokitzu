import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import { useButtonPress } from "../utils/animations";

interface AnimatedButtonProps {
  title: string;
  onPress: () => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "success" | "danger";
  size?: "small" | "medium" | "large";
  loading?: boolean;
}

const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  title,
  onPress,
  style,
  textStyle,
  disabled = false,
  variant = "primary",
  size = "medium",
  loading = false,
}) => {
  const {
    animatedStyle,
    onPressIn,
    onPressOut,
    onPress: buttonPress,
  } = useButtonPress();

  const handlePress = () => {
    if (!disabled && !loading) {
      buttonPress();
      onPress();
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case "primary":
        return {
          backgroundColor: "#3b82f6",
          borderColor: "#3b82f6",
        };
      case "secondary":
        return {
          backgroundColor: "transparent",
          borderColor: "#3b82f6",
        };
      case "success":
        return {
          backgroundColor: "#10b981",
          borderColor: "#10b981",
        };
      case "danger":
        return {
          backgroundColor: "#ef4444",
          borderColor: "#ef4444",
        };
      default:
        return {
          backgroundColor: "#3b82f6",
          borderColor: "#3b82f6",
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case "small":
        return {
          paddingHorizontal: 16,
          paddingVertical: 8,
          borderRadius: 8,
        };
      case "large":
        return {
          paddingHorizontal: 24,
          paddingVertical: 16,
          borderRadius: 12,
        };
      default:
        return {
          paddingHorizontal: 20,
          paddingVertical: 12,
          borderRadius: 10,
        };
    }
  };

  const getTextColor = () => {
    if (disabled) return "#666666";
    switch (variant) {
      case "secondary":
        return "#3b82f6";
      default:
        return "#ffffff";
    }
  };

  return (
    <Animated.View style={[animatedStyle]}>
      <TouchableOpacity
        style={[
          styles.button,
          getVariantStyles(),
          getSizeStyles(),
          disabled && styles.disabled,
          style,
        ]}
        onPress={handlePress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        activeOpacity={1}
        disabled={disabled || loading}
      >
        <Text style={[styles.text, { color: getTextColor() }, textStyle]}>
          {loading ? "Loading..." : title}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowRadius: 3.84,
    elevation: 5,
  },
  text: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  disabled: {
    backgroundColor: "#333333",
    borderColor: "#333333",
    shadowOpacity: 0,
    elevation: 0,
  },
});

export default AnimatedButton;
