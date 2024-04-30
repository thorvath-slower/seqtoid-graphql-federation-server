import { getEnrichedToken } from "../../utils/enrichToken";
import {
  fetchFromNextGen,
  get,
  postWithCSRF,
  shouldReadFromNextGen,
} from "../../utils/httpUtils";

export const CreateBulkDownloadResolver = async (root, args, context, info) => {
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
    const res = await postWithCSRF({
      url: `/bulk_downloads`,
      body,
      args,
      context,
    });
    return res;
  }
};
