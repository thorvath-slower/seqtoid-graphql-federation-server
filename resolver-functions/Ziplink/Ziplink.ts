import { get } from "../../utils/httpUtils";

export const ZiplinkResolver = async (root, args, context, info) => {
  /* --------------------- Rails ------------------------- */
  const res = await get({
    url: `/workflow_runs/${args.workflowRunId}/zip_link.json`,
    args,
    context,
    fullResponse: true,
  });
  if (res.status !== 200) {
    return {
      url: null,
      error: res.statusText,
    };
  }
  const url = res.url;
  return {
    url,
  };
};
