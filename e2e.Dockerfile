# Build image used for running services in docker-compose.e2e.yaml
# It is primarily based off of andreysenov/firebase-tools,
# but includes some yarn global commands for our services

# Commands to update the image
# > docker build . -f e2e.Dockerfile -t firebase-tools-react
# > docker tag firebase-tools-react danrecidiviz/firebase-tools-react:latest
# > docker push danrecidiviz/firebase-tools-react:latest

FROM andreysenov/firebase-tools:latest-node-16
WORKDIR /home/node
USER node
ENV PATH="/home/node/.yarn/bin:$PATH"
RUN yarn global add firebase-tools env-cmd serve
