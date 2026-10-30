# ---- Base Stage ----
FROM node:18-alpine AS base
WORKDIR /usr/src/app

# ---- Dependencies Stage ----
# Install dependencies first to leverage Docker layer cache
FROM base AS dependencies
COPY package.json package-lock.json* ./
RUN npm install --omit=dev

# ---- Production Stage ----
FROM base AS production
ENV NODE_ENV=production
COPY --from=dependencies /usr/src/app/node_modules ./node_modules
COPY ./backend ./backend

# Run as a non-root user rather than the image default (root)
RUN chown -R node:node /usr/src/app
USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/', r => process.exit(r.statusCode < 500 ? 0 : 1)).on('error', () => process.exit(1))"

CMD [ "node", "backend/server.js" ]
