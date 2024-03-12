# Changelog


## [2.16.0](https://github.com/chanzuckerberg/czid-graphql-federation-server/compare/v2.15.5...v2.16.0) (2024-03-12)


### Features

* query aggregates from NextGen and reformat response ([#159](https://github.com/chanzuckerberg/czid-graphql-federation-server/issues/159)) ([0f08a5f](https://github.com/chanzuckerberg/czid-graphql-federation-server/commit/0f08a5f6ee36edec2fc538ca253817da2d9dd1e1))


### Bug Fixes

* Tsconfig to allow deployment ([#175](https://github.com/chanzuckerberg/czid-graphql-federation-server/issues/175)) ([305bbbd](https://github.com/chanzuckerberg/czid-graphql-federation-server/commit/305bbbdf3a2418dd007ecda8677601e9174a9377))
* Use workflowRun IDs in inner consensusGenomes where, not sequencingRead IDs ([#171](https://github.com/chanzuckerberg/czid-graphql-federation-server/issues/171)) ([f858e3f](https://github.com/chanzuckerberg/czid-graphql-federation-server/commit/f858e3ff12bb86adc10a9dbf8437c8e0621f6a5f))

## [2.15.5](https://github.com/chanzuckerberg/czid-graphql-federation-server/compare/v2.15.4...v2.15.5) (2024-03-12)


### Bug Fixes

* Small Change for new version ([#172](https://github.com/chanzuckerberg/czid-graphql-federation-server/issues/172)) ([62adf05](https://github.com/chanzuckerberg/czid-graphql-federation-server/commit/62adf050a1200a4cdae6f996937628af40e2f66b))

## [2.15.4](https://github.com/chanzuckerberg/czid-graphql-federation-server/compare/v2.15.3...v2.15.4) (2024-03-11)


### Bug Fixes

* Add sample uploader name to joined data from Rails + Use new array orderBy argument for NextGen ([#166](https://github.com/chanzuckerberg/czid-graphql-federation-server/issues/166)) ([4914748](https://github.com/chanzuckerberg/czid-graphql-federation-server/commit/491474843e87b68a2bc19c3a1e6e0f89deb22b56))
* Update get conditional logic ([#169](https://github.com/chanzuckerberg/czid-graphql-federation-server/issues/169)) ([2a17d09](https://github.com/chanzuckerberg/czid-graphql-federation-server/commit/2a17d095780c91035f642981c68f2e380d93f365))

## [2.15.3](https://github.com/chanzuckerberg/czid-graphql-federation-server/compare/v2.15.2...v2.15.3) (2024-03-11)


### Bug Fixes

* return rails data when no nextgen id available ([#167](https://github.com/chanzuckerberg/czid-graphql-federation-server/issues/167)) ([b268861](https://github.com/chanzuckerberg/czid-graphql-federation-server/commit/b268861d93ba4146edad4f3b88ba9bcce92f4e04))

## [2.15.2](https://github.com/chanzuckerberg/czid-graphql-federation-server/compare/v2.15.1...v2.15.2) (2024-03-11)


### Bug Fixes

* fix malformed id ([#164](https://github.com/chanzuckerberg/czid-graphql-federation-server/issues/164)) ([51988c7](https://github.com/chanzuckerberg/czid-graphql-federation-server/commit/51988c73f508b784451cba459c584da492259841))

## [2.15.1](https://github.com/chanzuckerberg/czid-graphql-federation-server/compare/v2.15.0...v2.15.1) (2024-03-08)


### Bug Fixes

* Don't call Rails for the join if there were no sequencing reads returned by NextGen ([#162](https://github.com/chanzuckerberg/czid-graphql-federation-server/issues/162)) ([5281fca](https://github.com/chanzuckerberg/czid-graphql-federation-server/commit/5281fca487b43a8f1d455a4c69a0bf1ac4c926dd))
* Sample View header & pipeline version ([#160](https://github.com/chanzuckerberg/czid-graphql-federation-server/issues/160)) ([a23593d](https://github.com/chanzuckerberg/czid-graphql-federation-server/commit/a23593dbaee669b8bbdd012c0cf89b9f60ab14b8))

## [2.15.0](https://github.com/chanzuckerberg/czid-graphql-federation-server/compare/v2.14.0...v2.15.0) (2024-03-08)


### Features

* Add deprecated filter to federated request ([#151](https://github.com/chanzuckerberg/czid-graphql-federation-server/issues/151)) ([57057fc](https://github.com/chanzuckerberg/czid-graphql-federation-server/commit/57057fcf1c80807f81fecafa535f8feea195d19b))
* federate SampleForReport object ([#148](https://github.com/chanzuckerberg/czid-graphql-federation-server/issues/148)) ([91f0b1d](https://github.com/chanzuckerberg/czid-graphql-federation-server/commit/91f0b1d65974a2b8a6e08adf593166245c53d33f))
* Join NextGen data with Rails data in resolver ([#152](https://github.com/chanzuckerberg/czid-graphql-federation-server/issues/152)) ([9aa47f7](https://github.com/chanzuckerberg/czid-graphql-federation-server/commit/9aa47f7469cb91d1f11490a2b5a1fceae4d7887a))
* Update NextGen schema ([#158](https://github.com/chanzuckerberg/czid-graphql-federation-server/issues/158)) ([bc23402](https://github.com/chanzuckerberg/czid-graphql-federation-server/commit/bc23402e1c84647d5de58a58cd2756a813688ca2))
* Ziplink NG Connection and Delete to accept strings ([#149](https://github.com/chanzuckerberg/czid-graphql-federation-server/issues/149)) ([d3afbb8](https://github.com/chanzuckerberg/czid-graphql-federation-server/commit/d3afbb803d849a7fc049493a76fd73d2aead4b14))


### Bug Fixes

* Change to underscore entity input format ([#157](https://github.com/chanzuckerberg/czid-graphql-federation-server/issues/157)) ([8866b51](https://github.com/chanzuckerberg/czid-graphql-federation-server/commit/8866b516e919c354e2224763f8ac78552e850c19))

## [2.14.0](https://github.com/chanzuckerberg/czid-graphql-federation-server/compare/v2.13.0...v2.14.0) (2024-03-07)


### Features

* update staging env variables urls ([#153](https://github.com/chanzuckerberg/czid-graphql-federation-server/issues/153)) ([26afdd7](https://github.com/chanzuckerberg/czid-graphql-federation-server/commit/26afdd7888752856d13d3fa255cb94dfcde6c23b))

## [2.13.0](https://github.com/chanzuckerberg/czid-graphql-federation-server/compare/v2.12.0...v2.13.0) (2024-03-06)


### Features

* Integrate fedWorkflowRuns and fedSequencingReads with NextGen ([#146](https://github.com/chanzuckerberg/czid-graphql-federation-server/issues/146)) ([8f51783](https://github.com/chanzuckerberg/czid-graphql-federation-server/commit/8f51783d81050e059eb11f475fbc03238c222c51))


### Bug Fixes

* createBulkDownload Change workflowRunIdsStrings type and remove required for workflowRunIds ([#145](https://github.com/chanzuckerberg/czid-graphql-federation-server/issues/145)) ([256173d](https://github.com/chanzuckerberg/czid-graphql-federation-server/commit/256173dd1b8aaa8794daea7d0527656496238021))

## [2.12.0](https://github.com/chanzuckerberg/czid-graphql-federation-server/compare/v2.11.1...v2.12.0) (2024-03-04)


### Features

* Add fed prefix to a few fields ([#123](https://github.com/chanzuckerberg/czid-graphql-federation-server/issues/123)) ([832210f](https://github.com/chanzuckerberg/czid-graphql-federation-server/commit/832210fa1320261aba9ea4903e1bc51b160e12b7))
* Create Connection between Fed Server and Next Gen  ([#137](https://github.com/chanzuckerberg/czid-graphql-federation-server/issues/137)) ([b98dd14](https://github.com/chanzuckerberg/czid-graphql-federation-server/commit/b98dd1486c808e3b65c810769619a7f8204d11b3))
* Re-enable nextgen sources & update schemas ([#120](https://github.com/chanzuckerberg/czid-graphql-federation-server/issues/120)) ([0304aa4](https://github.com/chanzuckerberg/czid-graphql-federation-server/commit/0304aa4ffef7cb1d88dd3cdc1da9ec7699d0a690))
* schema edits for workflows, fedWorkflows, BulkDownloadModal and fedConsensusGenomes ([#142](https://github.com/chanzuckerberg/czid-graphql-federation-server/issues/142)) ([f89e183](https://github.com/chanzuckerberg/czid-graphql-federation-server/commit/f89e18380059bb971b3be6b23d6cd0f95d582c3f))
* Update paginated endpoints with limit/offset ([#112](https://github.com/chanzuckerberg/czid-graphql-federation-server/issues/112)) ([ae755ed](https://github.com/chanzuckerberg/czid-graphql-federation-server/commit/ae755ed673fa1a423b0f59f06f59a1ab738c41af))
* Use nodemon to auto restart mesh after files change. ([#124](https://github.com/chanzuckerberg/czid-graphql-federation-server/issues/124)) ([312dcef](https://github.com/chanzuckerberg/czid-graphql-federation-server/commit/312dcef29778e1c0d835cdfb9ff171bc4ed19e53))


### Bug Fixes

* Revert "fix: return id as a string" ([#140](https://github.com/chanzuckerberg/czid-graphql-federation-server/issues/140)) ([e8da29b](https://github.com/chanzuckerberg/czid-graphql-federation-server/commit/e8da29b3f0fc0ce42ced2fec1d632cbdf9ed8096))
* Revert "fix: update mutation to expect a string and tests" ([#139](https://github.com/chanzuckerberg/czid-graphql-federation-server/issues/139)) ([8c532ee](https://github.com/chanzuckerberg/czid-graphql-federation-server/commit/8c532eee47581dbfd9b8f67ef2a8adcd92a8bf23))
* switch "_" objects to prefixed fields ([#125](https://github.com/chanzuckerberg/czid-graphql-federation-server/issues/125)) ([f7911df](https://github.com/chanzuckerberg/czid-graphql-federation-server/commit/f7911df4438c12fedbee5b9a78e15fa90a9a436e))
* update mutation to expect a string and tests ([#121](https://github.com/chanzuckerberg/czid-graphql-federation-server/issues/121)) ([c72561f](https://github.com/chanzuckerberg/czid-graphql-federation-server/commit/c72561fecc33b9e54c54580e47f7483361444829))
* update to fedConsensusGenomes ([#127](https://github.com/chanzuckerberg/czid-graphql-federation-server/issues/127)) ([af20c6c](https://github.com/chanzuckerberg/czid-graphql-federation-server/commit/af20c6c43e34b7b3d84e0e783ca2617c64ac2e45))

## [2.11.1](https://github.com/chanzuckerberg/czid-graphql-federation-server/compare/v2.11.0...v2.11.1) (2024-02-23)


### Bug Fixes

* return id as a string ([#115](https://github.com/chanzuckerberg/czid-graphql-federation-server/issues/115)) ([0ffa0b2](https://github.com/chanzuckerberg/czid-graphql-federation-server/commit/0ffa0b2d6023927af6fac5e1eba4a6820d00e76a))

## [2.11.0](https://github.com/chanzuckerberg/czid-graphql-federation-server/compare/v2.10.0...v2.11.0) (2024-02-21)


### Features

* Add entities to sources ([#96](https://github.com/chanzuckerberg/czid-graphql-federation-server/issues/96)) ([2fa964c](https://github.com/chanzuckerberg/czid-graphql-federation-server/commit/2fa964ca4ba338f933ae001885f33709a9577919))
* Bulk Download List Endpoints ([#107](https://github.com/chanzuckerberg/czid-graphql-federation-server/issues/107)) ([1e45857](https://github.com/chanzuckerberg/czid-graphql-federation-server/commit/1e458578445096115591c35d726e3794c6efe352))
* CZID-9342 split workflowRuns endpoint based on ids field ([#101](https://github.com/chanzuckerberg/czid-graphql-federation-server/issues/101)) ([a2d3a31](https://github.com/chanzuckerberg/czid-graphql-federation-server/commit/a2d3a31ff9ec4d7487474741520cd8a0dce463fd))
* Feature Flag based routing ([#44](https://github.com/chanzuckerberg/czid-graphql-federation-server/issues/44)) ([f7c9999](https://github.com/chanzuckerberg/czid-graphql-federation-server/commit/f7c999941b8a6f087508bcd73a19ebddc975b8fe))
* Federate sequencingReads and consensusGenomes ([#102](https://github.com/chanzuckerberg/czid-graphql-federation-server/issues/102)) ([0239be8](https://github.com/chanzuckerberg/czid-graphql-federation-server/commit/0239be8108d128ef183e3a5752c42b660a2120fc))
* federate WorkflowsAggregate endpoint ([#108](https://github.com/chanzuckerberg/czid-graphql-federation-server/issues/108)) ([9001540](https://github.com/chanzuckerberg/czid-graphql-federation-server/commit/9001540400c35d63220809dc8e81021b3d4eb445))


### Bug Fixes

* Revert "feat: Feature Flag based routing" ([#109](https://github.com/chanzuckerberg/czid-graphql-federation-server/issues/109)) ([c9bede2](https://github.com/chanzuckerberg/czid-graphql-federation-server/commit/c9bede224fb23d4e26f18f027bf832d224a1918f))

## [2.10.0](https://github.com/chanzuckerberg/czid-graphql-federation-server/compare/v2.9.0...v2.10.0) (2024-02-12)


### Features

* Switch mode to basic to improve performance of unpaginated Rails request ([#97](https://github.com/chanzuckerberg/czid-graphql-federation-server/issues/97)) ([ed41e0c](https://github.com/chanzuckerberg/czid-graphql-federation-server/commit/ed41e0cc516559342235092da8e4bed41feabba2))

## [2.9.0](https://github.com/chanzuckerberg/czid-graphql-federation-server/compare/v2.8.0...v2.9.0) (2024-02-08)


### Features

* Federate CreateBulkDownload Endpoint ([#91](https://github.com/chanzuckerberg/czid-graphql-federation-server/issues/91)) ([6f85f6a](https://github.com/chanzuckerberg/czid-graphql-federation-server/commit/6f85f6ae58b532e4d199a0fb56428176023ae5c8))

## [2.8.0](https://github.com/chanzuckerberg/czid-graphql-federation-server/compare/v2.7.0...v2.8.0) (2024-02-08)


### Features

* Federate the samples NextGen field ([#85](https://github.com/chanzuckerberg/czid-graphql-federation-server/issues/85)) ([946d7dc](https://github.com/chanzuckerberg/czid-graphql-federation-server/commit/946d7dc259d1f7f8f22e716b6317fc5f7433408b))
* Federate workflowRuns endpoint ([#89](https://github.com/chanzuckerberg/czid-graphql-federation-server/issues/89)) ([3e15fac](https://github.com/chanzuckerberg/czid-graphql-federation-server/commit/3e15fac558eda082a4e3bdb7489eac9ed0c71e5f))


### Bug Fixes

* Revert "feat: [CZID-9279] Add entities to graphql sources" ([#94](https://github.com/chanzuckerberg/czid-graphql-federation-server/issues/94)) ([214d344](https://github.com/chanzuckerberg/czid-graphql-federation-server/commit/214d344e80c078c72547c8bd774a14b1acad501c))
* Update snapshot to fix tests ([#95](https://github.com/chanzuckerberg/czid-graphql-federation-server/issues/95)) ([db56d3d](https://github.com/chanzuckerberg/czid-graphql-federation-server/commit/db56d3d3e1122ca7af49fb2718d7c60cb31d6b83))

## [2.7.0](https://github.com/chanzuckerberg/czid-graphql-federation-server/compare/v2.6.1...v2.7.0) (2024-02-02)


### Features

* [CZID-9279] Add entities to graphql sources ([#88](https://github.com/chanzuckerberg/czid-graphql-federation-server/issues/88)) ([8e38c3a](https://github.com/chanzuckerberg/czid-graphql-federation-server/commit/8e38c3aa9dc62703f0850bac8be438ae71d821b4))

## [2.6.1](https://github.com/chanzuckerberg/czid-graphql-federation-server/compare/v2.6.0...v2.6.1) (2024-01-30)


### Bug Fixes

* **ci:** Pin happy stack eks to working version ([#83](https://github.com/chanzuckerberg/czid-graphql-federation-server/issues/83)) ([c172a25](https://github.com/chanzuckerberg/czid-graphql-federation-server/commit/c172a250b11b7242fe00f1a431ed7c60d5f3b1b1))

## [2.6.0](https://github.com/chanzuckerberg/czid-graphql-federation-server/compare/v2.5.0...v2.6.0) (2024-01-29)


### Features

* allow manual staging deploy, re-enable prod deploy ([#82](https://github.com/chanzuckerberg/czid-graphql-federation-server/issues/82)) ([c1a07ce](https://github.com/chanzuckerberg/czid-graphql-federation-server/commit/c1a07cefad79200c108d8055907c1ef8a51b5995))
* **ci:** Align release process to CZ ID manual release cadence ([#72](https://github.com/chanzuckerberg/czid-graphql-federation-server/issues/72)) ([83c97c6](https://github.com/chanzuckerberg/czid-graphql-federation-server/commit/83c97c68f952e40bba7a7aeca0b576b762d88c66))
* move get release tag into composite action ([#79](https://github.com/chanzuckerberg/czid-graphql-federation-server/issues/79)) ([ef26dcf](https://github.com/chanzuckerberg/czid-graphql-federation-server/commit/ef26dcfed522126a22afcb6018923083a8ce5f6e))


### Bug Fixes

* Access tag name path correctly ([#77](https://github.com/chanzuckerberg/czid-graphql-federation-server/issues/77)) ([60ba125](https://github.com/chanzuckerberg/czid-graphql-federation-server/commit/60ba125c7e4387a66dd40de195e3a32432c063ad))
* Checkout repo with release tag from action ([#80](https://github.com/chanzuckerberg/czid-graphql-federation-server/issues/80)) ([232a351](https://github.com/chanzuckerberg/czid-graphql-federation-server/commit/232a3513e9997a6ab6a95e74fc072ed8893d4c45))
* pass requested release tag to action ([#81](https://github.com/chanzuckerberg/czid-graphql-federation-server/issues/81)) ([f7c2bb3](https://github.com/chanzuckerberg/czid-graphql-federation-server/commit/f7c2bb393ea04ef4bf48d7f9b6537af6742ebc1a))
* quote release tag ([#78](https://github.com/chanzuckerberg/czid-graphql-federation-server/issues/78)) ([929ebf5](https://github.com/chanzuckerberg/czid-graphql-federation-server/commit/929ebf5f08fffde192ab548b2ce5446de0bdcaef))

## [2.5.0](https://github.com/chanzuckerberg/czid-graphql-federation-server/compare/v2.4.0...v2.5.0) (2024-01-12)


### Features

* add MetadataValues query ([#54](https://github.com/chanzuckerberg/czid-graphql-federation-server/issues/54)) ([721f8b0](https://github.com/chanzuckerberg/czid-graphql-federation-server/commit/721f8b00dddf30bf4c04d81b50c627b9fe8c8229))
* Add URL's for entities & workflows services in local dev ([#63](https://github.com/chanzuckerberg/czid-graphql-federation-server/issues/63)) ([26442d4](https://github.com/chanzuckerberg/czid-graphql-federation-server/commit/26442d4cf981f3c2550dba83d9047067f776e87e))


### Bug Fixes

* add missing property to location file ([#64](https://github.com/chanzuckerberg/czid-graphql-federation-server/issues/64)) ([c08a63d](https://github.com/chanzuckerberg/czid-graphql-federation-server/commit/c08a63dda5641cad5d16be386b7a0b0230946b34))
* adding multiple location types and Update metadata values ([#60](https://github.com/chanzuckerberg/czid-graphql-federation-server/issues/60)) ([9af53fe](https://github.com/chanzuckerberg/czid-graphql-federation-server/commit/9af53fe5d9b8c0f88659014e054c430f708e1cfd))
* Change ercc_comparison type from integer to float ([#59](https://github.com/chanzuckerberg/czid-graphql-federation-server/issues/59)) ([108e0ad](https://github.com/chanzuckerberg/czid-graphql-federation-server/commit/108e0ad2cebbd8c3ba80bf7860b6602a68dbb197))

## [2.4.0](https://github.com/chanzuckerberg/czid-graphql-federation-server/compare/v2.3.0...v2.4.0) (2023-12-19)


### Features

* add metadata-fields endpoint ([#50](https://github.com/chanzuckerberg/czid-graphql-federation-server/issues/50)) ([3c16bfc](https://github.com/chanzuckerberg/czid-graphql-federation-server/commit/3c16bfccb2bb2f1790172e0d6b7f6c893d7bf202))
* Add two distinct endpoints for notes and name ([#47](https://github.com/chanzuckerberg/czid-graphql-federation-server/issues/47)) ([353bea2](https://github.com/chanzuckerberg/czid-graphql-federation-server/commit/353bea20afba187d201803107005899e352a7065))
* **ci:** Set ALLOWED_CORS_ORIGINS app config ([#52](https://github.com/chanzuckerberg/czid-graphql-federation-server/issues/52)) ([bc4e48b](https://github.com/chanzuckerberg/czid-graphql-federation-server/commit/bc4e48bdcf42dcf6a4b838e03afde8426fc3279d))

## [2.3.0](https://github.com/chanzuckerberg/czid-graphql-federation-server/compare/v2.2.0...v2.3.0) (2023-12-15)


### Features

* added save_metadata_v2 endpoint ([#43](https://github.com/chanzuckerberg/czid-graphql-federation-server/issues/43)) ([4d692c0](https://github.com/chanzuckerberg/czid-graphql-federation-server/commit/4d692c026a7820ff9c1aa88b1d0464f9c95c8ea2))

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
