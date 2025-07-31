ARG NODE_VERSION=22.16.0
ARG ALPINE_VERSION=3.22
ARG NPM_VERSION=11.4.0
FROM ghcr.io/tjsr/node_patched_npm:${NODE_VERSION}-alpine${ALPINE_VERSION}-npm${NPM_VERSION} AS tagtool-build-preflight

WORKDIR /opt/tagtool

FROM tagtool-build-preflight AS tagtool-build

# First, files that are unlikely to change frequently.
COPY [ "tsconfig.json", ".npmrc", "babel.config.js", ".prettierrc.json", "vite.config.ts", "index.ts", "index.html", "eslint.config.mjs", "/opt/tagtool/" ]
# Then files that might.
COPY [ "package.json", "package-lock.json", "/opt/tagtool/" ]
COPY src /opt/tagtool/src
COPY public/ /opt/tagtool/public

RUN --mount=type=secret,id=github --mount=type=cache,target=/root/.npm  \
  echo "//npm.pkg.github.com/:_authToken=$(cat /run/secrets/github)" >> /root/.npmrc && \
  npm ci --no-fund && \
  npm run build && \
  rm -f /root/.npmrc

FROM tagtool-build-preflight AS tagtool-runtimes

COPY package*.json /opt/tagtool
COPY .npmrc /opt/tagtool

RUN --mount=type=secret,id=github --mount=type=cache,target=/root/.npm \
  echo "//npm.pkg.github.com/:_authToken=$(cat /run/secrets/github)" >> /root/.npmrc && \
  npm ci --omit=dev --no-fund && \
  rm -f /root/.npmrc

FROM node:${NODE_VERSION}-alpine${ALPINE_VERSION}
COPY --from=tagtool-build /opt/tagtool/dist /opt/tagtool
COPY package.json /opt/tagtool
COPY --from=tagtool-runtimes /opt/tagtool/node_modules /opt/tagtool/node_modules
WORKDIR /opt/tagtool

EXPOSE 8242

CMD ["node", "index.js"]