import { useEffect, useRef, useState } from "react";
import mqtt from "@taoqf/react-native-mqtt";

type Message = {
  topic: string;
  message: string;
};

export function useTaoMqtt(
  url: string = "wss://59e6345689bc4f5fafcf56db4088e8c4.s1.eu.hivemq.cloud:8884/mqtt", // hoặc url mặc định của bạn
  username: string = "",
  options?: { clientId?: string; password?: string }
) {
  const clientRef = useRef<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const generatedClientId =
      options?.clientId ||
      "client_" + Math.random().toString(36).substring(2, 10);

    console.log("🔌 Connecting to MQTT broker...");

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

    return () => {
      client.end(true, () => {
        console.log("🔌 MQTT client disconnected cleanly");
      });
    };
  }, [url, username, options?.password]);

  return {
    clientRef,
    isConnected,
    messages,
    error,
  };
}
