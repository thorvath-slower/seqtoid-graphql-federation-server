import { query_fedSequencingReads_items } from "../../.mesh";
import { TEN_MILLION } from "../../utils/constants";
import { get } from "../../utils/httpUtils";
import { formatUrlParams } from "../../utils/paramsUtils";
import { getMetadataEdges } from "../../utils/utils";

export const fedSequencingReadsResolver = async (
  root,
  args,
  context: any,
): Promise<any> => {
  const input = args.input;
  const queryingIdsOnly = /{\s*id\s*}/.test(context.params.query);
  if (input == null) {
    throw new Error("fedSequencingReads input is nullish");
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
        offset: queryingIdsOnly ? 0 : input.offset ?? input.limitOffset?.offset,
        listAllIds: false,
        workflowRunIds: input?.todoRemove?.workflowRunIds,
        // Only used for API testing:
        sampleIds: input?.todoRemove?.sampleIds,
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
      existingSequencingRead.consensusGenomes.edges.push(consensusGenomeEdge);
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
};
