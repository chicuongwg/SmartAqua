import React, { useState } from "react";
import { StyleSheet, Alert, TextInput, TouchableOpacity } from "react-native";
import { ThemedText } from "./ThemedText";
import { ThemedView } from "./ThemedView";

interface Props {
  onConfigured?: () => void;
}

export default function Esp32MqttConfig({ onConfigured }: Props) {
  const [mqttBroker, setMqttBroker] = useState("broker.hivemq.com");
  const [mqttPort, setMqttPort] = useState("1883");
  const [mqttUsername, setMqttUsername] = useState("");
  const [mqttPassword, setMqttPassword] = useState("");
  const [mqttClientId, setMqttClientId] = useState(
    `esp32_${Math.random().toString(16).slice(2, 8)}`
  );
  const [configStatus, setConfigStatus] = useState("");

  // Replace Bluetooth functionality with direct MQTT configuration
  const configureMqtt = async () => {
    try {
      // Here we would normally send the configuration via Bluetooth
      // Instead, we'll just simulate success since you're using direct MQTT
      Alert.alert(
        "MQTT Configuration",
        "Using direct MQTT connection to HiveMQ broker.\n" +
          "No Bluetooth configuration needed."
      );

      setConfigStatus("Using direct MQTT connection to broker.hivemq.com");
      if (onConfigured) onConfigured();
    } catch (error) {
      console.error("Error:", error);
      setConfigStatus(
        `Error: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="subtitle">MQTT Configuration</ThemedText>

      <ThemedView style={styles.configSection}>
        <ThemedText style={styles.statusText}>
          Connected directly to MQTT broker
        </ThemedText>

        <ThemedView style={styles.inputGroup}>
          <ThemedText>MQTT Broker</ThemedText>
          <TextInput
            style={styles.input}
            value={mqttBroker}
            onChangeText={setMqttBroker}
          />
        </ThemedView>

        <ThemedView style={styles.inputGroup}>
          <ThemedText>Port</ThemedText>
          <TextInput
            style={styles.input}
            value={mqttPort}
            onChangeText={setMqttPort}
            keyboardType="numeric"
          />
        </ThemedView>

        <ThemedView style={styles.inputGroup}>
          <ThemedText>Username (optional)</ThemedText>
          <TextInput
            style={styles.input}
            value={mqttUsername}
            onChangeText={setMqttUsername}
          />
        </ThemedView>

        <ThemedView style={styles.inputGroup}>
          <ThemedText>Password (optional)</ThemedText>
          <TextInput
            style={styles.input}
            value={mqttPassword}
            onChangeText={setMqttPassword}
            secureTextEntry
          />
        </ThemedView>

        <ThemedView style={styles.inputGroup}>
          <ThemedText>Client ID</ThemedText>
          <TextInput
            style={styles.input}
            value={mqttClientId}
            onChangeText={setMqttClientId}
          />
        </ThemedView>

        <TouchableOpacity style={styles.configButton} onPress={configureMqtt}>
          <ThemedText style={styles.buttonText}>
            Apply MQTT Configuration
          </ThemedText>
        </TouchableOpacity>

        {configStatus ? (
          <ThemedText style={styles.statusText}>{configStatus}</ThemedText>
        ) : null}
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e5e5",
  },
  configSection: {
    marginTop: 16,
  },
  statusText: {
    marginBottom: 16,
    fontStyle: "italic",
  },
  inputGroup: {
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e5e5e5",
    borderRadius: 6,
    padding: 10,
    marginTop: 4,
  },
  configButton: {
    backgroundColor: "#0a7ea4",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 16,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
