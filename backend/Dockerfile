# Use Node.js as the base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Expose the volumes for persistent storage
VOLUME /app/uploads
VOLUME /app/pictures

# Expose the port the app runs on
EXPOSE 80

# Start the application
CMD npx prisma db push && node server.js
