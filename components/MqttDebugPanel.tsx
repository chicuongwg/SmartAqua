import React from "react";
import { StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { ThemedText } from "./ThemedText";
import { ThemedView } from "./ThemedView";

interface MqttClient {
  isConnected: boolean;
  error?: { message: string };
  broker?: string;
  clientId?: string;
  messages: Array<{
    topic: string;
    message: string;
    timestamp: number;
  }>;
  subscribe: (topic: string) => void;
}

export default function MqttDebugPanel({
  mqttClient,
}: {
  mqttClient: MqttClient;
}) {
  const recentMessages = (mqttClient.messages || []).slice(-10);

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="subtitle">MQTT Raw Messages</ThemedText>

      <ScrollView style={styles.messagesBox}>
        {recentMessages.length === 0 ? (
          <ThemedText style={styles.noMessages}>
            No messages received
          </ThemedText>
        ) : (
          recentMessages.map((msg, idx) => (
            <ThemedView key={idx} style={styles.messageItem}>
              <ThemedText style={styles.topic}>{msg.topic}</ThemedText>
              <ThemedText style={styles.message}>{msg.message}</ThemedText>
              <ThemedText style={styles.timestamp}>
                {new Date(msg.timestamp).toLocaleTimeString()}
              </ThemedText>
            </ThemedView>
          ))
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 10,
    marginTop: 10,
  },
  infoBox: {
    padding: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 4,
    marginTop: 10,
  },
  errorText: {
    color: "#dc2626",
  },
  sectionTitle: {
    marginTop: 15,
    marginBottom: 5,
    fontWeight: "bold",
  },
  messagesBox: {
    maxHeight: 200,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 4,
  },
  messageItem: {
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  topic: {
    fontWeight: "bold",
  },
  message: {
    marginVertical: 4,
  },
  timestamp: {
    fontSize: 12,
    color: "#666",
  },
  noMessages: {
    padding: 10,
    fontStyle: "italic",
    textAlign: "center",
  },
  actionButton: {
    backgroundColor: "#0a7ea4",
    padding: 12,
    borderRadius: 5,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});
