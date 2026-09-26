# Multi-stage build for React frontend with Vite
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Serve with Nginx
FROM nginx:alpine

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built app from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port
EXPOSE 80

# Temporarily disable the container health check while diagnosing hosting health status.
# Re-enable it after confirming the hosting platform reports this container healthy.

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
