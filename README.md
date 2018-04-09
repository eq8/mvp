# eq8/onprem

A minimal on-prem installer

## REQUIREMENTS

### Developer Tools

- git
- make
- openssl

### Docker w/ Swarmkit initialized and nodes labeled

- install Docker: https://docs.docker.com/install/
- create a swarm: https://docs.docker.com/engine/swarm/swarm-mode/#view-the-join-command-or-update-a-swarm-join-token

### Install `docker-compose` CLI

- https://docs.docker.com/compose/install/

## USAGE

### Initialize

- Build and pull the images
- Run a Docker Registry service
- Push the images into the Docker Registry
- Deploy the Docker stack

```
# On a manager node of Docker
git clone --recurse-submodules git@github.com:eq8/onprem.git

# TODO: edit docker-compose.yml and add related submodules in the services directory
make build
make ship
make run
```

### Updates

```
make update
make build
make ship
make run
```

### Remove

```
make clean
```
