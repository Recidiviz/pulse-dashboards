FROM nginx:alpine

RUN apk add --no-cache jq

COPY dist/apps/@idaho-th/client /usr/share/nginx/html
COPY apps/@idaho-th/client/nginx.conf /etc/nginx/conf.d/default.conf
COPY apps/@idaho-th/client/entrypoint.sh /entrypoint.sh

RUN chmod +x /entrypoint.sh \
  && touch /usr/share/nginx/html/config.js \
  && chown nginx:nginx /usr/share/nginx/html/config.js \
  && chown -R nginx:nginx /var/cache/nginx \
  && sed -i '/^user[[:space:]]/d; s|/var/run/nginx.pid|/tmp/nginx.pid|g; s|/run/nginx.pid|/tmp/nginx.pid|g' /etc/nginx/nginx.conf

USER nginx

EXPOSE 8080

ENTRYPOINT ["/entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
