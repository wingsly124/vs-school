FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY server/package*.json ./server/
COPY web/package*.json ./web/

RUN npm install

COPY . .

RUN npm run build --workspace web

EXPOSE 3001

ENV NODE_ENV=production

CMD ["npm", "run", "start", "--workspace", "server"]
