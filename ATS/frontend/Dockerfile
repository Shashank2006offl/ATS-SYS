# --- Stage 1: Build the React Application ---
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package descriptors first to leverage Docker layer caching
COPY package*.json ./

# Install project dependencies
RUN npm install

# Copy project source files
COPY . .

# Compile/Build the production assets
RUN npm run build

# --- Stage 2: Serve the Compiled Assets using Nginx ---
FROM nginx:alpine

# Copy built static assets from the builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose HTTP port
EXPOSE 80

# Start Nginx in the foreground
CMD ["nginx", "-g", "daemon off;"]
