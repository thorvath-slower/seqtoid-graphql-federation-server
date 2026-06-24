import { processWorkflowsAggregateResponse } from "../../utils/aggregateUtils";
import { TEN_MILLION } from "../../utils/constants";
import { get } from "../../utils/httpUtils";
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

  return processWorkflowsAggregateResponse(
    projects.filter(
      project =>
        paginatedProjectIds === undefined ||
        paginatedProjectIds.has(project.id),
    ),
  );
};
