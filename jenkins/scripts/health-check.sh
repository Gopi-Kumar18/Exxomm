#!/bin/bash
# Deployment verification: hits the real reverse-proxy EC2's public URL,
# the single entry point in production, and checks both the static
# frontend and the proxied backend API respond.
set -euo pipefail

BASE_URL="$1"
RETRIES=10
DELAY=5

check() {
  local path="$1"
  local url="${BASE_URL}${path}"
  for i in $(seq 1 "$RETRIES"); do
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$url" || echo "000")
    if [ "$STATUS" = "200" ]; then
      echo "OK  $url -> $STATUS"
      return 0
    fi
    echo "... $url -> $STATUS (attempt $i/$RETRIES)"
    sleep "$DELAY"
  done
  echo "FAIL $url did not return 200 after $RETRIES attempts"
  return 1
}

check "/"
check "/api/products"

echo "Health check passed."
