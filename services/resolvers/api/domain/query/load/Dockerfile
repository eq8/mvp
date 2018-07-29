FROM node:8.11.3-alpine

ENV PORT 80

WORKDIR /workspace

COPY package.json /workspace/
RUN npm install

COPY index.js /workspace/

CMD node index.js
