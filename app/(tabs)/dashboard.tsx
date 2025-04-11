import React, { useEffect, useState } from "react";
import { StyleSheet, ScrollView, TouchableOpacity, Alert } from "react-native";
import { router } from "expo-router"; // Navigation
import { useSafeAreaInsets } from "react-native-safe-area-context"; // Safe area
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs"; // Tab bar height
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { DataCard } from "@/components/DataCard";
import { DataGraph } from "@/components/DataGraph"; // ALERT: Graph currently shows only the latest value.
import AutoFeed from "@/components/AutoFeed";
import { IconSymbol } from "@/components/ui/IconSymbol";

// Import MQTT context
import { useMqtt } from "@/context/MqttContext"; // IMPORTANT: Using global MQTT context

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();

  // Use shared MQTT context
  const { isConnected, aquariumData, publishMessage, connect, disconnect } =
    useMqtt(); // IMPORTANT: Accessing MQTT state and functions

  // Handler to disconnect MQTT and navigate to home
  const handleDisconnect = () => {
    disconnect(); // Disconnect via context
    router.replace("/"); // IMPORTANT: Navigates away after disconnect
  };

  // Handler to send FEED command via MQTT
  const handleFeed = async () => {
    if (!isConnected) {
      Alert.alert("Error", "MQTT not connected"); // Check connection before publishing
      return;
    }

    try {
      publishMessage("esp32/sensor/command", "FEED"); // IMPORTANT: Publishing MQTT message
      Alert.alert("Success", "Feed command sent");
    } catch (error) {
      console.error("❌ Failed to send feed command:", error);
      Alert.alert("Error", "Failed to send feed command");
    }
  };

  // Handler to attempt MQTT connection if disconnected
  const refreshConnection = () => {
    // Reconnect MQTT if it's not connected
    if (!isConnected) {
      connect(); // Connect via context
    }
    // ALERT: Consider adding feedback (e.g., Alert) if already connected or connection attempt fails.
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

        {/* Displaying data from MQTT context */}
        <ThemedView style={styles.gridContainer}>
          <ThemedView style={styles.gridRow}>
            <ThemedView style={styles.gridItem}>
              <DataCard
                title="Temperature"
                value={aquariumData.temperature} // IMPORTANT: Displaying MQTT data
                unit="°C"
                icon="thermometer"
              />
            </ThemedView>

            <ThemedView style={styles.gridItem}>
              <DataCard
                title="pH"
                value={aquariumData.ph} // IMPORTANT: Displaying MQTT data
                unit=""
                icon="drop.fill"
              />
            </ThemedView>
          </ThemedView>

          <ThemedView style={styles.gridRow}>
            <ThemedView style={styles.gridItem}>
              <DataCard
                title="TDS"
                value={aquariumData.tds} // IMPORTANT: Displaying MQTT data
                unit="ppm"
                icon="molecule"
              />
            </ThemedView>

            <ThemedView style={styles.gridItem}>
              <DataCard
                title="Turbidity"
                value={aquariumData.turbidity} // IMPORTANT: Displaying MQTT data
                unit="NTU"
                icon="eyedropper"
              />
            </ThemedView>
          </ThemedView>
        </ThemedView>

        {/* Button to refresh MQTT connection */}
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={refreshConnection} // IMPORTANT: Attempts MQTT connection
        >
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
        <AutoFeed onFeed={handleFeed} />{" "}
        {/* IMPORTANT: Triggers MQTT FEED command */}
      </ThemedView>

      {/* PARAMETER HISTORY */}
      <ThemedView style={styles.sectionCard}>
        <ThemedView style={styles.sectionHeader}>
          <IconSymbol name="chart.bar.fill" size={22} color="#0a7ea4" />
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Parameter History
          </ThemedText>
        </ThemedView>
        {/* ALERT: DataGraph currently only shows the single latest temperature value. Needs historical data source. */}
        <DataGraph
          title="Temperature Over Time"
          data={aquariumData ? [aquariumData.temperature] : []}
          labels={["Now"]}
          color="#ff6384"
          unit="°C"
        />
      </ThemedView>

      {/* DISCONNECT */}
      <TouchableOpacity
        style={styles.disconnectButton}
        onPress={handleDisconnect} // IMPORTANT: Disconnects MQTT and navigates away
      >
        <ThemedText style={styles.buttonText}>Disconnect</ThemedText>
      </TouchableOpacity>
    </ScrollView>
  );
}

// Styles for the component (remain unchanged)
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
