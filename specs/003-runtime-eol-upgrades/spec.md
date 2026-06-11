# Bug Specification: Runtime EOL upgrade — Node 18 → 20 (bugs #003/#004)

**Branch**: `bug-#003-runtime-eol-upgrades`  ·  **Spec dir**: `specs/003-runtime-eol-upgrades/`

**Created**: 2026-06-11 · **Status**: Draft · **Repo**: `seqtoid-graphql-federation-server`

**Input**: The GraphQL federation server pinned Node 18.16.0 (entering EOL) and an unpinned base. Move to Node 20 LTS — the follow-on to the seqtoid-web runtime upgrade (`bug-#001-004`).

## Changes

- **`.node-version`**: `18.16.0` → `20.18.1` (consumed by `jest-unit-tests.yml` via `node-version-file`, so CI follows automatically).
- **`Dockerfile`**: `FROM node:18.16.0` → `FROM node:20.18.1@sha256:968ca0550acc7589a8b1324401ec6e39ace53b2c82d2aed3a278e9ff491c2b1c` (Node 20 LTS, digest-pinned per the bug-#012 supply-chain ethos).

`reusable-deploy.yml` already used `node-version: 20`, so no CI change was needed there. `package-lock.json` is already `lockfileVersion: 3` and `npm ci`-valid under npm 10 (no regen needed — unlike seqtoid-web).

## Verification (Docker, `node:20.18.1`)

- `npm ci` clean (480 pkgs).
- `npm test` (= `mesh build && jest`): **15 suites, 61 tests pass**, 1 snapshot — the GraphQL mesh schema builds and the full suite is green under Node 20.

## Merge note

The Dockerfile `FROM` is also edited by `bug-#012-unproxied-dependencies` (digest-pin + `BASE_REGISTRY`/`NPM_REGISTRY` proxy hooks) on its own branch. On merge, keep both: the Node 20 base (this branch) plus the proxy hooks (bug-#012) — i.e. `FROM ${BASE_REGISTRY}node:20.18.1@sha256:968ca055…`.
