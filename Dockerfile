ARG NODE_VERSION=20.13.1
ARG ALPINE_VERSION=3.19
ARG NPM_VERSION=10.8.0
FROM ghcr.io/tjsr/node_patched_npm:${NODE_VERSION}-alpine${ALPINE_VERSION}-npm${NPM_VERSION} as tagtool-build-preflight

RUN --mount=type=cache,target=/root/.npm mkdir /opt/tagtool && \
  npm config set fund false --location=global && \
  npm config set update-notifier false --location=global

WORKDIR /opt/tagtool

FROM tagtool-build-preflight as tagtool-build

# First, files that are unlikely to change frequently.
COPY [ "tsconfig.json", ".npmrc", "babel.config.js", ".prettierrc.json", "vite.config.ts", "index.ts", "index.html", "eslint.config.mjs", "/opt/tagtool/" ]
# Then files that might.
COPY [ "package.json", "package-lock.json", "/opt/tagtool/" ]
COPY src /opt/tagtool/src
COPY public/ /opt/tagtool/public

RUN --mount=type=secret,id=github,target=/root/.npm/github_pat --mount=type=cache,target=/root/.npm \
  echo "//npm.pkg.github.com/:_authToken=$(cat /root/.npm/github_pat)" >> /root/.npmrc && \
  npm ci --no-fund && \
  npm run build && \
  rm -f /root/.npmrc

FROM tagtool-build-preflight as tagtool

COPY package*.json /opt/tagtool
COPY .npmrc /opt/tagtool

RUN --mount=type=secret,id=github,target=/root/.npm/github_pat --mount=type=cache,target=/root/.npm \
  echo "//npm.pkg.github.com/:_authToken=$(cat /root/.npm/github_pat)" >> /root/.npmrc && \
  npm ci --omit=dev --no-fund && \
  rm -f /root/.npmrc

COPY --from=tagtool-build /opt/tagtool/dist /opt/tagtool/dist
WORKDIR /opt/tagtool/dist

EXPOSE 8242

CMD ["node", "index.js"]