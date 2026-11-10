#!/bin/sh
set -e

: "${AUTH0_DOMAIN:?AUTH0_DOMAIN is required}"
: "${AUTH0_CLIENT_ID:?AUTH0_CLIENT_ID is required}"
: "${AUTH0_AUDIENCE:?AUTH0_AUDIENCE is required}"
: "${API_URL:?API_URL is required}"
: "${APP_ENV:=}"
: "${INTERCOM_APP_ID:=}"

config_json="$(jq -n \
  --arg AUTH0_DOMAIN "$AUTH0_DOMAIN" \
  --arg AUTH0_CLIENT_ID "$AUTH0_CLIENT_ID" \
  --arg AUTH0_AUDIENCE "$AUTH0_AUDIENCE" \
  --arg API_URL "$API_URL" \
  --arg APP_ENV "$APP_ENV" \
  --arg INTERCOM_APP_ID "$INTERCOM_APP_ID" \
  '{AUTH0_DOMAIN: $AUTH0_DOMAIN, AUTH0_CLIENT_ID: $AUTH0_CLIENT_ID, AUTH0_AUDIENCE: $AUTH0_AUDIENCE, API_URL: $API_URL, APP_ENV: $APP_ENV, INTERCOM_APP_ID: $INTERCOM_APP_ID}')"

printf 'window.__IDAHO_TH_CONFIG__ = %s;\n' "$config_json" \
  > /usr/share/nginx/html/config.js

exec "$@"
