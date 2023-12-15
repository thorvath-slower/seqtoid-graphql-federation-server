# Changelog


## [2.2.0](https://github.com/chanzuckerberg/czid-graphql-federation-server/compare/v2.1.1...v2.2.0) (2023-12-14)


### Features

* restrict CORS origin for graphQL mesh ([#38](https://github.com/chanzuckerberg/czid-graphql-federation-server/issues/38)) ([2aa22e6](https://github.com/chanzuckerberg/czid-graphql-federation-server/commit/2aa22e639e2cf943b380c1a044bb806687b128c6))

## [2.1.1](https://github.com/chanzuckerberg/czid-graphql-federation-server/compare/v2.1.0...v2.1.1) (2023-12-11)


### Bug Fixes

* update KickoffWGSWorkflow response id field  ([#39](https://github.com/chanzuckerberg/czid-graphql-federation-server/issues/39)) ([5f5e096](https://github.com/chanzuckerberg/czid-graphql-federation-server/commit/5f5e09666763a4567af6e3b7189250504e136b9c))

## [2.1.0](https://github.com/chanzuckerberg/czid-graphql-federation-server/compare/v2.0.0...v2.1.0) (2023-12-07)


### Features

* Add CSRF prevention plugin ([#13](https://github.com/chanzuckerberg/czid-graphql-federation-server/issues/13)) ([64c8215](https://github.com/chanzuckerberg/czid-graphql-federation-server/commit/64c82152fd8c48575c52441be2896fb432a97e67))
* federated /workflow_runs/{args.workflowRunId}/zip_link.json ([#25](https://github.com/chanzuckerberg/czid-graphql-federation-server/issues/25)) ([e97ab08](https://github.com/chanzuckerberg/czid-graphql-federation-server/commit/e97ab08450dbfe25267bad6ccf6a067fd2293386))


### Bug Fixes

* Change schema back to next gen format ([#28](https://github.com/chanzuckerberg/czid-graphql-federation-server/issues/28)) ([0771869](https://github.com/chanzuckerberg/czid-graphql-federation-server/commit/0771869d8aeb5aab0ef5d652947e45d85fcd9ab1))
* ConsensusGenomeWorkflowResults - add fall back for null values ([#34](https://github.com/chanzuckerberg/czid-graphql-federation-server/issues/34)) ([17d3193](https://github.com/chanzuckerberg/czid-graphql-federation-server/commit/17d3193bb304dda06b0faf5415020dd86147073a))
* Updated schema for kick off workflow ([#27](https://github.com/chanzuckerberg/czid-graphql-federation-server/issues/27)) ([9939a7b](https://github.com/chanzuckerberg/czid-graphql-federation-server/commit/9939a7b6b25f15eec38636d3fa2247d9157f3844))
* updates to ConsensusGenomeWorkflowResults type ([#33](https://github.com/chanzuckerberg/czid-graphql-federation-server/issues/33)) ([b25922a](https://github.com/chanzuckerberg/czid-graphql-federation-server/commit/b25922a1cbda73bfe2811558489b5c8e2f8545b8))

## [2.0.0](https://github.com/chanzuckerberg/czid-graphql-federation-server/compare/v1.7.0...v2.0.0) (2023-11-28)


### ⚠ BREAKING CHANGES

* swap sampleId type to ID to support QualityControlQuery ([#21](https://github.com/chanzuckerberg/czid-graphql-federation-server/issues/21))

### Features

* swap sampleId type to ID to support QualityControlQuery ([#21](https://github.com/chanzuckerberg/czid-graphql-federation-server/issues/21)) ([532a648](https://github.com/chanzuckerberg/czid-graphql-federation-server/commit/532a6488c4cbafa23f980fd126938bfdb1492322))

## [1.7.0](https://github.com/chanzuckerberg/czid-graphql-federation-server/compare/v1.6.0...v1.7.0) (2023-11-21)


### Features

* added coverage viz summary ([#4](https://github.com/chanzuckerberg/czid-graphql-federation-server/issues/4)) ([e20662e](https://github.com/chanzuckerberg/czid-graphql-federation-server/commit/e20662efd6b8504312ef1dc5bbb1d43b3f0cf358))
* added kickoff_workflow ([#9](https://github.com/chanzuckerberg/czid-graphql-federation-server/issues/9)) ([65ede16](https://github.com/chanzuckerberg/czid-graphql-federation-server/commit/65ede161c23ee775058cffd31df150472317ddfd))
* **ci:** promote images from staging when deploying to prod ([#5](https://github.com/chanzuckerberg/czid-graphql-federation-server/issues/5)) ([3854cbf](https://github.com/chanzuckerberg/czid-graphql-federation-server/commit/3854cbf33ab245c466d53cf1a2444a325d64b70f))
* enable additional variables for PipelineData ([#15](https://github.com/chanzuckerberg/czid-graphql-federation-server/issues/15)) ([4c23ca7](https://github.com/chanzuckerberg/czid-graphql-federation-server/commit/4c23ca780c2481bdae72cb88d19edb810705db38))
* federeated /samples/validate_users_can_delete_objects ([#14](https://github.com/chanzuckerberg/czid-graphql-federation-server/issues/14)) ([106dc4a](https://github.com/chanzuckerberg/czid-graphql-federation-server/commit/106dc4a7bc9fd4d5273881ee0a65ccf9a5108d80))


### Bug Fixes

* updated all json schemas  ([#22](https://github.com/chanzuckerberg/czid-graphql-federation-server/issues/22)) ([bb397de](https://github.com/chanzuckerberg/czid-graphql-federation-server/commit/bb397decb41713ae01870979536b25c6be6f271d))


### Reverts

* "chore: swap sampleId type to ID to support QualityControlQuery" ([#20](https://github.com/chanzuckerberg/czid-graphql-federation-server/issues/20)) ([078b0c2](https://github.com/chanzuckerberg/czid-graphql-federation-server/commit/078b0c2230ef0f3818372614ccf45b2df57f6066))

## 1.6.0 (2023-11-02)


### Features

* Pass CSRF token when querying CZID Rails graphql ([#10](https://github.com/chanzuckerberg/czid-graphql-federation-server/issues/10)) ([cf9b8db](https://github.com/chanzuckerberg/czid-graphql-federation-server/commit/cf9b8db24428a8addaaacb8c9bbaf006fb1036d6))


### Miscellaneous Chores

* release 1.6.0  ([#12](https://github.com/chanzuckerberg/czid-graphql-federation-server/issues/12)) ([f805fca](https://github.com/chanzuckerberg/czid-graphql-federation-server/commit/f805fcaab1870800e69f8b6047763df4c39740e6))

## 1.5.0 (2023-10-23)

### **Release tags and commits not available for version 1.5.0 and below**

### Features

* **api:** federate samples/bulk_delete
* **api:** support snapshot links

## 1.4.1 (2023-10-20)


### Bug Fixes

* **cd:** revert promote staging images to prod

## 1.4.0 (2023-10-13)


### Features

* **cd:** promote staging images to prod

## 1.3.0 (2023-10-10)


### Features

* **ci:** Update stack names and parameterize sensitive infrastructure info

## 1.2.1 (2023-10-06)


### Bug Fixes

* **ci:** remove staging image promotion in prod deploy

## 1.2.0 (2023-10-06)


### Features

* **api:** federate GET '/samples/{sampleId}/report_v2' endpt
* **ci:** improve release flow for graphql federation
* support /samples/[sampleId]/report_v2 url params


### Bug Fixes

* api url for local and deployed environments
* **ci:** use correct env for happy config in deploy staging and prod workflows * release fix taxon schema

## 1.1.1 (2023-09-29)


### Bug Fixes

* **ci:** deploy-prod action should deploy release tag, not main

## 1.1.0 (2023-09-28)


### Features

* **api:** federate GET  '/samples/index_v2' endpt
* **api:** federate GET  '/samples/index_v2' endpt
* **api:** federate GET '/samples/{sampleId}.json' endpt
* **api:** federate GET '/samples/{sampleId}/amr.json' endpt
* **api:** federate GET '/workflow_runs/{workflowRunId}/results' endpt

## 1.0.0 (2023-08-11)


### Features

* add new sandbox happy env
* add prod release workflow
* happy setup for dev,staging,prod

### Bug Fixes

* service needs to be the same name
* service needs to be the same name
