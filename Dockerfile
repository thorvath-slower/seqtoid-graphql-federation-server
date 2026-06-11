# bug-#003/#004: Node 18 (EOL-soon) -> 20 LTS, pinned by multi-arch digest.
# Base image pinned by multi-arch digest (bug-#012). The digest makes the base
# immutable and verifiable even when pulled straight from the public registry;
# ${BASE_REGISTRY} is the forward hook for the ECR pull-through cache (set it to
# "<acct>.dkr.ecr.<region>.amazonaws.com/" in CI to proxy through ECR — the
# digest stays valid because it is content-addressed). Empty default = Docker Hub.
ARG BASE_REGISTRY=
FROM ${BASE_REGISTRY}node:20.18.1@sha256:968ca0550acc7589a8b1324401ec6e39ace53b2c82d2aed3a278e9ff491c2b1c

# --- package proxy (bug-#012) --------------------------------------------------
# Route npm at the proxy registry when CI supplies this (non-secret) URL — e.g.
# the foundation CodeArtifact/ECR or an Artifactory virtual repo; the public
# default keeps local / credential-less builds working. Auth for a private proxy
# is injected via a BuildKit secret mount at build time (never an ARG/ENV — that
# bakes the token into image history); see specs/012-unproxied-dependencies/spec.md.
# `npm ci` verifies every package against the lockfile integrity hashes either way.
ARG NPM_REGISTRY=https://registry.npmjs.org/
# -------------------------------------------------------------------------------

WORKDIR /usr/src/app
ENV UWS_HTTP_MAX_HEADERS_SIZE=24576

ADD package*.json ./

RUN npm config set registry "$NPM_REGISTRY" \
 && npm ci --verbose --no-optional \
 && npm cache clean --force

COPY . .

# CICD will replace these and we can promote the images from staging to prod
ENV CZID_GQL_FED_GIT_VERSION DOCKER_REPLACE_ME_VERSION
ENV CZID_GQL_FED_GIT_SHA DOCKER_REPLACE_ME_GIT_SHA

CMD ["./entrypoint.sh"]
