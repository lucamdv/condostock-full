FROM node:20

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

# O comando de start será injetado pelo docker-compose.yml