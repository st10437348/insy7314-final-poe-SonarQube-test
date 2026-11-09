#!/bin/sh
set -eu

mkdir -p /etc/nginx/certs
if [ ! -s /etc/nginx/certs/localhost-key.pem ] || [ ! -s /etc/nginx/certs/localhost-cert.pem ]; then
  openssl req -x509 -newkey rsa:2048 -sha256 -nodes \
    -keyout /etc/nginx/certs/localhost-key.pem \
    -out /etc/nginx/certs/localhost-cert.pem \
    -days 30 \
    -subj "/CN=localhost" \
    -addext "subjectAltName=DNS:localhost,IP:127.0.0.1" \
    >/dev/null 2>&1
fi
