ARG NODE_VERSION=20.12.2
ARG ALPINE_VERSION=3.19
ARG NPM_VERSION=10.5.2
FROM ghcr.io/tjsr/node_patched_npm:${NODE_VERSION}-alpine${ALPINE_VERSION}-npm${NPM_VERSION} as tagtool-build-preflight

RUN mkdir /opt/tagtool

WORKDIR /opt/tagtool

FROM tagtool-build-preflight as tagtool-build

COPY src/ /opt/tagtool/src
COPY public/ /opt/tagtool/public
COPY package*.json /opt/tagtool
COPY index.ts /opt/tagtool
COPY .eslintrc.json /opt/tagtool
COPY babel.config.js /opt/tagtool
COPY tsconfig.json /opt/tagtool
COPY .npmrc /opt/tagtool

RUN --mount=type=secret,id=github,target=/root/.npm/github_pat \
  echo "//npm.pkg.github.com/:_authToken=$(cat /root/.npm/github_pat)" >> /root/.npmrc && \
  npm install && \
  npm run build && \
  rm -f /root/.npmrc

FROM tagtool-build-preflight as tagtool

COPY package*.json /opt/tagtool
COPY .npmrc /opt/tagtool

RUN --mount=type=secret,id=github,target=/root/.npm/github_pat \
  echo "//npm.pkg.github.com/:_authToken=$(cat /root/.npm/github_pat)" >> /root/.npmrc && \
  npm install --omit=dev && \
  rm -f /root/.npmrc

COPY --from=tagtool-build /opt/tagtool/dist /opt/tagtool/dist
COPY --from=tagtool-build /opt/tagtool/build /opt/tagtool/dist/build
WORKDIR /opt/tagtool/dist

EXPOSE 8242

CMD ["node", "index.js"]