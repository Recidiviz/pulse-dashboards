# Build environment for Anthropic's OSS Scanner (https://github.com/anthropics/oss-scanner).
# The scanner builds this file with the pulse-dashboards checkout as the build context, with network
# access, and then runs its audit with no network. Everything the tests need is installed here.
FROM node:22.22-bookworm

# CI=true makes yarn 4 default to immutable installs, which the mirror cannot pass (see the install
# step), so that default is switched off explicitly.
ENV DEBIAN_FRONTEND=noninteractive \
    CI=true \
    YARN_ENABLE_IMMUTABLE_INSTALLS=false \
    HUSKY=0 \
    NX_DAEMON=false \
    NX_NO_CLOUD=true

# git: yarn fetches one dependency from a git repository (approvedGitRepositories in .yarnrc.yml).
# python3 and build-essential: native Node modules compile with node-gyp.
RUN apt-get update && apt-get install -y --no-install-recommends \
      ca-certificates git python3 python3-pip build-essential openssl \
    && rm -rf /var/lib/apt/lists/*

# package.json pins yarn 4 through the packageManager field; corepack installs that version.
RUN corepack enable

# uv installs the two Python backends and downloads the Python 3.12 they need.
RUN pip3 install --break-system-packages "uv>=0.11.8"

# scanner contract: the checkout lives inside the image, at /src
COPY . /src
WORKDIR /src

# Exactly what yarn.lock pins. HUSKY=0 above skips the git hook install in the postinstall script.
# The mirror renames the root package from pulse-dashboards to pulse-dashboards but leaves its
# yarn.lock entry at the old alphabetical position, so `yarn install --immutable` refuses the reorder.
# Install without --immutable, then fail the build if the lockfile changed in any way other than order.
RUN cp yarn.lock /tmp/yarn.lock.orig \
    && yarn install \
    && bash -c 'diff <(sort /tmp/yarn.lock.orig) <(sort yarn.lock) >/dev/null' \
    || { echo "yarn.lock changed beyond reordering; the build is not reproducible" && exit 1; }

# The two FastAPI backends, each with its own uv.lock.
RUN cd apps/@reentry/backend && uv sync --frozen
RUN cd apps/@cpa-labeling/backend && uv sync --frozen

# Run one cheap project's tests so a broken image shows up in the build log, without letting a
# failing test abort the build. datatypes has no database or emulator dependency.
RUN (yarn nx test datatypes --skip-nx-cache || echo "WARNING: nx test datatypes reported failures")
