# Stage 1: Build
FROM node:22-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./

# Install ALL dependencies (devDependencies needed for vite/esbuild build)
RUN npm install --legacy-peer-deps

COPY . .

RUN npm run build

# Stage 2: Production
FROM node:22-alpine

WORKDIR /usr/src/app

COPY package*.json ./

# Production dependencies only
RUN npm install --legacy-peer-deps --omit=dev

# Copy built output from builder
COPY --from=builder /usr/src/app/dist ./dist

# Copy data folder (local DB fallback)
COPY --from=builder /usr/src/app/data ./data

EXPOSE 3000

CMD ["npm", "start"]
