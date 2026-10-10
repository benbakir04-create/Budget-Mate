# Budget Mate - Development Makefile

.PHONY: setup install run run-demo run-backend docker-up docker-down clean help

# Default target
help:
	@echo "Budget Mate - Development Commands"
	@echo "==================================="
	@echo ""
	@echo "Quick start:"
	@echo "  make setup      - First time setup"
	@echo "  make run-demo   - Run in demo mode"
	@echo ""
	@echo "Development:"
	@echo "  make install    - Install dependencies"
	@echo "  make run        - Run full application"
	@echo "  make run-backend- Run backend only"
	@echo ""
	@echo "Docker:"
	@echo "  make docker-up  - Start with Docker"
	@echo "  make docker-down- Stop Docker containers"
	@echo ""
	@echo "Maintenance:"
	@echo "  make clean      - Clean dependencies"
	@echo "  make help       - Show this help"

# Setup project
setup:
	./setup.sh

# Install dependencies
install:
	@echo "Installing dependencies..."
	cd backend && npm install
	cd ../frontend && npm install
	@echo "✅ Dependencies installed"

# Run application
run:
	./run.sh

# Run in demo mode
run-demo:
	./run-demo.sh

# Run backend only
run-backend:
	./run-backend.sh

# Docker commands
docker-up:
	docker-compose up --build

docker-down:
	docker-compose down

# Clean project
clean:
	@echo "Cleaning project..."
	rm -rf backend/node_modules
	rm -rf frontend/node_modules
	rm -f backend/package-lock.json
	rm -f frontend/package-lock.json
	@echo "✅ Project cleaned"

# Development shortcuts
backend-install:
	cd backend && npm install

frontend-install:
	cd frontend && npm install

backend-dev:
	cd backend && npm run dev

frontend-dev:
	cd frontend && npm run dev

db-migrate:
	cd backend && npm run prisma:migrate

db-seed:
	cd backend && npm run prisma:seed

db-studio:
	cd backend && npm run prisma:studio