/*
 * Three Phase Energy Monitoring - Arduino + GSM
 * Sends ONLY CURRENT data to backend
 * 
 * Hardware:
 * - Arduino Nano
 * - GSM Module (SIM800L/SIM900) on pins 10, 11
 * - Current sensor (ACS712) on A0
 */

#include <SoftwareSerial.h>

// GSM Module
SoftwareSerial gsmSerial(10, 11); // RX, TX

// Configuration
const String DEVICE_ID = "device1";
const String SERVER_URL = "http://YOUR_SERVER_IP:5000/api/sensor/data";
const unsigned long SEND_INTERVAL = 60000; // 1 minute

// Sensor pin
const int CURRENT_SENSOR_PIN = A0;

// ACS712 calibration (for ACS712-30A: 66mV per Amp)
const float SENSITIVITY = 0.066; // 66mV/A
const float V_REF = 5.0;         // Arduino reference voltage
const int ADC_MAX = 1023;

unsigned long lastSendTime = 0;

void setup() {
  Serial.begin(9600);
  gsmSerial.begin(9600);
  
  Serial.println("=== 3-Phase Energy Monitor ===");
  Serial.println("Initializing...");
  delay(2000);
  
  initGSM();
}

void loop() {
  unsigned long currentTime = millis();
  
  if (currentTime - lastSendTime >= SEND_INTERVAL) {
    // Read current
    float current = readCurrent();
    
    Serial.println("====================");
    Serial.print("Current: ");
    Serial.print(current, 2);
    Serial.println(" A");
    
    // Send to server
    sendData(current);
    
    lastSendTime = currentTime;
  }
  
  delay(100);
}

// Initialize GSM
void initGSM() {
  Serial.println("Initializing GSM...");
  
  gsmSerial.println("AT");
  delay(1000);
  if (gsmSerial.find("OK")) {
    Serial.println("✓ GSM Ready");
  } else {
    Serial.println("✗ GSM Error");
  }
  
  connectGPRS();
}

// Connect to GPRS
void connectGPRS() {
  Serial.println("Connecting to GPRS...");
  
  gsmSerial.println("AT+CGATT=1");
  delay(1000);
  
  gsmSerial.println("AT+SAPBR=3,1,\"CONTYPE\",\"GPRS\"");
  delay(1000);
  
  // Change APN according to your SIM provider
  gsmSerial.println("AT+SAPBR=3,1,\"APN\",\"internet\"");
  delay(1000);
  
  gsmSerial.println("AT+SAPBR=1,1");
  delay(2000);
  
  Serial.println("✓ GPRS Connected");
}

// Read current from ACS712
float readCurrent() {
  const int NUM_SAMPLES = 100;
  long sum = 0;
  
  // Take multiple samples for accuracy
  for (int i = 0; i < NUM_SAMPLES; i++) {
    sum += analogRead(CURRENT_SENSOR_PIN);
    delay(1);
  }
  
  int avgValue = sum / NUM_SAMPLES;
  float voltage = (avgValue / (float)ADC_MAX) * V_REF;
  
  // ACS712 outputs 2.5V at 0A
  float current = abs((voltage - 2.5) / SENSITIVITY);
  
  return current;
}

// Send data to server
void sendData(float current) {
  Serial.println("Sending data...");
  
  // Initialize HTTP
  gsmSerial.println("AT+HTTPINIT");
  delay(1000);
  
  gsmSerial.println("AT+HTTPPARA=\"CID\",1");
  delay(1000);
  
  // Set URL
  gsmSerial.print("AT+HTTPPARA=\"URL\",\"");
  gsmSerial.print(SERVER_URL);
  gsmSerial.println("\"");
  delay(1000);
  
  // Set content type
  gsmSerial.println("AT+HTTPPARA=\"CONTENT\",\"application/json\"");
  delay(1000);
  
  // Create JSON
  String json = "{\"deviceId\":\"" + DEVICE_ID + "\",\"data\":" + String(current, 2) + "}";
  
  Serial.println("JSON: " + json);
  
  // Set data length
  gsmSerial.print("AT+HTTPDATA=");
  gsmSerial.print(json.length());
  gsmSerial.println(",10000");
  delay(1000);
  
  // Send data
  gsmSerial.println(json);
  delay(2000);
  
  // POST request
  gsmSerial.println("AT+HTTPACTION=1");
  delay(5000);
  
  // Read response
  gsmSerial.println("AT+HTTPREAD");
  delay(2000);
  
  Serial.println("Response:");
  while (gsmSerial.available()) {
    Serial.write(gsmSerial.read());
  }
  
  // Terminate HTTP
  gsmSerial.println("AT+HTTPTERM");
  delay(1000);
  
  Serial.println("\n✓ Data sent!");
}
