import { ExecuteMeshFn } from "@graphql-mesh/runtime";
import { getZipLinkExampleQuery } from "./utils/ExampleQueryFiles";
import { getMeshInstance } from "./utils/MeshInstance";

import * as httpUtils from "../utils/httpUtils";
jest.spyOn(httpUtils, "get");

beforeEach(() => {
  (httpUtils.get as jest.Mock).mockClear();
});

describe("workflowRuns query:", () => {
  let execute: ExecuteMeshFn;

  beforeEach(async () => {
    const mesh$ = await getMeshInstance();
    ({ execute } = mesh$);
  });

  it("Returns input sample", async () => {
    const query = `
        query TestQuery($unused: String) {
            workflowRuns(input: {}) {
                id
                entityInputs {
                    edges {
                        node {
                            fieldName
                            inputEntityId
                        }
                    }
                }
            }
        }
    `;
    (httpUtils.get as jest.Mock).mockImplementation(() => ({
      workflow_runs: [
        {
          id: 1,
          sample: {
            id: 2,
          },
        },
        {
          id: 3,
          sample: {
            id: 4,
          },
        },
      ],
    }));

    const result = await execute(query, {});

    expect(httpUtils.get).toHaveBeenCalledWith(
      "/workflow_runs.json?&mode=with_sample_info&limit=10000000&offset=0&listAllIds=false",
      expect.anything(),
      expect.anything()
    );
    expect(result.data.workflowRuns).toHaveLength(2);
    expect(result.data.workflowRuns[0]).toEqual(
      expect.objectContaining({
        id: 1,
        entityInputs: {
          edges: [
            {
              node: {
                fieldName: "Sample",
                inputEntityId: 2,
              },
            },
          ],
        },
      })
    );
    expect(result.data.workflowRuns[1]).toEqual(
      expect.objectContaining({
        id: 3,
        entityInputs: {
          edges: [
            {
              node: {
                fieldName: "Sample",
                inputEntityId: 4,
              },
            },
          ],
        },
      })
    );
  });

  it("Called with order by", async () => {
    const query = `
        query TestQuery($unused: String) {
            workflowRuns(input: {
                orderBy: {
                    startedAt: "ASC"
                }
            }) {
                id
                entityInputs {
                    edges {
                        node {
                            fieldName
                            inputEntityId
                        }
                    }
                }
            }
        }
    `;
    (httpUtils.get as jest.Mock).mockImplementation(() => ({
      workflow_runs: [],
    }));

    const result = await execute(query, {});

    expect(httpUtils.get).toHaveBeenCalledWith(
      "/workflow_runs.json?&mode=with_sample_info&orderBy=createdAt&orderDir=ASC&limit=10000000&offset=0&listAllIds=false",
      expect.anything(),
      expect.anything()
    );
    expect(result.data.workflowRuns).toHaveLength(0);
  });
});
