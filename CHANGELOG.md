# Changelog

## Note: release tags and commits not available for version 1.5.0 and below

## 1.5.0 (2023-10-23)


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
