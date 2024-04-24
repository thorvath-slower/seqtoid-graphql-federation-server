import { ExecuteMeshFn } from "@graphql-mesh/runtime";
import { getExampleQuery } from "../../tests/utils/ExampleQueryFiles";
import { getMeshInstance } from "../../tests/utils/MeshInstance";

import * as httpUtils from "../../utils/httpUtils";
import { query_fedWorkflowRunsAggregateTotalCount_aggregate_items } from "../../.mesh";
jest.spyOn(httpUtils, "get");
jest.spyOn(httpUtils, "shouldReadFromNextGen");
jest.spyOn(httpUtils, "fetchFromNextGen");

beforeEach(() => {
  (httpUtils.get as jest.Mock).mockClear();
  (httpUtils.shouldReadFromNextGen as jest.Mock).mockClear();
  (httpUtils.fetchFromNextGen as jest.Mock).mockClear();
});

describe("workflowRuns aggregate total count query:", () => {
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
      countByWorkflow: {
        benchmark: 0,
        amr: 1,
        "consensus-genome": 2,
        "short-read-mngs": 3,
        "long-read-mngs": 4,
      },
    }));

    const query = getExampleQuery("workflow-runs-aggregate-total-count-query");
    const response = await execute(query, {});
    expect(httpUtils.get).toHaveBeenCalledWith({
      url: "/samples/stats.json?&domain=my_data&projectId=123",
      args: expect.anything(),
      context: expect.anything(),
    });

    const aggregates: query_fedWorkflowRunsAggregateTotalCount_aggregate_items[] =
      response.data.fedWorkflowRunsAggregateTotalCount.aggregate;
    const cgAggregate = aggregates.find(
      aggregate =>
        aggregate.groupBy?.workflowVersion?.workflow?.name ===
        "consensus-genome",
    );
    expect(cgAggregate?.count).toBe(2);
    const amrAggregate = aggregates.find(
      aggregate => aggregate.groupBy?.workflowVersion?.workflow?.name === "amr",
    );
    expect(amrAggregate?.count).toBe(1);
    const mngsAggregate = aggregates.find(
      aggregate =>
        aggregate.groupBy?.workflowVersion?.workflow?.name ===
        "short-read-mngs",
    );
    expect(mngsAggregate?.count).toBe(3);
    const longReadMngsAggregate = aggregates.find(
      aggregate =>
        aggregate.groupBy?.workflowVersion?.workflow?.name === "long-read-mngs",
    );
    expect(longReadMngsAggregate?.count).toBe(4);
    const benchmarkAggregate = aggregates.find(
      aggregate =>
        aggregate.groupBy?.workflowVersion?.workflow?.name === "benchmark",
    );
    expect(benchmarkAggregate?.count).toBe(0);
  });
});
