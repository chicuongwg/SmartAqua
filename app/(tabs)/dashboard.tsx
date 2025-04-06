import { useEffect, useState } from 'react';
import { StyleSheet, ScrollView } from 'react-native';
import { router } from 'expo-router';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { TouchableOpacity } from 'react-native';
import { useBluetooth } from '@/hooks/useBluetooth';
import { DataCard } from '@/components/DataCard';
import { DataGraph } from '@/components/DataGraph';

type AquariumData = {
  temperature: number;
  ph: number;
  tds: number;
  turbidity: number;
};

export default function DashboardScreen() {
  const [data, setData] = useState<AquariumData | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { readData, disconnect } = useBluetooth();

  const refreshData = async () => {
    setIsRefreshing(true);
    try {
      const rawData = await readData();
      if (rawData) {
        const parsed = parseAquariumData(rawData);
        setData(parsed);
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleDisconnect = async () => {
    await disconnect();
    router.replace('/');
  };

  useEffect(() => {
    refreshData();
    // Set up periodic refresh every 30 seconds
    const interval = setInterval(refreshData, 30000);
    return () => clearInterval(interval);
  }, []);

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
          value={data?.ph}
          unit="pH"
          icon="water"
        />
        <DataCard
          title="TDS"
          value={data?.tds}
          unit="ppm"
          icon="molecule"
        />
        <DataCard
          title="Turbidity"
          value={data?.turbidity}
          unit="NTU"
          icon="eyedropper"
        />
      </ThemedView>

      <DataGraph
        title="Temperature Over Time"
        data={data ? [data.temperature] : []}
        labels={['Now']}
        color="#ff6384"
        unit="°C"
      />

      <TouchableOpacity
        style={styles.disconnectButton}
        onPress={handleDisconnect}>
        <ThemedText style={styles.buttonText}>Disconnect</ThemedText>
      </TouchableOpacity>
    </ScrollView>
  );
}

function parseAquariumData(rawData: string): AquariumData {
  try {
    const pairs = rawData.split(';');
    const data: Partial<AquariumData> = {
      temperature: 0,
      ph: 0,
      tds: 0,
      turbidity: 0
    };

    pairs.forEach(pair => {
      const [key, value] = pair.split(':');
      if (!key || !value) return;
      
      switch (key) {
        case 'TEMP':
          data.temperature = parseFloat(value);
          break;
        case 'PH':
          data.ph = parseFloat(value);
          break;
        case 'TDS':
          data.tds = parseInt(value, 10);
          break;
        case 'TURB':
          data.turbidity = parseInt(value, 10);
          break;
      }
    });

    return data as AquariumData;
  } catch (error) {
    console.error('Failed to parse aquarium data:', error);
    return {
      temperature: 0,
      ph: 0,
      tds: 0,
      turbidity: 0
    };
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  grid: {
    padding: 16,
    gap: 16,
  },
  refreshButton: {
    backgroundColor: '#0a7ea4',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  disconnectButton: {
    backgroundColor: '#dc2626',
    margin: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});