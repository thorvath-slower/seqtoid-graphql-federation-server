import {
  fedWorkflowRunsAggregate,
  fedWorkflowRunsAggregateTotalCount,
} from "../.mesh";

type RailsProjectAggregate = {
  id: number;
  sample_counts: {
    mngs_runs_count: number;
    cg_runs_count: number;
    amr_runs_count: number;
  };
};

// build the Rails aggregate counts into a response
// that looks like a GraphQL aggregate query response
export const processWorkflowsAggregateResponse = (
  railsProjects: RailsProjectAggregate[],
): fedWorkflowRunsAggregate => {
  const aggregates: fedWorkflowRunsAggregate = {
    aggregate: [],
  };

  for (const project of railsProjects) {
    const counts = {
      "short-read-mngs": project.sample_counts.mngs_runs_count,
      "consensus-genome": project.sample_counts.cg_runs_count,
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

export const parseWorkflowsAggregateTotalCountsResponse = (
  railsCountByWorkflow: { [key: string]: number },
): fedWorkflowRunsAggregateTotalCount => {
  const aggregates: fedWorkflowRunsAggregateTotalCount = {
    aggregate: [],
  };

  for (const workflow of Object.keys(railsCountByWorkflow)) {
    const railsCount = railsCountByWorkflow[workflow] || 0;

    aggregates?.aggregate?.push({
      groupBy: {
        workflowVersion: {
          workflow: {
            name: workflow,
          },
        },
      },
      count: railsCount,
    });
  }
  return aggregates;
};
