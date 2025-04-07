import { useState, useEffect } from "react";
import mqtt from "mqtt";

// Sửa lại hook để chỉ định kiểu dữ liệu cho `brokerUrl` và `topic`
export const useMqtt = (brokerUrl: string, topic: string) => {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    // Tạo client MQTT và kết nối đến broker
    const client = mqtt.connect(brokerUrl, {
      username: "dltmai", // Username từ MQTT broker của bạn
      password: "Dltmai1410", // Password từ MQTT broker của bạn
      port: 8884, // Sử dụng cổng WebSocket
      protocol: "wss", // Sử dụng WebSocket Secure
    });

    // Khi client MQTT đã kết nối, đăng ký vào topic
    client.on("connect", () => {
      console.log("Connected to MQTT broker");
      client.subscribe(topic, (err) => {
        if (err) {
          console.error("Subscription failed", err);
        } else {
          console.log(`Subscribed to topic: ${topic}`);
        }
      });
    });

    // Lắng nghe các tin nhắn đến từ broker
    client.on("message", (topic, payload) => {
      const message = payload.toString(); // Chuyển payload thành chuỗi
      console.log(`Received message: ${message}`);
      setMessage(message); // Lưu dữ liệu vào state
    });

    // Dọn dẹp khi component unmount
    return () => {
      client.end(); // Ngắt kết nối MQTT khi component bị hủy
    };
  }, [brokerUrl, topic]);

  return message;
};
