import { get } from "../../utils/httpUtils";
import { formatUrlParams } from "../../utils/paramsUtils";
import { snakeToCamel } from "../../utils/utils";

interface BulkDownloadFromRails {
  id: number;
  download_type: string;
  status: "success" | "error" | "waiting" | "running";
  error_message: string | null;
  user_id: number;
  created_at: string;
  updated_at: string;
  output_file_size: number;
  deleted_at: string | null;
  analysis_type: string;
  analysis_count: number;
  log_url: string;
  params: { [x: string]: Param };
  pipeline_runs: { id: number; sample_name: string }[];
  workflow_runs: { id: number; sample_name: string }[];
  presigned_output_url: string | null;
}
interface Param {
  paramType: string;
  downloadName?: string;
  value: string;
}

export const fedBulkDowloadsResolver = async (root, args, context, info) => {
  /*----------------- Rails -----------------*/
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
    if (!entities || entities.length === 0) {
      return [];
    }
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
  const mappedRes = res.map(async (bulkDownload: BulkDownloadFromRails) => {
    const entityInputs = [
      ...getEntityInputInfo(bulkDownload?.workflow_runs),
      ...getEntityInputInfo(bulkDownload?.pipeline_runs),
    ];
    let params: Param[] = [];
    if (typeof bulkDownload?.params === "object") {
      Object.entries(bulkDownload?.params)
        // remove "workflow" and "sample_ids" from details?.bulk_download?.params
        .filter(param => param[0] !== "workflow" && param[0] !== "sample_ids")
        // make params into an array of objects
        .map((param: [string, { downloadName?: string; value: string }]) => {
          const paramItem = {
            paramType: snakeToCamel(param[0]),
            ...param[1],
          };
          params.push(paramItem);
        });
    }
    const {
      id,
      status,
      user_id,
      download_type,
      created_at,
      output_file_size,
      log_url,
      analysis_type,
      analysis_count,
      error_message,
      presigned_output_url,
    } = bulkDownload;
    return {
      id: id?.toString(),
      startedAt: created_at,
      status: statusDictionary[status],
      downloadType: download_type,
      ownerUserId: user_id,
      fileSize: output_file_size,
      url: presigned_output_url,
      analysisCount: analysis_count,
      entityInputFileType: analysis_type,
      entityInputs,
      errorMessage: error_message,
      params,
      logUrl: log_url, // used in admin only, we will deprecate log_url in NextGen and use something like executionId
    };
  });
  return mappedRes;
};
