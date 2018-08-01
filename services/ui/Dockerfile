FROM node:8.11.3

ENV PORT=80

WORKDIR /workspace

COPY package.json /workspace/package.json
RUN npm install

COPY ./index.js /workspace/index.js
COPY ./static /workspace/static

RUN cd static && npm install && npm run build

CMD node index.js --log-level=${LOG_LEVEL} --port=${PORT}
