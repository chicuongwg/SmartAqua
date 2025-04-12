import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
  View,
} from "react-native";
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
  // Remove disconnect from destructuring if not used elsewhere
  const { isConnected, aquariumData, publishMessage, connect } = useMqtt(); // IMPORTANT: Accessing MQTT state and functions

  // --- Add state for graph visibility ---
  const [showGraph, setShowGraph] = useState(true); // Default to true (visible)

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
      // Optionally add an alert for connection attempt
      // Alert.alert("Status", "Attempting to reconnect...");
    } else {
      // Optionally add feedback if already connected
      // Alert.alert("Status", "Already connected.");
    }
  };

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top }]}
      contentContainerStyle={{
        paddingHorizontal: 16, // Match FishPondDashboard container padding
        paddingBottom: tabBarHeight + 32, // Increased bottom padding
      }}
      showsVerticalScrollIndicator={false} // Hide scrollbar for cleaner look
    >
      <ThemedText type="title" style={styles.pageTitle}>
        Dashboard
      </ThemedText>

      {/* WATER PARAMETERS */}
      <ThemedView style={styles.sectionCard}>
        <ThemedView style={styles.sectionHeader}>
          <IconSymbol name="drop" size={20} color="#0a7ea4" />
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Water Parameters
          </ThemedText>
        </ThemedView>

        <ThemedView style={styles.gridContainer}>
          {/* ... DataCard grid ... */}
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

        <TouchableOpacity
          style={styles.refreshButton}
          onPress={refreshConnection}
        >
          <IconSymbol name="arrow.clockwise" size={16} color="#fff" />
          <ThemedText style={styles.buttonText}>Refresh Data</ThemedText>
        </TouchableOpacity>
      </ThemedView>

      {/* FEEDING CONTROLS - Wrapped in a card */}
      <ThemedView style={styles.sectionCard}>
        <ThemedView style={styles.sectionHeader}>
          <IconSymbol name="fish" size={20} color="#0a7ea4" />
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Feeding Controls
          </ThemedText>
        </ThemedView>
        <AutoFeed onFeed={handleFeed} />
      </ThemedView>

      {/* PARAMETER HISTORY (Combined Graph) */}
      <ThemedView style={styles.sectionCard}>
        {/* --- Modified Section Header --- */}
        <View style={styles.graphSectionHeader}>
          <View style={styles.graphHeaderTitle}>
            <IconSymbol
              name="chart.line.uptrend.xyaxis"
              size={20}
              color="#0a7ea4"
            />
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Sensor History
            </ThemedText>
          </View>
          <Switch
            trackColor={{ false: "#767577", true: "#81b0ff" }}
            thumbColor={showGraph ? "#0a7ea4" : "#f4f3f4"}
            ios_backgroundColor="#3e3e3e"
            onValueChange={() =>
              setShowGraph((previousState) => !previousState)
            }
            value={showGraph}
          />
        </View>
        {/* --- Conditionally render DataGraph --- */}
        {showGraph && <DataGraph title="Live Sensor Readings" />}
      </ThemedView>
    </ScrollView>
  );
}

// Base style for buttons, defined outside StyleSheet.create
const buttonBaseStyle = {
  flexDirection: "row" as "row", // Explicitly type flexDirection
  alignItems: "center" as "center",
  justifyContent: "center" as "center",
  paddingVertical: 12,
  borderRadius: 8,
  marginTop: 16,
  gap: 8,
};

// Styles for the component
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: "bold",
    marginVertical: 24,
    textAlign: "center",
  },
  sectionCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(229, 229, 229, 0.5)",
    marginBottom: 20,
    padding: 16,
    backgroundColor: "rgba(0,0,0,0.1)",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(229, 229, 229, 0.3)",
  },
  // --- New styles for graph header ---
  graphSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between", // Push title and switch apart
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(229, 229, 229, 0.3)",
  },
  graphHeaderTitle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10, // Keep gap for icon and title
  },
  // --- End new styles ---
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  gridContainer: {
    // Styles for grid container
  },
  gridRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
    gap: 16,
  },
  gridItem: {
    flex: 1,
  },
  // --- Use the externally defined buttonBaseStyle ---
  refreshButton: {
    ...buttonBaseStyle, // Apply base styles
    backgroundColor: "#0a7ea4",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
