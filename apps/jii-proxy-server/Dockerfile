FROM nginx:1.31.8@sha256:5ab5b0b01097420873a3f3330f44248e34a3c2a3e8d5ee30658aeae8cb7435da
RUN apt-get update && apt-get upgrade -y && rm -rf /var/lib/apt/lists/*
COPY apps/jii-proxy-server/nginx.conf.template /etc/nginx/templates/default.conf.template
