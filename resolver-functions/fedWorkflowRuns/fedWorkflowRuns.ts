import { query_fedWorkflowRuns_items } from "../../.mesh";
import { TEN_MILLION } from "../../utils/constants";
import { get, postWithCSRF } from "../../utils/httpUtils";
import { formatUrlParams } from "../../utils/paramsUtils";

export const fedWorkflowRunsResolver = async (_, args, context: any) => {
  const input = args.input;
  if (input == null) {
    throw new Error("fedWorkflowRuns input is nullish");
  }
  // CG BULK DOWNLOAD MODAL:
  // If we provide a list of workflowRunIds, we assume that this is for getting valid consensus genome workflow runs.
  // This endpoint only provides id, ownerUserId, and status.
  if (input.where?.id?._in && typeof input.where?.id?._in === "object") {
    const workflowRunIds = input.where.id._in;
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

  // DISCOVERY VIEW:
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
