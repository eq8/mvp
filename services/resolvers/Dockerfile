FROM node:8.11.3

WORKDIR /workspace

ENV PORT=80
ENV LOG_LEVEL=info

COPY package.json /workspace/package.json
RUN npm install

COPY index.js /workspace/index.js
COPY lib /workspace/lib

CMD node index.js --port=${PORT} --log-level=${LOG_LEVEL}
