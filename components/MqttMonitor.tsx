import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useTaoMqtt } from '@/hooks/useTaoMqtt';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

interface Props {
  brokerUrl: string;
  topic: string;
  username?: string;
  password?: string;
}

export default function MqttMonitor({ brokerUrl, topic, username, password }: Props) {
  const {
    isConnected,
    isConnecting,
    error,
    messages,
    connect,
    disconnect,
    publish
  } = useTaoMqtt(
    brokerUrl, 
    topic,
    {
      username,
      password,
      reconnectPeriod: 3000,
      clientId: `smartaqua_monitor_${Math.random().toString(16).slice(2, 8)}`
    }
  );

  // Only show the last 20 messages
  const recentMessages = messages.slice(-20);

  // Function to send a test message
  const sendTestMessage = () => {
    publish(topic, JSON.stringify({
      type: 'test',
      value: Math.round(Math.random() * 100),
      timestamp: new Date().toISOString()
    }));
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.statusContainer}>
        <ThemedText type="subtitle">MQTT Status</ThemedText>
        <ThemedView style={[styles.statusIndicator, { 
          backgroundColor: isConnected ? '#22c55e' : isConnecting ? '#f59e0b' : '#dc2626' 
        }]} />
        <ThemedText>
          {isConnected ? 'Connected' : isConnecting ? 'Connecting...' : 'Disconnected'}
        </ThemedText>
        {error && (
          <ThemedText style={styles.errorText}>
            Error: {error.message}
          </ThemedText>
        )}
      </ThemedView>

      <ThemedView style={styles.actionsContainer}>
        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: '#0a7ea4' }]} 
          onPress={isConnected ? disconnect : connect}
        >
          <ThemedText style={styles.buttonText}>
            {isConnected ? 'Disconnect' : 'Connect'}
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionButton, { 
            backgroundColor: isConnected ? '#22c55e' : '#9ca3af' 
          }]}
          disabled={!isConnected}
          onPress={sendTestMessage}
        >
          <ThemedText style={styles.buttonText}>
            Send Test Message
          </ThemedText>
        </TouchableOpacity>
      </ThemedView>

      <ThemedView style={styles.messagesContainer}>
        <ThemedText type="subtitle">Messages ({topic})</ThemedText>
        {recentMessages.length === 0 ? (
          <ThemedText style={styles.noMessagesText}>
            No messages received yet
          </ThemedText>
        ) : (
          <ScrollView style={styles.messagesScrollView}>
            {recentMessages.map((msg, index) => (
              <ThemedView key={index} style={styles.messageItem}>
                <ThemedText style={styles.messageTime}>
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </ThemedText>
                <ThemedText style={styles.messageText}>
                  {msg.message}
                </ThemedText>
              </ThemedView>
            ))}
          </ScrollView>
        )}
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  errorText: {
    color: '#dc2626',
    marginTop: 4,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 12,  // Added gap between buttons
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
    paddingVertical: 12,  // Increased padding for better touchability
    borderRadius: 6,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
  },
  messagesContainer: {
    borderTopWidth: 1,
    borderColor: '#e5e5e5',
    paddingTop: 16,
  },
  messagesScrollView: {
    maxHeight: 200,  // Reduced height to take less space
    marginTop: 10,
  },
  messageItem: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: 'rgba(0,0,0,0.05)',
    marginBottom: 8,
  },
  messageTime: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 4,
  },
  messageText: {
    fontSize: 14,
  },
  noMessagesText: {
    fontStyle: 'italic',
    marginTop: 10,
    opacity: 0.7,
    textAlign: 'center',
  },
});