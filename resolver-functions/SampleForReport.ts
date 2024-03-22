import { get, getFromRails, shouldReadFromNextGen } from "../utils/httpUtils";
import { isRunFinalized, parseRefFasta } from "../utils/responseHelperUtils";

export const SampleForReportResolver = async (root, args, context) => {
  /* --------------------- Rails and Next Gen --------------------- */
  const sampleInfo = await getFromRails({
    url: `/samples/${args.railsSampleId}.json`,
    args,
    context,
  });
  // Make output acceptable to Relay - convert ids to strings
  if (sampleInfo?.pipeline_runs) {
    const updatedPipelineRuns = sampleInfo?.pipeline_runs.map(pipelineRun => {
      return {
        ...pipelineRun,
        id: pipelineRun.id.toString(),
      };
    });
    sampleInfo.pipeline_runs = updatedPipelineRuns;
  }
  if (sampleInfo?.default_pipeline_run_id) {
    sampleInfo.default_pipeline_run_id =
      sampleInfo.default_pipeline_run_id.toString();
  }
  if (sampleInfo?.workflow_runs) {
    const updatedWorkflowRuns = sampleInfo?.workflow_runs.map(workflowRun => {
      return {
        ...workflowRun,
        id: workflowRun.id.toString(),
      };
    });
    sampleInfo.workflow_runs = updatedWorkflowRuns;
  }
  if (sampleInfo?.project) {
    sampleInfo.project.id = sampleInfo.project.id.toString();
  }

  const nextGenEnabled = await shouldReadFromNextGen(context);
  /* --------------------- Rails --------------------- */
  if (!nextGenEnabled) {
    return {
      id: args?.railsSampleId,
      railsSampleId: args.railsSampleId,
      ...sampleInfo,
    };
  }
  /* --------------------- Next Gen --------------------- */

  // NextGen Steps:
  // continue using everything from rails except for workflow_runs
  // get sample from rails using railsSampleId (same as above). This includes:
  // -- sample info
  // -- pipeline runs
  // -- workflowRuns:
  // ---- AMR workflow runs
  // ---- pre-migration CG workflow runs
  // ---- dual write CG workflow runs
  // query entities using railsSampleId to get NextGenSampleId and done CG workflow runs
  // query workflows using NextGenSampleId to get in progress CG workflow runs
  // combine workflow data from entities and workflows
  // deduplicate between rails and next gen

  const entitiesQuery = `
      query EntitiesQuery {
        samples(where: {railsSampleId: {_eq: ${args.railsSampleId}}}) {
          id
          sequencingReads {
            edges {
              node {
                consensusGenomes {
                  edges {
                    node {
                      id
                      createdAt
                      producingRunId
                      referenceGenome {
                        id
                        file {
                          path
                        }
                      }
                      accession {
                        accessionId
                        accessionName
                      }
                      taxon {
                        id
                        name
                      }
                      sequencingRead {
                        technology
                      }
                    }
                  }
                }
                sample {
                  hostOrganism {
                    id
                  }
                }
              }
            }
          }
        }
      } 
    `;
  const entitiesResp = await get({
    args,
    context,
    serviceType: "entities",
    customQuery: entitiesQuery,
  });

  // Non-WGS workflows will not have nextGenSampleId. In this case, return sampleInfo from Rails.
  const nextGenSampleId = entitiesResp?.data.samples?.[0]?.id;
  if (!nextGenSampleId) {
    console.log(
      `No NextGenSampleId found for railsSampleId: ${args.railsSampleId}`,
    );
    return {
      id: args.railsSampleId,
      railsSampleId: args.railsSampleId,
      ...sampleInfo,
    };
  }

  // Query workflows using NextGenSampleId to get in progress CG workflow runs
  const workflowsQuery = `
      query WorkflowsQuery {
        workflowRuns(where: {
          workflowVersion: {workflow: {name: {_eq: "consensus-genome"}}}, 
          entityInputs: {inputEntityId: {_eq: "${nextGenSampleId}"}},
          deprecatedById: {_is_null: true}
        }) {
          id
          _id
          railsWorkflowRunId
          status
          ownerUserId
          errorMessage
          workflowVersion {
            version
            id
            workflow {
              name
            }
          }
          createdAt
          endedAt
          rawInputsJson
        }
      }
  `;
  const workflowsResp = await get({
    args,
    context,
    serviceType: "workflows",
    customQuery: workflowsQuery,
  });
  const consensusGenomes =
    entitiesResp.data.samples[0].sequencingReads.edges[0].node.consensusGenomes
      .edges;
  const workflowsWorkflowRuns = workflowsResp?.data?.workflowRuns || [];
  const nextGenWorkflowRuns = workflowsWorkflowRuns.map(workflowRun => {
    const consensusGenome = consensusGenomes.find(consensusGenome => {
      return consensusGenome.node.producingRunId === workflowRun.id;
    });
    const { accession, taxon, sequencingRead } = consensusGenome?.node || {};
    const parsedRawInputsJson = JSON.parse(workflowRun.rawInputsJson);
    // If !consensusGenome this is a workflow run that is in progress
    return {
      deprecated: null,
      executed_at: workflowRun?.createdAt,
      id: workflowRun?.id,
      input_error: workflowRun?.errorMessage,
      inputs: {
        accession_id: accession?.accessionId,
        accession_name: accession?.accessionName,
        creation_source: parsedRawInputsJson?.creation_source,
        ref_fasta: parseRefFasta(
          consensusGenome?.node?.referenceGenome?.file?.path,
        ),
        taxon_id: taxon?.id,
        taxon_name: taxon?.name,
        technology: sequencingRead?.technology,
      },
      rails_workflow_run_id: workflowRun?.railsWorkflowRunId, // this is added for deduplicating below
      run_finalized: isRunFinalized(workflowRun?.status),
      status: workflowRun?.status,
      wdl_version: workflowRun?.workflowVersion.version,
      workflow: workflowRun?.workflowVersion.workflow.name,
    };
  });
  // Deduplicate sampleInfo.workflow_runs(from Rails) and nextGenWorkflowRuns(from NextGen)
  let dedupedWorkflowRuns;
  dedupedWorkflowRuns = [...nextGenWorkflowRuns];
  for (const railsWorkflowRun of sampleInfo.workflow_runs) {
    const alreadyExists = nextGenWorkflowRuns.find(
      nextGenWorkflowRun =>
        nextGenWorkflowRun.rails_workflow_run_id.toString() ===
        railsWorkflowRun.id,
    );
    if (!alreadyExists) {
      dedupedWorkflowRuns.push(railsWorkflowRun);
    }
  }
  return {
    id: args.railsSampleId,
    railsSampleId: args.railsSampleId,
    ...sampleInfo,
    workflow_runs: dedupedWorkflowRuns,
  };
};
