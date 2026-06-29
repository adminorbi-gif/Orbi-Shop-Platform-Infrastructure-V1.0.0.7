# Use Node.js LTS version
FROM node:20-slim

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the application (Vite + Server bundle)
ENV NODE_OPTIONS="--max-old-space-size=4096"
RUN npm run build

# ORBI Shop is routed on Railway target port 3000.
# Keep this aligned with Railway Networking -> Target Port.
ENV ORBI_SHOP_PORT=3000
EXPOSE 3000 8080

# Set environment to production
ENV NODE_ENV=production

# Start the application
CMD ["npm", "start"]
