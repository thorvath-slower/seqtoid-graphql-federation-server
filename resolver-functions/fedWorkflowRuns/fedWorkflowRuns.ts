import { query_fedWorkflowRuns_items } from "../../.mesh";
import { TEN_MILLION } from "../../utils/constants";
import {
  fetchFromNextGen,
  get,
  postWithCSRF,
  shouldReadFromNextGen,
} from "../../utils/httpUtils";
import { formatUrlParams } from "../../utils/paramsUtils";
import {
  convertValidateConsensusGenomeQuery,
  convertWorkflowRunsQuery,
} from "../../utils/queryFormatUtils";

export const fedWorkflowRunsResolver = async (_, args, context: any) => {
  const input = args.input;
  if (input == null) {
    throw new Error("fedWorkflowRuns input is nullish");
  }
  const nextGenEnabled = await shouldReadFromNextGen(context);
  // CG BULK DOWNLOAD MODAL:
  // If we provide a list of workflowRunIds, we assume that this is for getting valid consensus genome workflow runs.
  // This endpoint only provides id, ownerUserId, and status.
  if (input.where?.id?._in && typeof input.where?.id?._in === "object") {
    const workflowRunIds = input.where.id._in;
    if (nextGenEnabled) {
      const query = convertValidateConsensusGenomeQuery(context.params.query);
      const response = await fetchFromNextGen({
        customQuery: query,
        customVariables: {
          where: input.where,
        },
        args,
        context,
        serviceType: "workflows",
      });
      if (response?.data?.workflowRuns == null) {
        throw new Error(
          `NextGen validate workflowRuns query failed: ${JSON.stringify(response)}`,
        );
      }
      return response.data.workflowRuns;
    } else {
      const body = {
        authenticity_token: input.todoRemove?.authenticityToken,
        workflowRunIds: workflowRunIds.map(id => id && parseInt(id)),
      };
      const { workflowRuns } = await postWithCSRF({
        url: `/workflow_runs/valid_consensus_genome_workflow_runs`,
        body,
        args,
        context,
      });
      return workflowRuns.map(run => ({
        id: run.id.toString(),
        ownerUserId: run.owner_user_id,
        status: run.status,
      }));
    }
  }

  // DISCOVERY VIEW:
  if (nextGenEnabled) {
    const response = await fetchFromNextGen({
      customQuery: convertWorkflowRunsQuery(context.params.query),
      customVariables: {
        where: input.where,
        // TODO: Migrate to array orderBy.
        orderBy:
          (input.orderBy != null ? [input.orderBy] : undefined) ??
          input.orderByArray,
      },
      serviceType: "workflows",
      args,
      context,
    });
    if (response?.data?.workflowRuns == null) {
      throw new Error(
        `NextGen workflowRuns query failed: ${JSON.stringify(response)}`,
      );
    }
    return response.data.workflowRuns;
  }

  // TODO(bchu): Remove all the non-Workflows fields after moving and integrating them into the
  // Entities call.
  const { workflow_runs } = await get({
    url:
      "/workflow_runs.json" +
      formatUrlParams({
        mode: "basic",
        domain: input.todoRemove?.domain,
        projectId: input.todoRemove?.projectId,
        search: input.todoRemove?.search,
        orderBy: input.todoRemove?.orderBy,
        orderDir: input.todoRemove?.orderDir,
        host: input.todoRemove?.host,
        locationV2: input.todoRemove?.locationV2,
        taxon: input.todoRemove?.taxon,
        taxaLevels: input.todoRemove?.taxonLevels,
        time: input.todoRemove?.time,
        tissue: input.todoRemove?.tissue,
        visibility: input.todoRemove?.visibility,
        workflow: input.todoRemove?.workflow,
        limit: TEN_MILLION,
        offset: 0,
        listAllIds: false,
      }),
    args,
    context,
  });
  if (!workflow_runs?.length) {
    return [];
  }

  return workflow_runs.map(
    (run): query_fedWorkflowRuns_items => ({
      id: run.id?.toString(),
      ownerUserId: run.runner?.id?.toString(),
      startedAt: run.created_at,
      status: run.status,
      rawInputsJson: `{"creation_source": "${run.inputs?.creation_source ?? ""}"}`,
      workflowVersion: {
        version: run.wdl_version,
        workflow: {
          name: run.inputs?.creation_source, // TODO: Delete when FE uses rawInputsJson.
        },
      },
      entityInputs: {
        edges: [
          {
            node: {
              entityType: "sequencing_read",
              inputEntityId: run.sample?.info?.id?.toString(),
            },
          },
        ],
      },
    }),
  );
};
