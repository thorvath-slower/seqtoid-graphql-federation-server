import { getFromRails } from "../../utils/httpUtils";

export const SampleForReportResolver = async (root, args, context) => {
  /* --------------------- Rails --------------------- */
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

  return {
    id: args?.railsSampleId,
    railsSampleId: args.railsSampleId,
    ...sampleInfo,
  };
};
