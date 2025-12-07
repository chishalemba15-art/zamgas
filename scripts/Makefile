.PHONY: help test-connection init generate-providers provider-info reset test-backend clean

help:
	@echo "LPG Delivery System - Scripts Help"
	@echo "===================================="
	@echo ""
	@echo "Available commands:"
	@echo ""
	@echo "  make test-connection      - Test database connection"
	@echo "  make init                 - Initialize database with sample users"
	@echo "  make generate-providers   - Generate 10 random providers with pricing"
	@echo "  make provider-info        - View provider inventory and orders"
	@echo "  make reset                - Delete all users from database (⚠️ DESTRUCTIVE)"
	@echo "  make test-backend         - Run comprehensive backend tests"
	@echo "  make setup                - Complete setup: test → init → generate"
	@echo "  make clean                - Remove generated binaries"
	@echo ""
	@echo "Requirements:"
	@echo "  - .env file with DATABASE_URL and other config"
	@echo "  - PostgreSQL/Supabase database running"
	@echo "  - Go 1.21 or higher"
	@echo ""

test-connection:
	@echo "Testing database connection..."
	@cd .. && go run test_db_connection.go

init:
	@echo "Initializing database with sample data..."
	go run initial.go

generate-providers:
	@echo "Generating providers with pricing..."
	go run generate_providers.go

provider-info:
	@echo "Displaying provider information..."
	go run provider_info.go

reset:
	@echo "⚠️  WARNING: This will delete ALL users from the database!"
	@read -p "Type 'yes' to confirm: " confirm; \
	if [ "$$confirm" = "yes" ]; then \
		go run reset.go; \
	else \
		echo "Reset cancelled."; \
	fi

test-backend:
	@echo "Running backend tests..."
	@echo "Ensure the server is running on http://localhost:8080"
	go run test_backend.go

setup: test-connection init generate-providers
	@echo ""
	@echo "✅ Setup complete!"
	@echo "Database initialized with:"
	@echo "  - 6 initial users (2 customers, 2 providers, 2 couriers)"
	@echo "  - 10 generated providers with pricing"
	@echo ""

clean:
	@rm -f generate_providers reset initial provider_info test_backend
	@echo "Cleaned up generated binaries"

all: setup
	@echo "All done!"
