// resolvers.ts
import {
  Resolvers,
  query_fedConsensusGenomes_items,
  query_fedSamples_items,
  query_fedSequencingReads_items,
  query_fedWorkflowRunsAggregate_items,
  query_fedWorkflowRuns_items,
} from "./.mesh";
import {
  fetchFromNextGen,
  get,
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
  convertWorkflowRunsQuery,
} from "./utils/queryFormatUtils";

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
      const workflowRunIdsNumbers = workflowRunIdsStrings?.map(id =>
        parseInt(id),
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
      const nextGenEnabled = await shouldReadFromNextGen(context);
      if (nextGenEnabled) {
        const ret = await get({ args, context, serviceType: "entities" });
        return ret.data.consensusGenomes;
      }

      // CG REPORT:
      // Next Gen Not Enabled
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

      // NEXT GEN:
      const nextGenEnabled = await shouldReadFromNextGen(context);
      if (nextGenEnabled) {
        const response = await fetchFromNextGen({
          customQuery: convertSequencingReadsQuery(context.params.query),
          customVariables: {
            where: input.where,
            orderBy: input.orderBy != null ? [input.orderBy] : [], // TODO: Migrate to array orderBy.
            limitOffset: input.limitOffset,
            producingRunIds: input?.where?.id?._in,
          },
          serviceType: "entities",
          args,
          context,
        });
        return response.data.sequencingReads;
      }

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
            limit: input?.limit ?? input?.limitOffset?.limit, // TODO: Just use limitOffset.
            offset: input?.offset ?? input?.limitOffset?.offset,
            listAllIds: false,
          }),
        args,
        context,
      });
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
      const body = {
        selectedIds: args?.input?.selectedIds,
        workflow: args?.input?.workflow,
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
    fedWorkflowRuns: async (root, args, context: any) => {
      const input = args.input;

      // CG REPORT:
      // If we provide a list of workflowRunIds, we assume that this is for getting valid consensus genome workflow runs.
      // This endpoint only provides id, ownerUserId, and status.
      if (input?.where?.id?._in && typeof input?.where?.id?._in === "object") {
        const body = {
          authenticity_token: input?.todoRemove?.authenticityToken,
          workflowRunIds: input.where.id._in.map(id => id && parseInt(id)),
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

      // DISCOVERY VIEW:
      const nextGenEnabled = await shouldReadFromNextGen(context);
      if (nextGenEnabled) {
        const response = await fetchFromNextGen({
          customQuery: convertWorkflowRunsQuery(context.params.query),
          customVariables: {
            where: input.where,
            orderBy: input.orderBy != null ? [input.orderBy] : [], // TODO: Migrate to array orderBy.
          },
          serviceType: "workflows",
          args,
          context,
        });
        return response.data.workflowRuns;
      }

      // TODO(bchu): Remove all the non-Workflows fields after moving and integrating them into the
      // Entities call.
      const { workflow_runs } = await get({
        url:
          "/workflow_runs.json" +
          formatUrlParams({
            mode: "basic",
            domain: input?.todoRemove?.domain,
            projectId: input?.todoRemove?.projectId,
            search: input?.todoRemove?.search,
            orderBy: input?.todoRemove?.orderBy,
            orderDir: input?.todoRemove?.orderDir,
            host: input?.todoRemove?.host,
            locationV2: input?.todoRemove?.locationV2,
            taxon: input?.todoRemove?.taxon,
            taxaLevels: input?.todoRemove?.taxonLevels,
            time: input?.todoRemove?.time,
            tissue: input?.todoRemove?.tissue,
            visibility: input?.todoRemove?.visibility,
            workflow: input?.todoRemove?.workflow,
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
                  entityType: "SequencingRead",
                  inputEntityId: run.sample?.info?.id?.toString(),
                },
              },
            ],
          },
        }),
      );
    },
    fedWorkflowRunsAggregate: async (root, args, context, info) => {
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

      if (!projects?.length) {
        return [];
      }
      return projects.map((project): query_fedWorkflowRunsAggregate_items => {
        return {
          collectionId: project.id.toString(),
          mngsRunsCount: project.sample_counts.mngs_runs_count,
          cgRunsCount: project.sample_counts.cg_runs_count,
          amrRunsCount: project.sample_counts.amr_runs_count,
        };
      });

      // TODO (nina): call nextgen in addition to rails to get CG count
    },
    ZipLink: async (root, args, context, info) => {
      // const nextGenEnabled = await shouldReadFromNextGen(context);
      // if (nextGenEnabled) {
      //   const customQuery = `
      //     query blah bla blah
      //   `;
      //   const ret = await get({ args, context, serviceType: "workflows", customQuery });
      //   return {
      //     url: null,
      //     error: null,
      //   };
      // }
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
      const { downloadType, workflow, downloadFormat, workflowRunIds } =
        args?.input;
      const body = {
        download_type: downloadType,
        workflow: workflow,
        params: {
          download_format: {
            value: downloadFormat,
          },
          sample_ids: {
            value: workflowRunIds,
          },
          workflow: {
            value: workflow,
          },
        },
        workflow_run_ids: workflowRunIds,
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
      const body = {
        selectedIds: args?.input?.ids,
        workflow: args?.input?.workflow,
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
