# Makefile for KwikShot Docker operations
# Project: kwikshot - Professional Screen Recorder & Video Editor

# Variables
IMAGE_NAME = kwikshot
CONTAINER_NAME = kwikshot-container
DOCKERFILE = Dockerfile
# Allow user to override both container and host ports via environment variables
# Usage: make start HOST_PORT=8080 PORT=4546 or PORT=4546 HOST_PORT=4545 make start
PORT ?= 3000
HOST_PORT ?= $(PORT)

# Default target
.DEFAULT_GOAL := help

# Build the Docker image
.PHONY: build
build:
	@echo "Building Docker image: $(IMAGE_NAME)..."
	@if [ ! -f $(DOCKERFILE) ]; then \
		echo "Error: $(DOCKERFILE) not found!"; \
		echo "Please create a Dockerfile before building."; \
		exit 1; \
	fi
	docker build -t $(IMAGE_NAME) .
	@echo "✅ Docker image $(IMAGE_NAME) built successfully!"

# Stop the running container
.PHONY: stop
stop:
	@echo "Stopping container: $(CONTAINER_NAME)..."
	@if [ $$(docker ps -q -f name=$(CONTAINER_NAME)) ]; then \
		docker stop $(CONTAINER_NAME); \
		echo "✅ Container $(CONTAINER_NAME) stopped successfully!"; \
	else \
		echo "ℹ️  Container $(CONTAINER_NAME) is not running."; \
	fi

# Start the container
.PHONY: start
start:
	@echo "Starting container: $(CONTAINER_NAME)..."
	@if [ $$(docker ps -q -f name=$(CONTAINER_NAME)) ]; then \
		echo "ℹ️  Container $(CONTAINER_NAME) is already running."; \
	elif [ $$(docker ps -aq -f name=$(CONTAINER_NAME)) ]; then \
		docker start $(CONTAINER_NAME); \
		echo "✅ Container $(CONTAINER_NAME) started successfully!"; \
	else \
		echo "Creating and starting new container: $(CONTAINER_NAME)..."; \
		docker run -d \
			--name $(CONTAINER_NAME) \
			-p $(HOST_PORT):$(PORT) \
			-e PORT=$(PORT) \
			$(IMAGE_NAME); \
		echo "✅ Container $(CONTAINER_NAME) created and started successfully!"; \
	fi
	@echo "🌐 Application should be available at: http://localhost:$(HOST_PORT)"

# Restart the container (stop + start)
.PHONY: restart
restart: stop start
	@echo "✅ Container $(CONTAINER_NAME) restarted successfully!"

# Run tests in the container
.PHONY: test
test:
	@echo "Running tests in Docker container..."
	@if [ ! $$(docker images -q $(IMAGE_NAME)) ]; then \
		echo "Error: Docker image $(IMAGE_NAME) not found!"; \
		echo "Please run 'make build' first."; \
		exit 1; \
	fi
	@echo "Note: Running build verification as test since no test script is defined"
	docker run --rm \
		--name $(CONTAINER_NAME)-test \
		$(IMAGE_NAME) \
		npm run build
	@echo "✅ Build test completed successfully!"

# Clean up containers and images
.PHONY: clean
clean:
	@echo "Cleaning up Docker resources..."
	@if [ $$(docker ps -aq -f name=$(CONTAINER_NAME)) ]; then \
		docker rm -f $(CONTAINER_NAME); \
		echo "🗑️  Removed container: $(CONTAINER_NAME)"; \
	fi
	@if [ $$(docker images -q $(IMAGE_NAME)) ]; then \
		docker rmi $(IMAGE_NAME); \
		echo "🗑️  Removed image: $(IMAGE_NAME)"; \
	fi
	@echo "✅ Cleanup completed!"

# Show container logs
.PHONY: logs
logs:
	@echo "Showing logs for container: $(CONTAINER_NAME)..."
	@if [ $$(docker ps -q -f name=$(CONTAINER_NAME)) ]; then \
		docker logs -f $(CONTAINER_NAME); \
	else \
		echo "Error: Container $(CONTAINER_NAME) is not running."; \
		exit 1; \
	fi

# Show container status
.PHONY: status
status:
	@echo "Docker container status:"
	@echo "========================"
	@if [ $$(docker ps -q -f name=$(CONTAINER_NAME)) ]; then \
		echo "✅ Container $(CONTAINER_NAME) is RUNNING"; \
		docker ps -f name=$(CONTAINER_NAME) --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"; \
	elif [ $$(docker ps -aq -f name=$(CONTAINER_NAME)) ]; then \
		echo "⏸️  Container $(CONTAINER_NAME) is STOPPED"; \
	else \
		echo "❌ Container $(CONTAINER_NAME) does NOT EXIST"; \
	fi
	@echo ""
	@if [ $$(docker images -q $(IMAGE_NAME)) ]; then \
		echo "✅ Image $(IMAGE_NAME) EXISTS"; \
	else \
		echo "❌ Image $(IMAGE_NAME) does NOT EXIST"; \
	fi

# Help target
.PHONY: help
help:
	@echo "KwikShot Docker Makefile"
	@echo "========================"
	@echo ""
	@echo "Available targets:"
	@echo "  build    - Build the Docker image"
	@echo "  start    - Start the container"
	@echo "  stop     - Stop the running container"
	@echo "  restart  - Restart the container (stop + start)"
	@echo "  test     - Run tests in the container"
	@echo "  clean    - Remove container and image"
	@echo "  logs     - Show container logs"
	@echo "  status   - Show container and image status"
	@echo "  help     - Show this help message"
	@echo ""
	@echo "Configuration:"
	@echo "  Image name:     $(IMAGE_NAME)"
	@echo "  Container name: $(CONTAINER_NAME)"
	@echo "  Host port:      $(HOST_PORT)"
	@echo "  Container port: $(PORT)"
	@echo ""
	@echo "Port Configuration:"
	@echo "  Override the default host port ($(HOST_PORT)) using:"
	@echo "    make start HOST_PORT=8080"
	@echo "    HOST_PORT=8080 make start"
	@echo "    export HOST_PORT=8080 && make start"
