FROM node:16
RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app
WORKDIR /home/node/app
COPY --chown=node:node . .
USER node

RUN npm install -g npm
RUN npm install --force
RUN ls -la
RUN npm run buildweb

EXPOSE 8095
CMD [ "node", "src/background/server.js" ]