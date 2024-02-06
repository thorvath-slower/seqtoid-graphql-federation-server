import { ExecuteMeshFn } from "@graphql-mesh/runtime";
import { getZipLinkExampleQuery } from "./utils/ExampleQueryFiles";
import { getMeshInstance } from "./utils/MeshInstance";

import * as httpUtils from "../utils/httpUtils";
jest.mock("../utils/httpUtils");

beforeEach(() => {
  (httpUtils.getFullResponse as jest.Mock).mockClear();
});

const query = `
    query TestQuery($unused: String) {
        samples(where: {
          name: {
            _like: "abc",
          },
        }) {
          id
          metadatas {
            edges {
              node {
                fieldName
                value
              }
            }
          }
          sequencingReads {
            edges {
              node {
                consensusGenomes {
                  edges {
                    node {
                      taxon {
                        name
                      }
                    }
                  }
                }
              }
            }
          }
        }
    }
`;

describe("samples query:", () => {
  let execute: ExecuteMeshFn;

  beforeEach(async () => {
    const mesh$ = await getMeshInstance();
    ({ execute } = mesh$);
  });

  it("Returns empty list", async () => {
    (httpUtils.get as jest.Mock).mockImplementation(() => ({
      workflow_runs: [],
    }));

    const response = await execute(query, {});

    expect(response.data.samples).toHaveLength(0);
  });

  it("Returns nested fields", async () => {
    (httpUtils.get as jest.Mock).mockImplementation(() => ({
      workflow_runs: [
        {
          sample: {
            id: 123,
          },
          inputs: {
            taxon_name: "Taxon1",
          },
        },
        {
          sample: {
            id: 456,
          },
          inputs: {
            taxon_name: "Taxon2",
          },
        },
      ],
    }));

    const result = await execute(query, {});

    expect(result.data.samples).toHaveLength(2);
    expect(result.data.samples[0]).toEqual(
      expect.objectContaining({
        id: 123,
        sequencingReads: {
          edges: [
            {
              node: {
                consensusGenomes: {
                  edges: [
                    {
                      node: {
                        taxon: {
                          name: "Taxon1",
                        },
                      },
                    },
                  ],
                },
              },
            },
          ],
        },
      })
    );
    expect(result.data.samples[1]).toEqual(
      expect.objectContaining({
        id: 456,
        sequencingReads: {
          edges: [
            {
              node: {
                consensusGenomes: {
                  edges: [
                    {
                      node: {
                        taxon: {
                          name: "Taxon2",
                        },
                      },
                    },
                  ],
                },
              },
            },
          ],
        },
      })
    );
  });

  it("Returns metadata", async () => {
    (httpUtils.get as jest.Mock).mockImplementation(() => ({
      workflow_runs: [
        {
          sample: {
            metadata: {
              key1: "value1",
              nucleotide_type: "DNA",
              key2: "value2",
              key3: "value3",
            },
          },
        },
      ],
    }));

    const result = await execute(query, {});

    const metadataFields = result.data.samples[0].metadatas.edges.map(
      (edge) => edge.node.fieldName
    );
    expect(metadataFields).toHaveLength(3);
    expect(metadataFields[0]).toEqual("key1");
    expect(metadataFields[1]).toEqual("key2");
    expect(metadataFields[2]).toEqual("key3");
  });

  it("Returns empty metadata", async () => {
    (httpUtils.get as jest.Mock).mockImplementation(() => ({
      workflow_runs: [
        {
          sample: {},
        },
      ],
    }));

    const result = await execute(query, {});

    expect(result.data.samples[0].metadatas.edges).toHaveLength(0);
  });
});
