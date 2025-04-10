const mqtt = require('mqtt');

// Start with regular TCP instead of WebSockets - matches your React app
let BROKER_URL = 'mqtt://broker.hivemq.com:1883';

// Matching topic structure from your React app
const TOPICS = {
  TEMPERATURE: 'smart-aqua/temp',
  PH: 'smart-aqua/ph',
  TDS: 'smart-aqua/tds',
  TURBIDITY: 'smart-aqua/turbidity',
  COMMAND: 'smart-aqua/commands/feed' // Match the topic in your dashboard.tsx
};

class MqttClient {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.connect();
  }

  connect() {
    console.log(`Connecting to MQTT broker: ${BROKER_URL}`);
    
    // More robust connection options
    const options = {
      clientId: `smartaqua-server-${Math.random().toString(16).slice(2, 8)}`,
      clean: true,
      reconnectPeriod: 5000,
      connectTimeout: 30 * 1000,
      keepalive: 60,
      rejectUnauthorized: false
    };
    
    try {
      this.client = mqtt.connect(BROKER_URL, options);

      this.client.on('connect', () => {
        this.isConnected = true;
        console.log('Connected to MQTT broker successfully');
        
        // Subscribe to all sensor topics
        Object.values(TOPICS).forEach(topic => {
          this.client.subscribe(topic, (err) => {
            if (!err) {
              console.log(`Subscribed to ${topic}`);
            } else {
              console.error(`Failed to subscribe to ${topic}:`, err);
            }
          });
        });
      });

      this.client.on('message', (topic, message) => {
        try {
          const payload = JSON.parse(message.toString());
          console.log(`Received message on ${topic}:`, payload);
        } catch (error) {
          console.log(`Received raw message on ${topic}:`, message.toString());
        }
      });

      this.client.on('error', (error) => {
        console.error('MQTT error:', error);
        
        // If current connection method fails, try alternatives
        if (error.code === 'ECONNREFUSED' || error.code === 'ECONNRESET') {
          if (this.client) {
            this.client.end(true);
          }
          
          // Try an alternative connection method
          if (BROKER_URL.startsWith('mqtt://')) {
            console.log('Trying WebSocket connection instead...');
            BROKER_URL = 'ws://broker.hivemq.com:8000/mqtt';
            setTimeout(() => this.connect(), 5000);
          } else if (BROKER_URL.startsWith('ws://')) {
            console.log('Trying secure WebSocket connection...');
            BROKER_URL = 'wss://broker.hivemq.com:8884/mqtt';
            setTimeout(() => this.connect(), 5000);
          } else if (BROKER_URL.startsWith('wss://')) {
            console.log('Trying alternative MQTT broker...');
            BROKER_URL = 'mqtt://test.mosquitto.org:1883';
            setTimeout(() => this.connect(), 5000);
          }
        }
      });
      
      this.client.on('disconnect', () => {
        this.isConnected = false;
        console.log('Disconnected from MQTT broker');
      });
      
      this.client.on('reconnect', () => {
        console.log('Attempting to reconnect to MQTT broker...');
      });
    } catch (err) {
      console.error('Error creating MQTT client:', err);
    }
  }

  publishMessage(topic, data) {
    if (!this.isConnected) {
      console.warn('Not connected to MQTT broker');
      return false;
    }

    try {
      const payload = JSON.stringify(data);
      this.client.publish(topic, payload);
      console.log(`Published to ${topic}:`, payload);
      return true;
    } catch (error) {
      console.error('Error publishing message:', error);
      return false;
    }
  }

  // Method to send commands to ESP32
  sendCommand(command, value) {
    return this.publishMessage(TOPICS.COMMAND, {
      command,
      value,
      timestamp: new Date().toISOString()
    });
  }
}

// Create and export a singleton instance
const mqttClient = new MqttClient();
module.exports = mqttClient;