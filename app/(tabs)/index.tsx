import { useRouter } from 'expo-router';
import { useState, useCallback } from 'react';
import { StyleSheet, ActivityIndicator } from 'react-native';
import { useBluetooth } from '../../hooks/useBluetooth';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { TouchableOpacity } from '@/components/TouchableOpacity';

export default function HomeScreen() {
  const router = useRouter();
  const [isScanning, setIsScanning] = useState(false);
  const { connectToDevice, connectedDevice, scanForDevices } = useBluetooth();

  const handleScan = useCallback(async () => {
    setIsScanning(true);
    try {
      const device = await scanForDevices();
      if (device !== null && device !== undefined) {
        await connectToDevice(device);
        router.push('/dashboard');
      }
    } finally {
      setIsScanning(false);
    }
  }, [scanForDevices, connectToDevice, router]);

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Smart Aquarium</ThemedText>
      
      <ThemedView style={styles.statusContainer}>
        <ThemedText type="subtitle">Status</ThemedText>
        <ThemedText>
          {connectedDevice ? `Connected to ${connectedDevice.name}` : 'Not connected'}
        </ThemedText>
      </ThemedView>

      <TouchableOpacity
        style={styles.scanButton}
        onPress={handleScan}
        disabled={isScanning}>
        {isScanning ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <ThemedText style={styles.buttonText}>
            Scan for Devices
          </ThemedText>
        )}
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  statusContainer: {
    alignItems: 'center',
    gap: 8,
  },
  scanButton: {
    backgroundColor: '#0a7ea4',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
