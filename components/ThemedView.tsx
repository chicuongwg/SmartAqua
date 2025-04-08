import { View, type ViewProps, StyleSheet } from "react-native";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useThemeColor } from "@/hooks/useThemeColor";
import { Colors, Spacing, BorderRadius, Shadows } from "@/constants/Colors";
import Layout from "@/constants/Layout";

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
  card?: boolean; // Thêm prop để xác định kiểu card
  elevated?: boolean; // Thêm prop để thêm shadow
};

export function ThemedView({
  style,
  lightColor,
  darkColor,
  card,
  elevated,
  ...otherProps
}: ThemedViewProps): JSX.Element {
  const colorScheme = useColorScheme() ?? "light";
  const backgroundColor = useThemeColor(
    { light: lightColor, dark: darkColor },
    "background"
  );

  // Update the card style to use Layout constants
  const cardStyle = card
    ? {
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        borderColor: Colors[colorScheme].border,
        padding: Layout.card.padding, // Use Layout constant
        marginBottom: Spacing.md,
        backgroundColor: Colors[colorScheme].backgroundSecondary,
      }
    : {};

  const shadowStyle = elevated ? Shadows[colorScheme].small : {};

  return (
    <View
      style={[{ backgroundColor }, cardStyle, shadowStyle, style]}
      {...otherProps}
    />
  );
}
