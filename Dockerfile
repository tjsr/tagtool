ARG NODE_VERSION=18.13.0
ARG NPM_VERSION=9.6.3
FROM node:${NODE_VERSION}-alpine3.17 as tagtool-build-preflight
RUN npm install -g npm@${NPM_VERSION}

RUN mkdir /opt/tagtool

WORKDIR /opt/tagtool

FROM tagtool-build-preflight as tagtool-build

COPY src/ /opt/absee/src
COPY public/ /opt/absee/public
COPY package*.json /opt/absee
COPY index.ts /opt/absee
COPY .eslintrc.json /opt/absee
COPY babel.config.js /opt/absee
COPY tsconfig.json /opt/absee
COPY .npmrc /opt/absee

RUN npm i && npm run build

FROM tagtool-build-preflight as tagtool

COPY package*.json /opt/tagtool
COPY .npmrc /opt/tagtool

RUN npm i --production
COPY --from=tagtool-build /opt/absee/dist /opt/tagtool/dist
COPY --from=tagtool-build /opt/absee/build /opt/tagtool/dist/build
WORKDIR /opt/tagtool/dist

EXPOSE 8242

CMD ["node", "index.js"]