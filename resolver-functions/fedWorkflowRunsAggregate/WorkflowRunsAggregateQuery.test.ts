import {
  MeshExecuteTestFunction,
  getMeshExecute,
} from "../../tests/utils/MeshInstance";

import * as httpUtils from "../../utils/httpUtils";
import { getExampleQuery } from "../../tests/utils/ExampleQueryFiles";
import { query_fedWorkflowRunsAggregate_aggregate_items } from "../../.mesh";
jest.spyOn(httpUtils, "get");
jest.spyOn(httpUtils, "shouldReadFromNextGen");
import { ExecuteMeshFn } from "@graphql-mesh/runtime";
import { getMeshInstance } from "../../tests/utils/MeshInstance";
jest.spyOn(httpUtils, "fetchFromNextGen");

beforeEach(() => {
  (httpUtils.get as jest.Mock).mockClear();
  (httpUtils.shouldReadFromNextGen as jest.Mock).mockClear();
  (httpUtils.fetchFromNextGen as jest.Mock).mockClear();
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
          id: 2,
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

    const aggregates: query_fedWorkflowRunsAggregate_aggregate_items[] =
      response.data.fedWorkflowRunsAggregate.aggregate;

    expect(aggregates).toHaveLength(3);
    const cgAggregate = aggregates.find(
      aggregate =>
        aggregate.groupBy?.workflowVersion?.workflow?.name ===
        "consensus-genome",
    );
    expect(cgAggregate?.count).toBe(1);
    const amrAggregate = aggregates.find(
      aggregate => aggregate.groupBy?.workflowVersion?.workflow?.name === "amr",
    );
    expect(amrAggregate?.count).toBe(2);
    const mngsAggregate = aggregates.find(
      aggregate =>
        aggregate.groupBy?.workflowVersion?.workflow?.name ===
        "short-read-mngs",
    );
    expect(mngsAggregate?.count).toBe(3);
  });

  it("Only returns group bys for project IDs requested for page", async () => {
    (httpUtils.shouldReadFromNextGen as jest.Mock).mockImplementation(() =>
      Promise.resolve(true),
    );
    (httpUtils.get as jest.Mock).mockImplementation(() => ({
      projects: [
        {
          id: 1,
          sample_counts: {
            amr_runs_count: 1,
            mngs_runs_count: 1,
          },
        },
        {
          id: 2,
          sample_counts: {
            amr_runs_count: 2,
            mngs_runs_count: 2,
          },
        },
        {
          id: 3,
          sample_counts: {
            amr_runs_count: 3,
            mngs_runs_count: 3,
          },
        },
      ],
    }));
    (httpUtils.fetchFromNextGen as jest.Mock).mockImplementation(() => ({
      aggregate: [
        {
          groupBy: {
            collectionId: 2,
            workflowVersion: {
              workflow: {
                name: "consensus-genome",
              },
            },
            count: 2,
          },
        },
        {
          groupBy: {
            collectionId: 3,
            workflowVersion: {
              workflow: {
                name: "consensus-genome",
              },
            },
            count: 3,
          },
        },
      ],
    }));

    const query = getExampleQuery("workflows-aggregate-query");

    const response = await execute(query, {
      input: { where: { collectionId: { _in: [2, 3] } } },
    });

    const aggregates: query_fedWorkflowRunsAggregate_aggregate_items[] =
      response.data.fedWorkflowRunsAggregate.aggregate;

    expect(aggregates).toHaveLength(6);
    expect(
      aggregates.filter(aggregate => aggregate.groupBy.collectionId === 2)
        .length,
    ).toBe(3);
    expect(
      aggregates.filter(aggregate => aggregate.groupBy.collectionId === 3)
        .length,
    ).toBe(3);
  });
});
