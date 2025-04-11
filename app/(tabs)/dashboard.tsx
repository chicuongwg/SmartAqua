import React, { useEffect, useState } from "react";
import { StyleSheet, ScrollView, TouchableOpacity, Alert } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { DataCard } from "@/components/DataCard";
import { DataGraph } from "@/components/DataGraph";
import AutoFeed from "@/components/AutoFeed";
import { IconSymbol } from "@/components/ui/IconSymbol";

// Import MQTT context
import { useMqtt } from "@/context/MqttContext";

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();

  // Use shared MQTT context
  const { isConnected, aquariumData, publishMessage, connect, disconnect } =
    useMqtt();

  const handleDisconnect = () => {
    disconnect();
    router.replace("/");
  };

  const handleFeed = async () => {
    if (!isConnected) {
      Alert.alert("Error", "MQTT not connected");
      return;
    }

    try {
      publishMessage("esp32/sensor/command", "FEED");
      Alert.alert("Success", "Feed command sent");
    } catch (error) {
      console.error("❌ Failed to send feed command:", error);
      Alert.alert("Error", "Failed to send feed command");
    }
  };

  const refreshConnection = () => {
    // Reconnect MQTT if it's not connected
    if (!isConnected) {
      connect();
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
                value={aquariumData.temperature}
                unit="°C"
                icon="thermometer"
              />
            </ThemedView>

            <ThemedView style={styles.gridItem}>
              <DataCard
                title="pH"
                value={aquariumData.ph}
                unit=""
                icon="drop.fill"
              />
            </ThemedView>
          </ThemedView>

          <ThemedView style={styles.gridRow}>
            <ThemedView style={styles.gridItem}>
              <DataCard
                title="TDS"
                value={aquariumData.tds}
                unit="ppm"
                icon="molecule"
              />
            </ThemedView>

            <ThemedView style={styles.gridItem}>
              <DataCard
                title="Turbidity"
                value={aquariumData.turbidity}
                unit="NTU"
                icon="eyedropper"
              />
            </ThemedView>
          </ThemedView>
        </ThemedView>

        <TouchableOpacity
          style={styles.refreshButton}
          onPress={refreshConnection}
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
          data={aquariumData ? [aquariumData.temperature] : []}
          labels={["Now"]}
          color="#ff6384"
          unit="°C"
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
