FROM node:8.11.3

WORKDIR /workspace

ENV STORE_URI=rethinkdb://admin@rethinkdb:28015

COPY package.json /workspace/package.json
RUN npm install

COPY index.js /workspace/index.js
COPY plugins /workspace/plugins

CMD node index.js
