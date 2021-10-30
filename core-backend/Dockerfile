FROM node:10.16-buster-slim as builder
LABEL stage=builder
RUN apt-get -y update && apt-get -y install git protobuf-compiler
WORKDIR /app
RUN git clone [protos repository]
WORKDIR /app/core-backend
COPY package*.json ./
COPY ./src ./src
COPY tsconfig.json .
RUN npm i -s && npm run build

FROM node:10.16-buster-slim
RUN apt-get update && rm -rf /var/lib/apt/lists/*
RUN mkdir -p /home/node/core-backend/node_modules && chown -R node:node /home/node/core-backend
WORKDIR /home/node/core-backend
COPY package*.json ./
COPY --from=builder /app/core-backend/dist ./dist
COPY /mail-templates ./mail-templates
USER node
RUN npm i --production --no-optional -s
EXPOSE 50052
CMD ["node","./dist/app.js"]