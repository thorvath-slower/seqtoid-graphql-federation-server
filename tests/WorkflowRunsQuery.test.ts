import { ExecuteMeshFn } from "@graphql-mesh/runtime";
import { getExampleQuery } from "./utils/ExampleQueryFiles";
import { getMeshInstance } from "./utils/MeshInstance";
import { assertEqualsNoWhitespace } from "./utils/StringUtils";

import * as httpUtils from "../utils/httpUtils";
import { convertWorkflowRunsQuery } from "../utils/queryFormatUtils";
jest.spyOn(httpUtils, "get");
jest.spyOn(httpUtils, "postWithCSRF");
jest.spyOn(httpUtils, "shouldReadFromNextGen");
jest.spyOn(httpUtils, "fetchFromNextGen");

beforeEach(() => {
  (httpUtils.get as jest.Mock).mockClear();
  (httpUtils.postWithCSRF as jest.Mock).mockClear();
  (httpUtils.shouldReadFromNextGen as jest.Mock).mockClear();
  (httpUtils.fetchFromNextGen as jest.Mock).mockClear();
});

describe("workflowRuns query:", () => {
  let execute: ExecuteMeshFn;

  beforeEach(async () => {
    const mesh$ = await getMeshInstance();
    ({ execute } = mesh$);
  });

  it("Returns input sequencing read", async () => {
    (httpUtils.shouldReadFromNextGen as jest.Mock).mockImplementation(() =>
      Promise.resolve(false),
    );
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
      {},
    );

    expect(httpUtils.get).toHaveBeenCalledWith({
      url: "/workflow_runs.json?&mode=basic&limit=10000000&offset=0&listAllIds=false",
      args: expect.anything(),
      context: expect.anything(),
    });
    expect(result.data.fedWorkflowRuns).toHaveLength(2);
    expect(result.data.fedWorkflowRuns[0]).toEqual(
      expect.objectContaining({
        id: "1",
        entityInputs: {
          edges: [
            {
              node: {
                entityType: "sequencing_read",
                inputEntityId: "2",
              },
            },
          ],
        },
      }),
    );
    expect(result.data.fedWorkflowRuns[1]).toEqual(
      expect.objectContaining({
        id: "3",
        entityInputs: {
          edges: [
            {
              node: {
                entityType: "sequencing_read",
                inputEntityId: "4",
              },
            },
          ],
        },
      }),
    );
  });

  it("Called with order by", async () => {
    (httpUtils.shouldReadFromNextGen as jest.Mock).mockImplementation(() =>
      Promise.resolve(false),
    );
    (httpUtils.get as jest.Mock).mockImplementation(() => ({
      workflow_runs: [],
    }));

    const result = await execute(
      getExampleQuery("workflow-runs-query-order-by"),
      {},
    );

    // TODO: Add support for NextGen orderBy field.
    expect(httpUtils.get).toHaveBeenCalledWith({
      url: "/workflow_runs.json?&mode=basic&orderBy=createdAt&orderDir=ASC&limit=10000000&offset=0&listAllIds=false",
      args: expect.anything(),
      context: expect.anything(),
    });
    expect(result.data.fedWorkflowRuns).toHaveLength(0);
  });

  it("Constructs correct NextGen query", async () => {
    const query = `
      query DiscoveryViewFCWorkflowsQuery(
        $input: queryInput_fedWorkflowRuns_input_Input
      ) {
        fedWorkflowRuns(input: $input) {
          id
          startedAt
          status
          rawInputsJson
          workflowVersion {
            version
            workflow {
              name
            }
          }
          entityInputs {
            edges {
              node {
                inputEntityId
                entityType
              }
            }
          }
        }
      }`;

    assertEqualsNoWhitespace(
      convertWorkflowRunsQuery(query),
      `query ($where: WorkflowRunWhereClause, $orderBy: [WorkflowRunOrderByClause!]) {
        workflowRuns(where: $where, orderBy: $orderBy) {
          id
          startedAt
          status
          rawInputsJson
          workflowVersion {
            version
            workflow {
              name
            }
          }
          entityInputs(where: { entityType: { _eq: "sequencing_read" } }) {
            edges {
              node {
                inputEntityId
                entityType
              }
            }
          }
        }
      }`,
    );
  });

  it("Uses orderBy array field for NextGen", async () => {
    const query = getExampleQuery("workflow-runs-query-order-by-array");
    (httpUtils.shouldReadFromNextGen as jest.Mock).mockImplementation(() =>
      Promise.resolve(true),
    );

    await execute(query, {}, { params: { query } });

    expect(httpUtils.fetchFromNextGen as jest.Mock).toHaveBeenCalledWith(
      expect.objectContaining({
        customVariables: expect.objectContaining({
          orderBy: [{ startedAt: "asc" }],
        }),
      }),
    );
  });

  describe("validConsensusGenomes query", () => {
    it("should call the correct rails endpoint", async () => {
      await execute(getExampleQuery("workflow-runs-query-id-list"), {
        authenticityToken: "authtoken1234",
        workflowRunIds: ["1997", "2007"],
      });
      expect(httpUtils.postWithCSRF).toHaveBeenCalledWith({
        url: "/workflow_runs/valid_consensus_genome_workflow_runs",
        body: {
          authenticity_token: "authtoken1234",
          workflowRunIds: [1997, 2007],
        },
        context: expect.anything(),
        args: expect.anything(),
      });
    });
  });
});
