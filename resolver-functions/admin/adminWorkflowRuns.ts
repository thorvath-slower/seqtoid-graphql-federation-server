import { NextGenWorkflowsTypes } from "../../.mesh/sources/NextGenWorkflows/types";
import { fetchFromNextGen } from "../../utils/httpUtils";
import { convertAdminWorkflowRunsQuery } from "../../utils/queryFormatUtils";

export const adminWorkflowRunsResolver = async (root, args, context: any, info) => {
  const query = convertAdminWorkflowRunsQuery(context.params.query);
  const response = await fetchFromNextGen({
    args,
    context,
    serviceType: "workflows",
    customQuery: query,
    customVariables: {
      where: args.input?.where,
    }
  });
  const workflowRuns: NextGenWorkflowsTypes.WorkflowRun[] = response?.data?.workflowRuns;
  if (!workflowRuns) {
    throw new Error(`Error fetching workflowRuns from NextGen: ${JSON.stringify(response)}`);
  }
  return workflowRuns;
};