// resolvers.ts
import {
  Resolvers,
  queryInput_fedSequencingReads_input_where_Input,
  query_fedConsensusGenomes_items,
  query_fedSamples_items,
  query_fedSequencingReads_items,
  query_fedWorkflowRunsAggregate_aggregate_items,
  query_fedWorkflowRuns_items,
} from "./.mesh";
import { processWorkflowsAggregateResponse } from "./utils/aggregateUtils";
import {
  fetchFromNextGen,
  get,
  getFromRails,
  postWithCSRF,
  shouldReadFromNextGen,
} from "./utils/httpUtils";
import {
  formatTaxonHits,
  formatTaxonLineage,
} from "./utils/mngsWorkflowResultsUtils";
import { formatUrlParams } from "./utils/paramsUtils";
import {
  convertSequencingReadsQuery,
  convertValidateConsensusGenomeQuery,
  convertWorkflowRunsQuery,
  formatFedQueryForNextGen,
} from "./utils/queryFormatUtils";
import { isRunFinalized, parseRefFasta } from "./utils/responseHelperUtils";

/**
 * Arbitrary very large number used temporarily during Rails read phase to force Rails not to
 * paginate our fake "Workflows Service" call.
 */
const TEN_MILLION = 10_000_000;

export const resolvers: Resolvers = {
  Query: {
    AmrWorkflowResults: async (root, args, context, info) => {
      const { quality_metrics, report_table_data } = await get({
        url: `/workflow_runs/${args.workflowRunId}/results`,
        args,
        context,
      });
      return {
        metric_amr: quality_metrics,
        amr_hit: report_table_data,
      };
    },
    Background: async (root, args, context, info) => {
      const { other_backgrounds, owned_backgrounds } = await get({
        url: `/backgrounds.json`,
        args,
        context,
      });
      const ret = other_backgrounds.concat(owned_backgrounds);
      return ret.map((item: any) => {
        return {
          ...item,
          is_mass_normalized: item.mass_normalized,
        };
      }, []);
    },
    fedBulkDownloads: async (root, args, context, info) => {
      const statusDictionary = {
        success: "SUCCEEDED",
        error: "FAILED",
        waiting: "PENDING",
        running: "INPROGRESS",
        //fyi: in NextGen there is also a status of STARTED
      };
      const urlParams = formatUrlParams({
        searchBy: args?.input?.searchBy,
        n: args?.input?.limit,
      });
      const getEntityInputInfo = entities => {
        return entities.map(entity => {
          return {
            id: entity?.id,
            name: entity?.sample_name,
          };
        });
      };
      const res = await get({
        url: `/bulk_downloads.json${urlParams}`,
        args,
        context,
      });
      const mappedRes = res.map(async bulkDownload => {
        let url: string | null = null;
        let entityInputs: { id: string; name: string }[] = [];
        let sampleNames: Set<string> | null = null;
        let totalSamples: number | null = null;
        let description: string;
        let file_type_display: string;
        const details = await get({
          url: `/bulk_downloads/${bulkDownload?.id}.json`,
          args,
          context,
        });
        if (bulkDownload.status === "success") {
          url = details?.bulk_download?.presigned_output_url;
          entityInputs = [
            ...getEntityInputInfo(details?.bulk_download?.workflow_runs),
            ...getEntityInputInfo(details?.bulk_download?.pipeline_runs),
          ];
          sampleNames = new Set(
            entityInputs.map(entityInput => entityInput.name),
          );
          totalSamples =
            details?.bulk_download?.params?.sample_ids?.value?.length;
        }
        description = details?.download_type?.description;
        file_type_display = details?.download_type?.file_type_display;

        const {
          id,
          status,
          user_id,
          download_type,
          created_at,
          download_name,
          output_file_size,
          user_name,
          log_url,
          analysis_type,
          progress, // --> to be discussed on Feb 16th, 2024
        } = bulkDownload;

        // In Next Gen we will have an array with all of the entity input
        // filtered through the nodes entity query to get the relevant info
        // If there are 22 Consensus Genome Files coming from 20 Samples, there will be 42 items in the array.
        // We will get `sampleNames` by checking __typename to see if the entity is a sample,
        // The amount of other items left in the array should be a the `analysisCount` and the analysis type will come from the file.entity.type
        // Some work will have to be done in the resolver here to surface the right information to the front end from NextGen
        return {
          id, // in NextGen this will be the workflowRun id because that is the only place that has info about failed and in progress bulk download workflows
          startedAt: created_at,
          status: statusDictionary[status],
          rawInputsJson: {
            downloadType: download_type,
            downloadDisplayName: download_name,
            description: description,
            fileFormat: file_type_display,
          },
          ownerUserId: user_id,
          file: {
            size: output_file_size,
            downloadLink: {
              url: url,
            },
          },
          sampleNames,
          analysisCount: entityInputs.length,
          entityInputFileType: analysis_type,
          entityInputs,
          toDelete: {
            progress, // --> to be discussed on Feb 16th, 2024
            user_name, // will need to get from a new Rails endpoint from the FE
            log_url, // used in admin only, we will deprecate log_url and use something like executionId
            totalSamples,
            // dedupping by name isn't entirely reliable
            // we will use this as the accurate number of samples until we switch to NextGen
            // (then it can be the amount of Sample entitys in entityInputs on the workflowRun)
          },
        };
      });
      return mappedRes;
    },
    BulkDownloadCGOverview: async (root, args, context, info) => {
      if (!args?.input) {
        throw new Error("No input provided");
      }
      const {
        downloadType,
        workflow,
        includeMetadata,
        workflowRunIds,
        workflowRunIdsStrings,
      } = args?.input;

      //array of strings to array of numbers
      const workflowRunIdsNumbers = workflowRunIdsStrings?.map(
        id => id && parseInt(id),
      );
      const body = {
        download_type: downloadType,
        workflow: workflow,
        params: {
          include_metadata: { value: includeMetadata },
          sample_ids: {
            value: workflowRunIdsNumbers
              ? workflowRunIdsNumbers
              : workflowRunIds,
          },
          workflow: {
            value: workflow,
          },
        },
        workflow_run_ids: workflowRunIds,
      };
      const res = await postWithCSRF({
        url: `/bulk_downloads/consensus_genome_overview_data`,
        body,
        args,
        context,
      });
      if (res?.cg_overview_rows) {
        return {
          cgOverviewRows: res?.cg_overview_rows,
        };
      } else {
        throw new Error(res.error);
      }
    },
    fedConsensusGenomes: async (root, args, context) => {
      /* --------------------- Next Gen ------------------------- */
      const nextGenEnabled = await shouldReadFromNextGen(context);
      if (nextGenEnabled) {
        const ret = await get({ args, context, serviceType: "entities" });
        return ret.data.consensusGenomes;
      }
      /* --------------------- Rails ------------------------- */
      const input = args.input;
      if (input?.where?.producingRunId?._eq) {
        // if there is an _eq in the response than it is a call for a single workflow run result
        // and the rails call will be like this:
        const workflowRunId = input?.where?.producingRunId?._eq;
        const data = await get({
          url: `/workflow_runs/${workflowRunId}/results`,
          args,
          context,
        });
        const { coverage_viz, quality_metrics, taxon_info } = data;
        const { accession_id, accession_name, taxon_id, taxon_name } =
          taxon_info || {};
        const ret = [
          {
            metrics: {
              coverageTotalLength: coverage_viz?.total_length,
              coverageDepth: coverage_viz?.coverage_depth,
              coverageBreadth: coverage_viz?.coverage_breadth,
              coverageBinSize: coverage_viz?.coverage_bin_size,
              coverageViz: coverage_viz?.coverage,
              gcPercent: quality_metrics?.gc_percent,
              percentGenomeCalled: quality_metrics?.percent_genome_called,
              percentIdentity: quality_metrics?.percent_identity,
              refSnps: quality_metrics?.ref_snps,
              nMissing: quality_metrics?.n_missing,
              nAmbiguous: quality_metrics?.n_ambiguous,
              nActg: quality_metrics?.n_actg,
              mappedReads: quality_metrics?.mapped_reads,
            },
            accession: {
              accessionId: accession_id,
              accessionName: accession_name,
            },
            taxon: {
              id: taxon_id?.toString(),
              commonName: taxon_name,
              name: taxon_name,
            },
          },
        ];
        return ret;
      }

      // DISCOVERY VIEW:
      // The comments in the formatUrlParams() call correspond to the line in the current
      // codebase's callstack where the params are set, so help ensure we're not missing anything.
      const { workflow_runs } = await get({
        url:
          "/workflow_runs.json" +
          formatUrlParams({
            // index.ts
            // const getWorkflowRuns = ({
            mode: "with_sample_info",
            //  - DiscoveryDataLayer.ts
            //    await this._collection.fetchDataCallback({
            domain: input?.todoRemove?.domain,
            //  -- DiscoveryView.tsx
            //     ...this.getConditions(workflow)
            projectId: input?.todoRemove?.projectId,
            search: input?.todoRemove?.search,
            orderBy: input?.todoRemove?.orderBy,
            orderDir: input?.todoRemove?.orderDir,
            //  --- DiscoveryView.tsx
            //      filters: {
            host: input?.todoRemove?.host,
            locationV2: input?.todoRemove?.locationV2,
            taxon: input?.todoRemove?.taxons,
            taxaLevels: input?.todoRemove?.taxaLevels,
            time: input?.todoRemove?.time,
            tissue: input?.todoRemove?.tissue,
            visibility: input?.todoRemove?.visibility,
            workflow: input?.todoRemove?.workflow,
            //  - DiscoveryDataLayer.ts
            //    await this._collection.fetchDataCallback({
            limit: input?.limit,
            offset: input?.offset,
            listAllIds: false,
          }),
        args,
        context,
      });
      if (!workflow_runs?.length) {
        return [];
      }

      return workflow_runs.map((run): query_fedConsensusGenomes_items => {
        const inputs = run.inputs;
        const qualityMetrics = run.cached_results?.quality_metrics;
        const sample = run.sample;
        const sampleInfo = sample?.info;
        const sampleMetadata = sample?.metadata;

        const taxon =
          inputs?.taxon_name != null
            ? {
                name: inputs.taxon_name,
              }
            : null;
        const accession =
          inputs?.accession_id != null && inputs?.accession_name != null
            ? {
                accessionId: inputs?.accession_id,
                accessionName: inputs?.accession_name,
              }
            : null;
        return {
          producingRunId: run.id?.toString(),
          taxon,
          accession,
          metrics: {
            coverageDepth: run.cached_results?.coverage_viz?.coverage_depth,
            totalReads: qualityMetrics?.total_reads,
            gcPercent: qualityMetrics?.gc_percent,
            refSnps: qualityMetrics?.ref_snps,
            percentIdentity: qualityMetrics?.percent_identity,
            nActg: qualityMetrics?.n_actg,
            percentGenomeCalled: qualityMetrics?.percent_genome_called,
            nMissing: qualityMetrics?.n_missing,
            nAmbiguous: qualityMetrics?.n_ambiguous,
            referenceGenomeLength: qualityMetrics?.reference_genome_length,
          },
          sequencingRead: {
            nucleicAcid: sampleMetadata?.nucleotide_type ?? "",
            protocol: inputs?.wetlab_protocol,
            medakaModel: inputs?.medaka_model,
            technology: inputs?.technology ?? "",
            taxon,
            sample: {
              railsSampleId: sample?.id,
              name: sampleInfo?.name ?? "",
              notes: sampleInfo?.sample_notes,
              uploadError: sampleInfo?.result_status_description,
              collectionLocation:
                typeof sampleMetadata?.collection_location_v2 === "string"
                  ? sampleMetadata.collection_location_v2
                  : sampleMetadata?.collection_location_v2?.name ?? "",
              sampleType: sampleMetadata?.sample_type ?? "",
              waterControl: sampleMetadata?.water_control === "Yes",
              hostOrganism:
                sampleInfo?.host_genome_name != null
                  ? {
                      name: sampleInfo.host_genome_name,
                    }
                  : null,
              collection: {
                name: sample?.project_name,
                public: Boolean(sampleInfo?.public),
              },
              ownerUserId: sample?.uploader?.id,
              // TODO: Make runner come from Workflows stitched with the user service when NextGen
              // ready.
              ownerUserName: run.runner?.name ?? sample?.uploader?.name,
              metadatas: {
                edges: getMetadataEdges(sampleMetadata),
              },
            },
          },
        };
      });
    },
    ConsensusGenomeWorkflowResults: async (root, args, context, info) => {
      const { coverage_viz, quality_metrics, taxon_info } = await get({
        url: `/workflow_runs/${args.workflowRunId}/results`,
        args,
        context,
      });
      const { accession_id, accession_name, taxon_id, taxon_name } =
        taxon_info || {};
      return {
        metric_consensus_genome: {
          ...quality_metrics,
          coverage_viz,
        },
        reference_genome: {
          accession_id: accession_id,
          accession_name: accession_name,
          taxon: {
            id: taxon_id?.toString(),
            name: taxon_name,
          },
        },
      };
    },
    CoverageVizSummary: async (root, args, context, info) => {
      // should be fetched using pipeline run id instead of sample id
      // from the new backend
      const coverage_viz_summary = await get({
        url: `/samples/${args.sampleId}/coverage_viz_summary`,
        args,
        context,
      });
      const return_obj: any[] = [];
      for (const key in coverage_viz_summary) {
        for (const accension of coverage_viz_summary[key]["best_accessions"]) {
          return_obj.push({
            pipeline_id: key,
            ...accension,
          });
        }
      }
      return return_obj;
    },
    MetadataFields: async (root, args, context, info) => {
      const body = {
        sampleIds: args?.input?.sampleIds,
      };
      const res = await postWithCSRF({
        url: `/samples/metadata_fields`,
        body,
        args,
        context,
      });
      return res;
    },
    SampleMetadata: async (root, args, context, info) => {
      const url = `/samples/${args.sampleId}/metadata`;
      const urlWithParams = args?.input?.pipelineVersion
        ? url + `?pipeline_version=${args?.input?.pipelineVersion}`
        : url;
      const res = await get({ url: urlWithParams, args, context });
      try {
        const metadata = res.metadata.map(item => {
          item.id = item.id.toString();
          return item;
        });
        if (res?.additional_info?.pipeline_run?.id) {
          res.additional_info.pipeline_run.id =
            res.additional_info.pipeline_run.id.toString();
        }
        // location_validated_value is a union type, so we need to add __typename to the object
        metadata.map(field => {
          if (typeof field.location_validated_value === "object") {
            field.location_validated_value = {
              __typename:
                "query_SampleMetadata_metadata_items_location_validated_value_oneOf_1",
              ...field.location_validated_value,
              id: field.location_validated_value.id.toString(),
            };
          } else if (typeof field.location_validated_value === "string") {
            field.location_validated_value = {
              __typename:
                "query_SampleMetadata_metadata_items_location_validated_value_oneOf_0",
              name: field.location_validated_value,
            };
          } else {
            field.location_validated_value = null;
          }
        });
        res.metadata = metadata;
        return res;
      } catch {
        return res;
      }
    },
    SampleForReport: async (root, args, context) => {
      /* --------------------- Rails and Next Gen --------------------- */
      const sampleInfo = await getFromRails({
        url: `/samples/${args.railsSampleId}.json`,
        args,
        context,
      });
      // Make output acceptable to Relay - convert ids to strings
      if (sampleInfo?.pipeline_runs) {
        const updatedPipelineRuns = sampleInfo?.pipeline_runs.map(
          pipelineRun => {
            return {
              ...pipelineRun,
              id: pipelineRun.id.toString(),
            };
          },
        );
        sampleInfo.pipeline_runs = updatedPipelineRuns;
      }
      if (sampleInfo?.default_pipeline_run_id) {
        sampleInfo.default_pipeline_run_id =
          sampleInfo.default_pipeline_run_id.toString();
      }
      if (sampleInfo?.workflow_runs) {
        const updatedWorkflowRuns = sampleInfo?.workflow_runs.map(
          workflowRun => {
            return {
              ...workflowRun,
              id: workflowRun.id.toString(),
            };
          },
        );
        sampleInfo.workflow_runs = updatedWorkflowRuns;
      }
      if (sampleInfo?.project) {
        sampleInfo.project.id = sampleInfo.project.id.toString();
      }

      const nextGenEnabled = await shouldReadFromNextGen(context);
      /* --------------------- Rails --------------------- */
      if (!nextGenEnabled) {
        return {
          id: args?.railsSampleId,
          railsSampleId: args.railsSampleId,
          ...sampleInfo,
        };
      }
      /* --------------------- Next Gen --------------------- */

      // NextGen Steps:
      // continue using everything from rails except for workflow_runs
      // get sample from rails using railsSampleId (same as above). This includes:
      // -- sample info
      // -- pipeline runs
      // -- workflowRuns:
      // ---- AMR workflow runs
      // ---- pre-migration CG workflow runs
      // ---- dual write CG workflow runs
      // query entities using railsSampleId to get NextGenSampleId and done CG workflow runs
      // query workflows using NextGenSampleId to get in progress CG workflow runs
      // combine workflow data from entities and workflows
      // deduplicate between rails and next gen

      const entitiesQuery = `
          query EntitiesQuery {
            samples(where: {railsSampleId: {_eq: ${args.railsSampleId}}}) {
              id
              sequencingReads {
                edges {
                  node {
                    consensusGenomes {
                      edges {
                        node {
                          id
                          createdAt
                          producingRunId
                          referenceGenome {
                            id
                            file {
                              path
                            }
                          }
                          accession {
                            accessionId
                            accessionName
                          }
                          taxon {
                            id
                            name
                          }
                          sequencingRead {
                            technology
                          }
                        }
                      }
                    }
                    sample {
                      hostOrganism {
                        id
                      }
                    }
                  }
                }
              }
            }
          } 
        `;
      const entitiesResp = await get({
        args,
        context,
        serviceType: "entities",
        customQuery: entitiesQuery,
      });

      // Non-WGS workflows will not have nextGenSampleId. In this case, return sampleInfo from Rails.
      const nextGenSampleId = entitiesResp?.data.samples?.[0]?.id;
      if (!nextGenSampleId) {
        console.log(
          `No NextGenSampleId found for railsSampleId: ${args.railsSampleId}`,
        );
        return {
          id: args.railsSampleId,
          railsSampleId: args.railsSampleId,
          ...sampleInfo,
        };
      }

      // Query workflows using NextGenSampleId to get in progress CG workflow runs
      const workflowsQuery = `
          query WorkflowsQuery {
            workflowRuns(where: {entityInputs: {inputEntityId: {_eq: "${nextGenSampleId}"}}}) {
              id
              _id
              railsWorkflowRunId
              status
              ownerUserId
              errorMessage
              workflowVersion {
                version
                id
                workflow {
                  name
                }
              }
              createdAt
              endedAt
              rawInputsJson
            }
          }
      `;
      const workflowsResp = await get({
        args,
        context,
        serviceType: "workflows",
        customQuery: workflowsQuery,
      });
      const consensusGenomes =
        entitiesResp.data.samples[0].sequencingReads.edges[0].node
          .consensusGenomes.edges;
      const workflowsWorkflowRuns = workflowsResp?.data?.workflowRuns || [];
      const nextGenWorkflowRuns = workflowsWorkflowRuns.map(workflowRun => {
        const consensusGenome = consensusGenomes.find(consensusGenome => {
          return consensusGenome.node.producingRunId === workflowRun.id;
        });
        const { accession, taxon, sequencingRead } =
          consensusGenome?.node || {};
        const parsedRawInputsJson = JSON.parse(workflowRun.rawInputsJson);
        // If !consensusGenome this is a workflow run that is in progress
        return {
          deprecated: workflowRun?.deprecated_by,
          executed_at: workflowRun?.createdAt,
          id: workflowRun?.id,
          input_error: workflowRun?.errorMessage,
          inputs: {
            accession_id: accession?.accessionId,
            accession_name: accession?.accessionName,
            creation_source: parsedRawInputsJson?.creation_source,
            ref_fasta: parseRefFasta(
              consensusGenome?.node?.referenceGenome?.file?.path,
            ),
            taxon_id: taxon?.id,
            taxon_name: taxon?.name,
            technology: sequencingRead?.technology,
          },
          rails_workflow_run_id: workflowRun?.railsWorkflowRunId, // this is added for deduplicating below
          run_finalized: isRunFinalized(workflowRun?.status),
          status: workflowRun?.status,
          wdl_version: workflowRun?.workflowVersion.version,
          workflow: workflowRun?.workflowVersion.workflow.name,
        };
      });
      // Deduplicate sampleInfo.workflow_runs(from Rails) and nextGenWorkflowRuns(from NextGen)
      let dedupedWorkflowRuns;
      dedupedWorkflowRuns = [...nextGenWorkflowRuns];
      for (const railsWorkflowRun of sampleInfo.workflow_runs) {
        const alreadyExists = nextGenWorkflowRuns.find(
          nextGenWorkflowRun =>
            nextGenWorkflowRun.rails_workflow_run_id.toString() ===
            railsWorkflowRun.id,
        );
        if (!alreadyExists) {
          dedupedWorkflowRuns.push(railsWorkflowRun);
        }
      }
      return {
        id: args.railsSampleId,
        railsSampleId: args.railsSampleId,
        ...sampleInfo,
        workflow_runs: dedupedWorkflowRuns,
      };
    },
    MngsWorkflowResults: async (root, args, context, info) => {
      const data = await get({
        url: `/samples/${args.sampleId}.json`,
        args,
        context,
      });
      const pipelineRun = data?.pipeline_runs?.[0] || {};

      const urlParams = formatUrlParams({
        id: args.sampleId,
        pipelineVersion: args.workflowVersionId,
        background: args._backgroundId,
        merge_nt_nr: false,
      });
      const {
        _all_tax_ids,
        metadata,
        counts,
        lineage,
        _sortedGenus,
        _highlightedTaxIds,
      } =
        (await get({
          url: `/samples/${args.sampleId}/report_v2` + urlParams,
          args,
          context,
        })) || {};
      const taxonHits = formatTaxonHits(counts);
      const taxonLineage = formatTaxonLineage(lineage);
      return {
        metric_mngs: {
          assembled: pipelineRun?.assembled,
          adjusted_remaining_reads: pipelineRun?.adjusted_remaining_reads,
          total_ercc_reads: pipelineRun?.total_ercc_reads,
          num_reads: metadata?.preSubsamplingCount,
          num_reads_after_subsampling: metadata?.postSubsamplingCount,
          fed_has_byteranges: metadata?.hasByteRanges,
        },
        taxon_hit_results: {
          taxon_hits: taxonHits,
        },
        // Computed by PipelineReportService
        fed_lineage: taxonLineage,
      };
    },
    Pathogens: async (root, args, context, info) => {
      const urlParams = formatUrlParams({
        id: args.sampleId,
        pipelineVersion: args.workflowVersionId,
        merge_nt_nr: false,
      });
      const {
        _all_tax_ids,
        _metadata,
        counts,
        _lineage,
        _sortedGenus,
        _highlightedTaxIds,
      } =
        (await get({
          url: `/samples/${args.sampleId}/report_v2` + urlParams,
          args,
          context,
        })) || {};
      const speciesCounts = counts?.["1"] || {};
      const genusCounts = counts?.["2"] || {};
      const taxonCounts = Object.entries({ ...speciesCounts, ...genusCounts });

      const pathogens: any[] = [];
      taxonCounts.forEach(([taxId, taxInfo]: [string, any]) => {
        const isPathogen = !!taxInfo?.pathogenFlag;
        if (isPathogen) {
          pathogens.push({
            tax_id: parseInt(taxId),
          });
        }
      });
      return pathogens;
    },
    /** Returns just the sample IDs (and old Rails IDs) to determine which IDs pass the filters. */
    fedSamples: async (root, args, context) => {
      const input = args.input;

      // The comments in the formatUrlParams() call correspond to the line in the current
      // codebase's callstack where the params are set, so help ensure we're not missing anything.
      const { workflow_runs } = await get({
        url:
          "/workflow_runs.json" +
          formatUrlParams({
            // index.ts
            // const getWorkflowRuns = ({
            mode: "basic",
            //  - DiscoveryDataLayer.ts
            //    await this._collection.fetchDataCallback({
            domain: input?.todoRemove?.domain,
            //  -- DiscoveryView.tsx
            //     ...this.getConditions(workflow)
            projectId: input?.todoRemove?.projectId,
            search: input?.where?.name?._like,
            orderBy: input?.orderBy?.key,
            orderDir: input?.orderBy?.dir,
            //  --- DiscoveryView.tsx
            //      filters: {
            host: input?.where?.hostOrganism?.name?._in,
            locationV2: input?.where?.collectionLocation?._in,
            taxon: input?.todoRemove?.taxons,
            taxaLevels: input?.todoRemove?.taxaLevels,
            time: input?.todoRemove?.time,
            tissue: input?.where?.sampleType?._in,
            visibility: input?.todoRemove?.visibility,
            workflow: input?.todoRemove?.workflow,
            //  - DiscoveryDataLayer.ts
            //    await this._collection.fetchDataCallback({
            limit: input?.todoRemove?.limit,
            offset: input?.todoRemove?.offset,
            listAllIds: input?.todoRemove?.listAllIds,
          }),
        args,
        context,
      });
      if (!workflow_runs?.length) {
        return [];
      }

      return workflow_runs.map((run): query_fedSamples_items => {
        return {
          id: run.sample?.info?.id?.toString(),
          railsSampleId: run.sample?.info?.id?.toString(),
        };
      });
    },
    fedSequencingReads: async (root, args, context: any) => {
      const input = args.input;
      const queryingIdsOnly = /{\s*id\s*}/.test(context.params.query);
      if (input == null) {
        throw new Error("fedSequencingReads input is nullish");
      }

      // NEXT GEN:
      const nextGenEnabled = await shouldReadFromNextGen(context);
      if (nextGenEnabled) {
        console.log("bchu: " + queryingIdsOnly);
        if (queryingIdsOnly) {
          console.log(
            "bchu: " + convertSequencingReadsQuery(context.params.query),
          );
          console.log(
            "bchu: " +
              JSON.stringify({
                where: {
                  collectionId: input.where?.collectionId,
                  taxon: input.where?.taxon,
                  consensusGenomes: input.where?.consensusGenomes,
                },
              }),
          );
          const nextGenResponse = await fetchFromNextGen({
            customQuery: convertSequencingReadsQuery(context.params.query),
            customVariables: {
              // Entities Service doesn't support sample metadata yet.
              where: {
                collectionId: input.where?.collectionId,
                taxon: input.where?.taxon,
                consensusGenomes: input.where?.consensusGenomes,
              },
            },
            serviceType: "entities",
            args,
            context,
          });
          console.log("bchu: " + JSON.stringify(nextGenResponse));
          let sequencingReads = nextGenResponse.data.sequencingReads;
          if (input.where?.sample != null && sequencingReads.length > 0) {
            const filteredSampleIds = new Set(
              (
                await getFromRails({
                  url:
                    "/samples/index_v2.json" +
                    formatUrlParams({
                      locationV2: input.where.sample.collectionLocation?._in,
                      host: input.where.sample.hostOrganism?.name?._in,
                      tissue: input.where.sample.sampleType?._in,
                      limit: 0,
                      offset: 0,
                      listAllIds: true,
                    }),
                  args,
                  context,
                })
              ).all_samples_ids,
            );
            console.log("bchu: " + JSON.stringify(filteredSampleIds));
            sequencingReads = sequencingReads.filter(sequencingRead =>
              filteredSampleIds.has(sequencingRead.sample.railsSampleId),
            );
          }
          console.log("bchu: " + JSON.stringify(sequencingReads));
          return sequencingReads;
        }

        const nextGenResponse = await fetchFromNextGen({
          customQuery: convertSequencingReadsQuery(context.params.query),
          customVariables: {
            where: input.where,
            // TODO: Migrate to array orderBy.
            orderBy:
              (input.orderBy != null ? [input.orderBy] : undefined) ??
              input.orderByArray,
            limitOffset: input.limitOffset,
            producingRunIds:
              input.consensusGenomesInput?.where?.producingRunId?._in,
          },
          serviceType: "entities",
          args,
          context,
        });
        const nextGenSequencingReads = nextGenResponse?.data?.sequencingReads;
        if (nextGenSequencingReads == null) {
          throw new Error(
            `NextGen sequencingReads query failed: ${JSON.stringify(nextGenResponse)}`,
          );
        }
        const railsSampleIds = nextGenSequencingReads
          .map(sequencingRead => sequencingRead.sample.railsSampleId)
          .filter(id => id != null);
        if (railsSampleIds.length === 0) {
          return [];
        }

        const railsSamplesById = new Map<number, { [key: string]: any }>(
          (
            await getFromRails({
              url:
                "/samples/index_v2.json" +
                formatUrlParams({
                  sampleIds: railsSampleIds,
                  limit: TEN_MILLION,
                  offset: 0,
                  listAllIds: false,
                }),
              args,
              context,
            })
          ).samples.map(sample => [sample.id, sample]),
        );

        for (const nextGenSequencingRead of nextGenSequencingReads) {
          const nextGenSample = nextGenSequencingRead.sample;
          const railsSample = railsSamplesById.get(nextGenSample.railsSampleId);

          const railsMetadata = railsSample?.details?.metadata;
          const railsDbSample = railsSample?.details?.db_sample;

          nextGenSequencingRead.nucleicAcid =
            railsMetadata?.nucleotide_type ?? "";
          nextGenSample.collectionLocation =
            railsMetadata?.collection_location_v2 ?? "";
          nextGenSample.sampleType = railsMetadata?.sample_type ?? "";
          nextGenSample.waterControl = railsMetadata?.water_control === "Yes";
          nextGenSample.notes = railsDbSample?.sample_notes;
          nextGenSample.uploadError = railsDbSample?.upload_error;
          nextGenSample.hostOrganism =
            railsDbSample?.host_genome_name != null
              ? {
                  name: railsDbSample.host_genome_name,
                }
              : null;
          nextGenSample.ownerUserName = railsSample?.details?.uploader?.name;
          nextGenSample.collection = {
            name: railsSample?.details?.derived_sample_output?.project_name,
            public: railsSample?.public === 1,
          };
          nextGenSample.metadatas = {
            edges: getMetadataEdges(railsMetadata),
          };
        }

        return nextGenSequencingReads;
      }

      // RAILS:
      const { workflow_runs } = await get({
        url:
          "/workflow_runs.json" +
          formatUrlParams({
            mode: queryingIdsOnly ? "basic" : "with_sample_info",
            domain: input.todoRemove?.domain,
            projectId: input.todoRemove?.projectId,
            search: input.todoRemove?.search,
            orderBy: input.todoRemove?.orderBy,
            orderDir: input.todoRemove?.orderDir,
            host: input.todoRemove?.host,
            locationV2: input.todoRemove?.locationV2,
            taxon: input.todoRemove?.taxons,
            taxaLevels: input.todoRemove?.taxaLevels,
            time: input.todoRemove?.time,
            tissue: input.todoRemove?.tissue,
            visibility: input.todoRemove?.visibility,
            workflow: input.todoRemove?.workflow,
            limit: queryingIdsOnly
              ? TEN_MILLION
              : input.limit ?? input.limitOffset?.limit, // TODO: Just use limitOffset.
            offset: queryingIdsOnly
              ? 0
              : input.offset ?? input.limitOffset?.offset,
            listAllIds: false,
          }),
        args,
        context,
      });
      if (queryingIdsOnly) {
        const uniqueSampleIds = new Set<string>(
          workflow_runs.map(run => run.sample.info.id.toString()),
        );
        return [...uniqueSampleIds].map(sampleId => ({
          id: sampleId,
        }));
      }
      if (!workflow_runs?.length) {
        return [];
      }

      const result: query_fedSequencingReads_items[] = [];

      for (const run of workflow_runs) {
        const inputs = run.inputs;
        const qualityMetrics = run.cached_results?.quality_metrics;
        const sample = run.sample;
        const sampleInfo = sample?.info;
        const sampleMetadata = sample?.metadata;

        const id = sampleInfo?.id?.toString() ?? "";
        const taxon =
          inputs?.taxon_name != null
            ? {
                name: inputs.taxon_name,
              }
            : null;
        const accession =
          inputs?.accession_id != null && inputs?.accession_name != null
            ? {
                accessionId: inputs?.accession_id,
                accessionName: inputs?.accession_name,
              }
            : null;
        const consensusGenomeEdge = {
          node: {
            producingRunId: run.id?.toString(),
            taxon,
            referenceGenome: accession,
            accession,
            metrics: {
              coverageDepth: run.cached_results?.coverage_viz?.coverage_depth,
              totalReads: qualityMetrics?.total_reads,
              gcPercent: qualityMetrics?.gc_percent,
              refSnps: qualityMetrics?.ref_snps,
              percentIdentity: qualityMetrics?.percent_identity,
              nActg: qualityMetrics?.n_actg,
              percentGenomeCalled: qualityMetrics?.percent_genome_called,
              nMissing: qualityMetrics?.n_missing,
              nAmbiguous: qualityMetrics?.n_ambiguous,
              referenceGenomeLength: qualityMetrics?.reference_genome_length,
            },
          },
        };

        const existingSequencingRead = result.find(
          sequencingRead => sequencingRead.id === id,
        );
        if (existingSequencingRead !== undefined) {
          existingSequencingRead.consensusGenomes.edges.push(
            consensusGenomeEdge,
          );
        } else {
          result.push({
            id,
            nucleicAcid: sampleMetadata?.nucleotide_type ?? "",
            protocol: inputs?.wetlab_protocol,
            medakaModel: inputs?.medaka_model,
            technology: inputs?.technology ?? "",
            taxon,
            sample: {
              railsSampleId: sampleInfo?.id,
              name: sampleInfo?.name ?? "",
              notes: sampleInfo?.sample_notes,
              uploadError: sampleInfo?.result_status_description,
              collectionLocation:
                typeof sampleMetadata?.collection_location_v2 === "string"
                  ? sampleMetadata.collection_location_v2
                  : sampleMetadata?.collection_location_v2?.name ?? "",
              sampleType: sampleMetadata?.sample_type ?? "",
              waterControl: sampleMetadata?.water_control === "Yes",
              hostOrganism:
                sampleInfo?.host_genome_name != null
                  ? {
                      name: sampleInfo.host_genome_name,
                    }
                  : null,
              collection: {
                name: sample?.project_name,
                public: Boolean(sampleInfo?.public),
              },
              ownerUserId: sample?.uploader?.id,
              // TODO: Make runner come from Workflows stitched with the user service when NextGen
              // ready.
              ownerUserName: run.runner?.name ?? sample?.uploader?.name,
              metadatas: {
                edges: getMetadataEdges(sampleMetadata),
              },
            },
            consensusGenomes: {
              edges: [consensusGenomeEdge],
            },
          });
        }
      }

      return result;
    },
    ValidateUserCanDeleteObjects: async (root, args, context, info) => {
      if (!args?.input) {
        throw new Error("No input provided");
      }
      const { selectedIdsStrings, workflow, selectedIds } = args?.input;
      const body = {
        selectedIds: selectedIdsStrings ?? selectedIds,
        workflow: workflow,
      };
      const res = await postWithCSRF({
        url: `/samples/validate_user_can_delete_objects.json`,
        body,
        args,
        context,
      });
      return res;
    },
    Taxons: async (root, args, context, info) => {
      const urlParams = formatUrlParams({
        id: args.sampleId,
        pipelineVersion: args.workflowVersionId,
        merge_nt_nr: false,
      });
      const {
        all_tax_ids,
        _metadata,
        counts,
        lineage,
        _sortedGenus,
        _highlightedTaxIds,
      } =
        (await get({
          url: `/samples/${args.sampleId}/report_v2` + urlParams,
          args,
          context,
        })) || {};
      const speciesCounts = counts?.["1"] || {};
      const genusCounts = counts?.["2"] || {};
      const taxonCounts = Object.entries({ ...speciesCounts, ...genusCounts });

      const taxons: any[] = [];
      taxonCounts.forEach(([taxId, taxInfo]: [string, any]) => {
        taxons.push({
          tax_id: parseInt(taxId),
          tax_id_genus: taxInfo?.genus_tax_id,
          common_name: taxInfo?.common_name,
          name: taxInfo?.name,
          is_phage: taxInfo?.is_phage,
          level: speciesCounts.hasOwnProperty(taxId) ? "species" : "genus",
          // Computed from TaxonLineage::CATEGORIES
          fed_category: taxInfo?.category,
        });
      });
      return taxons;
    },
    UserBlastAnnotations: async (root, args, context, info) => {
      const urlParams = formatUrlParams({
        id: args.sampleId,
        pipelineVersion: args.workflowVersionId,
        merge_nt_nr: false,
      });
      const { counts } =
        (await get({
          url: `/samples/${args.sampleId}/report_v2` + urlParams,
          args,
          context,
        })) || {};
      const speciesCounts = counts?.["1"] || {};
      const genusCounts = counts?.["2"] || {};
      const taxonCounts = Object.entries({ ...speciesCounts, ...genusCounts });

      const annotations: any[] = [];
      taxonCounts.forEach(([taxId, taxInfo]: [string, any]) => {
        const annotation = taxInfo?.annotation;
        if (annotation) {
          annotations.push({
            tax_id: parseInt(taxId),
            annotation: annotation,
          });
        }
      });
      return annotations;
    },
    fedWorkflowRuns: async (_, args, context: any) => {
      const input = args.input;
      if (input == null) {
        throw new Error("fedWorkflowRuns input is nullish");
      }
      const nextGenEnabled = await shouldReadFromNextGen(context);

      // CG BULK DOWNLOAD MODAL:
      // If we provide a list of workflowRunIds, we assume that this is for getting valid consensus genome workflow runs.
      // This endpoint only provides id, ownerUserId, and status.
      if (input.where?.id?._in && typeof input.where?.id?._in === "object") {
        const workflowRunIds = input.where.id._in;
        if (nextGenEnabled) {
          const query = convertValidateConsensusGenomeQuery(
            context.params.query,
          );
          const response = await fetchFromNextGen({
            customQuery: query,
            customVariables: {
              where: input.where,
            },
            args,
            context,
            serviceType: "workflows",
          });
          if (response?.data?.workflowRuns == null) {
            throw new Error(
              `NextGen validate workflowRuns query failed: ${JSON.stringify(response)}`,
            );
          }
          return response.data.workflowRuns;
        } else {
          const body = {
            authenticity_token: input.todoRemove?.authenticityToken,
            workflowRunIds: workflowRunIds.map(id => id && parseInt(id)),
          };
          const { workflowRuns } = await postWithCSRF({
            url: `/workflow_runs/valid_consensus_genome_workflow_runs`,
            body,
            args,
            context,
          });
          return workflowRuns.map(run => ({
            id: run.id.toString(),
            ownerUserId: run.owner_user_id,
            status: run.status,
          }));
        }
      }

      // DISCOVERY VIEW:
      if (nextGenEnabled) {
        const response = await fetchFromNextGen({
          customQuery: convertWorkflowRunsQuery(context.params.query),
          customVariables: {
            where: input.where,
            // TODO: Migrate to array orderBy.
            orderBy:
              (input.orderBy != null ? [input.orderBy] : undefined) ??
              input.orderByArray,
          },
          serviceType: "workflows",
          args,
          context,
        });
        if (response?.data?.workflowRuns == null) {
          throw new Error(
            `NextGen workflowRuns query failed: ${JSON.stringify(response)}`,
          );
        }
        return response.data.workflowRuns;
      }

      // TODO(bchu): Remove all the non-Workflows fields after moving and integrating them into the
      // Entities call.
      const { workflow_runs } = await get({
        url:
          "/workflow_runs.json" +
          formatUrlParams({
            mode: "basic",
            domain: input.todoRemove?.domain,
            projectId: input.todoRemove?.projectId,
            search: input.todoRemove?.search,
            orderBy: input.todoRemove?.orderBy,
            orderDir: input.todoRemove?.orderDir,
            host: input.todoRemove?.host,
            locationV2: input.todoRemove?.locationV2,
            taxon: input.todoRemove?.taxon,
            taxaLevels: input.todoRemove?.taxonLevels,
            time: input.todoRemove?.time,
            tissue: input.todoRemove?.tissue,
            visibility: input.todoRemove?.visibility,
            workflow: input.todoRemove?.workflow,
            limit: TEN_MILLION,
            offset: 0,
            listAllIds: false,
          }),
        args,
        context,
      });
      if (!workflow_runs?.length) {
        return [];
      }

      return workflow_runs.map(
        (run): query_fedWorkflowRuns_items => ({
          id: run.id?.toString(),
          ownerUserId: run.runner?.id?.toString(),
          startedAt: run.created_at,
          status: run.status,
          rawInputsJson: `{"creation_source": "${run.inputs?.creation_source ?? ""}"}`,
          workflowVersion: {
            version: run.wdl_version,
            workflow: {
              name: run.inputs?.creation_source, // TODO: Delete when FE uses rawInputsJson.
            },
          },
          entityInputs: {
            edges: [
              {
                node: {
                  entityType: "sequencing_read",
                  inputEntityId: run.sample?.info?.id?.toString(),
                },
              },
            ],
          },
        }),
      );
    },
    fedWorkflowRunsAggregate: async (root, args, context: any, info) => {
      const input = args.input;
      const { projects } = await get({
        url:
          "/projects.json" +
          formatUrlParams({
            projectId: input?.todoRemove?.projectId,
            domain: input?.todoRemove?.domain,
            limit: TEN_MILLION,
            listAllIds: false,
            offset: 0,
            host: input?.todoRemove?.host,
            locationV2: input?.todoRemove?.locationV2,
            taxonThresholds: input?.todoRemove?.taxonThresholds,
            annotations: input?.todoRemove?.annotations,
            search: input?.todoRemove?.search,
            tissue: input?.todoRemove?.tissue,
            visibility: input?.todoRemove?.visibility,
            time: input?.todoRemove?.time,
            taxaLevels: input?.todoRemove?.taxaLevels,
            taxon: input?.todoRemove?.taxon,
          }),
        args,
        context,
      });

      const nextGenEnabled = await shouldReadFromNextGen(context);

      let nextGenProjectAggregates: query_fedWorkflowRunsAggregate_aggregate_items[] =
        [];

      if (nextGenEnabled) {
        const customQuery = `
          query nextGenWorkflowsAggregate($where: WorkflowRunWhereClause) {
            workflowRunsAggregate(where: $where) {
              aggregate {
                groupBy {
                  collectionId
                  workflowVersion {
                    workflow {
                      name
                    }
                  }
                }
                count
              }
            }
          }
        `;
        const consensusGenomesAggregateResponse = await fetchFromNextGen({
          args,
          context,
          serviceType: "workflows",
          customQuery,
          customVariables: {
            where: args.input?.where,
          },
        });
        nextGenProjectAggregates =
          consensusGenomesAggregateResponse?.data?.workflowRunsAggregate
            ?.aggregate;
      }

      return processWorkflowsAggregateResponse(
        nextGenProjectAggregates,
        projects,
        nextGenEnabled,
      );
    },
    ZipLink: async (root, args, context, info) => {
      /* --------------------- Next Gen ------------------------- */
      const nextGenEnabled = await shouldReadFromNextGen(context);
      if (nextGenEnabled) {
        const customQuery = `
          query GetZipLink {
            consensusGenomes(where: {producingRunId: {_eq: "${args.workflowRunId}"}}){
              intermediateOutputs {
                downloadLink {
                  url
                }
              }
            }
          }
        `;
        const ret = await get({
          args,
          context,
          serviceType: "entities",
          customQuery,
        });
        console.log("ret - ZipLink", JSON.stringify(ret));
        if (
          ret.data?.consensusGenomes[0]?.intermediateOutputs?.downloadLink?.url
        ) {
          return {
            url: ret.data.consensusGenomes[0].intermediateOutputs.downloadLink
              .url,
          };
        } else {
          return {
            url: null,
            error: ret.error,
          };
        }
      }
      /* --------------------- Rails ------------------------- */
      const res = await get({
        url: `/workflow_runs/${args.workflowRunId}/zip_link.json`,
        args,
        context,
        fullResponse: true,
      });
      if (res.status !== 200) {
        return {
          url: null,
          error: res.statusText,
        };
      }
      const url = res.url;
      return {
        url,
      };
    },
    GraphQLFederationVersion: () => ({
      version: process.env.CZID_GQL_FED_GIT_VERSION,
      gitCommit: process.env.CZID_GQL_FED_GIT_SHA,
    }),
  },
  Mutation: {
    CreateBulkDownload: async (root, args, context, info) => {
      if (!args?.input) {
        throw new Error("No input provided");
      }
      const {
        downloadType,
        workflow,
        downloadFormat,
        workflowRunIds,
        workflowRunIdsStrings,
      } = args?.input;

      const workflowRunIdsNumbers = workflowRunIdsStrings?.map(
        id => id && parseInt(id),
      );
      const body = {
        download_type: downloadType,
        workflow: workflow,
        params: {
          download_format: {
            value: downloadFormat,
          },
          sample_ids: {
            value: workflowRunIdsNumbers ?? workflowRunIds,
          },
          workflow: {
            value: workflow,
          },
        },
        workflow_run_ids: workflowRunIdsNumbers ?? workflowRunIds,
      };
      const res = await postWithCSRF({
        url: `/bulk_downloads`,
        body,
        args,
        context,
      });
      return res;
    },
    DeleteSamples: async (root, args, context, info) => {
      if (!args?.input) {
        throw new Error("No input provided");
      }
      const { idsStrings, workflow, ids } = args?.input;
      const body = {
        selectedIds: idsStrings ?? ids,
        workflow: workflow,
      };
      const { deletedIds, error } = await postWithCSRF({
        url: `/samples/bulk_delete`,
        body,
        args,
        context,
      });
      return {
        deleted_workflow_ids: deletedIds,
        error: error,
      };
    },
    KickoffWGSWorkflow: async (root, args, context, info) => {
      const body = {
        workflow: args?.input?.workflow,
        inputs_json: args?.input?.inputs_json,
      };
      const res = await postWithCSRF({
        url: `/samples/${args.sampleId}/kickoff_workflow`,
        body,
        args,
        context,
      });
      try {
        const formattedRes = res.map(item => {
          item.id = item.id.toString();
          return item;
        });
        return formattedRes;
      } catch {
        return res;
      }
    },
    KickoffAMRWorkflow: async (root, args, context, info) => {
      const body = {
        workflow: args?.input?.workflow,
        inputs_json: args?.input?.inputs_json,
      };
      const res = await postWithCSRF({
        url: `/samples/${args.sampleId}/kickoff_workflow`,
        body,
        args,
        context,
      });
      return res;
    },
    UpdateMetadata: async (root, args, context, info) => {
      const body = {
        field: args?.input?.field,
        value: args?.input?.value.String
          ? args.input.value.String
          : args?.input?.value
              .query_SampleMetadata_metadata_items_location_validated_value_oneOf_1_Input,
      };
      const res = await postWithCSRF({
        url: `/samples/${args.sampleId}/save_metadata_v2`,
        body,
        args,
        context,
      });
      return res;
    },
    UpdateSampleNotes: async (root, args, context, info) => {
      const body = {
        field: "sample_notes",
        value: args?.input?.value,
      };
      const res = await postWithCSRF({
        url: `/samples/${args.sampleId}/save_metadata`,
        body,
        args,
        context,
      });
      return res;
    },
    UpdateSampleName: async (root, args, context, info) => {
      const body = {
        field: "name",
        value: args?.input?.value,
      };
      const res = await postWithCSRF({
        url: `/samples/${args.sampleId}/save_metadata`,
        body,
        args,
        context,
      });
      return res;
    },
  },
};

function getMetadataEdges(
  sampleMetadata: any,
): Array<{ node: { fieldName: string; value: string } }> {
  return sampleMetadata != null
    ? Object.entries(sampleMetadata)
        .filter(
          ([fieldName]) =>
            fieldName !== "nucleotide_type" &&
            fieldName !== "collection_location_v2" &&
            fieldName !== "sample_type" &&
            fieldName !== "water_control",
        )
        .map(([fieldName, value]) => ({
          node: {
            fieldName,
            value: String(value),
          },
        }))
    : [];
}
