import { query_fedWorkflowRunsAggregate_aggregate_items } from "../../.mesh";
import { processWorkflowsAggregateResponse } from "../../utils/aggregateUtils";
import { TEN_MILLION } from "../../utils/constants";
import {
  fetchFromNextGen,
  get,
  shouldReadFromNextGen,
} from "../../utils/httpUtils";
import { formatUrlParams } from "../../utils/paramsUtils";

export const fedWorkflowRunsAggregateResolver = async (
  root,
  args,
  context: any,
  info,
) => {
  const input = args.input;
  const paginatedProjectIds = input?.where?.collectionId?._in?.length
    ? new Set(input.where.collectionId._in)
    : undefined;

  const { projects } = await get({
    url:
      "/projects.json" +
      formatUrlParams({
        projectId: input?.todoRemove?.projectId,
        domain: input?.todoRemove?.domain,
        limit: TEN_MILLION,
        listAllIds: false,
        offset: 0,
        host: input?.todoRemove?.host,
        locationV2: input?.todoRemove?.locationV2,
        taxonThresholds: input?.todoRemove?.taxonThresholds,
        annotations: input?.todoRemove?.annotations,
        search: input?.todoRemove?.search,
        tissue: input?.todoRemove?.tissue,
        visibility: input?.todoRemove?.visibility,
        time: input?.todoRemove?.time,
        taxaLevels: input?.todoRemove?.taxaLevels,
        taxon: input?.todoRemove?.taxon,
      }),
    args,
    context,
  });

  const nextGenEnabled = await shouldReadFromNextGen(context);

  let nextGenProjectAggregates: query_fedWorkflowRunsAggregate_aggregate_items[] =
    [];

  if (nextGenEnabled) {
    const customQuery = `
      query nextGenWorkflowsAggregate($where: WorkflowRunWhereClause) {
        workflowRunsAggregate(where: $where) {
          aggregate {
            groupBy {
              collectionId
              workflowVersion {
                workflow {
                  name
                }
              }
            }
            count
          }
        }
      }
    `;
    const consensusGenomesAggregateResponse = await fetchFromNextGen({
      args,
      context,
      serviceType: "workflows",
      customQuery,
      customVariables: {
        where: args.input?.where,
      },
    });
    nextGenProjectAggregates =
      consensusGenomesAggregateResponse?.data?.workflowRunsAggregate?.aggregate;
  }

  return processWorkflowsAggregateResponse(
    nextGenProjectAggregates,
    projects.filter(
      project =>
        paginatedProjectIds === undefined ||
        paginatedProjectIds.has(project.id),
    ),
    nextGenEnabled,
  );
};
