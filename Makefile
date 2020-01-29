GIT_USER ?= $(shell git config --get github.user)
USE_SSH ?= true
VERSION ?= $(shell cat VERSION)

CLI_DOCS_SRC ?= ../cli/docs
CLI_DOCS_DIR ?= docs/$(VERSION)/cli
CLI_FILES := $(patsubst $(CLI_DOCS_SRC)/%, $(CLI_DOCS_DIR)/%, $(wildcard $(CLI_DOCS_SRC)/*))

.PHONY: install
install: ## install docusaurus and dependencies using npm
	cd website && npm install

.PHONY: start dev
start dev: ## start a dev server and open browser
	cd website && npm start

.PHONY: build
build: ## run docusaurus build - output to website/build
	cd website && npm run build

.PHONY: clean-cli
clean-cli: ## remove existing CLI markdown files for the current VERSION
	rm $(CLI_DOCS_DIR)/* || echo no-files

.PHONY: cli
cli: clean-cli $(CLI_FILES)  ## copy CLI markdown files from CLI_DOCS_SRC (../cli/docs)

$(CLI_DOCS_DIR)/%: $(CLI_DOCS_SRC)/%
	sed -e '5,6d' \
		-e 's/title: "riff streaming pulsar/title: "pulsar/' \
		-e 's/title: "riff streaming inmemory/title: "inmemory/' \
		-e 's/title: "riff streaming kafka/title: "kafka/' \
		<$< >$@

.PHONY: publish
publish:
	@export GIT_USER
	@export USE_SSH
	@env | grep -e "GIT_USER" -e "USE_SSH"
	cd website && npm run publish

# Absolutely awesome: http://marmelab.com/blog/2016/02/29/auto-documented-makefile.html
help: ## Print help for each make target
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'
