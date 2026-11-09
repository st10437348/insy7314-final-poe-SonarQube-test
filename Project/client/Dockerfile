FROM node:22-alpine AS build

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .
ARG VITE_API_URL=https://localhost:5173
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

FROM nginx:stable-alpine
RUN apk add --no-cache openssl curl
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY docker/05-generate-cert.sh /docker-entrypoint.d/05-generate-cert.sh
RUN chmod +x /docker-entrypoint.d/05-generate-cert.sh
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 443
