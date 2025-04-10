import { useEffect, useRef, useState } from "react";
import mqtt from "@taoqf/react-native-mqtt";

type Message = {
  topic: string;
  message: string;
};

export function useTaoMqtt(
  // MQTT structure "wss://(your URL):8884/mqtt"
  url: string = "wss://abdaef3e94154ecdb21371e844ac801c.s1.eu.hivemq.cloud:8884/mqtt",
  username: string = "",
  options?: { clientId?: string; password?: string }
) {
  const clientRef = useRef<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState<Error | null>(null);

  // Create MQTT client connection
  const connect = () => {
    if (clientRef.current) {
      console.log("MQTT client already exists, reconnecting...");
      clientRef.current.reconnect();
      return;
    }

    const generatedClientId =
      options?.clientId ||
      "client_" + Math.random().toString(36).substring(2, 10);

    console.log("🔌 Connecting to MQTT broker...");

    try {
      const client = mqtt.connect(url, {
        username,
        password: options?.password ?? "",
        clientId: generatedClientId,
        keepalive: 60,
        reconnectPeriod: 1000,
      });

      clientRef.current = client;

      client.on("connect", () => {
        console.log("✅ Connected to MQTT");
        setIsConnected(true);
      });

      client.on("message", (topic: string, message: Buffer) => {
        const msg = {
          topic,
          message: message.toString(),
        };
        console.log("📩", msg);
        setMessages((prev) => [...prev, msg]);
      });

      client.on("error", (err: Error) => {
        console.error("❌ MQTT Error:", err);
        setError(err);
      });

      client.on("close", () => {
        console.log("🔌 Disconnected from MQTT");
        setIsConnected(false);
      });
    } catch (err) {
      console.error("❌ Error creating MQTT client:", err);
      setError(err instanceof Error ? err : new Error(String(err)));
    }
  };

  // Disconnect MQTT client
  const disconnect = () => {
    if (clientRef.current) {
      clientRef.current.end(true, () => {
        console.log("🔌 MQTT client disconnected cleanly");
        clientRef.current = null;
        setIsConnected(false);
      });
    }
  };

  // Connect on initial render
  useEffect(() => {
    connect();
    
    // Clean up on unmount
    return () => {
      if (clientRef.current) {
        disconnect();
      }
    };
  }, [url, username, options?.password]);

  return {
    clientRef,
    isConnected,
    messages,
    error,
    connect,     // Add connect method
    disconnect   // Add disconnect method
  };
}
