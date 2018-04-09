FROM ubuntu:xenial

RUN apt-get update && apt-get install -y curl make

RUN curl -fsSL get.docker.com | sh
RUN curl -L https://github.com/docker/compose/releases/download/1.20.1/docker-compose-$(uname -s)-$(uname -m) -o /usr/local/bin/docker-compose && chmod a+x /usr/local/bin/docker-compose

WORKDIR /opt/onprem

COPY Makefile /opt/onprem/Makefile
COPY docker-compose.yml /opt/onprem/docker-compose.yml
COPY bin /opt/onprem/bin

ENTRYPOINT ["make"]
CMD ["help"]
