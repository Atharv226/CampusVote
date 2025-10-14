# Multi-stage build for Node.js application
FROM node:18-alpine AS builder

# Build frontend
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci --only=production
COPY client/ ./
RUN npm run build

# Build backend
WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci --only=production
COPY server/ ./

# Production stage
FROM node:18-alpine AS production

# Create app directory
WORKDIR /app

# Copy backend files
COPY --from=builder /app/server ./server
COPY --from=builder /app/server/node_modules ./server/node_modules

# Copy built frontend
COPY --from=builder /app/client/build ./client/build

# Create uploads directory
RUN mkdir -p ./server/uploads

# Expose port
EXPOSE 5000

# Set working directory to server
WORKDIR /app/server

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/api/health || exit 1

# Start the application
CMD ["npm", "start"]