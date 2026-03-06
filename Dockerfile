# ---- Base Node Image ----
FROM node:24-alpine AS base
WORKDIR /app

# Install Java for Firebase / Rollup optional dependencies
RUN apk add --no-cache openjdk21

# Install Firebase CLI globally
RUN npm install -g firebase-tools

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy project source
COPY . .

# Expose relevant ports
EXPOSE 5000 4000 8080 9099 5173

# ---- Development Stage ----
FROM base AS dev
# Dev command: Vite dev server + Firebase emulators
CMD sh -c "npm run dev & firebase emulators:start --project will-carr"

# ---- Production Stage ----
FROM base AS prod

# Serve production build via Firebase hosting emulator
CMD sh -c "npm run preview & firebase emulators:start --project will-carr"