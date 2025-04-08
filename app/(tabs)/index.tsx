import { useRouter } from "expo-router";
import { useState, useCallback } from "react";
import { StyleSheet, ActivityIndicator, ScrollView } from "react-native";
import { useBluetooth } from "../../hooks/useBluetooth";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { TouchableOpacity } from "@/components/TouchableOpacity";
import MqttMonitor from "@/components/MqttMonitor";
import { IconSymbol } from "@/components/ui/IconSymbol";

// Remove unused import
// import { useTaoMqtt } from "@/hooks/useTaoMqtt";
// Remove unused MqttSimulator import
// import MqttSimulator from '@/components/MqttSimulator';

export default function HomeScreen() {
  const router = useRouter();
  const [isScanning, setIsScanning] = useState(false);
  const { connectToDevice, connectedDevice, scanForDevices } = useBluetooth();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();

  const handleScan = useCallback(async () => {
    setIsScanning(true);
    try {
      const device = await scanForDevices();
      if (device !== null && device !== undefined) {
        await connectToDevice(device);
        router.push("/dashboard");
      }
    } finally {
      setIsScanning(false);
    }
  }, [scanForDevices, connectToDevice, router]);

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top }]}
      contentContainerStyle={{
        paddingHorizontal: 20,
        paddingBottom: tabBarHeight + 20,
      }}
    >
      <ThemedText type="title" style={styles.pageTitle}>
        SmartAqua
      </ThemedText>

      <ThemedView style={styles.infoBlock}>
        <ThemedView style={styles.statusSection}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            System Status
          </ThemedText>

          <ThemedView style={styles.statusRow}>
            <ThemedView style={styles.statusItem}>
              <IconSymbol name="water" size={22} color="#0a7ea4" />
              <ThemedText>MQTT: </ThemedText>
              <ThemedView
                style={[styles.statusIndicator, { backgroundColor: "#22c55e" }]}
              />
              <ThemedText>Connected</ThemedText>
            </ThemedView>

            <ThemedView style={styles.statusItem}>
              <IconSymbol name="paperplane.fill" size={22} color="#0a7ea4" />
              <ThemedText>Device: </ThemedText>
              <ThemedView
                style={[
                  styles.statusIndicator,
                  {
                    backgroundColor: connectedDevice ? "#22c55e" : "#dc2626",
                  },
                ]}
              />
              <ThemedText>
                {connectedDevice ? "Connected" : "Disconnected"}
              </ThemedText>
            </ThemedView>
          </ThemedView>

          {connectedDevice && (
            <ThemedView style={styles.deviceInfo}>
              <ThemedText style={styles.deviceName}>
                {connectedDevice.name || "Unknown Device"}
              </ThemedText>
            </ThemedView>
          )}

          <TouchableOpacity
            style={styles.scanButton}
            onPress={handleScan}
            disabled={isScanning}
          >
            {isScanning ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <ThemedText style={styles.buttonText}>
                Scan for Devices
              </ThemedText>
            )}
          </TouchableOpacity>
        </ThemedView>

        <ThemedView style={styles.mqttSection}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            MQTT Sensor Data
          </ThemedText>
          <MqttMonitor
            brokerUrl="wss://broker.hivemq.com:1883/mqtt"
            topic="smart-aqua/data"
            compact={true}
          />
        </ThemedView>
      </ThemedView>

      <ThemedView style={styles.guideSection}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Getting Started
        </ThemedText>
        <ThemedText style={styles.guideText}>
          1. Connect to your Smart Aquarium device using the "Scan for Devices"
          button
        </ThemedText>
        <ThemedText style={styles.guideText}>
          2. Once connected, you'll be taken to the Dashboard to monitor your
          aquarium
        </ThemedText>
        <ThemedText style={styles.guideText}>
          3. Use the Dashboard to monitor water parameters and control your
          aquarium
        </ThemedText>
      </ThemedView>

      <ThemedView style={styles.featuresSection}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Features
        </ThemedText>

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

      <ThemedText style={{ textAlign: "center", marginTop: 24 }}>
        Developed by{" gleammy & dltmai"}
        <br />
        version 1.0.0
      </ThemedText>
    </ScrollView>
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  pageTitle: {
    fontSize: 28,
    marginVertical: 24,
    textAlign: "center",
  },
  infoBlock: {
    marginBottom: 24,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e5e5e5",
  },
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
  deviceInfo: {
    marginTop: 4,
    marginBottom: 16,
    paddingLeft: 30,
  },
  deviceName: {
    fontWeight: "500",
  },
  scanButton: {
    backgroundColor: "#0a7ea4",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
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
});
