#include <SoftwareSerial.h>
#include <TinyGPS.h>

SoftwareSerial gps_serial(4, 5); // RX, TX
TinyGPS gps;

void setup() {
  gps_serial.begin(9600);
  Serial.begin(9600);
}

void loop() {
  bool is_valid_info = false;

  while (gps_serial.available()) {
    char read = gps_serial.read();
    is_valid_info = gps.encode(read);
  }

  if (!is_valid_info) {
    return;
  }

  Serial.println("----------------------------------------");

  long latitude, longitude;
  unsigned long age;
  gps.get_position(&latitude, &longitude, &age);

  if (latitude != TinyGPS::GPS_INVALID_F_ANGLE) {
    Serial.print("Latitude: ");
    Serial.println(latitude / 1000000.0, 6);
  }

  if (longitude != TinyGPS::GPS_INVALID_F_ANGLE) {
    Serial.print("Longitude: ");
    Serial.println(longitude / 1000000.0, 6);
  }

  if (age != TinyGPS::GPS_INVALID_AGE) {
    Serial.print("Age (ms): ");
    Serial.println(age);
  }

  // Date and time
  int year;
  byte month, day, hour, minute, second, hundredth;
  gps.crack_datetime(&year, &month, &day, &hour, &minute, &second, &hundredth,
                     &age);

  Serial.print("Date (GMT): ");
  Serial.print(day);
  Serial.print("/");
  Serial.print(month);
  Serial.print("/");
  Serial.println(year);

  Serial.print("Time (GMT): ");
  Serial.print(hour);
  Serial.print(":");
  Serial.print(minute);
  Serial.print(":");
  Serial.print(second);
  Serial.print(":");
  Serial.println(hundredth);

  float altitude = gps.f_altitude();
  if (altitude != TinyGPS::GPS_INVALID_ALTITUDE && altitude != TinyGPS::GPS_INVALID_F_ALTITUDE) {
    Serial.print("Altitude (cm): ");
    Serial.println(altitude);
  }

  float speed = gps.f_speed_kmph();
  Serial.print("Speed (km/h): ");
  Serial.println(speed, 2);

  unsigned long course = gps.course();
  Serial.print("Course (degree): ");
  Serial.println(float(course) / 100, 2);

  unsigned short satellites = gps.satellites();
  if (satellites != TinyGPS::GPS_INVALID_SATELLITES) {
    Serial.print("Satelites: ");
    Serial.println(satellites);
  }

  unsigned long horizontal_accuracy = gps.hdop();
  if (horizontal_accuracy != TinyGPS::GPS_INVALID_HDOP) {
    Serial.print("Horizontal accuracy (hundredths de second): ");
    Serial.println(horizontal_accuracy);
  }
}

// API info to send
// {
//   "coordinates": "string",
//   "altitude_cm": 0,
//   "precision": 0,
//   "age": 0,
//   "speed": 0,
//   "sent_time": "string"
// }
