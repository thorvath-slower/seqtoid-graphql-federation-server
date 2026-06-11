# bug-#003/#004: Node 18 (EOL-soon) -> 20 LTS, pinned by multi-arch digest.
FROM node:20.18.1@sha256:968ca0550acc7589a8b1324401ec6e39ace53b2c82d2aed3a278e9ff491c2b1c

WORKDIR /usr/src/app
ENV UWS_HTTP_MAX_HEADERS_SIZE=24576

ADD package*.json ./

RUN npm ci --verbose --no-optional && npm cache clean --force

COPY . .

# CICD will replace these and we can promote the images from staging to prod
ENV CZID_GQL_FED_GIT_VERSION DOCKER_REPLACE_ME_VERSION
ENV CZID_GQL_FED_GIT_SHA DOCKER_REPLACE_ME_GIT_SHA

CMD ["./entrypoint.sh"]
