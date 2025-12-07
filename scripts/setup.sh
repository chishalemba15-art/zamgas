#!/bin/bash

# LPG Delivery System - Setup Script
# This script runs the consolidated setup_data.go script

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_header() {
    echo -e "${BLUE}=====================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}=====================================${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if .env exists
check_env() {
    if [ ! -f ../.env ]; then
        print_error ".env file not found in project root"
        print_info "Please create .env with DATABASE_URL and other required variables"
        exit 1
    fi
    print_success ".env file found"
}

# Main execution
main() {
    print_header "LPG Delivery System Setup"
    echo ""

    # Check environment
    print_info "Checking environment..."
    check_env
    echo ""

    # Run the consolidated setup_data.go script
    print_info "Starting setup wizard..."
    echo ""
    go run setup_data.go
}

# Run main function
main
