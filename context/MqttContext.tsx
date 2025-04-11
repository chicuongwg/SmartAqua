import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import mqtt from "@taoqf/react-native-mqtt";
import { Alert } from "react-native";

// MQTT Configuration
const MQTT_URL =
  "wss://abdaef3e94154ecdb21371e844ac801c.s1.eu.hivemq.cloud:8884/mqtt";
const MQTT_USERNAME = "ChiCuong";
const MQTT_PASSWORD = "TestIoT123";

// Standard data type
export type AquariumData = {
  temperature: number;
  tds: number;
  turbidity: number;
  ph: number; // Thêm pH vào dữ liệu tiêu chuẩn
};

// Message type
export type MqttMessage = {
  topic: string;
  message: string;
};

// Context type
interface MqttContextType {
  isConnected: boolean;
  messages: MqttMessage[];
  error: Error | null;
  aquariumData: AquariumData;
  connect: () => void;
  disconnect: () => void;
  publishMessage: (topic: string, message: string) => void;
  subscribeToTopic: (topic: string) => void;
  clearMessages: () => void;
  waterType: "lake" | "ocean";
  setWaterType: (type: "lake" | "ocean") => void;
}

// Create context
const MqttContext = createContext<MqttContextType | null>(null);

// Provider component
export const MqttProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const clientRef = useRef<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<MqttMessage[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [waterType, setWaterType] = useState<"lake" | "ocean">("lake");

  // Aquarium data state
  const [aquariumData, setAquariumData] = useState<AquariumData>({
    temperature: 0,
    tds: 0,
    turbidity: 0,
    ph: 0.0,
  });

  // Connect to MQTT broker
  const connect = () => {
    if (clientRef.current) {
      console.log("MQTT client already exists, reconnecting...");
      clientRef.current.reconnect();
      return;
    }

    const clientId = `smartaqua-global-${Math.random()
      .toString(36)
      .substring(2, 10)}`;
    console.log("🔌 Connecting to MQTT broker with client ID:", clientId);

    try {
      const client = mqtt.connect(MQTT_URL, {
        username: MQTT_USERNAME,
        password: MQTT_PASSWORD,
        clientId: clientId,
        keepalive: 60,
        reconnectPeriod: 1000,
      });

      clientRef.current = client;

      client.on("connect", () => {
        console.log("✅ Connected to MQTT broker");
        setIsConnected(true);

        // Subscribe to default topics
        client.subscribe("esp32/sensor/data");
        client.subscribe("smart-aqua/temp");
        client.subscribe("smart-aqua/ph");
        client.subscribe("smart-aqua/tds");
        client.subscribe("smart-aqua/turbidity");
        console.log("✅ Subscribed to default topics");
      });

      client.on("message", (topic: string, messageBuffer: Buffer) => {
        const messageStr = messageBuffer.toString();
        console.log(`📩 Message received on ${topic}:`, messageStr);

        const newMessage = { topic, message: messageStr };
        setMessages((prev) => [...prev, newMessage]);

        // Process messages based on topic
        processMessage(topic, messageStr);
      });

      client.on("error", (err: Error) => {
        console.error("❌ MQTT Error:", err);
        setError(err);
      });

      client.on("close", () => {
        console.log("🔌 Disconnected from MQTT");
        setIsConnected(false);
      });

      client.on("reconnect", () => {
        console.log("🔄 Attempting to reconnect to MQTT broker");
      });
    } catch (err) {
      console.error("❌ Error creating MQTT client:", err);
      setError(err instanceof Error ? err : new Error(String(err)));
    }
  };

  // Process incoming MQTT messages
  const processMessage = (topic: string, message: string) => {
    // First, try to parse ESP32 sensor data format (text format)
    if (topic === "esp32/sensor/data") {
      try {
        const matches = message.match(
          /Temp:\s*([\d.]+)\s*C,\s*TDS:\s*([\d.]+)\s*ppm,\s*Turbidity:\s*([\d.]+)\s*%/
        );

        if (matches) {
          const temperature = parseFloat(matches[1]);
          const tds = parseFloat(matches[2]);
          const turbidity = parseFloat(matches[3]);

          setAquariumData((prevData) => ({
            ...prevData,
            temperature,
            tds,
            turbidity,
          }));

          console.log("✅ Parsed sensor data:", {
            temperature,
            tds,
            turbidity,
          });
          return;
        }
      } catch (err) {
        console.error("❌ Failed to parse ESP32 sensor data:", err);
      }
    }

    // Try to parse individual topic data (JSON format)
    try {
      const jsonData = JSON.parse(message);

      if (topic === "smart-aqua/temp" && jsonData.value !== undefined) {
        setAquariumData((prev) => ({
          ...prev,
          temperature: parseFloat(jsonData.value),
        }));
      } else if (topic === "smart-aqua/ph" && jsonData.value !== undefined) {
        setAquariumData((prev) => ({
          ...prev,
          ph: parseFloat(jsonData.value),
        }));
      } else if (topic === "smart-aqua/tds" && jsonData.value !== undefined) {
        setAquariumData((prev) => ({
          ...prev,
          tds: parseFloat(jsonData.value),
        }));
      } else if (
        topic === "smart-aqua/turbidity" &&
        jsonData.value !== undefined
      ) {
        setAquariumData((prev) => ({
          ...prev,
          turbidity: parseFloat(jsonData.value),
        }));
      }
    } catch (err) {
      // Not JSON format, try direct parsing
      const value = parseFloat(message);
      if (!isNaN(value)) {
        if (topic === "smart-aqua/temp") {
          setAquariumData((prev) => ({ ...prev, temperature: value }));
        } else if (topic === "smart-aqua/ph") {
          setAquariumData((prev) => ({ ...prev, ph: value }));
        } else if (topic === "smart-aqua/tds") {
          setAquariumData((prev) => ({ ...prev, tds: value }));
        } else if (topic === "smart-aqua/turbidity") {
          setAquariumData((prev) => ({ ...prev, turbidity: value }));
        }
      }
    }
  };

  // Disconnect from MQTT broker
  const disconnect = () => {
    if (clientRef.current) {
      clientRef.current.end(true, () => {
        console.log("🔌 MQTT client disconnected cleanly");
        clientRef.current = null;
        setIsConnected(false);
      });
    } else {
      console.log("ℹ️ No active MQTT connection to disconnect");
    }
  };

  // Publish message to a topic
  const publishMessage = (topic: string, message: string) => {
    if (!isConnected || !clientRef.current) {
      console.error("❌ Cannot publish: MQTT client not connected");
      Alert.alert("Error", "MQTT client not connected");
      return;
    }

    try {
      clientRef.current.publish(topic, message);
      console.log(`📤 Published to ${topic}:`, message);
    } catch (err) {
      console.error("❌ Error publishing message:", err);
      setError(err instanceof Error ? err : new Error(String(err)));
    }
  };

  // Subscribe to a topic
  const subscribeToTopic = (topic: string) => {
    if (!isConnected || !clientRef.current) {
      console.error("❌ Cannot subscribe: MQTT client not connected");
      return;
    }

    clientRef.current.subscribe(topic, (err: Error) => {
      if (err) {
        console.error(`❌ Error subscribing to ${topic}:`, err);
        setError(err);
      } else {
        console.log(`✅ Subscribed to ${topic}`);
      }
    });
  };

  // Clear message history
  const clearMessages = () => {
    setMessages([]);
  };

  // Auto-connect on component mount
  useEffect(() => {
    connect();

    // Clean up on unmount
    return () => {
      if (clientRef.current) {
        disconnect();
      }
    };
  }, []);

  const contextValue: MqttContextType = {
    isConnected,
    messages,
    error,
    aquariumData,
    connect,
    disconnect,
    publishMessage,
    subscribeToTopic,
    clearMessages,
    waterType,
    setWaterType,
  };

  return (
    <MqttContext.Provider value={contextValue}>{children}</MqttContext.Provider>
  );
};

// Custom hook to use MQTT context
export const useMqtt = () => {
  const context = useContext(MqttContext);

  if (!context) {
    throw new Error("useMqtt must be used within an MqttProvider");
  }

  return context;
};
