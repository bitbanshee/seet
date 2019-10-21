FROM node:latest

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci --only=production

COPY . .

FROM node:slim

WORKDIR /usr/src/app

COPY --from=0 /usr/src/app/package*.json /usr/src/app/*.mjs ./
COPY --from=0 /usr/src/app/node_modules ./node_modules/
COPY --from=0 /usr/src/app/src ./src/

VOLUME ./sensitive

CMD ["npm", "start"]