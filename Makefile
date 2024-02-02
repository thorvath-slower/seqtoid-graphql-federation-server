.PHONY: help
help: ## display help for this makefile
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

.PHONY: build 
build: ## Build docker images
	docker compose build

.PHONY: test
test: ## Run tests
	docker compose run --rm gql npm test

.PHONY: local-init
local-init: ## Build & start the service
	docker compose build
	docker compose up -d

.PHONY: local-start
local-start: ## Start the service
	docker compose up -d

.PHONY: local-stop
local-stop: ## Stop the service
	docker compose stop

.PHONY: local-clean
local-clean: ## Delete the service.
	docker compose stop
	docker compose down
