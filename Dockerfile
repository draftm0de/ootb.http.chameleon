# syntax=docker/dockerfile:1
ARG NODE_VERSION=22
FROM node:${NODE_VERSION}-alpine

ARG MOCK_PATH=mocks
ENV MOCK_PATH=${MOCK_PATH}

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY server.js ./

RUN mkdir -p ${MOCK_PATH} && chmod 777 ${MOCK_PATH}

EXPOSE 3000

CMD ["npm", "start"]
