# Stage 1: Build CSS + Content
FROM node:24-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Production
FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

COPY app.js server.js ./
COPY src/ ./src/
COPY views/ ./views/
COPY content/ ./content/
COPY scripts/ ./scripts/
COPY theme.config.js tailwind.config.js ./
COPY --from=builder /app/dist/ ./dist/
COPY --from=builder /app/public/ ./public/

RUN mkdir -p logs && chown node:node logs
EXPOSE 3001
USER node
CMD ["node", "server.js"]
