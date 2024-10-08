# Use an official Node.js runtime as the base image
FROM node:20

# Install GraphicsMagick and other dependencies
RUN apt-get update && \
    apt-get install -y graphicsmagick && \
    rm -rf /var/lib/apt/lists/*

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json (or yarn.lock)
COPY package*.json ./
# If you're using Yarn, uncomment the following line and comment out the npm install line
# COPY yarn.lock ./

# Install application dependencies
RUN npm install
# If using Yarn, use: RUN yarn install

# Copy the rest of your application code
COPY . .

# Build the Next.js application
RUN npm run build
# If using Yarn, use: RUN yarn build

# Set environment variables (optional)
ENV NODE_ENV=production
ENV PORT=3000

# Expose the port your app runs on
EXPOSE 3000

# Define the command to run your app
CMD ["npm", "start"]
# If using Yarn, use: CMD ["yarn", "start"]
