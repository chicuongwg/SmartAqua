import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useTaoMqtt } from "@/hooks/useTaoMqtt";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { TouchableOpacity } from "@/components/TouchableOpacity";
import MqttMonitor from "@/components/MqttMonitor";
import { IconSymbol } from "@/components/ui/IconSymbol";
import ScreenContainer from "@/components/ScreenContainer";
import Layout from "@/constants/Layout";

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();

  // Use MQTT directly instead of Bluetooth
  const mqttClient = useTaoMqtt("mqtt://broker.hivemq.com:1883", "", {
    clientId: `smart-aqua-home-${Math.random().toString(16).slice(2, 8)}`,
  });

  const handleGoToDashboard = () => {
    router.push("/dashboard");
  };

  return (
    <ScreenContainer>
      <ThemedText type="title" style={styles.pageTitle}>
        SmartAqua
      </ThemedText>

      <ThemedView card style={styles.infoBlock}>
        <ThemedView style={styles.statusSection}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            System Status
          </ThemedText>

          <ThemedView style={styles.statusRow}>
            <ThemedView style={styles.statusItem}>
              <IconSymbol name="paperplane.fill" size={22} color="#0a7ea4" />
              <ThemedText>MQTT: </ThemedText>
              <ThemedView
                style={[
                  styles.statusIndicator,
                  {
                    backgroundColor: mqttClient.isConnected
                      ? "#22c55e"
                      : "#dc2626",
                  },
                ]}
              />
              <ThemedText>
                {mqttClient.isConnected ? "Connected" : "Disconnected"}
              </ThemedText>
            </ThemedView>
          </ThemedView>

          <TouchableOpacity
            style={styles.connectButton}
            onPress={() =>
              mqttClient.isConnected
                ? mqttClient.disconnect()
                : mqttClient.connect()
            }
          >
            <ThemedText style={styles.buttonText}>
              {mqttClient.isConnected ? "Disconnect MQTT" : "Connect to MQTT"}
            </ThemedText>
          </TouchableOpacity>
        </ThemedView>

        <ThemedView style={styles.mqttSection}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            MQTT Sensor Data
          </ThemedText>
          <MqttMonitor
            brokerUrl="mqtt://broker.hivemq.com:1883"
            topic="smart-aqua/#"
            compact={true}
          />
        </ThemedView>
      </ThemedView>

      <ThemedView style={styles.guideSection}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Getting Started
        </ThemedText>
        <ThemedText style={styles.guideText}>
          1. Connect to the MQTT broker using the "Connect to MQTT" button
        </ThemedText>
        <ThemedText style={styles.guideText}>
          2. View live sensor data from your aquarium in the MQTT monitor
        </ThemedText>
        <ThemedText style={styles.guideText}>
          3. Go to Dashboard to control your aquarium and view detailed stats
        </ThemedText>
      </ThemedView>

      <ThemedView style={styles.featuresSection}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Features
        </ThemedText>

        {/* Feature items remain unchanged */}
        <ThemedView style={styles.featureItem}>
          <IconSymbol
            name="chart.line.uptrend.xyaxis"
            size={24}
            color="#0a7ea4"
          />
          <ThemedView style={styles.featureTextContainer}>
            <ThemedText style={styles.featureTitle}>
              Real-time Monitoring
            </ThemedText>
            <ThemedText style={styles.featureDescription}>
              Track temperature, pH, TDS and turbidity in real-time
            </ThemedText>
          </ThemedView>
        </ThemedView>

        <ThemedView style={styles.featureItem}>
          <IconSymbol name="molecule" size={24} color="#0a7ea4" />
          <ThemedView style={styles.featureTextContainer}>
            <ThemedText style={styles.featureTitle}>
              Automated Feeding
            </ThemedText>
            <ThemedText style={styles.featureDescription}>
              Set up scheduled feeding times for your fish
            </ThemedText>
          </ThemedView>
        </ThemedView>

        <ThemedView style={styles.featureItem}>
          <IconSymbol name="eyedropper" size={24} color="#0a7ea4" />
          <ThemedView style={styles.featureTextContainer}>
            <ThemedText style={styles.featureTitle}>
              Parameter Alerts
            </ThemedText>
            <ThemedText style={styles.featureDescription}>
              Get notified when water parameters go out of safe ranges
            </ThemedText>
          </ThemedView>
        </ThemedView>
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
});
