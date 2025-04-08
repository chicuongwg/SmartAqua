#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>  // Thêm thư viện MQTT

// Khai báo chân kết nối
#define DS18B20_PIN 4    // Chân GPIO4 cho DS18B20
#define TDS_PIN 34       // Chân GPIO34 (ADC) cho cảm biến TDS
#define TURBIDITY_PIN 35 // Chân GPIO35 (ADC) cho cảm biến độ đục

// Điện áp tham chiếu và hệ số TDS
#define VREF 3.3         // Điện áp tham chiếu ADC (ESP32 dùng 3.3V)
#define TDS_FACTOR 0.5   // Hệ số chuyển đổi từ điện áp sang ppm

// WiFi
const char* ssid = "Tuyet Mai";
const char* password = "19092003";

// MQTT broker thông tin
const char* mqtt_server = "82af56b3a17f48efa9c5e0877cb7ae5a.s1.eu.hivemq.cloud";
const int mqtt_port = 8883;
const char* mqtt_username = "dltmai"; // User
const char* mqtt_password = "Dltmai1410"; // Password

// Khởi tạo DS18B20
OneWire oneWire(DS18B20_PIN);
DallasTemperature sensors(&oneWire);

// LCD địa chỉ I2C
LiquidCrystal_I2C lcd(0x27, 16, 2);

// Khai báo MQTT
WiFiClientSecure espClient;
PubSubClient client(espClient);

unsigned long lastMsg = 0;
#define MSG_BUFFER_SIZE (50)
char msg[MSG_BUFFER_SIZE];

// Hàm kết nối WiFi
void setup_wifi() {
  delay(10);
  Serial.print("Connecting to WiFi");

  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("\nWiFi connected");
  Serial.print("IP: ");
  Serial.println(WiFi.localIP());
}

// Hàm callback khi nhận tin nhắn
void callback(char* topic, byte* payload, unsigned int length) {
  String incommingMessage = "";
  for(int i=0; i<length;i++) incommingMessage += (char)payload[i];
  Serial.println("Message arrived ["+String(topic)+"]"+incommingMessage);
}

// Hàm kết nối MQTT
void reconnect() {
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection...");
    String clientID =  "ESPClient-";
    clientID += String(random(0xffff),HEX);
    if (client.connect(clientID.c_str(), mqtt_username, mqtt_password)) {
      Serial.println("connected");
      client.subscribe("esp32/sensor/data");
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" try again in 5 seconds");
      delay(5000);
    }
  }
}

void setup() {
  Serial.begin(115200);

  setup_wifi();

  // Khởi tạo MQTT server và callback
  espClient.setInsecure();
  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(callback);

  // LCD
  lcd.init();
  lcd.backlight();
  lcd.setCursor(0, 0);
  lcd.print("Water Quality");

  // DS18B20
  sensors.begin();
}

void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();

   // Đọc nhiệt độ từ DS18B20
    sensors.requestTemperatures();
    float tempC = sensors.getTempCByIndex(0);

// Đọc giá trị ADC từ cảm biến TDS
    int tdsAnalog = analogRead(TDS_PIN);
    float tdsVoltage = tdsAnalog * VREF / 4095.0; // ESP32 ADC 12-bit
    float tdsValue = tdsVoltage * TDS_FACTOR * 1000; // Chuyển đổi sang ppm

    // Đọc giá trị ADC từ cảm biến độ đục
    int turbidityAnalog = analogRead(TURBIDITY_PIN);
    float turbidityVoltage = turbidityAnalog * VREF / 4095.0;
    float turbidityValue = (1.0 - (turbidityVoltage / VREF)) * 100; // Quy đổi sang %

    // Hiển thị lên Serial Monitor
    Serial.print("Temp: ");
    Serial.print(tempC);
    Serial.print(" C, TDS: ");
    Serial.print(tdsValue);
    Serial.print(" ppm, Turbidity: ");
    Serial.print(turbidityValue);
    Serial.println(" %");

    // Cập nhật màn hình LCD chỉ một lần
    lcd.setCursor(0, 0);
    lcd.print("T:");
    lcd.print(tempC, 1); // Chỉ hiển thị 1 chữ số sau dấu phẩy
    lcd.print(" TDS:");
    lcd.print(tdsValue, 0); // Không cần chữ số sau dấu phẩy
    lcd.print("ppm");

    lcd.setCursor(0, 1);
    lcd.print("Turb:");
    lcd.print(turbidityValue, 1); // Chỉ hiển thị 1 chữ số sau dấu phẩy
    lcd.print("%  "); // Xóa số cũ nếu giá trị ngắn hơn

    delay(500); // Cập nhật mỗi giây

  // Gửi dữ liệu lên MQTT
  String payload = "Temp: " + String(tempC) + " C, TDS: " + String(tdsValue) + " ppm, Turbidity: " + String(turbidityValue) + " %";
  client.publish("esp32/sensor/data", payload.c_str());  // Gửi dữ liệu lên topic 'esp32/sensor/data'
}
