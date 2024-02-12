import { ExecuteMeshFn } from "@graphql-mesh/runtime";
import { getZipLinkExampleQuery } from "./utils/ExampleQueryFiles";
import { getMeshInstance } from "./utils/MeshInstance";

import * as httpUtils from "../utils/httpUtils";
jest.spyOn(httpUtils, "get");

beforeEach(() => {
  (httpUtils.get as jest.Mock).mockClear();
});

const query = `
    query TestQuery($unused: String) {
      samples(input: {
        where: {
          name: {
            _like: "abc",
          }
        },
      }) {
        id
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

    expect(httpUtils.get).toHaveBeenCalledWith(
      "/workflow_runs.json?&mode=basic&search=abc",
      expect.anything(),
      expect.anything()
    );
    expect(response.data.samples).toHaveLength(0);
  });

  it("Returns IDs", async () => {
    (httpUtils.get as jest.Mock).mockImplementation(() => ({
      workflow_runs: [
        {
          sample: { id: 123 },
        },
        {
          sample: { id: 456 },
        },
      ],
    }));

    const result = await execute(query, {});

    const samples = result.data.samples;
    expect(samples).toHaveLength(2);
    expect(samples[0].id).toEqual("123");
    expect(samples[1].id).toEqual("456");
  });
});
