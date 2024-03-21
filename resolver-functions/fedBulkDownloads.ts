import { get } from "../utils/httpUtils";
import { formatUrlParams } from "../utils/paramsUtils";
import { snakeToCamel } from "../utils/utils";

export const fedBulkDowloadsResolver = async (root, args, context, info) => {
  const statusDictionary = {
    success: "SUCCEEDED",
    error: "FAILED",
    waiting: "PENDING",
    running: "RUNNING",
  };
  const urlParams = formatUrlParams({
    searchBy: args?.input?.searchBy,
    n: args?.input?.limit,
  });
  const getEntityInputInfo = entities => {
    return entities.map(entity => {
      return {
        id: entity?.id.toString(),
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
    const details = await get({
      url: `/bulk_downloads/${bulkDownload?.id}.json`,
      args,
      context,
    });
    const url = details?.bulk_download?.presigned_output_url;
    const entityInputs = [
      ...getEntityInputInfo(details?.bulk_download?.workflow_runs),
      ...getEntityInputInfo(details?.bulk_download?.pipeline_runs),
    ];
    const params = {};
    Object.entries(details?.bulk_download?.params)
      // remove "workflow" and "sample_ids" from details?.bulk_download?.params
      .filter(param => param[0] !== "workflow" && param[0] !== "sample_ids")
      .map(param => {
        params[snakeToCamel(param[0])] = param[1];
      });

    const {
      id,
      status,
      user_id,
      download_type,
      created_at,
      output_file_size,
      logUrl,
      analysis_type,
      error_message,
    } = bulkDownload;

    // In Next Gen we will have an array with all of the entity input
    // filtered through the nodes entity query to get the relevant info
    // If there are 22 Consensus Genome Files coming from 20 Samples, there will be 42 items in the array.
    // We will get `sampleNames` by checking __typename to see if the entity is a sample,
    // The amount of other items left in the array should be a the `analysisCount` and the analysis type will come from the file.entity.type
    // Some work will have to be done in the resolver here to surface the right information to the front end from NextGen
    return {
      id: id.toString(), // in NextGen this will be the workflowRun id because that is the only place that has info about failed and in progress bulk download workflows
      startedAt: created_at,
      status: statusDictionary[status],
      downloadType: download_type,
      ownerUserId: user_id,
      fileSize: output_file_size,
      url,
      analysisCount: entityInputs.length,
      entityInputFileType: analysis_type,
      entityInputs,
      errorMessage: error_message,
      params: {
        ...params,
      },
      logUrl, // used in admin only, we will deprecate log_url and use something like executionId
    };
  });
  return mappedRes;
};
