import React, { useState, useEffect } from "react";
import { StyleSheet, TextInput, TouchableOpacity, Alert } from "react-native";
import { ThemedText } from "./ThemedText";
import { ThemedView } from "./ThemedView";

interface MqttConfigPanelProps {
  mqttClient: any; // Using any as the type for simplicity
}

export default function MqttConfigPanel({ mqttClient }: MqttConfigPanelProps) {
  const [broker, setBroker] = useState("broker.hivemq.com");
  const [port, setPort] = useState("1883");
  const [clientId, setClientId] = useState(
    `smart-aqua-${Math.random().toString(16).slice(2, 8)}`
  );
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (mqttClient?.broker) {
      try {
        const host = mqttClient.broker.replace("mqtt://", "").split(":")[0];
        setBroker(host);
      } catch (error) {
        console.warn("Error parsing mqttClient.broker:", error);
      }
    }
  }, [mqttClient]);

  const handleConnect = () => {
    if (!broker) {
      Alert.alert("Error", "Please enter a broker address");
      return;
    }

    try {
      // Disconnect first if already connected
      if (mqttClient?.isConnected) {
        mqttClient.disconnect?.();
      }

      const brokerUrl = `ws://${broker}:${port || 8000}/mqtt`;
      mqttClient?.connect?.(brokerUrl, username || undefined, {
        clientId: clientId,
        password: password || undefined,
      });

      Alert.alert("Connection", "Attempting to connect to MQTT broker");
    } catch (error) {
      Alert.alert("Error", "Failed to connect to MQTT broker");
      console.error("MQTT connection error:", error);
    }
  };

  const handlePublish = () => {
    if (!mqttClient?.isConnected) {
      Alert.alert("Error", "Not connected to MQTT broker");
      return;
    }

    try {
      mqttClient?.publish?.("smart-aqua/temp", JSON.stringify({ value: 25.5 }));
      mqttClient?.publish?.("smart-aqua/ph", JSON.stringify({ value: 7.2 }));
      mqttClient?.publish?.("smart-aqua/tds", JSON.stringify({ value: 150 }));
      mqttClient?.publish?.(
        "smart-aqua/turbidity",
        JSON.stringify({ value: 5 })
      );

      Alert.alert("Success", "Test messages published to all sensor topics");
    } catch (error) {
      Alert.alert("Error", "Failed to publish message");
      console.error("MQTT publish error:", error);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.statusText}>
        Status: {mqttClient?.isConnected ? "Connected" : "Disconnected"}
      </ThemedText>

      <ThemedView style={styles.inputGroup}>
        <ThemedText>Broker Address</ThemedText>
        <TextInput
          style={styles.input}
          value={broker}
          onChangeText={setBroker}
          placeholder="e.g. broker.hivemq.com"
        />
      </ThemedView>

      <ThemedView style={styles.inputGroup}>
        <ThemedText>Port</ThemedText>
        <TextInput
          style={styles.input}
          value={port}
          onChangeText={setPort}
          keyboardType="numeric"
          placeholder="1883"
        />
      </ThemedView>

      <ThemedView style={styles.inputGroup}>
        <ThemedText>Client ID</ThemedText>
        <TextInput
          style={styles.input}
          value={clientId}
          onChangeText={setClientId}
        />
      </ThemedView>

      <ThemedView style={styles.inputGroup}>
        <ThemedText>Username (optional)</ThemedText>
        <TextInput
          style={styles.input}
          value={username}
          onChangeText={setUsername}
        />
      </ThemedView>

      <ThemedView style={styles.inputGroup}>
        <ThemedText>Password (optional)</ThemedText>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
      </ThemedView>

      <TouchableOpacity style={styles.connectButton} onPress={handleConnect}>
        <ThemedText style={styles.buttonText}>
          {mqttClient?.isConnected ? "Reconnect" : "Connect"}
        </ThemedText>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.publishButton,
          !mqttClient?.isConnected && styles.disabledButton,
        ]}
        onPress={handlePublish}
        disabled={!mqttClient?.isConnected}
      >
        <ThemedText style={styles.buttonText}>Publish Test Message</ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 10,
  },
  statusText: {
    marginBottom: 15,
    fontWeight: "bold",
  },
  inputGroup: {
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 8,
    marginTop: 5,
  },
  connectButton: {
    backgroundColor: "#0a7ea4",
    padding: 12,
    borderRadius: 5,
    alignItems: "center",
    marginBottom: 10,
  },
  publishButton: {
    backgroundColor: "#2e8b57",
    padding: 12,
    borderRadius: 5,
    alignItems: "center",
  },
  disabledButton: {
    backgroundColor: "#cccccc",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});
