FROM node:18-alpine

RUN mkdir -p /data

WORKDIR /app
COPY package.json ./
RUN npm install --production
COPY . .

EXPOSE 80
CMD ["node", "index.js"]
