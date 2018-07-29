FROM node:8.11.1

ENV HOST rethinkdb
ENV PORT 28015

WORKDIR /workspace

COPY wait-for-it.sh /workspace/
COPY package.json /workspace/
RUN npm install

COPY index.js /workspace/

CMD ./wait-for-it.sh -t 0 -h ${HOST} -p ${PORT} -- node index.js
