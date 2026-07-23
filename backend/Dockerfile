FROM node:20-alpine

WORKDIR /app

# Copy package descriptors
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production

# Copy application source code
COPY src ./src

# Expose API port
EXPOSE 5000

# Environment defaults
ENV PORT=5000
ENV NODE_ENV=production

# Start application
CMD ["node", "src/app.js"]
