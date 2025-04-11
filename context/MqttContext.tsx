import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import mqtt from "@taoqf/react-native-mqtt";
import { Alert } from "react-native";
import { DataPoint } from "@/components/DataGraph"; // Import DataPoint type

// MQTT Configuration
const MQTT_URL =
  "wss://abdaef3e94154ecdb21371e844ac801c.s1.eu.hivemq.cloud:8884/mqtt";
const MQTT_USERNAME = "ChiCuong";
const MQTT_PASSWORD = "TestIoT123";
const MAX_HISTORY_LENGTH = 1000; // Limit the number of points stored

// Standard data type
export type AquariumData = {
  temperature: number;
  tds: number;
  turbidity: number;
  ph: number;
};

// Message type
export type MqttMessage = {
  topic: string;
  message: string;
};

// Context type - Add history arrays
interface MqttContextType {
  isConnected: boolean;
  messages: MqttMessage[];
  error: Error | null;
  aquariumData: AquariumData;
  // Add history arrays to the context type
  temperatureHistory: DataPoint[];
  phHistory: DataPoint[];
  tdsHistory: DataPoint[];
  turbidityHistory: DataPoint[];
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

  // Aquarium data state (latest values)
  const [aquariumData, setAquariumData] = useState<AquariumData>({
    temperature: 0,
    tds: 0,
    turbidity: 0,
    ph: 0.0,
  });

  // --- START: Add State for History Arrays ---
  const [temperatureHistory, setTemperatureHistory] = useState<DataPoint[]>([]);
  const [phHistory, setPhHistory] = useState<DataPoint[]>([]);
  const [tdsHistory, setTdsHistory] = useState<DataPoint[]>([]);
  const [turbidityHistory, setTurbidityHistory] = useState<DataPoint[]>([]);
  // --- END: Add State for History Arrays ---

  // Helper function to add data point and limit history size
  const addDataPoint = (
    setter: React.Dispatch<React.SetStateAction<DataPoint[]>>,
    value: number
  ) => {
    const newPoint: DataPoint = { timestamp: Date.now(), value: value };
    setter((prevHistory) => {
      const updatedHistory = [...prevHistory, newPoint];
      // Limit history length
      if (updatedHistory.length > MAX_HISTORY_LENGTH) {
        return updatedHistory.slice(updatedHistory.length - MAX_HISTORY_LENGTH);
      }
      return updatedHistory;
    });
  };

  // Connect to MQTT broker
  const connect = () => {
    // ... (connect logic remains the same) ...
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

  // Process incoming MQTT messages - Modified to update history
  const processMessage = (topic: string, message: string) => {
    const timestamp = Date.now(); // Get timestamp once

    // First, try to parse ESP32 sensor data format (text format)
    if (topic === "esp32/sensor/data") {
      try {
        // Updated regex to potentially capture pH if included
        const matches = message.match(
          /Temp:\s*([\d.]+)\s*C,\s*TDS:\s*([\d.]+)\s*ppm,\s*Turbidity:\s*([\d.]+)\s*%(?:,\s*pH:\s*([\d.]+))?/ // Make pH optional
        );

        if (matches) {
          const temperature = parseFloat(matches[1]);
          const tds = parseFloat(matches[2]);
          const turbidity = parseFloat(matches[3]);
          const ph = matches[4] ? parseFloat(matches[4]) : aquariumData.ph; // Use captured pH or keep previous

          // Update latest data state
          setAquariumData((prevData) => ({
            ...prevData,
            temperature,
            tds,
            turbidity,
            ph, // Update pH as well
          }));

          // --- Add to history ---
          if (!isNaN(temperature))
            addDataPoint(setTemperatureHistory, temperature);
          if (!isNaN(tds)) addDataPoint(setTdsHistory, tds);
          if (!isNaN(turbidity)) addDataPoint(setTurbidityHistory, turbidity);
          if (matches[4] && !isNaN(ph)) addDataPoint(setPhHistory, ph); // Add pH history if present

          console.log("✅ Parsed ESP32 sensor data:", {
            temperature,
            tds,
            turbidity,
            ph,
          });
          return; // Exit after processing combined message
        }
      } catch (err) {
        console.error("❌ Failed to parse ESP32 sensor data:", err);
      }
    }

    // Try to parse individual topic data (JSON format or plain number)
    let value: number | undefined = undefined;
    try {
      const jsonData = JSON.parse(message);
      if (jsonData.value !== undefined) {
        value = parseFloat(jsonData.value);
      }
    } catch (err) {
      // Not JSON or JSON without 'value', try parsing as plain number
      value = parseFloat(message);
    }

    if (value === undefined || isNaN(value)) {
      console.warn(`⚠️ Could not parse value from topic ${topic}:`, message);
      return; // Cannot process if value is not a valid number
    }

    // Update specific parameter based on topic
    if (topic === "smart-aqua/temp") {
      setAquariumData((prev) => ({ ...prev, temperature: value }));
      addDataPoint(setTemperatureHistory, value); // Add to history
    } else if (topic === "smart-aqua/ph") {
      setAquariumData((prev) => ({ ...prev, ph: value }));
      addDataPoint(setPhHistory, value); // Add to history
    } else if (topic === "smart-aqua/tds") {
      setAquariumData((prev) => ({ ...prev, tds: value }));
      addDataPoint(setTdsHistory, value); // Add to history
    } else if (topic === "smart-aqua/turbidity") {
      setAquariumData((prev) => ({ ...prev, turbidity: value }));
      addDataPoint(setTurbidityHistory, value); // Add to history
    }
  };

  // Disconnect from MQTT broker
  const disconnect = () => {
    // ... (disconnect logic remains the same) ...
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
    // ... (publishMessage logic remains the same) ...
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
    // ... (subscribeToTopic logic remains the same) ...
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
    // Optionally clear historical data too if needed
    // setTemperatureHistory([]);
    // setPhHistory([]);
    // setTdsHistory([]);
    // setTurbidityHistory([]);
  };

  // Auto-connect on component mount
  useEffect(() => {
    connect();
    return () => {
      disconnect(); // Ensure disconnect is called on unmount
    };
  }, []); // Empty dependency array ensures connect/disconnect run once

  // --- Update contextValue to include history arrays ---
  const contextValue: MqttContextType = {
    isConnected,
    messages,
    error,
    aquariumData,
    // Add history arrays here
    temperatureHistory,
    phHistory,
    tdsHistory,
    turbidityHistory,
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
