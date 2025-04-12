#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include <ESP32Servo.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>

// ===== Chân kết nối =====
#define DS18B20_PIN 4
#define TDS_PIN 34
#define TURBIDITY_PIN 35
#define TURBIDITY_DOUT 25
#define SERVO_PIN 18

#define VREF 3.3
#define TDS_FACTOR 0.5

// ===== WiFi =====
const char *ssid = "CAI PHIN cafe";
const char *password = "homnaybanthenao";

// ===== MQTT HiveMQ Cloud =====
const char *mqtt_server = "abdaef3e94154ecdb21371e844ac801c.s1.eu.hivemq.cloud";
const int mqtt_port = 8883;
const char *mqtt_username = "ChiCuong";
const char *mqtt_password = "TestIoT123";

WiFiClientSecure espClient;
PubSubClient client(espClient);

// ===== Cảm biến =====
OneWire oneWire(DS18B20_PIN);
DallasTemperature sensors(&oneWire);
LiquidCrystal_I2C lcd(0x27, 16, 2);

// ===== Servo =====
Servo feederServo;

// ===== Thời gian đọc cảm biến =====
unsigned long lastSensorReadTime = 0;
const unsigned long SENSOR_INTERVAL = 1000;

// ===== Kết nối WiFi =====
void setup_wifi()
{
  delay(10);
  Serial.print("Connecting to WiFi");
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED)
  {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected");
  Serial.println(WiFi.localIP());
}

// ===== Callback MQTT =====
void callback(char *topic, byte *payload, unsigned int length)
{
  String message = "";
  for (int i = 0; i < length; i++)
  {
    message += (char)payload[i];
  }
  Serial.println("Message arrived [" + String(topic) + "]: " + message);

  // Check messages on the "esp32/sensor/command" topic
  if (String(topic) == "esp32/sensor/command")
  {
    if (message == "FEED")
    {
      // Perform the feeding turn sequence
      Serial.println("Feed command received. Turning servo...");
      feederServo.write(180); // Turn to feeding position (adjust angle if needed)
      delay(500);             // Wait for half a second (adjust duration if needed)
      feederServo.write(90);  // Return to resting position (adjust angle if needed)
      Serial.println("Feeding cycle complete.");
    }
    // You can keep the "on"/"off" logic if you still need it for testing
    else if (message == "on")
    {
      feederServo.write(180);
      Serial.println("Servo ON (Manual)");
    }
    else if (message == "off")
    {
      feederServo.write(90);
      Serial.println("Servo OFF (Manual)");
    }
    else
    {
      Serial.println("Unknown command message: " + message);
    }
  }
  // You might handle messages on other topics here if needed
}

// ===== Kết nối MQTT =====
void reconnect()
{
  while (!client.connected())
  {
    Serial.print("Connecting to MQTT...");
    String clientID = "ESP32Client-" + String(random(0xffff), HEX);
    if (client.connect(clientID.c_str(), mqtt_username, mqtt_password))
    {
      Serial.println("connected");
      client.subscribe("esp32/sensor/data");    // Subscribe topic "esp32/sensor/data"
      client.subscribe("esp32/sensor/command"); // Subscribe topic "esp32/sensor/command"
    }
    else
    {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" try again in 5 seconds");
      delay(5000);
    }
  }
}

// ===== SETUP =====
void setup()
{
  Serial.begin(115200);

  setup_wifi();

  espClient.setInsecure(); // Bỏ kiểm tra chứng chỉ
  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(callback);

  lcd.init();
  lcd.backlight();
  lcd.setCursor(0, 0);
  lcd.print("Water Quality");

  sensors.begin();
  pinMode(TURBIDITY_DOUT, INPUT);

  feederServo.attach(SERVO_PIN);
  feederServo.write(90); // Góc dừng ban đầu
}

// ===== LOOP =====
void loop()
{
  if (!client.connected())
  {
    reconnect();
  }
  client.loop();

  unsigned long currentTime = millis();

  // ===== Đọc cảm biến mỗi giây =====
  if (currentTime - lastSensorReadTime >= SENSOR_INTERVAL)
  {
    lastSensorReadTime = currentTime;

    sensors.requestTemperatures();
    float tempC = sensors.getTempCByIndex(0);

    int tdsAnalog = analogRead(TDS_PIN);
    float tdsVoltage = tdsAnalog * VREF / 4095.0;
    float tdsValue = tdsVoltage * TDS_FACTOR * 1000;

    int turbidityAnalog = analogRead(TURBIDITY_PIN);
    float turbidityVoltage = turbidityAnalog * VREF / 4095.0;
    float turbidityValue = (1.0 - (turbidityVoltage / VREF)) * 100;

    int turbidityStatus = digitalRead(TURBIDITY_DOUT);

    Serial.print("Temp: ");
    Serial.print(tempC);
    Serial.print(" C, TDS: ");
    Serial.print(tdsValue);
    Serial.print(" ppm, Turbidity: ");
    Serial.print(turbidityValue);
    Serial.print(" %, DOUT: ");
    Serial.println(turbidityStatus);

    // Hiển thị LCD
    lcd.setCursor(0, 0);
    lcd.print("T:");
    lcd.print(tempC, 1);
    lcd.print(" TDS:");
    lcd.print((int)tdsValue);
    lcd.print("ppm   ");

    lcd.setCursor(0, 1);
    lcd.print("Turb:");
    lcd.print((int)turbidityValue);
    lcd.print("%     ");

    // Gửi lên MQTT
    String payload = "Temp: " + String(tempC) + " C, TDS: " + String(tdsValue) + " ppm, Turbidity: " + String(turbidityValue) + " %, DOUT: " + String(turbidityStatus);
    client.publish("esp32/sensor/data", payload.c_str());
  }
}