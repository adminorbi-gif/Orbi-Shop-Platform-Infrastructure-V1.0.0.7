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

# Railway routes Docker services through the runtime PORT, which is 8080 by
# default for this service. The app still reads process.env.PORT at runtime.
ENV PORT=8080
EXPOSE 8080

# Set environment to production
ENV NODE_ENV=production

# Start the application
CMD ["npm", "start"]
