# Multi-stage production Dockerfile for ChaiTube

# Stage 1: Build React Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: Install Production Dependencies
FROM node:20-alpine AS backend-builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Stage 3: Minimal Production Image
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8000

COPY --from=backend-builder /app/node_modules ./node_modules
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist
COPY . .

EXPOSE 8000

USER node

CMD ["node", "src/index.js"]
