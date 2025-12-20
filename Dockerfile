# syntax=docker/dockerfile:1
ARG NODE_VERSION=22
FROM node:${NODE_VERSION}-alpine

ARG MOCK_PATH=mocks
ENV MOCK_PATH=${MOCK_PATH} \
    NODE_ENV=production

WORKDIR /app

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

COPY package*.json ./
RUN npm ci --only=production && \
    npm cache clean --force

COPY --chown=nodejs:nodejs server.js ./

RUN mkdir -p ${MOCK_PATH} && \
    chown nodejs:nodejs ${MOCK_PATH}

USER nodejs

EXPOSE 3000

CMD ["node", "server.js"]
