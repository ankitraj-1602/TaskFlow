# ─── Stage 1: Build ───────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies (cached for faster rebuilds)
COPY package*.json ./
RUN npm ci --omit=dev

# Copy source code
COPY . .

# ─── Stage 2: Runtime ─────────────────────────────
FROM node:20-alpine

# Install dumb-init (proper signal handling)
RUN apk add --no-cache dumb-init

# Create non-root user (security best practice)
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy from builder
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./
COPY --from=builder --chown=nodejs:nodejs /app/src ./src

# Copy entrypoint script
COPY --chown=nodejs:nodejs docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Create uploads folder
RUN mkdir -p /app/uploads /app/logs && \
    chown -R nodejs:nodejs /app/uploads /app/logs
USER nodejs

EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/health', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))"

ENTRYPOINT ["dumb-init", "--", "docker-entrypoint.sh"]
CMD ["node", "src/index.js"]