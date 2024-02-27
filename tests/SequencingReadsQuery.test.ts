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
      "/workflow_runs.json?&mode=with_sample_info&search=abc&limit=50&offset=100&listAllIds=false",
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

    expect(result.data.sequencingReads).toHaveLength(2);
    expect(result.data.sequencingReads[0]).toEqual(
      expect.objectContaining({
        id: "123",
        consensusGenomes: {
          edges: [
            {
              node: expect.objectContaining({
                taxon: {
                  name: "Taxon1",
                },
              }),
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
              node: expect.objectContaining({
                taxon: {
                  name: "Taxon2",
                },
              }),
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

  it("Only returns taxon object if name exists", async () => {
    (httpUtils.get as jest.Mock).mockImplementation(() => ({
      workflow_runs: [{}],
    }));

    const result = await execute(query, {});

    expect(result.data.sequencingReads[0].taxon).toBeNull();
  });

  it("Does not return null for required location field", async () => {
    (httpUtils.get as jest.Mock).mockImplementation(() => ({
      workflow_runs: [
        {
          sample: {},
        },
      ],
    }));

    const result = await execute(query, {});

    expect(result.data.sequencingReads[0].sample.collectionLocation).toBe("");
  });

  it("Converts water control to boolean", async () => {
    (httpUtils.get as jest.Mock).mockImplementation(() => ({
      workflow_runs: [
        {
          sample: {
            metadata: {
              water_control: "Yes",
            },
          },
        },
      ],
    }));

    const result = await execute(query, {});

    expect(result.data.sequencingReads[0].sample.waterControl).toBe(true);
  });

  it("Returns unique sequencing reads", async () => {
    (httpUtils.get as jest.Mock).mockImplementation(() => ({
      workflow_runs: [
        {
          id: "a",
          sample: {
            info: {
              id: "123",
            },
          },
          inputs: {
            taxon_name: "Taxon1",
          },
        },
        {
          id: "b",
          sample: {
            info: {
              id: "123",
            },
          },
          inputs: {
            taxon_name: "Taxon2",
          },
        },
        {
          id: "c",
          sample: {
            info: {
              id: "456",
            },
          },
          inputs: {
            taxon_name: "Taxon3",
          },
        },
        {
          id: "d",
          sample: {
            info: {
              id: "123",
            },
          },
          inputs: {
            taxon_name: "Taxon1",
          },
        },
      ],
    }));

    const sequencingReads = (await execute(query, {})).data.sequencingReads;

    expect(sequencingReads.length).toBe(2);

    expect(sequencingReads[0].id).toBe("123");
    expect(sequencingReads[0].consensusGenomes.edges.length).toBe(3);
    expect(
      sequencingReads[0].consensusGenomes.edges[0].node.producingRunId
    ).toBe("a");
    expect(sequencingReads[0].consensusGenomes.edges[0].node.taxon.name).toBe(
      "Taxon1"
    );
    expect(
      sequencingReads[0].consensusGenomes.edges[1].node.producingRunId
    ).toBe("b");
    expect(sequencingReads[0].consensusGenomes.edges[1].node.taxon.name).toBe(
      "Taxon2"
    );
    expect(
      sequencingReads[0].consensusGenomes.edges[2].node.producingRunId
    ).toBe("d");
    expect(sequencingReads[0].consensusGenomes.edges[2].node.taxon.name).toBe(
      "Taxon1"
    );

    expect(sequencingReads[1].id).toBe("456");
    expect(sequencingReads[1].consensusGenomes.edges.length).toBe(1);
    expect(
      sequencingReads[1].consensusGenomes.edges[0].node.producingRunId
    ).toBe("c");
    expect(sequencingReads[1].consensusGenomes.edges[0].node.taxon.name).toBe(
      "Taxon3"
    );
  });
});
