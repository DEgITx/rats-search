FROM node:20
ARG DEBIAN_FRONTEND=noninteractive
RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app
WORKDIR /home/node/app
COPY --chown=node:node . .
RUN npm install -g npm
USER node

RUN npm install --force
RUN ls -la
RUN npm run buildweb

EXPOSE 8095
CMD [ "node", "src/background/server.js" ]