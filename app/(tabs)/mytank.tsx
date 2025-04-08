import { StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import FishPondDashboard from "@/components/FishPondDashboard";
import ScreenContainer from "@/components/ScreenContainer";

export default function MyTankScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();

  return (
    <ScreenContainer>
      <ThemedText type="title" style={styles.pageTitle}>
        My Tank
      </ThemedText>
      <FishPondDashboard />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  pageTitle: {
    fontSize: 28,
    marginVertical: 24,
    textAlign: "center",
  },
  sectionCard: {
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e5e5e5",
    marginBottom: 24,
    padding: 16,
    backgroundColor: "rgba(0,0,0,0)",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    marginBottom: 0,
  },
});
