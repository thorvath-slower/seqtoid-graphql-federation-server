# TODO — seqtoid-graphql-federation-server

Outstanding work for this repo. Forward-looking companion to the program-level
`SESSION-ACCOMPLISHMENTS` (done) and the jslower security review (audit).

**Refs** `[brackets]` = review IDs / our branches. **Status:** OPEN · PARTIAL · BLOCKED.
**Priority:** P0 · P1 · P2 · P3.

## CI/CD
- [ ] [CICD-3] (P2) Delete the stale `deploy.yml` stub (assumes role `gha-cypherid-workflow-infra-terraform`); the real path is `deploy-{prod,staging,sandbox}.yml` + `reusable-deploy.yml`. Confirm no branch-protection check references it first.
- [ ] [CICD-4] (P2) Harden the self-hosted ARM64 runners — confirm ephemeral + not fork-PR-reachable (`jest-unit-tests.yml`, `deploy-*.yml`); otherwise move to GitHub-hosted `ubuntu-22.04-arm` or require approval.
- [ ] [improvement-#010] (P2) Add the gitleaks + Trivy security gates (only the IaC repos have `security.yml` today).

## Runtime & dependencies
- [x] [EOL-1, bug-#003] Node 18→20 LTS (.node-version + digest-pinned Dockerfile). *(done — `reusable-deploy.yml` was already on node 20)*

## Cleanup
- [ ] [MIG-1] (P3) Sweep `idseq`/`czid` → `seqtoid` in docs.

## Done this session, awaiting merge/push (nothing pushed)
- `improvement-#006-spec-kit-adoption` · `improvement-#009-renovate` · `bug-#003-runtime-eol-upgrades` · `bug-#012-unproxied-dependencies`
