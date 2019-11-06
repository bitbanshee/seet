#include <SoftwareSerial.h>


SoftwareSerial serialGSM(6, 7); // RX, TX

void leGSM();
void configuraGSM();

void setup() {
  Serial.begin(9600);
  serialGSM.begin(9600);

  Serial.println("Sketch Iniciado!");
  configuraGSM();
}

void loop() {
  leGSM();

  if (comandoGSM != "") {
    Serial.println(comandoGSM);
    ultimoGSM = comandoGSM;
    comandoGSM = "";
  }
}

void leGSM() {
  static String textoRec = "";
  static unsigned long delay1 = 0;
  static int count = 0;
  static unsigned char buffer[64];

  serialGSM.listen();
  if (serialGSM.available()) {

    while (serialGSM.available()) {
      buffer[count++] = serialGSM.read();
      if (count == 64)
        break;
    }

    textoRec += (char *)buffer;
    delay1 = millis();

    for (int i = 0; i < count; i++) {
      buffer[i] = NULL;
    }
    count = 0;
  }

  if (textoRec != "") {

  }
}

void configuraGSM() {
  serialGSM.print("AT+CMGF=1\n;AT+CNMI=2,2,0,0,0\n;ATX4\n;AT+COLP=1\n");
}
