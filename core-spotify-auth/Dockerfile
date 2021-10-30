FROM node:12.10-buster-slim as builder
LABEL stage=builder
RUN apt-get -y update
WORKDIR /app/core-spotify-auth-auth
COPY package*.json ./
COPY ./src ./src
COPY tsconfig.json .
RUN npm i -s && npm run build

FROM node:12.10-alpine
RUN mkdir -p /home/node/core-spotify-auth/node_modules && chown -R node:node /home/node/core-spotify-auth
WORKDIR /home/node/core-spotify-auth
COPY package*.json ./
COPY --from=builder /app/core-spotify-auth/dist ./dist
USER node
RUN npm i --production --no-optional -s
EXPOSE 6677
CMD ["node","./dist/index.js"]