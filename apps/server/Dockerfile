FROM node:20-alpine AS builder

RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

# Copy root configuration and manifests
COPY package*.json ./
COPY tsconfig.base.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY apps/server/package*.json ./apps/server/

# Install dependencies across workspaces
RUN npm install

# Copy source code
COPY packages/shared ./packages/shared
COPY apps/server ./apps/server

# Build shared, generate prisma client, and build server
RUN npm --workspace=@online-chess/shared run build
RUN npm --workspace=@online-chess/server run db:generate
RUN npm --workspace=@online-chess/server run build

# Production runner stage
FROM node:20-alpine AS runner

RUN apk add --no-cache openssl libc6-compat

WORKDIR /app
ENV NODE_ENV=production

# Copy built code and dependencies from builder
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/tsconfig.base.json ./
COPY --from=builder /app/packages/shared ./packages/shared
COPY --from=builder /app/apps/server ./apps/server
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 4000

CMD ["sh", "-c", "npm --workspace=@online-chess/server run db:push && (npm --workspace=@online-chess/server run db:seed || true) && exec node apps/server/dist/server.js"]
