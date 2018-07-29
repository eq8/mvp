REGISTRY_IMAGE?=registry:2
REGISTRY_NAMESPACE?=equate
REGISTRY_NAME?=$(REGISTRY_NAMESPACE)_registry
REGISTRY_HOST?=127.0.0.1
REGISTRY_PORT?=5000
PWD=$(shell pwd)
STACK_NAME?=mvp
STACK_NETWORK?=net
GIT_BRANCH?=master
BOOT_NAME?=install

.env:
	echo "REGISTRY_HOST=$(REGISTRY_HOST):$(REGISTRY_PORT)" > .env
	echo "REGISTRY_NAMESPACE=$(REGISTRY_NAMESPACE)" >> .env

help:
	clear
	@echo docker load -i install.img
	@echo docker run -i --rm -v /var/run/docker.sock:/var/run/docker.sock $(REGISTRY_NAMESPACE)/$(BOOT_NAME) ship
	@echo docker run -i --rm -v /var/run/docker.sock:/var/run/docker.sock $(REGISTRY_NAMESPACE)/$(BOOT_NAME) run

build: .env
	docker-compose build --pull
	mkdir -p $(PWD)/bin
	@echo 'Saving docker images...'
	docker-compose config | docker run -i --rm evns/yq '.services|.[]|.image' | grep $(REGISTRY_HOST) | grep -o '[^"]\+' | awk '{split($$0,a,"/"); print "./bin/" a[3] ".img " $$0}' | xargs -n 2 docker save -o
	@echo 'Building installer...'
	docker build -t $(REGISTRY_NAMESPACE)/$(BOOT_NAME) .
	@echo 'Saving installer...'
	docker save -o $(PWD)/$(BOOT_NAME).img $(REGISTRY_NAMESPACE)/$(BOOT_NAME)
	$(MAKE) help

docker-compose.tmp.yml:
	# cat docker-compose.yml | grep -v '^[ ]*build:' > $(PWD)/docker-compose.tmp.yml
	docker-compose config > $(PWD)/docker-compose.tmp.yml

ship: .env docker-compose.tmp.yml
	-docker service create --name $(REGISTRY_NAME) --mount type=volume,destination=/var/lib/registry -p $(REGISTRY_PORT):5000 $(REGISTRY_IMAGE)
	ls $(PWD)/bin | awk '{print "$(PWD)/bin/" $$1}'| xargs -n 1 docker load -i 
	docker-compose -f $(PWD)/docker-compose.tmp.yml push

run: .env docker-compose.tmp.yml
	docker-compose -f $(PWD)/docker-compose.tmp.yml config> $(PWD)/docker-stack.yml
	docker stack deploy --resolve-image always -c $(PWD)/docker-stack.yml $(STACK_NAME)
	docker service ls
	docker stack ps $(STACK_NAME)

update:
	git checkout $(GIT_BRANCH)
	# TBD: make sure this next command resets submodules to latest
	git pull --recurse-submodules

clean:
	-docker service rm $(REGISTRY_NAME)
	-docker stack rm $(STACK_NAME)
	-rm -rf .env docker-compose.tmp.yml bin
	docker system prune -a
