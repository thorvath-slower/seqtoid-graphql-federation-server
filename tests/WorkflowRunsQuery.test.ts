import { ExecuteMeshFn } from "@graphql-mesh/runtime";
import { getExampleQuery } from "./utils/ExampleQueryFiles";
import { getMeshInstance } from "./utils/MeshInstance";

import * as httpUtils from "../utils/httpUtils";
jest.spyOn(httpUtils, "get");
jest.spyOn(httpUtils, "postWithCSRF");

beforeEach(() => {
  (httpUtils.get as jest.Mock).mockClear();
  (httpUtils.postWithCSRF as jest.Mock).mockClear();
});

describe("workflowRuns query:", () => {
  let execute: ExecuteMeshFn;

  beforeEach(async () => {
    const mesh$ = await getMeshInstance();
    ({ execute } = mesh$);
  });

  it("Returns input sample", async () => {
    (httpUtils.get as jest.Mock).mockImplementation(() => ({
      workflow_runs: [
        {
          id: 1,
          sample: {
            info: {
              id: 2,
            },
          },
        },
        {
          id: 3,
          sample: {
            info: {
              id: 4,
            },
          },
        },
      ],
    }));

    const result = await execute(
      getExampleQuery("workflow-runs-query-empty"),
      {}
    );

    expect(httpUtils.get).toHaveBeenCalledWith(
      "/workflow_runs.json?&mode=basic&limit=10000000&offset=0&listAllIds=false",
      expect.anything(),
      expect.anything()
    );
    expect(result.data.workflowRuns).toHaveLength(2);
    expect(result.data.workflowRuns[0]).toEqual(
      expect.objectContaining({
        id: "1",
        entityInputs: {
          edges: [
            {
              node: {
                entityType: "Sample",
                inputEntityId: "2",
              },
            },
          ],
        },
      })
    );
    expect(result.data.workflowRuns[1]).toEqual(
      expect.objectContaining({
        id: "3",
        entityInputs: {
          edges: [
            {
              node: {
                entityType: "Sample",
                inputEntityId: "4",
              },
            },
          ],
        },
      })
    );
  });

  it("Called with order by", async () => {
    (httpUtils.get as jest.Mock).mockImplementation(() => ({
      workflow_runs: [],
    }));

    const result = await execute(
      getExampleQuery("workflow-runs-query-order-by"),
      {}
    );

    expect(httpUtils.get).toHaveBeenCalledWith(
      "/workflow_runs.json?&mode=basic&orderBy=createdAt&orderDir=ASC&limit=10000000&offset=0&listAllIds=false",
      expect.anything(),
      expect.anything()
    );
    expect(result.data.workflowRuns).toHaveLength(0);
  });

  describe("validConsensusGenomes query", () => {
    it("should call the correct rails endpoint", async () => {
      await execute(getExampleQuery("workflow-runs-query-id-list"), {
        authenticityToken: "authtoken1234",
        workflowRunIds: ["1997", "2007"],
      });
      expect(httpUtils.postWithCSRF).toHaveBeenCalledWith(
        "/workflow_runs/valid_consensus_genome_workflow_runs",
        {
          authenticity_token: "authtoken1234",
          workflowRunIds: [1997, 2007],
        },
        expect.anything(),
        expect.anything()
      );
    });
  });
});
