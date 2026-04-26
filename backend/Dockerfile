FROM node:22-slim

# Install system dependencies required by Baileys/Prisma
RUN apt-get update && apt-get install -y \
    openssl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy dependency files first for better caching
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies (postinstall runs prisma generate automatically)
RUN npm ci --omit=dev

# Copy rest of application
COPY . .

# Create volume mount points
RUN mkdir -p /app/uploads /app/wa-sessions

EXPOSE 3000

CMD ["node", "src/app.js"]
