# Makefile
install: install-deps

install-deps:
	npm ci

test:
	npm test

test-coverage:
	npm test -- --coverage --coverageProvider=v8

lint:
	npx eslint . --fix

develop:
	npx webpack serve

publish:
	npm publish --dry-run

build: 
	rm -rf dist
	NODE_ENV=production npx webpack
	# npm run build
