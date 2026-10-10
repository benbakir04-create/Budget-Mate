# Backend Dockerfile
FROM node:18-alpine

WORKDIR /app

# Prisma's query engine needs OpenSSL on Alpine
RUN apk add --no-cache openssl

# Copy package files
COPY package*.json ./

# Install dependencies (dev deps included: nodemon and the prisma CLI are used by docker-compose)
RUN npm ci

# Copy source code and generate the Prisma client
COPY . .
RUN npx prisma generate

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Change ownership
RUN chown -R nodejs:nodejs /app
USER nodejs

EXPOSE 5000

CMD ["npm", "start"]