# TODO — seqtoid-graphql-federation-server

Outstanding work for this repo. Forward-looking companion to the program-level
`SESSION-ACCOMPLISHMENTS` (done) and the jslower security review (audit).

**Refs** `[brackets]` = review IDs / our branches. **Status:** OPEN · PARTIAL · BLOCKED.
**Priority:** P0 · P1 · P2 · P3.

## CI/CD
- [x] [CICD-3 / CZID-38] (P2) Delete the stale `deploy.yml` stub (assumed role `gha-cypherid-workflow-infra-terraform`). *(done — PR #6)*
- [x] [improvement-#010 / CZID-137] (P2) gitleaks + Trivy + CodeQL security gates (`security.yml`). *(done — PR #7)*
- [x] [CZID-89 / CZID-148] (P3) Node-24 safe bumps: `actions/checkout` v4→v6 + `actions/setup-node` v4→v6. *(done — PR #8)*
- [ ] [CZID-149] (P3) Node-24 held deploy-critical bumps: `aws-actions/configure-aws-credentials` v4→v6 (×4) + `google-github-actions/release-please-action` v3→v4 (breaking) — verify on a real deploy/release run (Bucket B).
- [ ] [CICD-4 / CZID-39] (P2) Harden the self-hosted ARM64 runners — confirm ephemeral + not fork-PR-reachable (`jest-unit-tests.yml`, `deploy-*.yml`); otherwise move to GitHub-hosted `ubuntu-22.04-arm` or require approval.

## Runtime & dependencies
- [x] [EOL-1, bug-#003] Node 18→20 LTS (.node-version + digest-pinned Dockerfile). *(done — `reusable-deploy.yml` was already on node 20)*
- [ ] [CZID-144] (P3) `reusable-deploy.yml` node SSOT (`node-version-file: .node-version`) — committed locally as `4139f25` but **NOT pushed to origin**; push/land it.

## Cleanup
- [ ] [MIG-1] (P3) Sweep `idseq`/`czid` → `seqtoid` in docs.

## Merged to main
- `improvement-#006-spec-kit-adoption` · `improvement-#009-renovate` · `bug-#003-runtime-eol-upgrades` · `bug-#012-unproxied-dependencies`
- improvement-#010 security scanning (CZID-137, PR #7) · CZID-38 stale-deploy removal (PR #6) · CZID-89 safe action bumps (CZID-148, PR #8)
