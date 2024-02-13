.PHONY: help
help: ## display help for this makefile
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

.PHONY: build ## Build docker images
build:
	docker compose build

.PHONY: test ## Run tests
test:
	docker compose run --rm gql npm test

.PHONY: local-init ## Build & start the service
local-init:
	docker compose build
	docker compose up -d

.PHONY: local-start ## Start the service
local-start:
	docker compose up -d

.PHONY: local-dev ## Start the service in development mode
local-dev:
	docker compose run --rm gql npm run dev

.PHONY: local-stop ## Stop the service
local-stop:
	docker compose stop

.PHONY: local-clean ## Delete the service.
local-clean:
	docker compose stop
	docker compose down
