import { useState, useEffect, useCallback, useRef } from 'react';
import * as mqttModule from '@taoqf/react-native-mqtt';

// Initialize the MQTT client
const mqtt = mqttModule;

export interface MqttMessage {
  topic: string;
  message: string;
  timestamp: number;
}

export interface MqttOptions {
  clientId?: string;
  username?: string;
  password?: string;
  keepalive?: number;
  cleanSession?: boolean;
  reconnectPeriod?: number;
}

export function useTaoMqtt(brokerUrl: string, defaultTopic: string, options: MqttOptions = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [messages, setMessages] = useState<MqttMessage[]>([]);
  const clientRef = useRef<any>(null);
  
  // Connect to the MQTT broker
  const connect = useCallback(() => {
    if (clientRef.current) {
      return;
    }
    
    setIsConnecting(true);
    setError(null);
    
    try {
      // Generate unique client ID if not provided
      const clientId = options.clientId || `smartaqua_${Math.random().toString(16).slice(2, 8)}`;
      
      // Setup client with connection options
      clientRef.current = mqtt.connect(brokerUrl, {
        clientId,
        username: options.username,
        password: options.password,
        keepalive: options.keepalive || 60,
        clean: options.cleanSession !== false,
        reconnectPeriod: options.reconnectPeriod || 1000,
      });
      
      // Setup event handlers
      clientRef.current.on('connect', () => {
        console.log('MQTT Connected to:', brokerUrl);
        setIsConnected(true);
        setIsConnecting(false);
        
        // Auto-subscribe to default topic if provided
        if (defaultTopic) {
          subscribe(defaultTopic);
        }
      });
      
      clientRef.current.on('error', (err: Error) => {
        console.error('MQTT Connection error:', err);
        setError(err);
        setIsConnecting(false);
      });
      
      clientRef.current.on('offline', () => {
        console.log('MQTT Client is offline');
        setIsConnected(false);
      });
      
      clientRef.current.on('message', (topic: string, payload: any) => {
        const message = payload.toString();
        console.log(`Message from ${topic}: ${message}`);
        
        setMessages((prevMessages) => [
          ...prevMessages,
          {
            topic,
            message,
            timestamp: Date.now(),
          },
        ]);
      });
    } catch (err) {
      console.error('Failed to connect to MQTT broker:', err);
      setError(err instanceof Error ? err : new Error('Unknown connection error'));
      setIsConnecting(false);
    }
  }, [brokerUrl, defaultTopic, options]);
  
  // Subscribe to a topic
  const subscribe = useCallback((topic: string, qos = 0) => {
    if (!clientRef.current || !isConnected) {
      console.warn('Cannot subscribe: MQTT client not connected');
      return false;
    }
    
    try {
      clientRef.current.subscribe(topic, { qos }, (err: Error) => {
        if (err) {
          console.error(`Failed to subscribe to ${topic}:`, err);
          setError(err);
          return;
        }
        console.log(`Subscribed to ${topic}`);
      });
      return true;
    } catch (err) {
      console.error(`Error subscribing to ${topic}:`, err);
      setError(err instanceof Error ? err : new Error('Unknown subscription error'));
      return false;
    }
  }, [isConnected]);
  
  // Publish a message to a topic
  const publish = useCallback((topic: string, message: string, qos = 0, retain = false) => {
    if (!clientRef.current || !isConnected) {
      console.warn('Cannot publish: MQTT client not connected');
      return false;
    }
    
    try {
      clientRef.current.publish(topic, message, { qos, retain }, (err: Error) => {
        if (err) {
          console.error(`Failed to publish to ${topic}:`, err);
          setError(err);
          return;
        }
        console.log(`Published to ${topic}: ${message}`);
      });
      return true;
    } catch (err) {
      console.error(`Error publishing to ${topic}:`, err);
      setError(err instanceof Error ? err : new Error('Unknown publish error'));
      return false;
    }
  }, [isConnected]);
  
  // Unsubscribe from a topic
  const unsubscribe = useCallback((topic: string) => {
    if (!clientRef.current || !isConnected) {
      return;
    }
    
    clientRef.current.unsubscribe(topic, (err: Error) => {
      if (err) {
        console.error(`Failed to unsubscribe from ${topic}:`, err);
        setError(err);
        return;
      }
      console.log(`Unsubscribed from ${topic}`);
    });
  }, [isConnected]);
  
  // Disconnect from the broker
  const disconnect = useCallback(() => {
    if (!clientRef.current) {
      return;
    }
    
    clientRef.current.end(false, () => {
      console.log('MQTT Disconnected');
      setIsConnected(false);
      clientRef.current = null;
    });
  }, []);
  
  // Connect automatically when the hook is initialized
  useEffect(() => {
    connect();
    
    // Clean up on unmount
    return () => {
      if (clientRef.current) {
        disconnect();
      }
    };
  }, [connect, disconnect]);
  
  // Reset error state when URL or options change
  useEffect(() => {
    setError(null);
  }, [brokerUrl, options]);
  
  return {
    isConnected,
    isConnecting,
    error,
    messages,
    connect,
    subscribe,
    unsubscribe,
    publish,
    disconnect,
    // Return the latest message for convenience
    latestMessage: messages.length > 0 ? messages[messages.length - 1] : null,
  };
}