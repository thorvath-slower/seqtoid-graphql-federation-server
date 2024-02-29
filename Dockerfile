FROM node:18.16.0

WORKDIR /usr/src/app
ENV UWS_HTTP_MAX_HEADERS_SIZE=24576

ADD package*.json ./

RUN npm ci --verbose --no-optional && npm cache clean --force

COPY . .

# CICD will replace these and we can promote the images from staging to prod
ENV CZID_GQL_FED_GIT_VERSION DOCKER_REPLACE_ME_VERSION
ENV CZID_GQL_FED_GIT_SHA DOCKER_REPLACE_ME_GIT_SHA

CMD ["./entrypoint.sh"]
