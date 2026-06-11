# Bug Specification: Unproxied / unpinned dependencies (bug-#012)

**Branch**: `bug-#012-unproxied-dependencies`  ·  **Spec dir**: `specs/012-unproxied-dependencies/`

**Created**: 2026-06-10 · **Status**: Draft · **Repo**: `seqtoid-graphql-federation-server`

**Input**: Builds pull their base image and packages straight from public registries with no immutability guarantee and no path through a controlled proxy — a supply-chain exposure (bug-#012). Harden this repo's build.

## Why

The foundation `registries` module (czid-infra) provisions the controlled artifact homes: ECR (with an optional pull-through cache for public images) and a CodeArtifact domain that proxies npm/pypi/maven. bug-#012 is the **build half**: make every build resolve through those when available, and pin + checksum-verify regardless. Per the program decision, pinning must resolve the exposure **standalone** — even if the proxy is never stood up — while staying forward-compatible with it.

## What this repo needed

This service is a single Node image. Two gaps:
1. `FROM node:18.16.0` — a mutable tag; the bytes behind it can change.
2. npm install had no proxy hook (it does already use `npm ci`, which is good).

## Change

- **Base pinned by digest**: `FROM ${BASE_REGISTRY}node:18.16.0@sha256:4a55308cc855cba1a925d19ae4e45838741dad2fd7bb8949a93b2a0f2ae339e3`.
  - The `@sha256` digest (the multi-arch index digest) makes the base immutable + verifiable — this alone closes the exposure.
  - `ARG BASE_REGISTRY=` (empty default → Docker Hub) is the forward hook: set it to the ECR pull-through prefix in CI to proxy through ECR. The digest stays valid because it is content-addressed.
- **npm proxy hook (no-op by default)**: `ARG NPM_REGISTRY=https://registry.npmjs.org/`. The `RUN` points npm at `$NPM_REGISTRY` (a non-secret URL — the foundation CodeArtifact/ECR or an Artifactory virtual repo) then runs `npm ci`; the public default keeps local / credential-less builds working.
  - **Auth is deliberately NOT an ARG/ENV.** Passing a CodeArtifact token via `ARG` bakes it into image history (`docker build --check` flags this as `SecretsUsedInArgOrEnv`). For a private/authenticated proxy, CI injects the token via a BuildKit secret mount that does not persist in any layer — the **Bucket B** step:
    ```dockerfile
    # syntax=docker/dockerfile:1
    RUN --mount=type=secret,id=npmrc,target=/usr/src/app/.npmrc \
        npm ci --verbose --no-optional
    ```
    with CI passing `--secret id=npmrc,src=<aws codeartifact login-generated .npmrc>`.
- **Checksum verification is already in place**: `npm ci` + `lockfileVersion: 3` (every dep carries an integrity hash). Kept, now also enforced as the supply-chain control.

## Scope / non-goals

- Node 18 EOL upgrade is **not** here — that is bug-#003 (runtime upgrades). This pins what exists today.
- Actually standing up the registries module, minting CodeArtifact tokens, and the live ECR pull-through cache are **Bucket B** (live AWS). This change is the build-side wiring that consumes them; it changes no behavior when they are absent.

## Acceptance (verified locally)

- Base digest resolves on the public registry (confirmed via `docker buildx imagetools inspect`).
- `docker build --check .` passes — no new warnings from the added `ARG`/`FROM`/proxy lines (only the pre-existing legacy-`ENV` sentinel warnings remain, untouched).
- Default build (no proxy args) behaves exactly as before: `npm ci` against the public registry, integrity-verified.
