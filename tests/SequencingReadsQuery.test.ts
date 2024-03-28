import { ExecuteMeshFn } from "@graphql-mesh/runtime";
import {
  MeshExecuteTestFunction,
  getMeshExecute,
  getMeshInstance,
} from "./utils/MeshInstance";
import * as httpUtils from "../utils/httpUtils";
import { getExampleQuery } from "./utils/ExampleQueryFiles";
import { assertEqualsNoWhitespace } from "./utils/StringUtils";
import { convertSequencingReadsQuery } from "../utils/queryFormatUtils";

jest.spyOn(httpUtils, "get");
jest.spyOn(httpUtils, "shouldReadFromNextGen");
jest.spyOn(httpUtils, "fetchFromNextGen");
jest.spyOn(httpUtils, "getFromRails");

beforeEach(() => {
  (httpUtils.get as jest.Mock).mockClear();
  (httpUtils.shouldReadFromNextGen as jest.Mock).mockClear();
  (httpUtils.fetchFromNextGen as jest.Mock).mockClear();
  (httpUtils.getFromRails as jest.Mock).mockClear();
});

const query = getExampleQuery("sequencing-reads-query");

describe("sequencingReads query:", () => {
  let execute: MeshExecuteTestFunction;

  beforeEach(async () => {
    (httpUtils.shouldReadFromNextGen as jest.Mock).mockImplementation(() =>
      Promise.resolve(false),
    );
    execute = await getMeshExecute();
  });

  it("Returns empty list", async () => {
    (httpUtils.get as jest.Mock).mockImplementation(() => ({
      workflow_runs: [],
    }));
    const response = await execute(query, {});
    console.log(JSON.stringify(response));

    expect(httpUtils.get).toHaveBeenCalledWith({
      url: "/workflow_runs.json?&mode=with_sample_info&search=abc&limit=50&offset=100&listAllIds=false",
      args: expect.anything(),
      context: expect.anything(),
    });
    expect(response.data.fedSequencingReads).toHaveLength(0);
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

    expect(result.data.fedSequencingReads).toHaveLength(2);
    expect(result.data.fedSequencingReads[0]).toEqual(
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
      }),
    );
    expect(result.data.fedSequencingReads[1]).toEqual(
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
      }),
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
      result.data.fedSequencingReads[0].sample.metadatas.edges.map(
        edge => edge.node.fieldName,
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

    expect(
      result.data.fedSequencingReads[0].sample.metadatas.edges,
    ).toHaveLength(0);
  });

  it("Only returns taxon object if name exists", async () => {
    (httpUtils.get as jest.Mock).mockImplementation(() => ({
      workflow_runs: [{}],
    }));

    const result = await execute(query, {});

    expect(result.data.fedSequencingReads[0].taxon).toBeNull();
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

    expect(result.data.fedSequencingReads[0].sample.collectionLocation).toBe(
      "",
    );
  });

  it("Returns string location field", async () => {
    (httpUtils.get as jest.Mock).mockImplementation(() => ({
      workflow_runs: [
        {
          sample: {
            metadata: {
              collection_location_v2: "Redwood City",
            },
          },
        },
      ],
    }));

    const result = await execute(query, {});

    expect(result.data.fedSequencingReads[0].sample.collectionLocation).toBe(
      "Redwood City",
    );
  });

  it("Returns object name for location field", async () => {
    (httpUtils.get as jest.Mock).mockImplementation(() => ({
      workflow_runs: [
        {
          sample: {
            metadata: {
              collection_location_v2: {
                name: "Redwood City",
              },
            },
          },
        },
      ],
    }));

    const result = await execute(query, {});

    expect(result.data.fedSequencingReads[0].sample.collectionLocation).toBe(
      "Redwood City",
    );
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

    expect(result.data.fedSequencingReads[0].sample.waterControl).toBe(true);
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

    const sequencingReads = (await execute(query, {})).data.fedSequencingReads;

    expect(sequencingReads.length).toBe(2);

    expect(sequencingReads[0].id).toBe("123");
    expect(sequencingReads[0].consensusGenomes.edges.length).toBe(3);
    expect(
      sequencingReads[0].consensusGenomes.edges[0].node.producingRunId,
    ).toBe("a");
    expect(sequencingReads[0].consensusGenomes.edges[0].node.taxon.name).toBe(
      "Taxon1",
    );
    expect(
      sequencingReads[0].consensusGenomes.edges[1].node.producingRunId,
    ).toBe("b");
    expect(sequencingReads[0].consensusGenomes.edges[1].node.taxon.name).toBe(
      "Taxon2",
    );
    expect(
      sequencingReads[0].consensusGenomes.edges[2].node.producingRunId,
    ).toBe("d");
    expect(sequencingReads[0].consensusGenomes.edges[2].node.taxon.name).toBe(
      "Taxon1",
    );

    expect(sequencingReads[1].id).toBe("456");
    expect(sequencingReads[1].consensusGenomes.edges.length).toBe(1);
    expect(
      sequencingReads[1].consensusGenomes.edges[0].node.producingRunId,
    ).toBe("c");
    expect(sequencingReads[1].consensusGenomes.edges[0].node.taxon.name).toBe(
      "Taxon3",
    );
  });

  it("Constructs correct NextGen paginated query", () => {
    assertEqualsNoWhitespace(
      convertSequencingReadsQuery(getExampleQuery("sequencing-reads-query-fe")),
      `query ($where: SequencingReadWhereClause,
              $orderBy: [SequencingReadOrderByClause!],
              $limitOffset: LimitOffsetClause,
              $producingRunIds: [UUID!]) {
        sequencingReads(where: $where, orderBy: $orderBy, limitOffset: $limitOffset) {
          id
          protocol
          medakaModel
          technology
          taxon {
            name
          }
          sample {
            railsSampleId
            name
            hostOrganism {
              name
            }
            ownerUserId
            metadatas {
              edges {
                node {
                  fieldName
                  value
                }
              }
            }
          }
          consensusGenomes(where: { producingRunId: { _in: $producingRunIds } }) {
            edges {
              node {
                producingRunId
                taxon {
                  name
                }
                accession {
                  accessionId
                  accessionName
                }
                metrics {
                  coverageDepth
                  totalReads
                  gcPercent
                  refSnps
                  percentIdentity
                  nActg
                  percentGenomeCalled
                  nMissing
                  nAmbiguous
                  referenceGenomeLength
                }
              }
            }
          }
        }
      }`,
    );
  });

  it("Constructs correct NextGen IDs query", () => {
    assertEqualsNoWhitespace(
      convertSequencingReadsQuery(
        getExampleQuery("sequencing-reads-query-id-fe"),
      ),
      `query ($where: SequencingReadWhereClause, $orderBy: [SequencingReadOrderByClause!]) {
        sequencingReads(where: $where, orderBy: $orderBy) {
          id
          sample {
            railsSampleId
          }
        }
      }`,
    );
  });

  it("Joins NextGen and Rails data", async () => {
    (httpUtils.shouldReadFromNextGen as jest.Mock).mockImplementation(() =>
      Promise.resolve(true),
    );
    (httpUtils.fetchFromNextGen as jest.Mock).mockImplementation(() =>
      Promise.resolve({
        data: {
          sequencingReads: [
            {
              id: "abc",
              sample: {
                railsSampleId: 123,
              },
              technology: "Technology A",
              consensusGenomes: {
                edges: [],
              },
            },
            {
              id: "def",
              sample: {
                railsSampleId: 123,
              },
              technology: "Technology B",
              consensusGenomes: {
                edges: [],
              },
            },
            {
              id: "ghi",
              sample: {
                railsSampleId: 456,
              },
              technology: "Technology C",
              consensusGenomes: {
                edges: [],
              },
            },
          ],
        },
      }),
    );
    (httpUtils.getFromRails as jest.Mock).mockImplementation(() =>
      Promise.resolve({
        samples: [
          {
            id: 123,
            details: {
              db_sample: {
                sample_notes: "Note A",
              },
              derived_sample_output: {
                project_name: "Project A",
              },
              metadata: {
                collection_location_v2: "USA",
                custom1: "Custom value 1",
              },
            },
          },
          {
            id: 456,
            details: {
              db_sample: {
                sample_notes: "Note B",
              },
              derived_sample_output: {
                project_name: "Project B",
              },
              metadata: {
                collection_location_v2: "Mexico",
                custom2: "Custom value 2",
              },
            },
          },
        ],
      }),
    );

    const sequencingReads = (await execute(query, {})).data.fedSequencingReads;

    expect(sequencingReads).toMatchObject([
      expect.objectContaining({
        id: "abc",
        technology: "Technology A",
        sample: {
          railsSampleId: 123,
          collectionLocation: "USA",
          notes: "Note A",
          collection: {
            name: "Project A",
            public: false,
          },
          metadatas: {
            edges: [
              {
                node: {
                  fieldName: "custom1",
                  value: "Custom value 1",
                },
              },
            ],
          },
          waterControl: false,
        },
      }),
      expect.objectContaining({
        id: "def",
        technology: "Technology B",
        sample: {
          railsSampleId: 123,
          collectionLocation: "USA",
          notes: "Note A",
          collection: {
            name: "Project A",
            public: false,
          },
          metadatas: {
            edges: [
              {
                node: {
                  fieldName: "custom1",
                  value: "Custom value 1",
                },
              },
            ],
          },
          waterControl: false,
        },
      }),
      expect.objectContaining({
        id: "ghi",
        technology: "Technology C",
        sample: {
          railsSampleId: 456,
          collectionLocation: "Mexico",
          notes: "Note B",
          collection: {
            name: "Project B",
            public: false,
          },
          metadatas: {
            edges: [
              {
                node: {
                  fieldName: "custom2",
                  value: "Custom value 2",
                },
              },
            ],
          },
          waterControl: false,
        },
      }),
    ]);
  });

  it("Does not call Rails to do join if no NextGen data returned", async () => {
    (httpUtils.shouldReadFromNextGen as jest.Mock).mockImplementation(() =>
      Promise.resolve(true),
    );
    (httpUtils.fetchFromNextGen as jest.Mock).mockImplementation(() =>
      Promise.resolve({
        data: {
          sequencingReads: [],
        },
      }),
    );

    const sequencingReads = (await execute(query, {})).data.fedSequencingReads;

    expect(sequencingReads).toEqual([]);
    expect(httpUtils.getFromRails as jest.Mock).not.toHaveBeenCalled();
  });

  it("Joins NextGen and Rails data for IDs only", async () => {
    const query = getExampleQuery("sequencing-reads-query-id-fe");
    (httpUtils.shouldReadFromNextGen as jest.Mock).mockImplementation(() =>
      Promise.resolve(true),
    );
    (httpUtils.fetchFromNextGen as jest.Mock).mockImplementation(() =>
      Promise.resolve({
        data: {
          sequencingReads: [
            {
              id: "abc",
              sample: {
                railsSampleId: 123,
              },
            },
            {
              id: "def",
              sample: {
                railsSampleId: 123,
              },
            },
            {
              id: "ghi",
              sample: {
                railsSampleId: 456,
              },
            },
          ],
        },
      }),
    );
    (httpUtils.getFromRails as jest.Mock).mockImplementation(() =>
      Promise.resolve({
        all_samples_ids: [123],
      }),
    );

    const sequencingReads = (
      await execute(query, {
        input: { where: { sample: { collectionLocation: { _in: ["USA"] } } } },
      })
    ).data.fedSequencingReads;

    expect(sequencingReads).toMatchObject([
      {
        id: "abc",
      },
      {
        id: "def",
      },
    ]);
  });

  it("Fetches all IDs only from Rails if NextGen off", async () => {
    const query = getExampleQuery("sequencing-reads-query-id-fe");
    (httpUtils.shouldReadFromNextGen as jest.Mock).mockImplementation(() =>
      Promise.resolve(false),
    );
    (httpUtils.get as jest.Mock).mockImplementation(() =>
      Promise.resolve({
        workflow_runs: [
          {
            sample: {
              info: {
                id: 123,
              },
            },
          },
          {
            sample: {
              info: {
                id: 456,
              },
            },
          },
        ],
      }),
    );

    const sequencingReads = (await execute(query, { input: {} })).data
      .fedSequencingReads;

    expect(httpUtils.fetchFromNextGen as jest.Mock).not.toHaveBeenCalled();
    expect(sequencingReads).toMatchObject([{ id: "123" }, { id: "456" }]);
  });

  it("Does not call Rails if ID query doesn't need to", async () => {
    const query = getExampleQuery("sequencing-reads-query-id-fe");
    (httpUtils.shouldReadFromNextGen as jest.Mock).mockImplementation(() =>
      Promise.resolve(true),
    );
    (httpUtils.fetchFromNextGen as jest.Mock).mockImplementation(() =>
      Promise.resolve({
        data: {
          sequencingReads: [
            {
              id: "abc",
              sample: {
                railsSampleId: 123,
              },
            },
            {
              id: "def",
              sample: {
                railsSampleId: 123,
              },
            },
            {
              id: "ghi",
              sample: {
                railsSampleId: 456,
              },
            },
          ],
        },
      }),
    );

    const sequencingReads = (await execute(query, { input: {} })).data
      .fedSequencingReads;

    expect(httpUtils.getFromRails as jest.Mock).not.toHaveBeenCalled();
    expect(sequencingReads).toMatchObject([
      {
        id: "abc",
      },
      {
        id: "def",
      },
      {
        id: "ghi",
      },
    ]);
  });

  it("Sorts using NextGen for ID query", async () => {
    const query = getExampleQuery("sequencing-reads-query-id-fe");
    (httpUtils.shouldReadFromNextGen as jest.Mock).mockImplementation(() =>
      Promise.resolve(true),
    );
    (httpUtils.fetchFromNextGen as jest.Mock).mockImplementation(() =>
      Promise.resolve({
        data: {
          sequencingReads: [
            {
              id: "a",
              sample: {
                railsSampleId: 1,
              },
            },
            {
              id: "b",
              sample: {
                railsSampleId: 2,
              },
            },
            {
              id: "c",
              sample: {
                railsSampleId: 3,
              },
            },
            {
              id: "d",
              sample: {
                railsSampleId: 4,
              },
            },
          ],
        },
      }),
    );
    (httpUtils.getFromRails as jest.Mock).mockImplementation(() =>
      Promise.resolve({
        all_samples_ids: [3, 2, 1, 0],
      }),
    );

    const sequencingReads = (
      await execute(query, {
        input: {
          where: {
            sample: { collectionLocation: { _in: ["USA"] } },
          },
          orderByArray: [{ protocol: "asc_nulls_first" }],
        },
      })
    ).data.fedSequencingReads;

    expect(sequencingReads).toMatchObject([
      {
        id: "a",
      },
      {
        id: "b",
      },
      {
        id: "c",
      },
    ]);
  });

  it("Sorts using Rails for ID query", async () => {
    const query = getExampleQuery("sequencing-reads-query-id-fe");
    (httpUtils.shouldReadFromNextGen as jest.Mock).mockImplementation(() =>
      Promise.resolve(true),
    );
    (httpUtils.fetchFromNextGen as jest.Mock).mockImplementation(() =>
      Promise.resolve({
        data: {
          sequencingReads: [
            {
              id: "a",
              sample: {
                railsSampleId: 1,
              },
            },
            {
              id: "b",
              sample: {
                railsSampleId: 2,
              },
            },
            {
              id: "c",
              sample: {
                railsSampleId: 2,
              },
            },
            {
              id: "d",
              sample: {
                railsSampleId: 4,
              },
            },
          ],
        },
      }),
    );
    (httpUtils.getFromRails as jest.Mock).mockImplementation(() =>
      Promise.resolve({
        all_samples_ids: [3, 2, 1],
      }),
    );

    const sequencingReads = (
      await execute(query, {
        input: {
          orderByArray: [
            {
              sample: {
                metadata: {
                  fieldName: "blah",
                  dir: "asc_nulls_first",
                },
              },
            },
          ],
        },
      })
    ).data.fedSequencingReads;

    expect(sequencingReads).toMatchObject([
      {
        id: "b",
      },
      {
        id: "c",
      },
      {
        id: "a",
      },
    ]);
  });
});
