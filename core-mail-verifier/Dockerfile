FROM node:12.10-buster-slim as builder
LABEL stage=builder
RUN apt-get -y update
WORKDIR /app/core-mail-verifier
COPY package*.json ./
COPY ./src ./src
COPY tsconfig.json .
RUN npm i -s && npm run build

FROM node:12.10-alpine
RUN mkdir -p /home/node/core-mail-verifier/node_modules && chown -R node:node /home/node/core-mail-verifier
WORKDIR /home/node/core-mail-verifier
COPY package*.json ./
COPY --from=builder /app/core-mail-verifier/dist ./dist
COPY /templates ./templates
USER node
RUN npm i --production --no-optional -s
EXPOSE 6675
CMD ["node","./dist/index.js"]
