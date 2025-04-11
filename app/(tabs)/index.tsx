// Import necessary hooks and components from libraries
import { useRouter } from "expo-router"; // Navigation
import {
  StyleSheet,
  ScrollView,
  Alert,
  useColorScheme,
  TouchableOpacity,
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

  // Access the global MQTT context state and functions
  const { isConnected, connect, disconnect, aquariumData } = useMqtt(); // IMPORTANT: Get MQTT state/functions

  // Function to handle toggling the MQTT connection
  const toggleConnection = () => {
    if (isConnected) {
      disconnect(); // Disconnect via context
      Alert.alert("MQTT", "Disconnected from MQTT broker");
    } else {
      connect(); // Connect via context
      Alert.alert("MQTT", "Connecting to MQTT broker...");
    }
  };

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

      {/* System Status Information Block */}
      <ThemedView card style={styles.infoBlock}>
        <ThemedView style={styles.statusSection}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            System Status
          </ThemedText>

          {/* MQTT Connection Status Display */}
          <ThemedView style={styles.statusRow}>
            <ThemedView style={styles.statusItem}>
              {/* Wifi icon indicating connection status */}
              <IconSymbol
                name={isConnected ? "wifi" : "wifi.slash"} // Dynamic icon based on connection
                size={24}
                color={isConnected ? "#16a34a" : "#dc2626"} // Dynamic color
              />
              <ThemedView style={styles.statusTextContainer}>
                <ThemedText>MQTT Connection</ThemedText>
                {/* Text displaying connection status */}
                <ThemedText
                  style={[
                    styles.statusValue,
                    {
                      color: isConnected ? "#16a34a" : "#dc2626", // Dynamic color
                    },
                  ]}
                >
                  {isConnected ? "Connected" : "Disconnected"}
                </ThemedText>
              </ThemedView>
            </ThemedView>
          </ThemedView>

          {/* Button to Connect/Disconnect MQTT */}
          <TouchableOpacity
            style={styles.connectButton}
            onPress={toggleConnection} // IMPORTANT: Toggles MQTT connection
          >
            <ThemedText style={styles.buttonText}>
              {/* Button label changes based on connection status */}
              {isConnected ? "Disconnect MQTT" : "Connect to MQTT"}
            </ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </ThemedView>

      {/* Quick Guide Section */}
      <ThemedText type="subtitle" style={styles.sectionTitle}>
        Quick Guide
      </ThemedText>
      <ThemedView card style={styles.guideSection}>
        <ThemedText style={styles.guideText}>
          This is a demo application for the SmartAqua project. It allows you to
          monitor and control your aquarium system remotely.
        </ThemedText>
        <ThemedText style={styles.guideText}>
          To get started, connect to the MQTT broker using the button above or
          via the Settings tab.
        </ThemedText>
        <ThemedText style={styles.guideText}>
          Navigate using the bottom tabs to view the dashboard, fish guide, or
          adjust settings.
        </ThemedText>
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
});
