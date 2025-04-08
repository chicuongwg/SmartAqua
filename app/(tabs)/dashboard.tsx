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
import { useTaoMqtt } from "@/hooks/useTaoMqtt"; 
import { IconSymbol } from '@/components/ui/IconSymbol';

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
  const mqttClient = useTaoMqtt(
    "mqtt://broker.hivemq.com:1883",
    "", // No default topic
    {
      clientId: `smart-aqua-dash-${Math.random().toString(16).slice(2, 8)}`,
    }
  );

  // In your useEffect, subscribe to the topics when connected
  useEffect(() => {
    if (mqttClient.isConnected) {
      mqttClient.subscribe('smart-aqua/temp');
      mqttClient.subscribe('smart-aqua/ph');
      mqttClient.subscribe('smart-aqua/tds');
      mqttClient.subscribe('smart-aqua/turbidity');
    }
  }, [mqttClient.isConnected]);

  // Update your data processing logic
  useEffect(() => {
    if (mqttClient.messages.length > 0) {
      // Create a new object to hold the latest values
      const newData: AquariumData = {
        temperature: data?.temperature || 0,
        ph: data?.ph || 0,
        tds: data?.tds || 0,
        turbidity: data?.turbidity || 0
      };
      
      // Process only the latest message for each topic
      const latestMessages = mqttClient.messages.slice(-10);
      latestMessages.forEach(msg => {
        const value = parseFloat(msg.message);
        if (!isNaN(value)) {
          if (msg.topic === 'smart-aqua/temp') newData.temperature = value;
          else if (msg.topic === 'smart-aqua/ph') newData.ph = value;
          else if (msg.topic === 'smart-aqua/tds') newData.tds = value;
          else if (msg.topic === 'smart-aqua/turbidity') newData.turbidity = value;
        }
      });
      
      setData(newData);
      console.log("Updated Data:", newData);
    }
  }, [mqttClient.messages]);

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
      style={[styles.container, { paddingTop: insets.top }]}
      contentContainerStyle={{
        paddingHorizontal: 20,
        paddingBottom: tabBarHeight + 20
      }}
    >
      <ThemedText type="title" style={styles.pageTitle}>Dashboard</ThemedText>
      
      {/* Water Parameters Card */}
      <ThemedView style={styles.sectionCard}>
        <ThemedView style={styles.sectionHeader}>
          <IconSymbol name="water" size={22} color="#0a7ea4" />
          <ThemedText type="subtitle" style={styles.sectionTitle}>Water Parameters</ThemedText>
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
        
        <TouchableOpacity style={styles.refreshButton} onPress={refreshData}>
          <ThemedText style={styles.buttonText}>Refresh Data</ThemedText>
        </TouchableOpacity>
      </ThemedView>

      {/* Feeding Controls Card */}
      <ThemedView style={styles.sectionCard}>
        <ThemedView style={styles.sectionHeader}>
          <IconSymbol name="molecule" size={22} color="#0a7ea4" />
          <ThemedText type="subtitle" style={styles.sectionTitle}>Feeding Controls</ThemedText>
        </ThemedView>
        <AutoFeed onFeed={handleFeed} />
      </ThemedView>

      {/* Data Visualization Card */}
      <ThemedView style={styles.sectionCard}>
        <ThemedView style={styles.sectionHeader}>
          <IconSymbol name="chart.line.uptrend.xyaxis" size={22} color="#0a7ea4" />
          <ThemedText type="subtitle" style={styles.sectionTitle}>Parameter History</ThemedText>
        </ThemedView>
        <DataGraph
          title="Temperature Over Time"
          data={data ? [data.temperature] : []}
          labels={["Now"]}
          color="#ff6384"
          unit="°C"
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

// Your existing parseAquariumData function...
function parseAquariumData(rawData: string): AquariumData {
  try {
    console.log("Raw data to parse:", rawData);
    console.log("Raw data type:", typeof rawData);
    
    // Default values
    const defaultData: AquariumData = {
      temperature: 0,
      ph: 0,
      tds: 0,
      turbidity: 0,
    };
    
    // Check if the data is empty or undefined
    if (!rawData) {
      console.log("Empty data received");
      return defaultData;
    }
    
    // Try parsing as JSON first
    try {
      // If it's already a JSON string
      const jsonData = JSON.parse(rawData);
      console.log("Successfully parsed as JSON:", jsonData);
      
      return {
        temperature: parseFloat(jsonData.Temp || jsonData.temperature || '0'),
        ph: parseFloat(jsonData.pH || jsonData.ph || '0'),
        tds: parseFloat(jsonData.TDS || jsonData.tds || '0'),
        turbidity: parseFloat(jsonData.Turbidity || jsonData.turbidity || '0')
      };
    } catch (jsonError) {
      // Not JSON, continue with string parsing
      console.log("Not valid JSON, trying string parsing");
    }
    
    // If it's a comma-separated string format
    if (typeof rawData === 'string' && rawData.includes(',')) {
      const pairs = rawData.split(",");
      const data = {...defaultData};
      
      pairs.forEach((pair) => {
        const [key, value] = pair.split(":");
        
        if (!key || !value) return;
        
        const cleanedValue = value.trim().replace(/[^\d.-]/g, "");
        
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
      
      return data;
    }
    
    // If it's a colon-separated string or other format
    console.log("Unknown data format, returning default values");
    return defaultData;
    
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
  pageTitle: {
    fontSize: 28,
    marginVertical: 24,
    textAlign: 'center',
  },
  sectionCard: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e5e5e5',
    marginBottom: 24,
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0)',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    marginBottom: 0, // Override default margin
  },
  gridContainer: {
    marginBottom: 16,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  gridItem: {
    width: '48%',
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
