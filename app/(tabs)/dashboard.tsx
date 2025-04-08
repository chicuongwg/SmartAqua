import { useEffect, useState } from 'react';
import { StyleSheet, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { TouchableOpacity } from 'react-native';
import { useBluetooth } from '@/hooks/useBluetooth';
import { DataCard } from '@/components/DataCard';
import { DataGraph } from '@/components/DataGraph';
import AutoFeed from '@/components/AutoFeed';
import { useMqtt } from "@/hooks/useMqtt"; 
import MqttMonitor from '@/components/MqttMonitor';

type AquariumData = {
  temperature: number;
  ph: number;
  tds: number;
  turbidity: number;
};

export default function DashboardScreen() {
  const [data, setData] = useState<AquariumData | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();

  // MQTT hook for data
  const rawData = useMqtt(
    "wss://82af56b3a17f48efa9c5e0877cb7ae5a.s1.eu.hivemq.cloud:8884/mqtt",
    "esp32/sensor/data"
  );

  // Parse received MQTT data
  useEffect(() => {
    if (rawData) {
      const parsed = parseAquariumData(rawData);
      setData(parsed);
      console.log("Parsed Data:", parsed);
    }
  }, [rawData]);

  const { readData, disconnect, sendCommand } = useBluetooth();

  const refreshData = async () => {
    setIsRefreshing(true);
    try {
      // If needed, you can refresh data from MQTT here
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleDisconnect = async () => {
    router.replace("/");
  };
  
  const handleFeed = async () => {
    await sendCommand('FEED');
  };

  return (
    <ScrollView 
      style={[styles.container, { paddingTop: insets.top }]} // Add top inset padding
      contentContainerStyle={{
        paddingBottom: tabBarHeight + 20 // Add padding for tab bar plus some extra space
      }}
    >
      <ThemedView style={styles.header}>
        <ThemedText type="title">Dashboard</ThemedText>
        <TouchableOpacity style={styles.refreshButton} onPress={refreshData}>
          <ThemedText style={styles.buttonText}>Refresh</ThemedText>
        </TouchableOpacity>
      </ThemedView>

      {/* MQTT Monitor - Moved to the top after header */}
      <ThemedView style={styles.mqttSection}>
        <MqttMonitor 
          brokerUrl="wss://82af56b3a17f48efa9c5e0877cb7ae5a.s1.eu.hivemq.cloud:8884/mqtt"
          topic="esp32/sensor/data"
          username="dltmai" 
          password="Dltmai1410"
        />
      </ThemedView>

      <ThemedView style={styles.gridContainer}>
        {/* First Row: Temperature and pH */}
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
        
        {/* Second Row: TDS and Turbidity */}
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

      <AutoFeed onFeed={handleFeed} />

      <DataGraph
        title="Temperature Over Time"
        data={data ? [data.temperature] : []}
        labels={["Now"]}
        color="#ff6384"
        unit="°C"
      />

      <TouchableOpacity
        style={styles.disconnectButton}
        onPress={handleDisconnect}
      >
        <ThemedText style={styles.buttonText}>Disconnect</ThemedText>
      </TouchableOpacity>
    </ScrollView>
  );
}

// Your existing parseAquariumData function...
function parseAquariumData(rawData: string): AquariumData {
  try {
    const pairs = rawData.split(","); // Tách chuỗi dữ liệu thành từng cặp key:value
    const data: Partial<AquariumData> = {
      temperature: 0,
      ph: 0,
      tds: 0,
      turbidity: 0,
    };

    pairs.forEach((pair) => {
      const [key, value] = pair.split(":"); // Tách key và value

      if (!key || !value) return;

      const cleanedValue = value.trim().replace(/[^\d.-]/g, ""); // Loại bỏ tất cả ký tự không phải là số hoặc dấu phân cách thập phân (C, ppm, %, ...)

      switch (key.trim()) {
        case "Temp":
          data.temperature = parseFloat(cleanedValue);
          break;
        case "TDS":
          data.tds = parseFloat(cleanedValue);
          break;
        case "Turbidity":
          data.turbidity = parseFloat(cleanedValue);
          break;
        case "pH":
          data.ph = parseFloat(cleanedValue);
          break;
        default:
          break;
      }
    });

    return data as AquariumData; // Trả về dữ liệu đã được phân tích
  } catch (error) {
    console.error("Failed to parse aquarium data:", error);
    return {
      temperature: 0,
      ph: 0,
      tds: 0,
      turbidity: 0,
    };
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
  },
  mqttSection: {
    marginHorizontal: 10,
    marginBottom: 20,  // Add space below MQTT section
  },
  gridContainer: {
    padding: 16,
    marginTop: 10,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16, // Space between rows
  },
  gridItem: {
    width: '48%', // Slightly less than 50% to account for spacing
  },
  refreshButton: {
    backgroundColor: "#0a7ea4",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  disconnectButton: {
    backgroundColor: "#dc2626",
    margin: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
