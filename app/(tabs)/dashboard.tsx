import { useEffect, useState } from "react";
import { StyleSheet, ScrollView, Alert } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { TouchableOpacity } from "react-native";
import { DataCard } from "@/components/DataCard";
import { DataGraph } from "@/components/DataGraph";
import AutoFeed from "@/components/AutoFeed";
import { useTaoMqtt } from "@/hooks/useTaoMqtt";
import { IconSymbol } from "@/components/ui/IconSymbol";
import MqttConfigPanel from "@/components/MqttConfigPanel";
import MqttDebugPanel from "@/components/MqttDebugPanel";

type AquariumData = {
  temperature: number;
  ph: number;
  tds: number;
  turbidity: number;
};

export default function DashboardScreen() {
  const [data, setData] = useState<AquariumData | null>(null);

  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();

  // MQTT hook for data
  const mqttClient = useTaoMqtt("mqtt://broker.hivemq.com:1883", "", {
    clientId: `smart-aqua-dash-${Math.random().toString(16).slice(2, 8)}`,
  });

  // Subscribe to topics when connected
  useEffect(() => {
    if (mqttClient.isConnected) {
      mqttClient.subscribe("smart-aqua/temp");
      mqttClient.subscribe("smart-aqua/ph");
      mqttClient.subscribe("smart-aqua/tds");
      mqttClient.subscribe("smart-aqua/turbidity");
    }
  }, [mqttClient.isConnected]);

  // Process MQTT messages
  useEffect(() => {
    if (mqttClient.messages.length > 0) {
      const newData: AquariumData = {
        temperature: data?.temperature || 0,
        ph: data?.ph || 0,
        tds: data?.tds || 0,
        turbidity: data?.turbidity || 0,
      };

      const latestMessages = mqttClient.messages.slice(-10);
      latestMessages.forEach((msg) => {
        try {
          // Try to parse as JSON first
          const jsonData = JSON.parse(msg.message);

          // Handle JSON format - adjust these properties based on your ESP32's JSON structure
          if (msg.topic === "smart-aqua/temp" && jsonData.value !== undefined) {
            newData.temperature = parseFloat(jsonData.value);
          } else if (
            msg.topic === "smart-aqua/ph" &&
            jsonData.value !== undefined
          ) {
            newData.ph = parseFloat(jsonData.value);
          } else if (
            msg.topic === "smart-aqua/tds" &&
            jsonData.value !== undefined
          ) {
            newData.tds = parseFloat(jsonData.value);
          } else if (
            msg.topic === "smart-aqua/turbidity" &&
            jsonData.value !== undefined
          ) {
            newData.turbidity = parseFloat(jsonData.value);
          }
        } catch (e) {
          // Fallback to plain string parsing if JSON fails
          const value = parseFloat(msg.message);
          if (!isNaN(value)) {
            if (msg.topic === "smart-aqua/temp") newData.temperature = value;
            else if (msg.topic === "smart-aqua/ph") newData.ph = value;
            else if (msg.topic === "smart-aqua/tds") newData.tds = value;
            else if (msg.topic === "smart-aqua/turbidity")
              newData.turbidity = value;
          }
        }
      });

      setData(newData);
    }
  }, [mqttClient.messages]);

  const refreshData = () => {
    // Force reconnect MQTT if needed
    if (!mqttClient.isConnected) {
      mqttClient.connect();
    }
  };

  const handleDisconnect = () => {
    router.replace("/");
  };

  // Replace Bluetooth feeding with MQTT command
  const handleFeed = async () => {
    try {
      if (mqttClient.isConnected) {
        mqttClient.publish("smart-aqua/commands/feed", "FEED");
        Alert.alert("Success", "Feed command sent via MQTT");
      } else {
        Alert.alert("Error", "MQTT not connected");
      }
    } catch (error) {
      console.error("Failed to send feed command:", error);
      Alert.alert("Error", "Failed to send feed command");
    }
  };

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top }]}
      contentContainerStyle={{
        paddingHorizontal: 20,
        paddingBottom: tabBarHeight + 20,
      }}
    >
      <ThemedText type="title" style={styles.pageTitle}>
        Dashboard
      </ThemedText>

      <ThemedView style={styles.sectionCard}>
        <ThemedView style={styles.sectionHeader}>
          <IconSymbol name="water" size={22} color="#0a7ea4" />
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Water Parameters
          </ThemedText>
        </ThemedView>

        <ThemedView style={styles.gridContainer}>
          <ThemedView style={styles.gridRow}>
            <ThemedView style={styles.gridItem}>
              <DataCard
                title="Temperature"
                value={data?.temperature}
                unit="°C"
                icon="thermometer"
              />
            </ThemedView>
            <ThemedView style={styles.gridItem}>
              <DataCard
                title="pH Level"
                value={data?.ph || 0}
                unit="pH"
                icon="water"
              />
            </ThemedView>
          </ThemedView>

          <ThemedView style={styles.gridRow}>
            <ThemedView style={styles.gridItem}>
              <DataCard
                title="TDS"
                value={data?.tds}
                unit="ppm"
                icon="molecule"
              />
            </ThemedView>
            <ThemedView style={styles.gridItem}>
              <DataCard
                title="Turbidity"
                value={data?.turbidity}
                unit="NTU"
                icon="eyedropper"
              />
            </ThemedView>
          </ThemedView>
        </ThemedView>

        <TouchableOpacity style={styles.refreshButton} onPress={refreshData}>
          <ThemedText style={styles.buttonText}>Refresh Data</ThemedText>
        </TouchableOpacity>
      </ThemedView>

      <ThemedView style={styles.sectionCard}>
        <ThemedView style={styles.sectionHeader}>
          <IconSymbol
            name="chart.line.uptrend.xyaxis"
            size={22}
            color="#0a7ea4"
          />
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Feeding Controls
          </ThemedText>
        </ThemedView>

        <AutoFeed onFeed={handleFeed} />
      </ThemedView>

      <ThemedView style={styles.sectionCard}>
        <ThemedView style={styles.sectionHeader}>
          <IconSymbol
            name="chart.line.uptrend.xyaxis"
            size={22}
            color="#0a7ea4"
          />
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Parameter History
          </ThemedText>
        </ThemedView>
        <DataGraph
          title="Temperature Over Time"
          data={data ? [data.temperature] : []}
          labels={["Now"]}
          color="#ff6384"
          unit="°C"
        />
      </ThemedView>

      <ThemedView style={styles.sectionCard}>
        <ThemedView style={styles.sectionHeader}>
          <IconSymbol name="paperplane.fill" size={22} color="#0a7ea4" />
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            MQTT Configuration
          </ThemedText>
        </ThemedView>
        <MqttConfigPanel mqttClient={mqttClient} />
      </ThemedView>

      <ThemedView style={styles.sectionCard}>
        <ThemedView style={styles.sectionHeader}>
          <IconSymbol name="paperplane.fill" size={22} color="#0a7ea4" />
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            MQTT Debug
          </ThemedText>
        </ThemedView>
        <MqttDebugPanel
          mqttClient={{
            ...mqttClient,
            error: mqttClient.error
              ? { message: mqttClient.error.message }
              : undefined,
          }}
        />
      </ThemedView>

      <TouchableOpacity
        style={styles.disconnectButton}
        onPress={handleDisconnect}
      >
        <ThemedText style={styles.buttonText}>Disconnect</ThemedText>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
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
  gridContainer: {
    marginBottom: 16,
  },
  gridRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  gridItem: {
    width: "48%",
  },
  refreshButton: {
    backgroundColor: "#0a7ea4",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  disconnectButton: {
    backgroundColor: "#dc2626",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
