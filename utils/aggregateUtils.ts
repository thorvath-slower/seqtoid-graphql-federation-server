import {
  fedWorkflowRunsAggregate,
  query_fedWorkflowRunsAggregate_aggregate_items,
} from "../.mesh";

type RailsProjectAggregate = {
  id: number;
  sample_counts: {
    mngs_runs_count: number;
    cg_runs_count: number;
    amr_runs_count: number;
  };
};

// combine the aggregate counts from rails and next gen into a single response
// that looks like a GraphQL aggregate query response
export const processWorkflowsAggregateResponse = (
  nextGenProjectAggregates:
    | query_fedWorkflowRunsAggregate_aggregate_items[]
    | null,
  railsProjects: RailsProjectAggregate[],
  nextGenEnabled: boolean,
): fedWorkflowRunsAggregate => {
  const aggregates: fedWorkflowRunsAggregate = {
    aggregate: [],
  };

  for (const project of railsProjects) {
    // TODO: enable more workflows coming from next gen
    const nextGenCgCount =
      nextGenProjectAggregates?.find(
        aggregate =>
          aggregate?.groupBy?.workflowVersion?.workflow?.name ===
            "consensus-genome" &&
          aggregate?.groupBy?.collectionId === project.id,
      )?.count || 0;
    const counts = {
      "short-read-mngs": project.sample_counts.mngs_runs_count,
      "consensus-genome": nextGenEnabled
        ? nextGenCgCount
        : project.sample_counts.cg_runs_count,
      amr: project.sample_counts.amr_runs_count,
    };
    for (const workflow of ["consensus-genome", "short-read-mngs", "amr"]) {
      aggregates?.aggregate?.push({
        groupBy: {
          workflowVersion: {
            workflow: {
              name: workflow,
            },
          },
          collectionId: project.id,
        },
        count: counts[workflow],
      });
    }
  }

  return aggregates;
};
