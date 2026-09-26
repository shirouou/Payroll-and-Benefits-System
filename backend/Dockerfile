# Multi-stage build for Node.js backend
FROM node:18-alpine AS base

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Expose port
EXPOSE 5000

# Health check temporarily disabled for debugging.

# Run server
CMD ["npm", "run", "start:prod"]
