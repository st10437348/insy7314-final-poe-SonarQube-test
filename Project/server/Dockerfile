FROM node:22-bookworm-slim

WORKDIR /app/server

RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts --no-audit --no-fund

COPY --chown=node:node app.js server.js ./
COPY --chown=node:node config/*.js ./config/
COPY --chown=node:node controllers/*.js ./controllers/
COPY --chown=node:node middleware/*.js ./middleware/
COPY --chown=node:node models/*.js ./models/
COPY --chown=node:node routes/*.js ./routes/
COPY --chown=node:node services/*.js ./services/
COPY --chown=node:node utils/*.js ./utils/
COPY --chown=node:node scripts/generateCertificate.js scripts/bootstrapAdmin.js scripts/localhost.cnf ./scripts/
RUN mkdir -p certificates logs && chown -R node:node /app/server

ENV NODE_ENV=production HOST=0.0.0.0 PORT=5000
USER node
EXPOSE 5000

CMD ["sh", "-c", "node scripts/generateCertificate.js && node server.js"]
