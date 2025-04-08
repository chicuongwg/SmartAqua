import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, ScrollView, Switch } from 'react-native';
import { useTaoMqtt } from '@/hooks/useTaoMqtt';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { TouchableOpacity } from 'react-native';
import { DataCard } from '@/components/DataCard';
import { IconSymbol } from '@/components/ui/IconSymbol';

const TOPICS = {
  temperature: 'smart-aqua/temp',
  ph: 'smart-aqua/ph',
  tds: 'smart-aqua/tds',
  turbidity: 'smart-aqua/turbidity'
};

type SensorData = {
  temperature: number;
  ph: number;
  tds: number;
  turbidity: number;
};

export default function MockMqttMonitor() {
  // State for the sensor data
  const [sensorData, setSensorData] = useState<SensorData>({
    temperature: 25.5,
    ph: 7.2,
    tds: 320,
    turbidity: 10
  });
  
  // State for connection and simulation
  const [isSimulating, setIsSimulating] = useState(false);
  const [updateInterval, setUpdateInterval] = useState(5000); // 5 seconds
  const simulationTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Connect to the MQTT broker
  const mqtt = useTaoMqtt(
    'mqtt://broker.hivemq.com:1883',
    '', // No default topic, we'll subscribe to multiple
    {
      clientId: `smart-aqua-mock-${Math.random().toString(16).slice(2, 8)}`,
      reconnectPeriod: 1000
    }
  );
  
  // Subscribe to topics once connected
  useEffect(() => {
    if (mqtt.isConnected) {
      Object.values(TOPICS).forEach(topic => {
        mqtt.subscribe(topic);
      });
      console.log('Subscribed to all sensor topics');
    }
  }, [mqtt.isConnected]);
  
  // Handle incoming messages
  useEffect(() => {
    if (mqtt.messages.length > 0) {
      const newData = { ...sensorData };
      
      // Process only the latest message for each topic
      const latestMessages = mqtt.messages.slice(-10);
      latestMessages.forEach(msg => {
        const value = parseFloat(msg.message);
        if (!isNaN(value)) {
          if (msg.topic === TOPICS.temperature) newData.temperature = value;
          else if (msg.topic === TOPICS.ph) newData.ph = value;
          else if (msg.topic === TOPICS.tds) newData.tds = value;
          else if (msg.topic === TOPICS.turbidity) newData.turbidity = value;
        }
      });
      
      setSensorData(newData);
    }
  }, [mqtt.messages]);
  
  // Start/stop simulation
  useEffect(() => {
    if (isSimulating && mqtt.isConnected) {
      // Start sending mock data
      simulationTimerRef.current = setInterval(() => {
        publishMockData();
      }, updateInterval);
      
      // Initial publish
      publishMockData();
    } else {
      // Stop simulation
      if (simulationTimerRef.current) {
        clearInterval(simulationTimerRef.current);
        simulationTimerRef.current = null;
      }
    }
    
    return () => {
      if (simulationTimerRef.current) {
        clearInterval(simulationTimerRef.current);
      }
    };
  }, [isSimulating, mqtt.isConnected, updateInterval]);
  
  // Function to publish mock data with small random variations
  const publishMockData = () => {
    if (!mqtt.isConnected) return;
    
    // Randomize the data slightly for realism
    const randomizeValue = (base: number, range: number) => {
      return (base + (Math.random() * range * 2 - range)).toFixed(1);
    };
    
    // Publish to each topic with slight variations
    mqtt.publish(TOPICS.temperature, randomizeValue(sensorData.temperature, 0.5));
    mqtt.publish(TOPICS.ph, randomizeValue(sensorData.ph, 0.2));
    mqtt.publish(TOPICS.tds, randomizeValue(sensorData.tds, 20));
    mqtt.publish(TOPICS.turbidity, randomizeValue(sensorData.turbidity, 1));
    
    console.log('Published mock data to all topics');
  };
  
  // Function to manually adjust base values
  const adjustValue = (parameter: keyof SensorData, delta: number) => {
    setSensorData(prev => ({
      ...prev,
      [parameter]: parseFloat((prev[parameter] + delta).toFixed(1))
    }));
  };
  
  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedView style={styles.titleContainer}>
          <IconSymbol name="water" size={24} color="#0a7ea4" />
          <ThemedText type="subtitle">MQTT Simulator</ThemedText>
        </ThemedView>
        
        <ThemedView style={styles.connectionStatus}>
          <ThemedText>Status: </ThemedText>
          <ThemedView style={[
            styles.statusIndicator, 
            { backgroundColor: mqtt.isConnected ? '#22c55e' : mqtt.isConnecting ? '#f59e0b' : '#dc2626' }
          ]} />
          <ThemedText>
            {mqtt.isConnected ? 'Connected' : mqtt.isConnecting ? 'Connecting...' : 'Disconnected'}
          </ThemedText>
        </ThemedView>
      </ThemedView>
      
      {mqtt.error && (
        <ThemedView style={styles.errorContainer}>
          <ThemedText style={styles.errorText}>Error: {mqtt.error.message}</ThemedText>
        </ThemedView>
      )}
      
      <ThemedView style={styles.controlPanel}>
        <ThemedView style={styles.simulationControl}>
          <ThemedText>Simulation: </ThemedText>
          <Switch
            value={isSimulating}
            onValueChange={setIsSimulating}
            disabled={!mqtt.isConnected}
          />
        </ThemedView>
        
        <TouchableOpacity
          style={[styles.connectButton, mqtt.isConnected ? styles.disconnectButton : styles.connectButton]}
          onPress={mqtt.isConnected ? mqtt.disconnect : mqtt.connect}
        >
          <ThemedText style={styles.buttonText}>
            {mqtt.isConnected ? 'Disconnect' : 'Connect'}
          </ThemedText>
        </TouchableOpacity>
      </ThemedView>
      
      {/* Sensor data display in 2-column layout */}
      <ThemedView style={styles.dataContainer}>
        {/* First row: Temperature and pH */}
        <ThemedView style={styles.dataRow}>
          <ThemedView style={styles.dataCard}>
            <DataCard
              title="Temperature"
              value={sensorData.temperature}
              unit="°C"
              icon="thermometer"
            />
            <ThemedView style={styles.adjustControls}>
              <TouchableOpacity style={styles.adjustButton} onPress={() => adjustValue('temperature', -0.5)}>
                <ThemedText style={styles.adjustButtonText}>-</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity style={styles.adjustButton} onPress={() => adjustValue('temperature', 0.5)}>
                <ThemedText style={styles.adjustButtonText}>+</ThemedText>
              </TouchableOpacity>
            </ThemedView>
          </ThemedView>
          
          <ThemedView style={styles.dataCard}>
            <DataCard
              title="pH Level"
              value={sensorData.ph}
              unit="pH"
              icon="water"
            />
            <ThemedView style={styles.adjustControls}>
              <TouchableOpacity style={styles.adjustButton} onPress={() => adjustValue('ph', -0.1)}>
                <ThemedText style={styles.adjustButtonText}>-</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity style={styles.adjustButton} onPress={() => adjustValue('ph', 0.1)}>
                <ThemedText style={styles.adjustButtonText}>+</ThemedText>
              </TouchableOpacity>
            </ThemedView>
          </ThemedView>
        </ThemedView>
        
        {/* Second row: TDS and Turbidity */}
        <ThemedView style={styles.dataRow}>
          <ThemedView style={styles.dataCard}>
            <DataCard
              title="TDS"
              value={sensorData.tds}
              unit="ppm"
              icon="molecule"
            />
            <ThemedView style={styles.adjustControls}>
              <TouchableOpacity style={styles.adjustButton} onPress={() => adjustValue('tds', -10)}>
                <ThemedText style={styles.adjustButtonText}>-</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity style={styles.adjustButton} onPress={() => adjustValue('tds', 10)}>
                <ThemedText style={styles.adjustButtonText}>+</ThemedText>
              </TouchableOpacity>
            </ThemedView>
          </ThemedView>
          
          <ThemedView style={styles.dataCard}>
            <DataCard
              title="Turbidity"
              value={sensorData.turbidity}
              unit="NTU"
              icon="eyedropper"
            />
            <ThemedView style={styles.adjustControls}>
              <TouchableOpacity style={styles.adjustButton} onPress={() => adjustValue('turbidity', -1)}>
                <ThemedText style={styles.adjustButtonText}>-</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity style={styles.adjustButton} onPress={() => adjustValue('turbidity', 1)}>
                <ThemedText style={styles.adjustButtonText}>+</ThemedText>
              </TouchableOpacity>
            </ThemedView>
          </ThemedView>
        </ThemedView>
      </ThemedView>
      
      <ThemedView style={styles.messageLog}>
        <ThemedText type="subtitle">Message Log</ThemedText>
        <ScrollView style={styles.logScroll}>
          {mqtt.messages.slice(-5).map((msg, idx) => (
            <ThemedView key={idx} style={styles.logItem}>
              <ThemedText style={styles.logTopic}>{msg.topic}:</ThemedText>
              <ThemedText style={styles.logMessage}>{msg.message}</ThemedText>
              <ThemedText style={styles.logTime}>
                {new Date(msg.timestamp).toLocaleTimeString()}
              </ThemedText>
            </ThemedView>
          ))}
          {mqtt.messages.length === 0 && (
            <ThemedText style={styles.noMessages}>No messages yet</ThemedText>
          )}
        </ScrollView>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  errorContainer: {
    padding: 10,
    backgroundColor: '#fee2e2',
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#dc2626',
  },
  controlPanel: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  simulationControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  connectButton: {
    backgroundColor: '#0a7ea4',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  disconnectButton: {
    backgroundColor: '#dc2626',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
  },
  dataContainer: {
    marginBottom: 16,
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  dataCard: {
    width: '48%',
  },
  adjustControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
    gap: 16,
  },
  adjustButton: {
    backgroundColor: '#0a7ea4',
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adjustButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  messageLog: {
    marginTop: 8,
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  logScroll: {
    maxHeight: 120,
    marginTop: 8,
  },
  logItem: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingVertical: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  logTopic: {
    fontWeight: '500',
    marginRight: 8,
  },
  logMessage: {
    flex: 1,
  },
  logTime: {
    fontSize: 12,
    opacity: 0.6,
  },
  noMessages: {
    textAlign: 'center',
    fontStyle: 'italic',
    opacity: 0.6,
    marginTop: 8,
  },
});