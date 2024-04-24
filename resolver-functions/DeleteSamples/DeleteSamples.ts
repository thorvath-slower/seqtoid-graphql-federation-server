import { postWithCSRF } from "../../utils/httpUtils";

export const DeleteSamplesResolver = async (root, args, context, info) => {
  if (!args?.input) {
    throw new Error("No input provided");
  }
  const { idsStrings, workflow, ids } = args?.input;
  const body = {
    selectedIds: idsStrings ?? ids,
    workflow: workflow,
  };
  const { deletedIds, error } = await postWithCSRF({
    url: `/samples/bulk_delete`,
    body,
    args,
    context,
  });
  return {
    deleted_workflow_ids: deletedIds,
    error: error,
  };
};
