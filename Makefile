# Simple Makefile for Development Environment

# Default target
.DEFAULT_GOAL := help

# Variables
COMPOSE := docker compose
PROJECT_NAME := file-convert

# Help command
help: ## Show this help message
	@echo "File Convert - Development Environment"
	@echo "======================================"
	@echo ""
	@echo "Available commands:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'
	@echo ""

# Docker commands
up: ## Start frontend in Docker
	$(COMPOSE) up -d
	@echo "✅ Frontend started: http://localhost:5173"

down: ## Stop all services
	$(COMPOSE) down

restart: ## Restart services
	$(COMPOSE) restart

build: ## Build Docker images
	$(COMPOSE) build

rebuild: ## Rebuild Docker images (no cache)
	$(COMPOSE) build --no-cache

logs: ## View logs
	$(COMPOSE) logs -f

# Development shortcuts
dev: ## Start local development server
	cd apps/frontend && bun run dev
	@echo "✅ Development server started: http://localhost:5173"

clean: ## Clean up containers and images
	$(COMPOSE) down -v --rmi local
	@echo "🧹 Cleanup complete"

status: ## Show status of services
	$(COMPOSE) ps

# Installation
install: ## Install dependencies
	bun install
	cd apps/frontend && bun install
	@echo "✅ All dependencies installed"

# Testing
test: ## Run tests
	cd apps/frontend && bun run test
	@echo "✅ Tests complete"

# Build for production
build-prod: ## Build for production
	cd apps/frontend && bun run build
	@echo "✅ Production build complete in apps/frontend/build"

.PHONY: help up down restart build rebuild logs dev clean status install test build-prod
