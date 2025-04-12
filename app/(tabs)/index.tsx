// Import necessary hooks and components from libraries
import { useRouter } from "expo-router"; // Navigation
import {
  StyleSheet,
  ScrollView,
  Alert,
  useColorScheme,
  TouchableOpacity,
  View,
  Text,
} from "react-native"; // Core RN
import { useSafeAreaInsets } from "react-native-safe-area-context"; // Safe area
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs"; // Tab bar height

// Import custom hooks and components
import { useTaoMqtt } from "@/hooks/useTaoMqtt"; // ALERT: Potentially unused MQTT hook
import { ThemedText } from "@/components/ThemedText"; // Themed text
import { ThemedView } from "@/components/ThemedView"; // Themed view
import { IconSymbol } from "@/components/ui/IconSymbol"; // Icons
import ScreenContainer from "@/components/ScreenContainer"; // Screen layout
import Layout from "@/constants/Layout"; // Layout constants
import { useMqtt } from "@/context/MqttContext"; // IMPORTANT: Global MQTT context hook

// Define the HomeScreen component
export default function HomeScreen() {
  // Initialize hooks
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const colorScheme = useColorScheme();

  // Render the component UI
  return (
    <ScreenContainer>
      {/* App Title */}
      <ThemedText type="largeTitle" style={styles.title}>
        SmartAqua
      </ThemedText>
      {/* App Subtitle */}
      <ThemedText type="subtitle" style={styles.subtitle}>
        Your Intelligent Aquarium Control Center
      </ThemedText>

      {/* Quick Guide Section */}
      <ThemedText type="subtitle" style={styles.sectionTitle}>
        Quick Guide
      </ThemedText>
      <ThemedView card style={styles.guideSection}>
        <ThemedText style={styles.guideText}>
          Welcome to SmartAqua! Monitor your aquarium's key parameters and
          explore fish information.
        </ThemedText>
        <ThemedText style={styles.guideText}>
          Use the bottom tabs to navigate:
        </ThemedText>
        <View style={styles.guidePoints}>
          <ThemedText style={styles.guidePoint}>
            • <ThemedText style={styles.tabName}>Home:</ThemedText> This welcome
            screen.
          </ThemedText>
          <ThemedText style={styles.guidePoint}>
            • <ThemedText style={styles.tabName}>My Tank:</ThemedText> Search
            for compatible fish species for current tank size.
          </ThemedText>
          <ThemedText style={styles.guidePoint}>
            • <ThemedText style={styles.tabName}>Dashboard:</ThemedText> View
            live sensor data, history graphs, and feeding controls.
          </ThemedText>
          <ThemedText style={styles.guidePoint}>
            • <ThemedText style={styles.tabName}>Fish Library:</ThemedText>{" "}
            Search for information about different fish species.
          </ThemedText>
        </View>
        <ThemedText style={styles.guideText}>
          Future features include:
        </ThemedText>
        <View style={styles.guidePoints}>
          <ThemedText style={styles.guidePoint}>
            •{" "}
            <ThemedText style={styles.tabName}>Fish Compatibility:</ThemedText>{" "}
            Check compatibility of fish species with current tank condition.
          </ThemedText>
          <ThemedText style={styles.guidePoint}>
            • <ThemedText style={styles.tabName}>In App Setting:</ThemedText>{" "}
            Customize app settings.
          </ThemedText>
          <ThemedText style={styles.guidePoint}>
            •{" "}
            <ThemedText style={styles.tabName}>
              Water Quality Alerts:
            </ThemedText>{" "}
            Get notified of water quality changes.
          </ThemedText>
        </View>
      </ThemedView>

      {/* Footer Section */}
      <ThemedView style={styles.footer}>
        <ThemedText style={styles.footerText}>
          Developed by{" "}
          <ThemedText style={styles.footerHighlight}>
            chicuongwg & dltmai
          </ThemedText>
        </ThemedText>
        <ThemedText style={styles.versionText}>Version 1.0.0</ThemedText>
      </ThemedView>
    </ScreenContainer>
  );
}

// Styles for the component (remain unchanged)
const styles = StyleSheet.create({
  pageTitle: {
    marginVertical: Layout.margin.section,
    textAlign: "center",
  },
  infoBlock: {},
  statusSection: {
    padding: 16,
    backgroundColor: "rgba(0,0,0,0)",
  },
  mqttSection: {
    padding: 16,
    borderTopWidth: 1,
    borderColor: "#e5e5e5",
  },
  sectionTitle: {
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: "column",
    gap: 12,
    marginBottom: 16,
  },
  statusItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  connectButton: {
    backgroundColor: "#0a7ea4",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  dashboardButton: {
    backgroundColor: "#22c55e",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 24,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  guideSection: {
    borderRadius: 12,
    padding: 16,
    backgroundColor: "rgba(0,0,0,0)",
    borderWidth: 1,
    borderColor: "#e5e5e5",
    marginBottom: 24,
  },
  guideText: {
    marginBottom: 8,
    lineHeight: 20,
  },
  featuresSection: {
    borderRadius: 12,
    padding: 16,
    backgroundColor: "rgba(0,0,0,0)",
    borderWidth: 1,
    borderColor: "#e5e5e5",
  },
  featureItem: {
    flexDirection: "row",
    marginBottom: 16,
    alignItems: "flex-start",
    gap: 12,
  },
  featureTextContainer: {
    flex: 1,
  },
  featureTitle: {
    fontWeight: "600",
    marginBottom: 4,
  },
  featureDescription: {
    opacity: 0.8,
  },
  footer: {
    marginTop: 16,
    alignItems: "center",
    paddingVertical: 8,
  },
  footerText: {
    fontSize: 14,
  },
  footerHighlight: {
    fontWeight: "600",
  },
  versionText: {
    fontSize: 12,
    opacity: 0.7,
    marginTop: 4,
  },
  title: {
    marginVertical: Layout.margin.section,
    textAlign: "center",
  },
  subtitle: {
    textAlign: "center",
    marginBottom: 24,
  },
  statusTextContainer: {
    flex: 1,
  },
  statusValue: {
    fontWeight: "600",
  },
  readingsSection: {
    padding: 16,
    borderTopWidth: 1,
    borderColor: "#e5e5e5",
  },
  readingsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  readingItem: {
    width: "48%",
    padding: 12,
    borderRadius: 8,
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  readingHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  readingTitle: {
    marginLeft: 8,
    fontWeight: "600",
  },
  readingValue: {
    fontSize: 18,
    fontWeight: "600",
  },
  menuGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    marginTop: 24,
  },
  menuItem: {
    width: "48%",
    padding: 16,
    borderRadius: 8,
    backgroundColor: "rgba(0,0,0,0.05)",
    alignItems: "center",
  },
  menuLabel: {
    marginTop: 8,
    fontWeight: "600",
  },
  guidePoints: {
    marginTop: 8,
    marginLeft: 16, // Indent the points
  },
  guidePoint: {
    marginBottom: 4, // Add spacing between points
    lineHeight: 20,
  },
  tabName: {
    fontWeight: "600", // Highlight tab names
  },
});
