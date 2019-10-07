FROM node:latest

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci --only=production

COPY . .

VOLUME ./sensitive

CMD ["node", "--experimental-modules", "server.js"]