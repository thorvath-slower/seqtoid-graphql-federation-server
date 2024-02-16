import { ExecuteMeshFn } from "@graphql-mesh/runtime";
import { getMeshInstance } from "./utils/MeshInstance";
import * as httpUtils from "../utils/httpUtils";
import { getExampleQuery } from "./utils/ExampleQueryFiles";

jest.spyOn(httpUtils, "get");

beforeEach(() => {
  (httpUtils.get as jest.Mock).mockClear();
});

const query = getExampleQuery("sequencing-reads-query");

describe("sequencingReads query:", () => {
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

    expect(httpUtils.get).toHaveBeenCalledWith(
      "/workflow_runs.json?&mode=with_sample_info&search=abc&listAllIds=false",
      expect.anything(),
      expect.anything()
    );
    expect(response.data.sequencingReads).toHaveLength(0);
  });

  it("Returns nested fields", async () => {
    (httpUtils.get as jest.Mock).mockImplementation(() => ({
      workflow_runs: [
        {
          sample: {
            info: {
              id: 123,
            },
          },
          inputs: {
            taxon_name: "Taxon1",
          },
        },
        {
          sample: {
            info: {
              id: 456,
            },
          },
          inputs: {
            taxon_name: "Taxon2",
          },
        },
      ],
    }));

    const result = await execute(query, {});

    console.log(JSON.stringify(result));

    expect(result.data.sequencingReads).toHaveLength(2);
    expect(result.data.sequencingReads[0]).toEqual(
      expect.objectContaining({
        id: "123",
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
      })
    );
    expect(result.data.sequencingReads[1]).toEqual(
      expect.objectContaining({
        id: "456",
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
      })
    );
  });

  it("Returns metadata", async () => {
    (httpUtils.get as jest.Mock).mockImplementation(() => ({
      workflow_runs: [
        {
          sample: {
            info: {
              id: "123",
            },
            metadata: {
              key1: "value1",
              nucleotide_type: "DNA",
              key2: "value2",
              key3: "value3",
            },
          },
          inputs: {
            taxon_name: "Taxon1",
          },
        },
      ],
    }));

    const result = await execute(query, {});

    const metadataFields =
      result.data.sequencingReads[0].sample.metadatas.edges.map(
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
          sample: {
            info: {
              id: "123",
            },
          },
        },
      ],
    }));

    const result = await execute(query, {});

    expect(result.data.sequencingReads[0].sample.metadatas.edges).toHaveLength(
      0
    );
  });
});
