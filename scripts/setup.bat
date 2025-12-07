@echo off
REM LPG Delivery System - Setup Script for Windows
REM This script runs the consolidated setup_data.go script

cls
echo =====================================
echo LPG Delivery System Setup
echo =====================================
echo.

REM Check if .env exists
if not exist ..\. env (
    echo ERROR: .env file not found in project root
    echo Please create .env with DATABASE_URL and other required variables
    exit /b 1
)
echo OK: .env file found
echo.

REM Run the consolidated setup_data.go script
echo Starting setup wizard...
echo.
go run setup_data.go

exit /b 0
