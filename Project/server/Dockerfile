FROM node:22-bookworm-slim

WORKDIR /app/server

RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund

COPY --chown=node:node . .
RUN mkdir -p certificates logs && chown -R node:node /app/server

ENV NODE_ENV=production HOST=0.0.0.0 PORT=5000
USER node
EXPOSE 5000

CMD ["sh", "-c", "node scripts/generateCertificate.js && node server.js"]
