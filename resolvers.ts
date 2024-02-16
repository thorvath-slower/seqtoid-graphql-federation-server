// resolvers.ts
import {
  Resolvers,
  query_consensusGenomes_items,
  query_samples_items,
  query_sequencingReads_items,
  query_workflowRuns_items,
} from "./.mesh";
import {
  get,
  formatUrlParams,
  postWithCSRF,
  getFullResponse,
} from "./utils/httpUtils";
import {
  formatTaxonHits,
  formatTaxonLineage,
} from "./utils/mngsWorkflowResultsUtils";

/**
 * Arbitrary very large number used temporarily during Rails read phase to force Rails not to
 * paginate our fake "Workflows Service" call.
 */
const TEN_MILLION = 10_000_000;

export const resolvers: Resolvers = {
  Query: {
    AmrWorkflowResults: async (root, args, context, info) => {
      const { quality_metrics, report_table_data } = await get(
        `/workflow_runs/${args.workflowRunId}/results`,
        args,
        context
      );
      return {
        metric_amr: quality_metrics,
        amr_hit: report_table_data,
      };
    },
    Background: async (root, args, context, info) => {
      const { other_backgrounds, owned_backgrounds } = await get(
        `/backgrounds.json`,
        args,
        context
      );
      const ret = other_backgrounds.concat(owned_backgrounds);
      return ret.map((item: any) => {
        return {
          ...item,
          is_mass_normalized: item.mass_normalized,
        };
      }, []);
    },
    BulkDownloadCGOverview: async (root, args, context, info) => {
      if (!args?.input) {
        throw new Error("No input provided");
      }
      const { downloadType, workflow, includeMetadata, workflowRunIds } =
        args?.input;
      const body = {
        download_type: downloadType,
        workflow: workflow,
        params: {
          include_metadata: { value: includeMetadata },
          sample_ids: {
            value: workflowRunIds,
          },
          workflow: {
            value: workflow,
          },
        },
        workflow_run_ids: workflowRunIds,
      };
      const res = await postWithCSRF(
        `/bulk_downloads/consensus_genome_overview_data`,
        body,
        args,
        context
      );
      if (res?.cg_overview_rows) {
        return {
          cgOverviewRows: res?.cg_overview_rows,
        };
      } else {
        throw new Error(res.error);
      }
    },
    consensusGenomes: async (root, args, context) => {
      const input = args.input;

      // The comments in the formatUrlParams() call correspond to the line in the current
      // codebase's callstack where the params are set, so help ensure we're not missing anything.
      const { workflow_runs } = await get(
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
            limit: input?.todoRemove?.limit,
            offset: input?.todoRemove?.offset,
            listAllIds: false,
          }),
        args,
        context
      );
      if (!workflow_runs?.length) {
        return [];
      }

      return workflow_runs.map((run): query_consensusGenomes_items => {
        const inputs = run.inputs;
        const qualityMetrics = run.cached_results?.quality_metrics;
        const sample = run.sample;
        const sampleInfo = sample?.info;
        const sampleMetadata = sample?.metadata;
        return {
          producingRunId: run.id?.toString(),
          taxon: {
            name: inputs?.taxon_name,
          },
          referenceGenome: {
            accessionId: inputs?.accession_id,
            accessionName: inputs?.accession_name,
          },
          metric: {
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
            nucleicAcid: sampleMetadata?.nucleotide_type,
            protocol: inputs?.wetlab_protocol,
            medakaModel: inputs?.medaka_model,
            technology: inputs?.technology,
            taxon: {
              name: inputs?.taxon_name,
            },
            sample: {
              railsSampleId: sample?.id,
              name: sampleInfo?.name,
              notes: sampleInfo?.sample_notes,
              collectionLocation: sampleMetadata?.collection_location_v2,
              sampleType: sampleMetadata?.sample_type,
              waterControl: sampleMetadata?.water_control,
              hostOrganism: {
                name: sampleInfo?.host_genome_name,
              },
              collection: {
                name: sample?.project_name,
                public: Boolean(sampleInfo?.public),
              },
              ownerUser: {
                name: sample?.uploader?.name,
              },
              metadatas: {
                edges: getMetadataEdges(sampleMetadata),
              },
            },
          },
        };
      });
    },
    ConsensusGenomeWorkflowResults: async (root, args, context, info) => {
      const { coverage_viz, quality_metrics, taxon_info } = await get(
        `/workflow_runs/${args.workflowRunId}/results`,
        args,
        context
      );
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
      const coverage_viz_summary = await get(
        `/samples/${args.sampleId}/coverage_viz_summary`,
        args,
        context
      );
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
      const res = await postWithCSRF(
        `/samples/metadata_fields`,
        body,
        args,
        context
      );
      return res;
    },
    SampleMetadata: async (root, args, context, info) => {
      const url = `/samples/${args.sampleId}/metadata`;
      const urlWithParams = args?.input?.pipelineVersion
        ? url + `?pipeline_version=${args?.input?.pipelineVersion}`
        : url;
      const res = await get(urlWithParams, args, context);
      try {
        const metadata = res.metadata.map((item) => {
          item.id = item.id.toString();
          return item;
        });
        if (res?.additional_info?.pipeline_run?.id) {
          res.additional_info.pipeline_run.id =
            res.additional_info.pipeline_run.id.toString();
        }
        // location_validated_value is a union type, so we need to add __typename to the object
        metadata.map((field) => {
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
      const data = await get(`/samples/${args.sampleId}.json`, args, context);
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
        (await get(
          `/samples/${args.sampleId}/report_v2` + urlParams,
          args,
          context
        )) || {};
      const taxonHits = formatTaxonHits(counts);
      const taxonLineage = formatTaxonLineage(lineage);
      return {
        metric_mngs: {
          assembled: pipelineRun?.assembled,
          adjusted_remaining_reads: pipelineRun?.adjusted_remaining_reads,
          total_ercc_reads: pipelineRun?.total_ercc_reads,
          num_reads: metadata?.preSubsamplingCount,
          num_reads_after_subsampling: metadata?.postSubsamplingCount,
          _: {
            has_byteranges: metadata?.hasByteRanges,
          },
        },
        taxon_hit_results: {
          taxon_hits: taxonHits,
        },
        _: {
          // Computed by PipelineReportService
          lineage: taxonLineage,
        },
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
        (await get(
          `/samples/${args.sampleId}/report_v2` + urlParams,
          args,
          context
        )) || {};
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
    samples: async (root, args, context) => {
      const input = args.input;

      // The comments in the formatUrlParams() call correspond to the line in the current
      // codebase's callstack where the params are set, so help ensure we're not missing anything.
      const { workflow_runs } = await get(
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
        context
      );
      if (!workflow_runs?.length) {
        return [];
      }

      return workflow_runs.map((run): query_samples_items => {
        return {
          id: run.sample?.info?.id?.toString(),
          railsSampleId: run.sample?.info?.id?.toString(),
        };
      });
    },
    sequencingReads: async (root, args, context) => {
      const input = args.input;

      // The comments in the formatUrlParams() call correspond to the line in the current
      // codebase's callstack where the params are set, so help ensure we're not missing anything.
      const { workflow_runs } = await get(
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
            limit: input?.todoRemove?.limit,
            offset: input?.todoRemove?.offset,
            listAllIds: false,
          }),
        args,
        context
      );
      if (!workflow_runs?.length) {
        return [];
      }

      return workflow_runs.map((run): query_sequencingReads_items => {
        const inputs = run.inputs;
        const qualityMetrics = run.cached_results?.quality_metrics;
        const sample = run.sample;
        const sampleInfo = sample?.info;
        const sampleMetadata = sample?.metadata;
        return {
          id: sampleInfo?.id?.toString(),
          nucleicAcid: sampleMetadata?.nucleotide_type,
          protocol: inputs?.wetlab_protocol,
          medakaModel: inputs?.medaka_model,
          technology: inputs?.technology,
          taxon: {
            name: inputs?.taxon_name,
          },
          sample: {
            railsSampleId: sampleInfo?.id?.toString(),
            name: sampleInfo?.name,
            notes: sampleInfo?.sample_notes,
            collectionLocation: sampleMetadata?.collection_location_v2,
            sampleType: sampleMetadata?.sample_type,
            waterControl: sampleMetadata?.water_control,
            hostOrganism: {
              name: sampleInfo?.host_genome_name,
            },
            collection: {
              name: sample?.project_name,
              public: Boolean(sampleInfo?.public),
            },
            ownerUser: {
              name: sample?.uploader?.name,
            },
            metadatas: {
              edges: getMetadataEdges(sampleMetadata),
            },
          },
          consensusGenomes: {
            edges: [
              {
                node: {
                  producingRunId: run.id?.toString(),
                  taxon: {
                    name: inputs?.taxon_name,
                  },
                  referenceGenome: {
                    accessionId: inputs?.accession_id,
                    accessionName: inputs?.accession_name,
                  },
                  metric: {
                    coverageDepth:
                      run.cached_results?.coverage_viz?.coverage_depth,
                    totalReads: qualityMetrics?.total_reads,
                    gcPercent: qualityMetrics?.gc_percent,
                    refSnps: qualityMetrics?.ref_snps,
                    percentIdentity: qualityMetrics?.percent_identity,
                    nActg: qualityMetrics?.n_actg,
                    percentGenomeCalled: qualityMetrics?.percent_genome_called,
                    nMissing: qualityMetrics?.n_missing,
                    nAmbiguous: qualityMetrics?.n_ambiguous,
                    referenceGenomeLength:
                      qualityMetrics?.reference_genome_length,
                  },
                },
              },
            ],
          },
        };
      });
    },
    ValidateUserCanDeleteObjects: async (root, args, context, info) => {
      const body = {
        selectedIds: args?.input?.selectedIds,
        workflow: args?.input?.workflow,
      };
      const res = await postWithCSRF(
        `/samples/validate_user_can_delete_objects.json`,
        body,
        args,
        context
      );
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
        (await get(
          `/samples/${args.sampleId}/report_v2` + urlParams,
          args,
          context
        )) || {};
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
          _: {
            // Computed from TaxonLineage::CATEGORIES
            category: taxInfo?.category,
          },
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
        (await get(
          `/samples/${args.sampleId}/report_v2` + urlParams,
          args,
          context
        )) || {};
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
    workflowRuns: async (root, args, context) => {
      const input = args.input;

      // If we provide a list of workflowRunIds, we assume that this is for getting valid consensus genome workflow runs.
      // This endpoint only provides id, ownerUserId, and status.
      if (input?.where?.id?._in && typeof input?.where?.id?._in === "object") {
        const body = {
          authenticity_token: input?.todoRemove?.authenticityToken,
          workflowRunIds: input.where.id._in.map((id) => id && parseInt(id)),
        };

        const { workflowRuns } = await postWithCSRF(
          `/workflow_runs/valid_consensus_genome_workflow_runs`,
          body,
          args,
          context
        );
        return workflowRuns.map((run) => ({
          id: run.id,
          ownerUserId: run.owner_user_id,
          status: run.status,
        }));
      }

      // TODO(bchu): Remove all the non-Workflows fields after moving and integrating them into the
      // Entities call.
      const { workflow_runs } = await get(
        "/workflow_runs.json" +
          formatUrlParams({
            mode: "basic",
            domain: input?.todoRemove?.domain,
            projectId: input?.todoRemove?.projectId,
            search: input?.todoRemove?.search,
            // Workflows Service will cover sorting by time, version, or creation source, but
            // Rails doesn't support the latter 2!
            orderBy:
              input?.orderBy?.startedAt != null ? "createdAt" : undefined,
            orderDir: input?.orderBy?.startedAt,
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
        context
      );
      if (!workflow_runs?.length) {
        return [];
      }

      return workflow_runs.map(
        (run): query_workflowRuns_items => ({
          id: run.id?.toString(),
          ownerUserId: run.runner?.id?.toString(),
          startedAt: run.created_at,
          status: run.status,
          workflowVersion: {
            version: run.wdl_version,
            workflow: {
              name: run.inputs?.creation_source,
            },
          },
          entityInputs: {
            edges: [
              {
                node: {
                  entityType: "Sample",
                  inputEntityId: run.sample?.info?.id?.toString(),
                },
              },
            ],
          },
        })
      );
    },
    ZipLink: async (root, args, context, info) => {
      const res = await getFullResponse(
        `/workflow_runs/${args.workflowRunId}/zip_link.json`,
        args,
        context
      );
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
      const res = await postWithCSRF(`/bulk_downloads`, body, args, context);
      return res;
    },
    DeleteSamples: async (root, args, context, info) => {
      const body = {
        selectedIds: args?.input?.ids,
        workflow: args?.input?.workflow,
      };
      const { deletedIds, error } = await postWithCSRF(
        `/samples/bulk_delete`,
        body,
        args,
        context
      );
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
      const res = await postWithCSRF(
        `/samples/${args.sampleId}/kickoff_workflow`,
        body,
        args,
        context
      );
      try {
        const formattedRes = res.map((item) => {
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
      const res = await postWithCSRF(
        `/samples/${args.sampleId}/kickoff_workflow`,
        body,
        args,
        context
      );
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
      const res = await postWithCSRF(
        `/samples/${args.sampleId}/save_metadata_v2`,
        body,
        args,
        context
      );
      return res;
    },
    UpdateSampleNotes: async (root, args, context, info) => {
      const body = {
        field: "sample_notes",
        value: args?.input?.value,
      };
      const res = await postWithCSRF(
        `/samples/${args.sampleId}/save_metadata`,
        body,
        args,
        context
      );
      return res;
    },
    UpdateSampleName: async (root, args, context, info) => {
      const body = {
        field: "name",
        value: args?.input?.value,
      };
      const res = await postWithCSRF(
        `/samples/${args.sampleId}/save_metadata`,
        body,
        args,
        context
      );
      return res;
    },
  },
};

function getMetadataEdges(
  sampleMetadata: any
): Array<{ node: { fieldName: string; value: string } }> {
  return sampleMetadata != null
    ? Object.entries(sampleMetadata)
        .filter(
          ([fieldName]) =>
            fieldName !== "nucleotide_type" &&
            fieldName !== "collection_location_v2" &&
            fieldName !== "sample_type" &&
            fieldName !== "water_control"
        )
        .map(([fieldName, value]) => ({
          node: {
            fieldName,
            value: String(value),
          },
        }))
    : [];
}
