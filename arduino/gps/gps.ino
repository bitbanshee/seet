#include <SoftwareSerial.h>
#include <TinyGPS.h>

SoftwareSerial gps_serial(4, 5); // RX, TX
TinyGPS gps;

typedef struct seet_api_payload
{
  long latitude;
  long longitude;
  unsigned long age;
}

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

  //long latitude, longitude;
  float latitude, longitude;
  unsigned long age;
  //gps.get_position(&latitude, &longitude, &age);
  gps.f_get_position(&latitude, &longitude, &age);

  if (latitude != TinyGPS::GPS_INVALID_F_ANGLE) {
    Serial.print("Latitude: ");
    //Serial.println(latitude / 1000000.0, 6);
    Serial.println(latitude / 1000000.0, 6);
  }

  if (longitude != TinyGPS::GPS_INVALID_F_ANGLE) {
    Serial.print("Longitude: ");
    //Serial.println(longitude / 1000000.0, 6);
    Serial.println(longitude, 6);
  }

  if (age != TinyGPS::GPS_INVALID_AGE) {
    Serial.print("Age (ms): ");
    Serial.println(age);
  }

  // Date and time
  int year;
  byte month, day, hour, minute, second, hundredth;
  gps.crack_datetime(&year, &month, &day, &hour, &minute, &second, &hundredth, &age);

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
  } else {
    altitude = NULL;
  }

  float speed = gps.f_speed_kmph();
  Serial.print("Speed (km/h): ");
  Serial.println(speed, 2);

  unsigned long course = gps.course();
  Serial.print("Course (degree): ");
  Serial.println(float(course) / 100, 2);

  unsigned short satellites = gps.satellites();
  if (satellites != TinyGPS::GPS_INVALID_SATELLITES) {
    Serial.print("Satellites: ");
    Serial.println(satellites);
  }

  unsigned long horizontal_accuracy = gps.hdop();
  if (horizontal_accuracy != TinyGPS::GPS_INVALID_HDOP) {
    Serial.print("Horizontal accuracy (hundredths de second): ");
    Serial.println(horizontal_accuracy);
  }
}

string iso8601 (int *year, byte *month, byte *day, 
  byte *hour, byte *minute, byte *second, byte *hundredths)
{
  //alocação dinamica
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
*char payloadJSON (seet_api_payload *ps)
{
  char *json;
  append(json, "{");
  append(json, "\"coordinates\":");
  append(json, "\"");
  append(json, build_coordinates(seet_api_payload.latitude, seet_api_payload.longitude));
  append(json, "\"");
}

*char append (char *str, char *to_append)
{
  str = (char *)realloc(strlen(to_append), sizeof(char));
  if (str == NULL) {
    str = (char *)calloc(strlen(to_append), sizeof(char));
  }
  return strcat(str, to_append);
}

*char build_coordinates (long latitude, long longitude)
{
  char *coordinates = "(";
  char *buff;
  int n;

  n = snprintf(NULL, 0, "%.6f", latitude);
  buff = (char *)calloc(n + 1, sizeof(char));
  snprintf(buff, n + 1, "%.6f", latitude);
  append(coordinates, buff);

  append(coordinates, ",");
  
  n = snprintf(NULL, 0, "%.6f", longitude);
  buff = (char *)realloc(n + 1, sizeof(char));
  snprintf(buff, n + 1, "%.6f", longitude);
  append(coordinates, buff);

  return append(coordinates, ")");
}