FROM node:18

RUN apt-get update && \
    apt-get install -y ffmpeg && \
    apt-get clean

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN mkdir -p uploads outputs

EXPOSE 3000

CMD ["node", "server.js"]
