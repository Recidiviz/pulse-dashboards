FROM nginx
RUN apt-get update && apt-get upgrade -y && rm -rf /var/lib/apt/lists/*
COPY apps/jii-proxy-server/nginx.conf.template /etc/nginx/templates/default.conf.template
