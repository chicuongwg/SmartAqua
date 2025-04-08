import React from "react";
import {
  StyleSheet,
  TouchableOpacity,
  TouchableOpacityProps,
} from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { Colors, BorderRadius, Spacing } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";

type ButtonType = "primary" | "secondary" | "danger" | "success";

type Props = TouchableOpacityProps & {
  label: string;
  type?: ButtonType;
  size?: "small" | "medium" | "large";
};

export default function Button({
  label,
  type = "primary",
  size = "medium",
  style,
  ...props
}: Props) {
  const colorScheme = useColorScheme() ?? "light";

  const getBackgroundColor = () => {
    switch (type) {
      case "primary":
        return Colors[colorScheme].primary;
      case "danger":
        return Colors[colorScheme].danger;
      case "success":
        return Colors[colorScheme].success;
      case "secondary":
        return "transparent";
      default:
        return Colors[colorScheme].primary;
    }
  };

  const getBorderColor = () => {
    return type === "secondary" ? Colors[colorScheme].primary : "transparent";
  };

  const getTextColor = () => {
    return type === "secondary" ? Colors[colorScheme].primary : "#ffffff";
  };

  const getSizeStyle = () => {
    switch (size) {
      case "small":
        return styles.small;
      case "large":
        return styles.large;
      default:
        return styles.medium;
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      style={[
        styles.button,
        {
          backgroundColor: getBackgroundColor(),
          borderColor: getBorderColor(),
        },
        getSizeStyle(),
        style,
      ]}
      {...props}
    >
      <ThemedText style={{ ...styles.text, color: getTextColor() }}>
        {label}
      </ThemedText>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  small: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
  },
  medium: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  large: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  text: {
    fontSize: 16,
    fontWeight: "600",
  },
});
