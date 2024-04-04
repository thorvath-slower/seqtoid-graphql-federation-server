import { get, shouldReadFromNextGen } from "../../utils/httpUtils";
import { formatUrlParams } from "../../utils/paramsUtils";
import {
  convertArrayToObject,
  snakeToCamel,
  toKebabCase,
} from "../../utils/utils";

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
enum NextGenStatuses {
  success = "SUCCEEDED",
  error = "FAILED",
  waiting = "PENDING",
  running = "RUNNING",
}

export const fedBulkDowloadsResolver = async (root, args, context, info) => {
  const getRailsBulkDownloads = async (args, context) => {
    const getEntityInputInfo = entities => {
      if (!entities || entities.length === 0) {
        return [];
      }
      return entities.map(entity => {
        return {
          id: entity?.id?.toString(),
          name: entity?.sample_name,
        };
      });
    };
    const urlParams = formatUrlParams({
      searchBy: args?.input?.searchBy,
      n: args?.input?.limit,
    });
    let res = await get({
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
          // which leaves only the params that are shown in the sidebar of
          // the bulk download list page ie. download_format, metrics, etc.
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
        status: NextGenStatuses[status],
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
  const getNextGenBulkDownloads = async (args, context) => {
    const nextGenEnabled = await shouldReadFromNextGen(context);
    if (nextGenEnabled) {
      const getAllBulkDownloadsQuery = `query GetAllBulkDownloadsQuery {
        workflowRuns(
          where: {
            workflowVersion: {workflow: {name: {_eq: "bulk-download"}}},
            deletedAt: {_is_null: true}
          }
      ) {
          id
          status
          rawInputsJson
          createdAt
          ownerUserId
          errorMessage
          workflowVersion {
            id
          }
          entityInputs{
            edges{
              node{
                fieldName
                inputEntityId
                entityType
              }
            }
          }
        }
      }`;
      const allBulkDownloadsResp = await get({
        args,
        context,
        serviceType: "workflows",
        customQuery: getAllBulkDownloadsQuery,
      });
      // If the workflow run is successful, get the download link
      // Add the URL to the workflow run object
      const succeededWorkflowRunIds = allBulkDownloadsResp?.data?.workflowRuns
        ?.filter(bulkDownload => bulkDownload.status === "SUCCEEDED")
        .map(bulkDownload => bulkDownload.id);
      const allEntityInputsIds =
        allBulkDownloadsResp?.data?.workflowRuns?.flatMap(bulkDownload =>
          bulkDownload?.entityInputs?.edges?.map(
            entityInput => entityInput?.node?.inputEntityId,
          ),
        );
      const downloadLinkQuery = `query GetDownloadURLAndSampleNames {
        bulkDownloads(where: {producingRunId: {_in: [${succeededWorkflowRunIds?.map(id => `"${id}"`)}]}}) {
          producingRunId
          file {
            size
            downloadLink {
              url
            }
          }
        }
        consensusGenomes(where: {id: {_in: [${allEntityInputsIds?.map(id => `"${id}"`)}]}}) {
          id
          sequencingRead {
            sample {
              name
            }
          }
        }
      }`;
      const downloadLinksResp = await get({
        args,
        context,
        serviceType: "entities",
        customQuery: downloadLinkQuery,
      });
      const bulkDownloads =
        downloadLinksResp?.data?.bulkDownloads &&
        convertArrayToObject(
          downloadLinksResp.data.bulkDownloads,
          "producingRunId",
        );
      const consensusGenomes =
        downloadLinksResp?.data?.consensusGenomes &&
        convertArrayToObject(downloadLinksResp.data.consensusGenomes, "id");
      const nextGenBulkDownloads = allBulkDownloadsResp?.data?.workflowRuns
        ?.filter(wr => wr)
        .map(workflowRun => {
          const file = bulkDownloads[workflowRun.id]?.file;
          console.log("file", file);
          const {
            createdAt,
            rawInputsJson,
            id,
            status,
            ownerUserId,
            entityInputs,
            errorMessage,
          } = workflowRun;
          const inputs = entityInputs?.edges || [];
          const { bulk_download_type, aggregate_action } =
            JSON.parse(rawInputsJson) || {};
          return {
            id,
            startedAt: createdAt,
            status,
            downloadType: bulk_download_type,
            ownerUserId,
            fileSize: file?.size,
            url: file?.downloadLink?.url,
            analysisCount: entityInputs?.edges?.length,
            entityInputFileType: toKebabCase(inputs[0].node.entityType),
            entityInputs: inputs.map(edge => {
              return {
                id: edge.node.inputEntityId,
                name: consensusGenomes[edge.node.inputEntityId]?.sequencingRead
                  ?.sample?.name,
              };
            }),
            errorMessage: errorMessage,
            params: [
              {
                paramType: "downloadFormat",
                value: aggregate_action,
              },
            ],
            logUrl: null,
          };
        });
      return nextGenBulkDownloads;
    }
    return [];
  };
  const railsBulkDownloads = await getRailsBulkDownloads(args, context);
  const nextGenBulkDownloads = await getNextGenBulkDownloads(args, context);

  const mappedRes = [...railsBulkDownloads, ...nextGenBulkDownloads];
  return mappedRes;
};
