# Maintenance register — seqtoid-graphql-federation-server

**Purpose.** A complete inventory of what in this repo is kept current automatically
(SSOT version files + Renovate) versus what a human must maintain by hand, with the
exact file path and in-file location of each. If it's in the "human-maintained" table,
nothing will remind you — so this list is how we avoid silently drifting.

> ⚠️ **Renovate is configured (`renovate.json`) but the GitHub app is not enabled yet
> (CZID-212).** `.github/workflows/security.yml` (header) notes Actions are disabled on
> the thorvath fork. Until enabled, *everything* below is effectively human-maintained.

> ⚠️ **Renovate and Dependabot overlap.** Both `renovate.json` and `.github/dependabot.yml`
> declare an **npm** manager for `/`. Once Renovate is enabled they will open duplicate npm
> PRs — pick one (the doctrine is Renovate) and delete `.github/dependabot.yml`, or scope
> them so they don't collide.

## A. Human-maintained (Renovate / SSOT cannot track these)

| # | Item | Where (path → location in file) | Why it's manual | How to update |
|---|------|--------------------------------|-----------------|---------------|
| A1 | App version | `package.json` → `"version"` (`2.35.2`) | Bumped by release-please from conventional commits | Don't hand-edit; merge the release-please PR |
| A2 | release-please config | `.github/workflows/release-please.yml` → `release-type: node`, `bump-minor-pre-major: true` | No manifest/config JSON; behavior is inline in the workflow | Hand-edit the workflow |
| A3 | GraphQL subgraph / federation URLs (env contract) | `.meshrc.yaml` → `sources[].handler.graphql.endpoint`, `serve.cors.origin`; injected via deploy workflows + GitHub env `vars.*` (`API_URL`, `NEXTGEN_ENTITIES_URL`, `NEXTGEN_WORKFLOWS_URL`, `ALLOWED_CORS_ORIGINS`) | Federation topology / env contract; no updater understands these | Edit `.meshrc.yaml` + the deploy workflows + GitHub env `vars` together |
| A4 | Vendored subgraph schemas (SDL snapshots) | `sources/czid-schema.graphql`, `sources/nextgen-entities-schema.graphql`, `sources/nextgen-workflows-schema.graphql` | Hand-captured copies of upstream service schemas; drift silently when upstream changes | Re-export from each upstream service; `make update-schema-snapshot` to refresh the test snapshot |
| A5 | REST→GraphQL operation map (Rails endpoint contract) | `.meshrc.yaml` → `CZIDREST.handler.jsonSchema.operations[]` + `json-schemas/*.json` | Hardcoded Rails route paths + request/response schemas | Edit operation `path`/schemas when the Rails API changes |
| A6 | Served port / endpoint (`4444`, `/graphqlfed`) | `.meshrc.yaml` → `serve.port`/`serve.endpoint`; mirrored in `docker-compose.yml` and `.happy/terraform/envs/*/main.tf` (`port = "4444"`) | Hand-synced across mesh config, compose, and Terraform | Keep `.meshrc.yaml`, `docker-compose.yml`, and all four `main.tf` in sync |
| A7 | Node version pin — SECOND copy | `Dockerfile` line 8 → `FROM …node:20.18.1@sha256:…` | The `20.18.1` tag duplicates `.node-version`; Renovate's `nodenv`+`dockerfile` grouping keeps them in one PR (B2), but if the app is off this is hand-synced | Bump tag + digest together with `.node-version` |
| A8 | Dockerfile build logic | `Dockerfile` → `BASE_REGISTRY`/`NPM_REGISTRY` ARGs, `npm ci` block, `UWS_HTTP_MAX_HEADERS_SIZE`, `DOCKER_REPLACE_ME_*` substitution tokens | Bespoke proxy/registry hooks + CI substitution contract | Hand-edit; the `DOCKER_REPLACE_ME_*` tokens are replaced by deploy workflows |
| A9 | AWS / k8s deploy identifiers | `.happy/config.json` → `environments.*` (`aws_profile`, `cluster_id`, `namespace`, `log_group_prefix`), `app: czid-gql-fed`; `us-west-2` in every deploy workflow | Infra identifiers; no updater | Hand-edit `config.json` + deploy workflows |
| A10 | Terraform provider & module version constraints | `.happy/terraform/envs/{dev,prod,sandbox,staging}/versions.tf` (`aws >= 4.45`, `kubernetes >= 2.16`, `datadog >= 3.20.0`); `main.tf` module refs `cztack//…?ref=v0.40.0`, `happy-stack-eks-v4.27.1` | **No Renovate `terraform` manager is configured** — these constraints + `?ref=` module pins are manual | Hand-bump constraints + module `ref` tags |
| A11 | `terraform_version` pin (`1.3.0`) | `.happy/config.json` → `"terraform_version"` | Hand-pinned, separate from `versions.tf >= 1.3` | Hand-edit |
| A12 | happy CLI version pin (`0.128.6`) | `.happy/version.lock` → `Require."chanzuckerberg/happy"` | No updater | Hand-edit |
| A13 | Internal CZI / repo-local composite actions at `@main` | `.github/workflows/*` → `chanzuckerberg/github-actions/.github/actions/{install-happy,conventional-commits}@main`, repo-local `…/.github/actions/*@main`; `deploy-happy-stack@v1.26.0` | Renovate github-actions won't meaningfully bump floating `@main`; repo-local actions aren't external deps | Review/repin `@main` manually; bump `deploy-happy-stack@…` by hand |
| A14 | Custom composite action logic | `.github/actions/get-release-tag/action.yml`, `.github/actions/happy-config-set/action.yml` | Bespoke action code | Hand-edit |
| A15 | CI bespoke steps + scanner pins | `.github/workflows/jest-unit-tests.yml` (`docker swarm init`, `czidnet`), `security.yml` (gitleaks `VER=8.30.1` via curl, trivy report-mode, npm-audit; self-hosted runner) | Hardcoded versions + runner assumptions; gitleaks is curl'd (not a `uses:`) | Hand-edit / ratchet per the `TODO(CZID-137)` markers |
| A16 | Local dev env contract | `docker-compose.yml` → `environment:` block (`API_URL`, `NEXTGEN_*_URL`, `ALLOWED_CORS_ORIGINS`, ports, `czidnet`) | Hardcoded local URLs/ports | Hand-edit |
| A17 | Schema additions / resolver wiring | `.meshrc.yaml` (`additionalTypeDefs`, `additionalResolvers`, `plugins`), `resolvers.ts`, `resolver-functions/`, `codegen.cjs` | Application code/config | Hand-edit |

