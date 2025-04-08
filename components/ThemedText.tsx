import React from "react";
import { Text, TextStyle, StyleSheet } from "react-native";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Colors } from "@/constants/Colors";

type TextType = "default" | "title" | "subtitle" | "small" | "secondary";

type Props = {
  children: React.ReactNode;
  type?: TextType;
  style?: TextStyle;
};

export default function ThemedText({
  children,
  type = "default",
  style,
}: Props) {
  const colorScheme = useColorScheme() ?? "light";

  // Sử dụng hệ thống màu thống nhất
  const textColor =
    type === "secondary"
      ? Colors[colorScheme].textSecondary
      : Colors[colorScheme].text;

  return (
    <Text style={[{ color: textColor }, styles[type], style]}>{children}</Text>
  );
}

// Keep the named export for backwards compatibility
export { ThemedText };

const styles = StyleSheet.create({
  default: {
    fontSize: 16,
    lineHeight: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: "600",
    lineHeight: 24,
  },
  small: {
    fontSize: 12,
    lineHeight: 16,
  },
  secondary: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.8,
  },
});
