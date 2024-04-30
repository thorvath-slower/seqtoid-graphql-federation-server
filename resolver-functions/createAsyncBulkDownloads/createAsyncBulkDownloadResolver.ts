import { getEnrichedToken } from "../../utils/enrichToken";
import {
  fetchFromNextGen,
  get,
  postWithCSRF,
  shouldReadFromNextGen,
} from "../../utils/httpUtils";

export const createAsyncBulkDownloadResolver = async (root, args, context, info) => {
  if (!args?.input) {
    throw new Error("No input provided");
  }
  const {
    downloadType,
    workflow,
    downloadFormat,
    // TO DO: remove workflowRunIds (and potentially rename workflowRunIdsStrings)
    // after the dual write period is over
    workflowRunIds,
    workflowRunIdsStrings,
  } = args?.input;

  const workflowRunIdsNumbers = workflowRunIdsStrings?.map(
    id => id && parseInt(id),
  );
  const nextGenEnabled = await shouldReadFromNextGen(context);

  /* --------------------- Rails --------------------- */
  if (!nextGenEnabled) {
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
    const railsResponse = await postWithCSRF({
      url: `/bulk_downloads`,
      body,
      args,
      context,
    });
    if (railsResponse.error != null) {
      throw new Error(railsResponse.error);
    }
    return {
      id: railsResponse.id.toString(),
    };
  }

  /* --------------------- Next Gen --------------------- */
  // get the default bulk download workflow version id from the workflow service
  if (!workflowRunIdsStrings || workflowRunIdsStrings.length === 0) {
    throw new Error(
      "No Next Gen Workflow Ids provided for bulk download creation",
    );
  }
  if (!downloadType) {
    throw new Error("No downloadType provided for bulk download creation");
  }
  const getBulkdownloadDefautVersion = `
      query GetBulkDownloadDefaultVersion {
        workflows(where: {name: {_eq: "bulk-download"}}){
          defaultVersion
        }
      }
    `;
  const enrichedToken = await getEnrichedToken(context);
  const resDefaultVersion = await get({
    args,
    context,
    serviceType: "workflows",
    customQuery: getBulkdownloadDefautVersion,
    securityToken: enrichedToken,
  });
  const defaultVersion = resDefaultVersion.data?.workflows?.[0]?.defaultVersion;
  const getBulkdownloadVersionId = `
    query GetBulkDownloadVersionId {
      workflowVersions(
        where: {version: {_eq: "${defaultVersion}"}, workflow: {name: {_eq: "bulk-download"}}}
      ) {
        id
      }
    }
  `;
  const resWorkflowVersionId = await get({
    args,
    context,
    serviceType: "workflows",
    customQuery: getBulkdownloadVersionId,
    securityToken: enrichedToken,
  });
  const bulkdownloadVersionId =
    resWorkflowVersionId.data?.workflowVersions?.[0]?.id;

  const getFileIdsQuery = `query GetFilesFromEntities {
    consensusGenomes(where: {producingRunId: {_in: [${workflowRunIdsStrings.map(id => `"${id}"`)}]}}){
        id
      }
    }
  `;
  const resFileIds = await get({
    args,
    context,
    serviceType: "entities",
    customQuery: getFileIdsQuery,
    securityToken: enrichedToken,
  });
  const files = resFileIds.data?.consensusGenomes?.map(consensusGenome => {
    return `{name: "consensus_genomes", entityType: "consensus_genome", entityId: "${consensusGenome.id}"}`;
  });
  // run the workflow version with the files as inputs

  let aggregateAction =
    downloadFormat === "Single File (Concatenated)" ? "concatenate" : "zip";

  const runBulkDownload = `
      mutation BulkDownload {
        runWorkflowVersion(
          input: {
            workflowVersionId: "${bulkdownloadVersionId}",
            rawInputJson: "{ \\\"bulk_download_type\\\": \\\"${downloadType}\\\", \\\"aggregate_action\\\": \\\"${aggregateAction}\\\"}",
            entityInputs: [${files.join(",")}]
          }
        ) {
          id
        }
      }
    `;
  return (
    await fetchFromNextGen({
      args,
      context,
      serviceType: "workflows",
      customQuery: runBulkDownload,
      securityToken: enrichedToken,
    })
  ).data.runWorkflowVersion;
};
