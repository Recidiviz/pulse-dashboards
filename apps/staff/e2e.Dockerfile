# Build image used for running services in docker-compose.e2e.yaml
# It is primarily based off of andreysenov/firebase-tools,
# but includes some yarn dlx commands for our services

# Commands to update the image
# > docker build . -f e2e.Dockerfile -t firebase-tools-react
# > docker tag firebase-tools-react danrecidiviz/firebase-tools-react:latest
# > docker push danrecidiviz/firebase-tools-react:latest

FROM andreysenov/firebase-tools:latest-node-lts
WORKDIR /home/node
RUN mkdir -p /home/node/.npm-global
USER node
ENV PATH="/home/node/.npm-global/bin:/home/node/.yarn/bin:$PATH"
RUN npm config set prefix '/home/node/.npm-global' && \
    npm install -g wget
RUN yarn dlx firebase-tools env-cmd serve
