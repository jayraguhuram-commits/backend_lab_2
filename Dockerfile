# Use lightweight Node LTS Alpine image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package descriptors
COPY package*.json ./

# Install production dependencies
RUN npm ci --omit=dev

# Copy application files
COPY . .

# Expose default port
EXPOSE 3000

# Set environment variable defaults
ENV NODE_ENV=production
ENV PORT=3000

# Start server
CMD ["npm", "start"]
