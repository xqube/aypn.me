# Stage 1: Build CSS
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
COPY tailwind.config.js postcss.config.js input.css ./
COPY views/ ./views/
RUN npx tailwindcss -i ./input.css -o ./public/css/styles.css --minify

# Stage 2: Production
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

COPY app.js ./
COPY src/ ./src/
COPY views/ ./views/
COPY content/ ./content/
COPY --from=builder /app/public/css/styles.css ./public/css/styles.css

EXPOSE 3000
USER node
CMD ["node", "app.js"]
