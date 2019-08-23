.PHONY: install
install:
	cd website && npm install

.PHONY: start
start:
	cd website && npm start

.PHONY: build
build:
	cd website && npm run build

.PHONY: publish
publish:
	cd website && npm run publish
