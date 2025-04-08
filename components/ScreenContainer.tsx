import React from "react";
import { ScrollView, StyleSheet, StyleProp, ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { ThemedView } from "@/components/ThemedView";
import Layout from "@/constants/Layout";

type Props = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  showsVerticalScrollIndicator?: boolean;
};

export default function ScreenContainer({
  children,
  style,
  contentContainerStyle,
  showsVerticalScrollIndicator = false,
}: Props) {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();

  return (
    <ScrollView
      style={[styles.scrollView, { paddingTop: insets.top }, style]}
      contentContainerStyle={[
        styles.contentContainer,
        { paddingBottom: tabBarHeight + Layout.padding.container },
        contentContainerStyle,
      ]}
      showsVerticalScrollIndicator={showsVerticalScrollIndicator}
    >
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: Layout.padding.container,
  },
});
