// resolvers.ts
import { Resolvers } from "./.mesh";
import { get } from "./utils/httpUtils";
import {
  fedBulkDowloadsResolver,
  BulkDownloadsCGOverviewResolver,
  fedConsensusGenomesResolver,
  MetadataFieldsResolver,
  SampleMetadataResolver,
  fedSequencingReadsResolver,
  SampleForReportResolver,
  ValidateUserCanDeleteObjectsResolver,
  fedWorkflowRunsResolver,
  fedWorkflowRunsAggregateResolver,
  fedWorkflowRunsAggregateTotalCountResolver,
  ZiplinkResolver,
  CreateBulkDownloadResolver,
  DeleteSamplesResolver,
  KickoffWGSWorkflowResolver,
  UpdateMetadataResolver,
  UpdateSampleNotesResolver,
  UpdateSampleNameResolver,
  adminSamplesResolver,
  adminWorkflowRunsResolver,
} from "./resolver-functions";

export const resolvers: Resolvers = {
  Query: {
    adminSamples: adminSamplesResolver,
    adminWorkflowRuns: adminWorkflowRunsResolver,
    fedBulkDownloads: fedBulkDowloadsResolver,
    BulkDownloadCGOverview: BulkDownloadsCGOverviewResolver,
    fedConsensusGenomes: fedConsensusGenomesResolver,
    //TO DO: Remove this query after the integration is released to production
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
    MetadataFields: MetadataFieldsResolver,
    SampleMetadata: SampleMetadataResolver,
    SampleForReport: SampleForReportResolver,
    fedSequencingReads: fedSequencingReadsResolver,
    ValidateUserCanDeleteObjects: ValidateUserCanDeleteObjectsResolver,
    fedWorkflowRuns: fedWorkflowRunsResolver,
    fedWorkflowRunsAggregate: fedWorkflowRunsAggregateResolver,
    fedWorkflowRunsAggregateTotalCount:
      fedWorkflowRunsAggregateTotalCountResolver,
    ZipLink: ZiplinkResolver,
    GraphQLFederationVersion: () => ({
      version: process.env.CZID_GQL_FED_GIT_VERSION,
      gitCommit: process.env.CZID_GQL_FED_GIT_SHA,
    }),
  },
  Mutation: {
    CreateBulkDownload: CreateBulkDownloadResolver,
    DeleteSamples: DeleteSamplesResolver,
    KickoffWGSWorkflow: KickoffWGSWorkflowResolver,
    UpdateMetadata: UpdateMetadataResolver,
    UpdateSampleNotes: UpdateSampleNotesResolver,
    UpdateSampleName: UpdateSampleNameResolver,
  },
};
