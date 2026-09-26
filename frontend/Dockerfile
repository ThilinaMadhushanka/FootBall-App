# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package.json and package-lock.json
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the application code
COPY . .

# Set environment variables for the build
ENV REACT_APP_API_URL=/api

RUN npx tsc --noEmit

# Build the application
RUN npm run build






# Production stage
FROM nginx:1.27-alpine

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the build output to the Nginx html directory
COPY --from=builder /app/build /usr/share/nginx/html

# Expose port 80 for the application
EXPOSE 80

# Set up a health check for the Nginx server
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \ 
CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

# Start Nginx in the foreground
CMD [ "nginx", "-g", "daemon off;" ]
