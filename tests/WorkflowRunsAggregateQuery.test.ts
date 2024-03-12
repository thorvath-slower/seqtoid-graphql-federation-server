import { ExecuteMeshFn } from "@graphql-mesh/runtime";
import { getMeshInstance } from "./utils/MeshInstance";

import * as httpUtils from "../utils/httpUtils";
import { getExampleQuery } from "./utils/ExampleQueryFiles";
import { query_fedWorkflowRunsAggregate_aggregate_items } from "../.mesh";
jest.spyOn(httpUtils, "get");
jest.spyOn(httpUtils, "shouldReadFromNextGen");

beforeEach(() => {
  (httpUtils.get as jest.Mock).mockClear();
});

describe("workflows aggregate query:", () => {
  let execute: ExecuteMeshFn;

  beforeEach(async () => {
    const mesh$ = await getMeshInstance();
    ({ execute } = mesh$);
  });

  it("Returns aggregate counts for each workflow", async () => {
    (httpUtils.shouldReadFromNextGen as jest.Mock).mockImplementation(() =>
      Promise.resolve(false),
    );
    (httpUtils.get as jest.Mock).mockImplementation(() => ({
      projects: [
        {
          id: 1,
          sample_counts: {
            cg_runs_count: 1,
            amr_runs_count: 2,
            mngs_runs_count: 3,
          },
        },
      ],
    }));

    const query = getExampleQuery("workflows-aggregate-query");

    const response = await execute(query, {});
    expect(httpUtils.get).toHaveBeenCalledWith({
      url: "/projects.json?&domain=my_data&limit=10000000&listAllIds=false&offset=0&search=abc&visibility=public&time[]=20240214&time[]=20240222",
      args: expect.anything(),
      context: expect.anything(),
    });

    console.log(response);

    const aggregates: query_fedWorkflowRunsAggregate_aggregate_items[] = response.data.fedWorkflowRunsAggregate.aggregate;

    expect(aggregates).toHaveLength(3);
    const cgAggregate = aggregates.find(aggregate => aggregate.groupBy?.workflowVersion?.workflow?.name === "consensus-genome");
    expect(cgAggregate?.count).toBe(1);
    const amrAggregate = aggregates.find(aggregate => aggregate.groupBy?.workflowVersion?.workflow?.name === "amr");
    expect(amrAggregate?.count).toBe(2);
    const mngsAggregate = aggregates.find(aggregate => aggregate.groupBy?.workflowVersion?.workflow?.name === "short-read-mngs");
    expect(mngsAggregate?.count).toBe(3);
  });
});