## B. Automated — SSOT version files + Renovate
*(Only effective once the Renovate GitHub app is enabled — see the banner.)*

| # | Item | Where (path → location in file) | Maintained by |
|---|------|--------------------------------|---------------|
| B1 | npm dependencies + lockfile | `package.json` `dependencies`/`devDependencies`; `package-lock.json` | Renovate `npm` (`config:recommended`). **Also** in `.github/dependabot.yml` — overlapping (see banner); lockfile maintenance disabled via `:maintainLockFilesDisabled` |
| B2 | Node runtime (SSOT + Docker base, grouped) | `.node-version` → `20.18.1`; `Dockerfile` line 8 | Renovate `nodenv` + `dockerfile` managers, grouped into one "node runtime" PR. `actions/setup-node` reads `.node-version` via `node-version-file:` |
| B3 | Dockerfile base-image digest | `Dockerfile` line 8 → `@sha256:…` | Renovate `dockerfile` manager + `pinDigests: true` |
| B4 | GitHub Actions `uses:` (external, tagged) | `.github/workflows/*` (`actions/checkout@v6`, `setup-node@v6`, `github-script@v7`, `aws-actions/configure-aws-credentials@v4`, `github/codeql-action/*@v3`, `aquasecurity/trivy-action`, `release-please-action@…`) | Renovate `github-actions` manager (grouped) + `pinDigests:true`. **`@main` refs and first-party actions are NOT covered → A13** |
| B5 | Security vulnerability PRs | repo-wide deps | Renovate `vulnerabilityAlerts.enabled` |

## When you add something, update the register

When you add a hardcoded version, URL, AWS/k8s identifier, subgraph schema, Rails
endpoint, Terraform module `ref`, or a `uses:` pin Renovate won't track (`@main`,
curl-downloaded tools), add a row to **table A**. When you add a dependency a configured
Renovate manager already covers, it belongs in **table B** — confirm a manager actually
matches it first (note there is currently **no** Terraform manager configured, A10).
