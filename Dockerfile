FROM node:20-slim AS builder
WORKDIR /app
# Install node_modules at /app so TypeScript can resolve packages for
# both /app/worker/**/*.ts and /app/lib/*.ts during compilation
COPY worker/package.json ./package.json
RUN npm install
# Copy source tree
COPY types/ ./types/
COPY lib/quota.ts lib/youtube-auth.ts lib/youtube-upload.ts ./lib/
COPY worker/ ./worker/
WORKDIR /app/worker
RUN npm run build

FROM node:20-slim

RUN apt-get update && apt-get install -y \
    chromium \
    ffmpeg \
    fonts-liberation \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libxss1 \
    libxtst6 \
    ca-certificates \
    --no-install-recommends \
  && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium \
    CHROME_PATH=/usr/bin/chromium \
    NODE_ENV=production

WORKDIR /app
COPY --from=builder /app/worker/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

CMD ["node", "dist/index.js"]
