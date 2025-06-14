# Dockerfile for KwikShot - Professional Screen Recorder & Video Editor
# This Dockerfile creates a container that runs the React development server
# for frontend development and testing purposes.

# Use Node.js LTS version with Alpine for smaller image size
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install system dependencies required for native modules and Electron
# Note: These are needed for building native dependencies like ffmpeg-static
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    git \
    bash \
    curl \
    && ln -sf python3 /usr/bin/python

# Create a non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S kwikshot -u 1001

# Copy package files for dependency installation
COPY package*.json ./

# Install dependencies
# Using npm ci for faster, reliable, reproducible builds
RUN npm ci --only=production=false

# Copy TypeScript configuration files
COPY tsconfig*.json ./
COPY babel.config.js ./
COPY webpack.renderer.config.js ./
COPY tailwind.config.js ./
COPY postcss.config.js ./

# Copy source code
COPY src/ ./src/

# Copy build configuration
COPY build/ ./build/

# Change ownership of the app directory to the nodejs user
RUN chown -R kwikshot:nodejs /app

# Switch to non-root user
USER kwikshot

# Build the application
# This compiles TypeScript and builds the renderer for production
RUN npm run build

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Expose the port that the development server runs on
EXPOSE $PORT

# Health check to ensure the application is running
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:$PORT || exit 1

# Default command - run the development server
# Note: In a container environment, we run the renderer dev server
# since Electron's main process requires a GUI environment
CMD ["npm", "run", "dev:renderer"]

# Alternative commands that can be used:
# For building: docker run --rm kwikshot npm run build
# For testing: docker run --rm kwikshot npm test
# For production build: docker run --rm kwikshot npm run build:all
