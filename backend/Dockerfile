# Build Stage
FROM golang:1.24-alpine AS builder

WORKDIR /app

RUN apk add --no-cache ca-certificates git

# Copy go.mod and go.sum files
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download

COPY . .

RUN go test ./...

# Build the Go application
RUN CGO_ENABLED=0 GOOS=linux go build \
    -trimpath \
    -ldflags="-s -w" \
    -o /app/playerpro-server \
    ./cmd/server





# Production Stage
FROM alpine:3.21

WORKDIR /app

RUN apk add --no-cache ca-certificates tzdata \
    && addgroup -S 10001 playerpro \
    && adduser -S -u 10001 -G playerpro playerpro \
    && mkdir -p /app/uploads \
    && chown -R playerpro:playerpro /app

# Copy the built Go application from the builder stage
COPY --from=builder /app/playerpro-server /app/playerpro-server

COPY seed.sql /app/seed.sql
COPY refresh_seed_2026.sql /app/refresh_seed_2026.sql
COPY migrations /app/migrations

RUN mkdir -p /app/uploads \
    && chown -R playerpro:playerpro /app

USER 10001:10001

EXPOSE 8080

CMD ["/app/playerpro-server"]
