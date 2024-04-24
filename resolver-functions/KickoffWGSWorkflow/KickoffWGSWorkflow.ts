import { postWithCSRF } from "../../utils/httpUtils";

export const KickoffWGSWorkflowResolver = async (root, args, context, info) => {
  const body = {
    workflow: args?.input?.workflow,
    inputs_json: args?.input?.inputs_json,
  };
  const res = await postWithCSRF({
    url: `/samples/${args.sampleId}/kickoff_workflow`,
    body,
    args,
    context,
  });
  try {
    const formattedRes = res.map(item => {
      item.id = item.id.toString();
      return item;
    });
    return formattedRes;
  } catch {
    return res;
  }
};
