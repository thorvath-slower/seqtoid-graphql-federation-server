import { Accession, Sample, SampleForReport, Taxon, query_SampleForReport_workflow_runs_items } from "../.mesh";
import { get, getFromRails, shouldReadFromNextGen } from "../utils/httpUtils";
import { isRunFinalized, parseRefFasta } from "../utils/responseHelperUtils";
import type { NextGenWorkflowsTypes } from '../.mesh/./sources/NextGenWorkflows/types';
import type { NextGenEntitiesTypes } from '../.mesh/./sources/NextGenEntities/types';

export const SampleForReportResolver = async (root, args, context)=> {
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
  const samples: NextGenEntitiesTypes.Sample[] = entitiesResp?.data?.samples || [];
  const nextGenSampleId = samples[0]?.id;
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
          entityInputs(where: entityType { _in: ["taxon", "accession"] }) {
            edges {
              node {
                inputEntityId
                entityType
              }
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
    samples[0].sequencingReads.edges[0].node.consensusGenomes
      .edges;
  const workflowsWorkflowRuns: NextGenWorkflowsTypes.WorkflowRun[] = workflowsResp?.data?.workflowRuns || [];

  // Fetch taxon info from entities based on workflow run inputs
  const taxonEntityIds : { taxon: string[], accession: string [] } = {
    taxon: [],
    accession: [],
  };
  workflowsWorkflowRuns.forEach(workflowRun => {
    workflowRun.entityInputs.edges.forEach(
      input => {
        if (input.node.inputEntityId && input.node.entityType) {
          taxonEntityIds[input.node.entityType].push(input.node.inputEntityId);
        }
      }
    );
  });

  const taxaQuery = `
    query TaxaQuery {
      taxa(where: {id: {_in: ${taxonEntityIds["taxon"]}}}) {
        id
        name
        upstreamDatabaseIdentifier
      }
      accessions(where: {id: {_in: ${taxonEntityIds["accession"]}}}) {
        id
        accessionId
        accessionName
      }
    }
  `;

  const taxaResp = await get({
    args,
    context,
    serviceType: "entities",
    customQuery: taxaQuery,
  });
  const taxonInfo: NextGenEntitiesTypes.Taxon[] = taxaResp?.data?.taxa || [];
  const accessionInfo: NextGenEntitiesTypes.Accession[] = taxaResp?.data?.accessions || [];

  const nextGenWorkflowRuns: query_SampleForReport_workflow_runs_items[] = workflowsWorkflowRuns.map(workflowRun => {
    const consensusGenome = consensusGenomes.find(consensusGenome => {
      return consensusGenome.node.producingRunId === workflowRun.id;
    });
    const { sequencingRead } = consensusGenome?.node || {};
    const parsedRawInputsJson = JSON.parse(workflowRun.rawInputsJson || "{}");
    // Taxon will only be null if the user selected "unknown" for taxon in WGS upload
    const taxon = taxonInfo.find(
      taxon => {
        const workflowTaxId = workflowRun.entityInputs.edges.find(
          input => input.node.entityType === "taxon"
        )?.node.inputEntityId;
        return taxon.id === workflowTaxId;
      }
    );
    // Accession will be null for WGS uploads
    const accession = accessionInfo.find(
      accession => 
        accession.id === workflowRun.entityInputs.edges.find(
          input => input.node.entityType === "accession"
        )?.node?.inputEntityId
    );
    // If !consensusGenome this is a workflow run that is in progress
    return {
      deprecated: null,
      executed_at: workflowRun.createdAt,
      id: workflowRun.id,
      input_error: workflowRun.errorMessage,
      inputs: {
        accession_id: accession?.accessionId,
        accession_name: accession?.accessionName,
        creation_source: parsedRawInputsJson?.creation_source,
        ref_fasta: parseRefFasta(
          consensusGenome?.node?.referenceGenome?.file?.path,
        ),
        taxon_id: taxon?.upstreamDatabaseIdentifier, // this is the NCBI taxid, which should match the taxids used in the mNGS report
        taxon_name: taxon?.name,
        technology: sequencingRead?.technology,
      },
      rails_workflow_run_id: workflowRun.railsWorkflowRunId?.toString(), // this is added for deduplicating below
      run_finalized: isRunFinalized(workflowRun.status || ""),
      status: workflowRun.status,
      wdl_version: workflowRun.workflowVersion?.version,
      workflow: workflowRun.workflowVersion?.workflow?.name,
    };
  });
  // Deduplicate sampleInfo.workflow_runs(from Rails) and nextGenWorkflowRuns(from NextGen)
  let dedupedWorkflowRuns: query_SampleForReport_workflow_runs_items[];
  dedupedWorkflowRuns = [...nextGenWorkflowRuns];
  for (const railsWorkflowRun of sampleInfo.workflow_runs) {
    const alreadyExists = nextGenWorkflowRuns.find(
      nextGenWorkflowRun =>
        nextGenWorkflowRun.rails_workflow_run_id ===
        railsWorkflowRun.id,
    );
    if (!alreadyExists) {
      dedupedWorkflowRuns.push(railsWorkflowRun);
    }
  }

  // sort workflow runs by latest first so that the frontend defaults to the most recent one
  dedupedWorkflowRuns.sort((a, b) => {return (a.executed_at < b.executed_at) ? 1 : ((a.executed_at > b.executed_at) ? -1 : 0);});
  return {
    id: args.railsSampleId,
    railsSampleId: args.railsSampleId,
    ...sampleInfo,
    workflow_runs: dedupedWorkflowRuns,
  };
};
