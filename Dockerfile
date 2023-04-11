ARG NODE_VERSION=18.13.0
ARG NPM_VERSION=9.6.3
FROM node:${NODE_VERSION}-alpine3.17 as tagtool-build-preflight
RUN npm install -g npm@${NPM_VERSION}

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

RUN npm i && npm run build

FROM tagtool-build-preflight as tagtool

COPY package*.json /opt/tagtool
COPY .npmrc /opt/tagtool

RUN npm i --production
COPY --from=tagtool-build /opt/tagtool/dist /opt/tagtool/dist
COPY --from=tagtool-build /opt/abtagtoolsee/build /opt/tagtool/dist/build
WORKDIR /opt/tagtool/dist

EXPOSE 8242

CMD ["node", "index.js"]