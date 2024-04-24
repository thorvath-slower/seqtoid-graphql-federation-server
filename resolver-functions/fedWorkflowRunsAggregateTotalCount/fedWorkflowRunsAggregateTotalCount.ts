import { parseWorkflowsAggregateTotalCountsResponse } from "../../utils/aggregateUtils";
import {
  fetchFromNextGen,
  get,
  shouldReadFromNextGen,
} from "../../utils/httpUtils";
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

  let nextGenAggregates = [];
  // the frontend decides which workflows are fetched from NextGen vs Rails
  const nextgenWorkflows =
    (input?.where?.workflowVersion?.workflow?.name?._in as string[]) || [];

  const nextGenEnabled = await shouldReadFromNextGen(context);
  if (nextGenEnabled) {
    const totalCountQuery = `
      query nextGenWorkflowsAggregateTotalCount($where: WorkflowRunWhereClause) {
        workflowRunsAggregate(where: $where) {
          aggregate {
            count
            groupBy {
              workflowVersion {
                workflow {
                  name
                }
              }
            }
          }
        }
      }
    `;
    const totalCountResponse = await fetchFromNextGen({
      args,
      context,
      serviceType: "workflows",
      customQuery: totalCountQuery,
      customVariables: {
        where: args.input?.where,
      },
    });

    nextGenAggregates =
      totalCountResponse?.data?.workflowRunsAggregate?.aggregate;
  }

  return parseWorkflowsAggregateTotalCountsResponse(
    nextGenAggregates,
    railsCountByWorkflow,
    nextGenEnabled,
    nextgenWorkflows,
  );
};
