import { parseWorkflowsAggregateTotalCountsResponse } from "../../utils/aggregateUtils";
import { get } from "../../utils/httpUtils";
import { formatUrlParams } from "../../utils/paramsUtils";

export const fedWorkflowRunsAggregateTotalCountResolver = async (
  root,
  args,
  context,
  info,
) => {
  const input = args.input;
  const { countByWorkflow: railsCountByWorkflow } = await get({
    url:
      "/samples/stats.json" +
      formatUrlParams({
        domain: input?.todoRemove?.domain,
        projectId: input?.todoRemove?.projectId,
      }),
    args,
    context,
  });

  return parseWorkflowsAggregateTotalCountsResponse(railsCountByWorkflow);
};
