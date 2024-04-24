import { TEN_MILLION } from "../../utils/constants";
import {
  fetchFromNextGen,
  get,
  shouldReadFromNextGen,
} from "../../utils/httpUtils";
import { formatUrlParams } from "../../utils/paramsUtils";
import { convertConsensusGenomesQuery } from "../../utils/queryFormatUtils";

export const fedConsensusGenomesResolver = async (root, args, context: any) => {
  const nextGenEnabled = await shouldReadFromNextGen(context);
  const input = args.input;
  if (input == null) {
    throw new Error("fedConsensusGenomes input was nullish");
  }

  // if there is an _eq in the response then it is a call for a single workflow run result
  if (input.where?.producingRunId?._eq) {
    /* --------------------- Next Gen ------------------------- */
    if (nextGenEnabled) {
      const ret = await get({ args, context, serviceType: "entities" });
      return ret.data.consensusGenomes;
    }
    /* --------------------- Rails ----------------------------- */
    const workflowRunId = input.where.producingRunId._eq;
    const data = await get({
      url: `/workflow_runs/${workflowRunId}/results`,
      args,
      context,
    });
    const { coverage_viz, quality_metrics, taxon_info } = data;
    const { accession_id, accession_name, taxon_id, taxon_name } =
      taxon_info || {};

    const referenceGenomeDownloadUrl = await get({
      url: `/workflow_runs/${workflowRunId}/cg_report_downloads?downloadType=ref_fasta`,
      args,
      context,
    });

    const accession =
      accession_id && accession_name
        ? { accessionId: accession_id, accessionName: accession_name }
        : null;
    const taxon =
      taxon_id && taxon_name
        ? {
            id: taxon_id.toString(),
            name: taxon_name,
            commonName: taxon_name,
          }
        : null;
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
        accession: accession,
        taxon: taxon,
        referenceGenome: {
          file: {
            downloadLink: {
              url: referenceGenomeDownloadUrl.url,
            },
          },
        },
      },
    ];
    return ret;
  }

  // DISCOVERY VIEW:
  if (nextGenEnabled) {
    return (
      await fetchFromNextGen({
        customQuery: convertConsensusGenomesQuery(context.params.query),
        customVariables: {
          where: input.where,
          orderBy: input.orderBy,
        },
        serviceType: "entities",
        args,
        context,
      })
    ).data.consensusGenomes;
  }

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
        taxon: input?.todoRemove?.taxons,
        taxaLevels: input?.todoRemove?.taxaLevels,
        time: input?.todoRemove?.time,
        tissue: input?.todoRemove?.tissue,
        visibility: input?.todoRemove?.visibility,
        workflow: input?.todoRemove?.workflow,
        workflowRunIds: input?.todoRemove?.workflowRunIds,
        sampleIds: input?.todoRemove?.sampleIds,
        limit: TEN_MILLION,
        offset: 0,
        listAllIds: false,
      }),
    args,
    context,
  });
  return workflow_runs.map(run => ({
    sequencingRead: {
      id: run.sample.info.id.toString(),
    },
  }));
};
