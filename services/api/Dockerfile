FROM node:10.8.0

VOLUME /var/run
WORKDIR /workspace

ENV STORE_URI=rethinkdb://admin@rethinkdb:28015
ENV PORT=80
ENV LOG_LEVEL=info

COPY package.json /workspace/package.json
RUN npm install

COPY index.js /workspace/index.js
COPY lib /workspace/lib

CMD node index.js --port=${PORT} --store-uri=${STORE_URI} --log-level=${LOG_LEVEL}
