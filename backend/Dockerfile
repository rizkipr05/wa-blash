FROM node:22-slim

# Install system dependencies required by Baileys/canvas/sharp
RUN apt-get update && apt-get install -y \
    openssl \
    ca-certificates \
    libglib2.0-0 \
    libnss3 \
    libatk-bridge2.0-0 \
    libx11-6 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libxss1 \
    libxtst6 \
    libgtk-3-0 \
    libpangocairo-1.0-0 \
    libpango-1.0-0 \
    libcairo2 \
    libatk1.0-0 \
    libdrm2 \
    libgbm1 \
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
