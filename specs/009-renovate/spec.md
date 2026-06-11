# Improvement Specification: Renovate dependency automation (improvement-#009)

**Branch**: `improvement-#009-renovate`  ·  **Spec dir**: `specs/009-renovate/`

**Created**: 2026-06-11 · **Status**: Draft · **Repo**: `seqtoid-graphql-federation-server`

**Input**: Automate dependency/version bumps (and Docker digest maintenance) so future Node upgrades are review-and-merge, not manual edits. Sibling of the `seqtoid-web` config; see that repo's `specs/009-renovate/spec.md` for the full Renovate-vs-Dependabot rationale.

## What this delivers — `renovate.json` (repo root)

- `extends`: `config:recommended`, `:dependencyDashboard`, `:maintainLockFilesDisabled`.
- Weekly schedule (`before 9am on monday`, `America/Los_Angeles`); `prConcurrentLimit: 5`, `prHourlyLimit: 2`; `rebaseWhen: conflicted`.
- **`pinDigests: true`** — maintains the `FROM node@sha256:…` pin and bumps the digest with the tag (bug-#012 contract, automated).
- **Grouping** (`packageRules`):
  - **node runtime** — `node` across the `nodenv` (`.node-version`) and `dockerfile` (`FROM node`) managers in one PR.
  - **github actions** — grouped.
- `vulnerabilityAlerts.enabled: true`.

The `package-lock.json` is already `lockfileVersion: 3` / npm-10-valid, so Renovate's npm lock updates need no special handling here (unlike seqtoid-web).

## Validation

`renovate-config-validator` passes. Enabling the Renovate app on the repo is a GitHub-side step (Bucket B).
