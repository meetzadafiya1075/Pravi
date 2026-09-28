FROM node:22-alpine

WORKDIR /app

# Copy package descriptors
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production

# Copy application source
COPY . .

# Render exposes PORT dynamically
ENV PORT=8000
EXPOSE 8000

CMD ["node", "server.js"]
