
import { useEffect, useState } from 'react';
import { StyleSheet, ScrollView } from 'react-native';
import { router } from 'expo-router';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { TouchableOpacity } from 'react-native';
import { useBluetooth } from '@/hooks/useBluetooth';
import { DataCard } from '@/components/DataCard';
import { DataGraph } from '@/components/DataGraph';
import AutoFeed from '@/components/AutoFeed';
import { useMqtt } from "@/hooks/useMqtt"; // Import hook useMqtt

type AquariumData = {
  temperature: number;
  ph: number;
  tds: number;
  turbidity: number;
};

export default function DashboardScreen() {
  const [data, setData] = useState<AquariumData | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);


  // Sử dụng useMqtt hook để lấy dữ liệu từ broker MQTT
  const rawData = useMqtt(
    "wss://82af56b3a17f48efa9c5e0877cb7ae5a.s1.eu.hivemq.cloud:8884/mqtt", // Sử dụng WebSocket MQTT
    "esp32/sensor/data"
  );

  // Phân tích dữ liệu nhận được từ MQTT
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
      // Nếu cần thiết, bạn có thể lấy lại dữ liệu từ MQTT tại đây
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleDisconnect = async () => {
    router.replace("/"); // Điều hướng về trang chính khi ngắt kết nối
  };
  
  const handleFeed = async () => {
    // Send the FEED command to the ESP32, which will rotate the motor 180 degrees
    await sendCommand('FEED');
  };

  return (
    <ScrollView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">Dashboard</ThemedText>
        <TouchableOpacity style={styles.refreshButton} onPress={refreshData}>
          <ThemedText style={styles.buttonText}>Refresh</ThemedText>
        </TouchableOpacity>
      </ThemedView>

      <ThemedView style={styles.grid}>
        <DataCard
          title="Temperature"
          value={data?.temperature}
          unit="°C"
          icon="thermometer"
        />
        <DataCard
          title="pH Level"
          value={data?.ph || 0} // Đảm bảo pH mặc định là 0
          unit="pH"
          icon="water"
        />
        <DataCard title="TDS" value={data?.tds} unit="ppm" icon="molecule" />
        <DataCard
          title="Turbidity"
          value={data?.turbidity}
          unit="NTU"
          icon="eyedropper"
        />
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

// Hàm phân tích dữ liệu từ MQTT thành đối tượng AquariumData
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
  grid: {
    padding: 16,
    gap: 16,
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
