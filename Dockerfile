# Build stage
FROM --platform=linux/amd64 golang:1.24-alpine AS builder

# Install required build dependencies
RUN apk add --no-cache git ca-certificates tzdata

WORKDIR /app

# Copy go mod files
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download

# Copy source code
COPY . .

# Build the application
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -ldflags="-w -s" -o main ./cmd/server

# Final stage - minimal runtime image
FROM --platform=linux/amd64 alpine:latest

# Install CA certificates for HTTPS connections (required for Neon) and postgresql-client for migrations
RUN apk --no-cache add ca-certificates tzdata postgresql-client

WORKDIR /app

# Copy the binary from builder
COPY --from=builder /app/main .

# Copy migration files and entrypoint script
COPY separate_admin_migration.sql .
COPY user_preferences_migration.sql .
COPY courier_assignment_migration.sql .
COPY entrypoint.sh .

# Copy timezone data
COPY --from=builder /usr/share/zoneinfo /usr/share/zoneinfo

# Make entrypoint executable
RUN chmod +x entrypoint.sh

# Set timezone (optional, adjust as needed)
ENV TZ=UTC

# Expose port
EXPOSE 8080

# Create non-root user for security (but don't switch yet - entrypoint runs as root)
RUN adduser -D -u 1000 appuser && \
    chown -R appuser:appuser /app

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/ || exit 1

# Run the entrypoint script (which will run migrations then start the app)
CMD ["./entrypoint.sh"]