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

const MQTT_URL = "mqtt://broker.hivemq.com:1883"; // ⚠️ thay đổi nếu cần
const MQTT_USERNAME = ""; // optional
const MQTT_PASSWORD = ""; // optional

export default function DashboardScreen() {
  const [data, setData] = useState<AquariumData | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<any>(null);

  const { clientRef, isConnected, messages, error } = useTaoMqtt(
    MQTT_URL,
    MQTT_USERNAME,
    {
      password: MQTT_PASSWORD,
    }
  );

  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();

  useEffect(() => {
    const client = clientRef.current;
    if (!client) {
      console.log("❌ MQTT client is null");
      return;
    }

    const handleConnect = () => {
      console.log("✅ MQTT Connected");
      setConnected(true);
      client.subscribe("esp32/sensor/data");
      console.log("📡 Subscribed to topic: esp32/sensor/data");
    };

    const handleMessage = (topic: string, message: Buffer) => {
      if (topic === "esp32/sensor/data") {
        try {
          const jsonData = JSON.parse(message.toString());
          setData({
            temperature: jsonData.temperature,
            ph: jsonData.ph,
            tds: jsonData.tds,
            turbidity: jsonData.turbidity,
          });
          console.log("✅ Received data:", jsonData);
        } catch (err) {
          console.error("❌ Failed to parse JSON:", err);
          console.log("Raw message:", message.toString());
        }
      }
    };

    const handleError = (err: any) => {
      console.error("❌ MQTT Error:", err);
      setError(err);
    };

    client.on("connect", handleConnect);
    client.on("message", handleMessage);
    client.on("error", handleError);

    return () => {
      client.off("connect", handleConnect);
      client.off("message", handleMessage);
      client.off("error", handleError);
    };
  }, [clientRef]);

  const refreshData = () => {
    const client = clientRef.current;
    if (!connected && client) {
      client.reconnect();
    }
  };

  const handleDisconnect = () => {
    const client = clientRef.current;
    if (client) {
      client.end();
    }
    router.replace("/");
  };

  const handleFeed = async () => {
    const client = clientRef.current;
    try {
      if (connected && client) {
        client.publish("esp32/sensor/command", "FEED");
        Alert.alert("Success", "Feed command sent via MQTT");
      } else {
        Alert.alert("Error", "MQTT not connected");
      }
    } catch (error) {
      console.error("❌ Failed to send feed command:", error);
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

      {/* WATER PARAMETERS */}
      <ThemedView style={styles.sectionCard}>
        <ThemedView style={styles.sectionHeader}>
          <IconSymbol name="drop" size={22} color="#0a7ea4" />
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
                value={data?.ph}
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

      {/* FEEDING CONTROLS */}
      <ThemedView style={styles.sectionCard}>
        <ThemedView style={styles.sectionHeader}>
          <IconSymbol name="bolt.fill" size={22} color="#0a7ea4" />
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Feeding Controls
          </ThemedText>
        </ThemedView>

        <AutoFeed onFeed={handleFeed} />
      </ThemedView>

      {/* PARAMETER HISTORY */}
      <ThemedView style={styles.sectionCard}>
        <ThemedView style={styles.sectionHeader}>
          <IconSymbol name="chart.bar.fill" size={22} color="#0a7ea4" />
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

      {/* MQTT CONFIG */}
      <ThemedView style={styles.sectionCard}>
        <ThemedView style={styles.sectionHeader}>
          <IconSymbol name="paperplane.fill" size={22} color="#0a7ea4" />
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            MQTT Configuration
          </ThemedText>
        </ThemedView>
        {clientRef.current && (
          <MqttConfigPanel mqttClient={clientRef.current} />
        )}
      </ThemedView>

      {/* MQTT DEBUG */}
      <ThemedView style={styles.sectionCard}>
        <ThemedView style={styles.sectionHeader}>
          <IconSymbol name="ant.circle.fill" size={22} color="#0a7ea4" />
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            MQTT Debug
          </ThemedText>
        </ThemedView>
        <MqttDebugPanel
          mqttClient={{
            ...clientRef.current,
            error: error ? { message: error.message } : undefined,
          }}
        />
      </ThemedView>

      {/* DISCONNECT */}
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
