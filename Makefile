GIT_USER ?= $(shell git config --get github.user)
USE_SSH ?= true

.PHONY: install
install:
	cd website && npm install

.PHONY: start dev
start dev:
	cd website && npm start

.PHONY: build
build:
	cd website && npm run build

.PHONY: publish
publish:
	@export GIT_USER
	@export USE_SSH
	@env | grep -e "GIT_USER" -e "USE_SSH"
	cd website && npm run publish
