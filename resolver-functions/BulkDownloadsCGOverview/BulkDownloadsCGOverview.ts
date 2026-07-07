import { postWithCSRF } from "../../utils/httpUtils";

export const BulkDownloadsCGOverviewResolver = async (
  root,
  args,
  context,
  info,
) => {
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

  /* --------------------- Rails ------------------------- */
  //array of strings to array of numbers
  const workflowRunIdsNumbers = workflowRunIdsStrings?.map(
    id => id && parseInt(id),
  );

  const body = {
    download_type: downloadType,
    workflow: workflow,
    params: {
      include_metadata: { value: includeMetadata },
      sample_ids: {
        value: workflowRunIdsNumbers ? workflowRunIdsNumbers : workflowRunIds,
      },
      workflow: {
        value: workflow,
      },
    },
    workflow_run_ids: workflowRunIdsNumbers
      ? workflowRunIdsNumbers
      : workflowRunIds,
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
};
