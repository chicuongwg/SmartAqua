import { useRouter } from "expo-router";
import { StyleSheet, ScrollView, Alert, useColorScheme } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useTaoMqtt } from "@/hooks/useTaoMqtt";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { TouchableOpacity } from "@/components/TouchableOpacity";
import { IconSymbol } from "@/components/ui/IconSymbol";
import ScreenContainer from "@/components/ScreenContainer";
import Layout from "@/constants/Layout";
import { useMqtt } from "@/context/MqttContext";

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const colorScheme = useColorScheme();

  // Use MQTT directly instead of Bluetooth
  const mqttClient = useTaoMqtt("mqtt://broker.hivemq.com:1883", "", {
    clientId: `smart-aqua-home-${Math.random().toString(16).slice(2, 8)}`,
  });

  // Sử dụng MQTT context
  const { isConnected, connect, disconnect, aquariumData } = useMqtt();

  // Hiển thị thông tin kết nối
  const toggleConnection = () => {
    if (isConnected) {
      disconnect();
      Alert.alert("MQTT", "Disconnected from MQTT broker");
    } else {
      connect();
      Alert.alert("MQTT", "Connecting to MQTT broker...");
    }
  };

  return (
    <ScreenContainer>
      <ThemedText type="largeTitle" style={styles.title}>
        SmartAqua
      </ThemedText>
      <ThemedText type="subtitle" style={styles.subtitle}>
        Your Intelligent Aquarium Control Center
      </ThemedText>

      <ThemedView card style={styles.infoBlock}>
        <ThemedView style={styles.statusSection}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            System Status
          </ThemedText>

          <ThemedView style={styles.statusRow}>
            <ThemedView style={styles.statusItem}>
              <IconSymbol
                name={isConnected ? "wifi" : "wifi.slash"}
                size={24}
                color={isConnected ? "#16a34a" : "#dc2626"}
              />
              <ThemedView style={styles.statusTextContainer}>
                <ThemedText>MQTT Connection</ThemedText>
                <ThemedText
                  style={[
                    styles.statusValue,
                    {
                      color: isConnected ? "#16a34a" : "#dc2626",
                    },
                  ]}
                >
                  {isConnected ? "Connected" : "Disconnected"}
                </ThemedText>
              </ThemedView>
            </ThemedView>
          </ThemedView>

          <TouchableOpacity
            style={styles.connectButton}
            onPress={toggleConnection}
          >
            <ThemedText style={styles.buttonText}>
              {isConnected ? "Disconnect MQTT" : "Connect to MQTT"}
            </ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </ThemedView>

      <ThemedText type="subtitle" style={styles.sectionTitle}>
        Quick Guide
      </ThemedText>

      <ThemedView card style={styles.guideSection}>
        <ThemedText style={styles.guideText}>
          This is a demo application for the SmartAqua project. It allows you to
          monitor and control your aquarium system remotely.
        </ThemedText>
        <ThemedText style={styles.guideText}>
          To get started, connect to the MQTT broker and subscribe to the
          relevant topics.
        </ThemedText>
        <ThemedText style={styles.guideText}>
          You can also control the feeding schedule and monitor the water
          parameters.
        </ThemedText>
      </ThemedView>

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

// Styles
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
