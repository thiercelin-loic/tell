FROM node:lts-trixie-slim AS builder
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci --verbose
COPY . .
RUN npm run build --verbose
FROM node:lts-trixie-slim
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /usr/src/app/dist ./dist
EXPOSE 3000
CMD ["node", "dist/main"]