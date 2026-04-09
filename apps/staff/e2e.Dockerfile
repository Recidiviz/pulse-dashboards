# Build image used for running services in docker-compose.e2e.yaml
# It is primarily based off of andreysenov/firebase-tools,
# but includes some yarn dlx commands for our services

# To update the image, run the `Build and Push E2E Docker Image` workflow on Github
FROM andreysenov/firebase-tools:latest-node-lts
WORKDIR /home/node
RUN mkdir -p /home/node/.npm-global
USER node
ENV PATH="/home/node/.npm-global/bin:/home/node/.yarn/bin:$PATH"
RUN npm config set prefix '/home/node/.npm-global' && \
    npm install -g wget
RUN npm install -g firebase-tools env-cmd serve
