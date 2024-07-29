# Use the official Node.js image
FROM node:18

# Install dependencies for building native modules
RUN apt-get update && \
    apt-get install -y \
    libcairo2-dev \
    libjpeg-dev \
    libpango1.0-dev \
    libgif-dev \
    build-essential \
    g++ \
    libgtk-3-dev \
    && rm -rf /var/lib/apt/lists/*

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install Node.js dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Ensure electron-builder is available globally
RUN npm install -g electron-builder

# Run the build command
RUN npm run build

# Define the default command
CMD ["npm", "start"]
